import { useEffect, useRef, useState } from 'react'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useUnlock } from '../../achievements/AchievementContext.jsx'
import { PALETTE, TWO_PI } from '../../constants/index.js'

// 第三章:从"指纹"到"谱" —— 建立时域↔频域的一一对应,理解频谱图。
// 双向对话:拖时域圆半径 ↔ 拖频谱柱高,实时互动(拖动时冻结旋转便于操作)。
// 破坏性实验:随机化相位 → 频谱(振幅)纹丝不动,波形面目全非
//   → 结论:频谱只含振幅信息;相位决定波形形状。视听同步强化直觉。

const N = 8 // 谐波/柱子个数
const BASE_FREQ_VIS = 1 // 可视化基频(画一个周期)
const AUDIO_F0 = 220 // 发声基频(Hz),k 次谐波 = k*220
const PX_PER_SEC = 60

const BLUE = [74, 144, 226]
const ORANGE = [245, 166, 35]
const colorForIndex = (i, n) => {
  const t = n > 1 ? i / (n - 1) : 0
  const ch = (a, b) => Math.round(a + (b - a) * t)
  return `rgb(${ch(BLUE[0], ORANGE[0])}, ${ch(BLUE[1], ORANGE[1])}, ${ch(BLUE[2], ORANGE[2])})`
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// 初值:锯齿波 Σ(1/k)sin(kx),柱高随 k 递减、相位全 0 —— 随机相位后形变最明显
const INITIAL_AMPS = Array.from({ length: N }, (_, i) => 1 / (i + 1))

// 布局函数:draw 与指针命中共用同一套坐标,保证拖拽精确
const timeLayout = (w, h) => ({
  ox: w * 0.28,
  oy: h * 0.5,
  unitR: Math.min(w * 0.12, h * 0.3), // 振幅=1 对应的圆半径
  waveLeft: w * 0.52,
})
const freqLayout = (w, h) => {
  const pad = 28
  const slot = (w - 2 * pad) / N
  return { pad, slot, barW: slot * 0.55, baseline: h - 30, maxBarH: h - 54 }
}

export default function Spectrum() {
  const [amps, setAmps] = useState(INITIAL_AMPS)
  const [phases, setPhases] = useState(() => new Array(N).fill(0))
  const [dragging, setDragging] = useState(false)
  const [randomized, setRandomized] = useState(false)

  const circlesRef = useRef([]) // 最近一帧时域圆几何,供命中
  const dragRef = useRef(null) // { kind: 'time' | 'freq', index }
  const unlock = useUnlock()

  const { enabled, enable, disable, sync } = useAudioEngine()

  // 时域:拖拽时 speed=0 冻结旋转,圆心稳定便于调半径
  const timeCanvasRef = useCanvasAnimation(
    ({ ctx, width, height, time }) => {
      drawTime(ctx, width, height, time, { amps, phases, circlesOut: circlesRef.current })
    },
    { speed: dragging ? 0 : 1 },
  )

  // 频域:静态柱状图,用循环重画以实时反映 state
  const freqCanvasRef = useCanvasAnimation(({ ctx, width, height }) => {
    drawFreq(ctx, width, height, amps)
  })

  // 视听同步:开启后,振幅/相位变化实时(节流)合成发声
  useEffect(() => {
    if (!enabled) return
    const harmonics = amps
      .map((a, i) => ({ freq: (i + 1) * AUDIO_F0, amplitude: a, phase: phases[i] }))
      .filter((h) => h.amplitude > 0.001)
    sync(harmonics)
  }, [amps, phases, enabled, sync])

  const setAmp = (index, value) =>
    setAmps((prev) => prev.map((a, i) => (i === index ? clamp01(value) : a)))

  // --- 时域圆拖拽:命中圆环 → 拖动距离即新半径(振幅) ---
  const onTimeDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let best = null
    let bestRing = 16
    for (const c of circlesRef.current) {
      const ring = Math.abs(Math.hypot(mx - c.cx, my - c.cy) - c.r)
      if (ring < bestRing) {
        bestRing = ring
        best = c
      }
    }
    if (!best) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { kind: 'time', index: best.index, cx: best.cx, cy: best.cy }
    setDragging(true)
    const { unitR } = timeLayout(rect.width, rect.height)
    setAmp(best.index, Math.hypot(mx - best.cx, my - best.cy) / unitR)
  }
  const onTimeMove = (e) => {
    const drag = dragRef.current
    if (drag?.kind !== 'time') return
    const rect = e.currentTarget.getBoundingClientRect()
    const { unitR } = timeLayout(rect.width, rect.height)
    const d = Math.hypot(e.clientX - rect.left - drag.cx, e.clientY - rect.top - drag.cy)
    setAmp(drag.index, d / unitR)
  }

  // --- 频谱柱拖拽:命中柱列 → 纵向位置即新振幅 ---
  const onFreqDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const { pad, slot, baseline, maxBarH } = freqLayout(rect.width, rect.height)
    const index = Math.floor((mx - pad) / slot)
    if (index < 0 || index >= N) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { kind: 'freq', index, baseline, maxBarH }
    setDragging(true)
    setAmp(index, (baseline - (e.clientY - rect.top)) / maxBarH)
  }
  const onFreqMove = (e) => {
    const drag = dragRef.current
    if (drag?.kind !== 'freq') return
    const rect = e.currentTarget.getBoundingClientRect()
    setAmp(drag.index, (drag.baseline - (e.clientY - rect.top)) / drag.maxBarH)
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  const randomizePhases = () => {
    setPhases(Array.from({ length: N }, () => Math.random() * TWO_PI))
    setRandomized(true)
    unlock('phase-chaos')
  }
  const resetPhases = () => {
    setPhases(new Array(N).fill(0))
    setRandomized(false)
  }

  return (
    <div className="chapter">
      <header className="chapter__header">
        <h2 className="chapter__title">第三章 · 从「指纹」到「谱」</h2>
        <p className="chapter__goal">时域与频域,是同一件事的两种说法。拖一拖,听一听。</p>
      </header>

      <div className="control-row">
        <button
          type="button"
          className={enabled ? 'btn' : 'btn btn--ghost'}
          onClick={() => {
            if (enabled) {
              disable()
            } else {
              enable()
              unlock('sound-on')
            }
          }}
        >
          {enabled ? '🔊 声音:开' : '🔈 开启声音'}
        </button>
        <button type="button" className="btn btn--accent" onClick={randomizePhases}>
          随机化相位
        </button>
        {randomized && (
          <button type="button" className="btn btn--ghost" onClick={resetPhases}>
            复位相位
          </button>
        )}
      </div>

      <p className="chapter__hint">时域:旋转圆与合成波形(可拖动任意圆的半径)</p>
      <div className="chapter__stage" style={{ height: 260 }}>
        <canvas
          ref={timeCanvasRef}
          className="canvas-surface"
          onPointerDown={onTimeDown}
          onPointerMove={onTimeMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>

      <p className="chapter__hint">频域:频谱图(上下拖动柱子改变振幅)</p>
      <div className="chapter__stage" style={{ height: 220 }}>
        <canvas
          ref={freqCanvasRef}
          className="canvas-surface"
          onPointerDown={onFreqDown}
          onPointerMove={onFreqMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>

      <p className={`chapter__conclusion${randomized ? ' is-active' : ''}`}>
        频谱只包含<strong>振幅</strong>信息,不包含相位信息;而<strong>相位</strong>,决定了波形的具体形状。
      </p>
    </div>
  )
}

// ===== 时域绘制:epicycles + 合成波形 =====

function drawTime(ctx, width, height, time, { amps, phases, circlesOut }) {
  circlesOut.length = 0
  const { ox, oy, unitR, waveLeft } = timeLayout(width, height)
  const omega0 = TWO_PI * BASE_FREQ_VIS
  const waveRight = width - 16
  const n = amps.length

  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, waveLeft, oy, waveRight, oy)

  let x = ox
  let y = oy
  for (let i = 0; i < n; i += 1) {
    const r = amps[i] * unitR
    const angle = (i + 1) * omega0 * time + phases[i]
    const color = colorForIndex(i, n)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TWO_PI)
    ctx.stroke()
    const nx = x + r * Math.cos(angle)
    const ny = y - r * Math.sin(angle)
    ctx.lineWidth = 1.5
    line(ctx, x, y, nx, ny)
    circlesOut.push({ cx: x, cy: y, r, index: i })
    x = nx
    y = ny
  }
  line(ctx, x, y, waveLeft, y, PALETTE.text, true)
  dot(ctx, x, y, 4, PALETTE.text)

  ctx.strokeStyle = PALETTE.text
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let px = waveLeft; px <= waveRight; px += 1) {
    const t = time - (px - waveLeft) / PX_PER_SEC
    let v = 0
    for (let i = 0; i < n; i += 1) v += amps[i] * Math.sin((i + 1) * omega0 * t + phases[i])
    const py = oy - v * unitR
    px === waveLeft ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.stroke()
}

// ===== 频域绘制:振幅柱状图 =====

function drawFreq(ctx, width, height, amps) {
  const { pad, slot, barW, baseline, maxBarH } = freqLayout(width, height)
  const n = amps.length

  // 基线
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, pad, baseline, width - pad, baseline)

  ctx.textAlign = 'center'
  ctx.font = '12px system-ui, sans-serif'
  for (let i = 0; i < n; i += 1) {
    const cx = pad + slot * i + slot / 2
    const barH = amps[i] * maxBarH
    ctx.fillStyle = colorForIndex(i, n)
    ctx.fillRect(cx - barW / 2, baseline - barH, barW, barH)
    // 频率刻度(k 次谐波)
    ctx.fillStyle = PALETTE.muted
    ctx.fillText(`${i + 1}f₀`, cx, baseline + 16)
  }
}

function line(ctx, x1, y1, x2, y2, color, dashed = false) {
  ctx.save()
  if (color) ctx.strokeStyle = color
  if (dashed) ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TWO_PI)
  ctx.fill()
}
