import { useRef, useState } from 'react'
import Slider from '../../components/Slider.jsx'
import ToggleSwitch from '../../components/ToggleSwitch.jsx'
import FormulaCard from '../../components/FormulaCard.jsx'
import DerivationWizard from './DerivationWizard.jsx'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { useUnlock } from '../../achievements/AchievementContext.jsx'
import { PARAM_RANGES, PALETTE, TWO_PI } from '../../constants/index.js'

// 第二章:圆舞曲(谐波雕塑家) —— 一系列首尾相连的旋转圆,其末端垂直投影雕刻出周期波形。
// 关键改进:谐波数 >10 自动提示聚焦(悬停某圆 → 余圆半透明 + 右侧叠加该圆单波);
// 慢动作拨盘看高频小圆如何精雕细琢;"求解"按钮触发正交性分步推导向导。

const WAVEFORMS = [
  { value: 'square', label: '方波' },
  { value: 'sawtooth', label: '锯齿波' },
]

const BASE_FREQ = 1 // 基频 f0(Hz),整章统一口径
const PX_PER_SEC = 70 // 波形时间轴像素密度
const GAP = 20

// 低频→高频 的蓝→橙渐变(符合"低频蓝/高频橙"语义,且不触红绿)
const BLUE = [74, 144, 226]
const ORANGE = [245, 166, 35]

const round = (value, digits) => Number(value.toFixed(digits))

/**
 * 按目标波形生成前 count 个谐波分量。
 * 统一表示为 { k, mag(正), ph }:负系数折进相位 π,便于按"半径+角度"画圆。
 */
function buildHarmonics(waveform, count) {
  const list = []
  for (let i = 1; i <= count; i += 1) {
    if (waveform === 'square') {
      const k = 2 * i - 1 // 方波仅含奇次谐波
      list.push({ k, mag: 4 / (Math.PI * k), ph: 0 })
    } else {
      const k = i // 锯齿波含全部谐波,符号交替
      const positive = i % 2 === 1
      list.push({ k, mag: 2 / (Math.PI * k), ph: positive ? 0 : Math.PI })
    }
  }
  return list
}

function colorForIndex(index, total) {
  const t = total > 1 ? index / (total - 1) : 0
  const ch = (a, b) => Math.round(a + (b - a) * t)
  return `rgb(${ch(BLUE[0], ORANGE[0])}, ${ch(BLUE[1], ORANGE[1])}, ${ch(BLUE[2], ORANGE[2])})`
}

export default function Harmonics() {
  const [waveform, setWaveform] = useState('square')
  const [harmonicCount, setHarmonicCount] = useState(3)
  const [speed, setSpeed] = useState(PARAM_RANGES.animationSpeed.default)
  const [hovered, setHovered] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const unlock = useUnlock()

  // 谐波数加到 30 以上 → 解锁;统一经此包装设置
  const handleHarmonicCount = (value) => {
    const n = Math.round(value)
    setHarmonicCount(n)
    if (n >= 30) unlock('harmonics-many')
  }

  // 最近一帧各圆的几何(CSS 像素),供指针命中测试;不进 state,避免逐帧重渲染
  const circlesRef = useRef([])

  const harmonics = buildHarmonics(waveform, harmonicCount)

  const canvasRef = useCanvasAnimation(
    ({ ctx, width, height, time }) => {
      drawStage(ctx, width, height, time, {
        harmonics,
        hovered,
        circlesOut: circlesRef.current,
      })
    },
    { speed },
  )

  // 指针命中:选最贴近圆环(|d - r| 最小)的圆,驱动聚焦高亮
  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let best = null
    let bestRing = 12 // 命中容差(px)
    for (const c of circlesRef.current) {
      const ring = Math.abs(Math.hypot(mx - c.cx, my - c.cy) - c.r)
      if (ring < bestRing) {
        bestRing = ring
        best = c.index
      }
    }
    setHovered(best)
  }

  const focusActive = harmonicCount > 10

  return (
    <div className="chapter">
      <header className="chapter__header">
        <h2 className="chapter__title">第二章 · 圆舞曲</h2>
        <p className="chapter__goal">
          首尾相连的旋转圆,末端的垂直投影,就是被一层层雕刻出的周期波形。
        </p>
      </header>

      <div className="control-row">
        <ToggleSwitch
          label="目标波形"
          options={WAVEFORMS}
          value={waveform}
          onChange={setWaveform}
        />
        <button type="button" className="btn btn--ghost" onClick={() => setWizardOpen(true)}>
          求解 A_k、φ_k 怎么来?
        </button>
      </div>

      <div className="chapter__stage">
        <canvas
          ref={canvasRef}
          className="canvas-surface"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHovered(null)}
        />
      </div>

      <div className="chapter__controls">
        <Slider
          label="谐波数量(圆的个数)"
          value={harmonicCount}
          min={PARAM_RANGES.harmonicCount.min}
          max={PARAM_RANGES.harmonicCount.max}
          step={PARAM_RANGES.harmonicCount.step}
          onChange={(v) => handleHarmonicCount(v)}
        />
        <Slider
          label="动画速度(慢动作拨盘)"
          value={speed}
          min={PARAM_RANGES.animationSpeed.min}
          max={PARAM_RANGES.animationSpeed.max}
          step={PARAM_RANGES.animationSpeed.step}
          onChange={(v) => setSpeed(round(v, 2))}
          unit="x"
        />
      </div>

      <p className="chapter__hint">
        {focusActive
          ? '谐波较多,把指针悬停到任意一个圆上:其余圆变暗,右侧叠加它单独产生的正弦波。'
          : '增加谐波数量,看方波/锯齿波被一个个小圆逐步雕刻出来。'}
      </p>

      <FormulaCard latex={'f(t) = A_0 + \\sum_{k=1}^{N} A_k \\sin(2\\pi k f_0 t + \\varphi_k)'} />

      {wizardOpen && (
        <DerivationWizard
          onClose={() => setWizardOpen(false)}
          onComplete={() => unlock('derivation-done')}
        />
      )}
    </div>
  )
}

// ===== 纯绘制:epicycles + 合成波形 =====

function drawStage(ctx, width, height, time, params) {
  const { harmonics, hovered, circlesOut } = params
  circlesOut.length = 0 // 复用数组,清空后重填本帧几何

  const margin = 16
  const ox = width * 0.26 // 圆链起点(第一个圆圆心)
  const oy = height * 0.5
  const baseR = Math.min(width * 0.2, height * 0.3)
  const scale = baseR / harmonics[0].mag // 以基波半径定标
  const omega0 = TWO_PI * BASE_FREQ
  const waveLeft = width * 0.5
  const waveRight = width - margin
  const total = harmonics.length

  // 0 值基准线
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, waveLeft, oy, waveRight, oy)

  // --- 圆链(首尾相连) ---
  let x = ox
  let y = oy
  for (let i = 0; i < total; i += 1) {
    const h = harmonics[i]
    const angle = h.k * omega0 * time + h.ph
    const r = h.mag * scale
    const color = colorForIndex(i, total)
    const dim = hovered !== null && hovered !== i // 聚焦:非悬停圆变暗

    ctx.save()
    ctx.globalAlpha = dim ? 0.18 : 1
    // 圆环
    ctx.strokeStyle = color
    ctx.lineWidth = hovered === i ? 2.5 : 1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TWO_PI)
    ctx.stroke()

    const nx = x + r * Math.cos(angle)
    const ny = y - r * Math.sin(angle)
    // 矢量
    ctx.strokeStyle = color
    ctx.lineWidth = hovered === i ? 3 : 1.5
    line(ctx, x, y, nx, ny)
    ctx.restore()

    circlesOut.push({ cx: x, cy: y, r, index: i })
    x = nx
    y = ny
  }

  // 末端点 → 波形左端的水平连线
  line(ctx, x, y, waveLeft, y, PALETTE.text, true)
  dot(ctx, x, y, 4, PALETTE.text)

  // --- 合成波形(末端垂直投影随时间展开) ---
  ctx.strokeStyle = PALETTE.text
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let px = waveLeft; px <= waveRight; px += 1) {
    const t = time - (px - waveLeft) / PX_PER_SEC
    let v = 0
    for (const h of harmonics) v += h.mag * Math.sin(h.k * omega0 * t + h.ph)
    const py = oy - v * scale
    px === waveLeft ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.stroke()

  // --- 聚焦:叠加被悬停圆单独产生的正弦波(同色) ---
  if (hovered !== null && harmonics[hovered]) {
    const h = harmonics[hovered]
    ctx.strokeStyle = colorForIndex(hovered, total)
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let px = waveLeft; px <= waveRight; px += 1) {
      const t = time - (px - waveLeft) / PX_PER_SEC
      const py = oy - h.mag * Math.sin(h.k * omega0 * t + h.ph) * scale
      px === waveLeft ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.stroke()
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
