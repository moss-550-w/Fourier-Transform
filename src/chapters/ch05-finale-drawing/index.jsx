import { useRef, useState } from 'react'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { dft2d } from '../../engine/fft.js'
import { PALETTE, TWO_PI } from '../../constants/index.js'

// 终章:万物皆可画(神笔傅里叶) —— 任何封闭曲线 = 一串旋转圆的合运动。
// 流程:手绘 → 等弧长重采样到 N 点 → dft2d 分解 → epicycle 旋转链重建曲线。
// 关键改进(告别黑箱):
//   - 分步绘制:参与的分量数随时间增长,低频大圆先勾勒轮廓、高频小圆再刻画细节;
//   - 二维频谱图:横轴为带符号频率(正=逆时针/负=顺时针),点柱子高亮对应的圆;
//   - 知识桥接弹窗:一维方波叠加 ↔ 二维旋转圆叠加,同一思想的不同维度投影。

const SAMPLE_COUNT = 128 // 重采样点数(= DFT 长度),兼顾精度与朴素 O(n²) 开销
const DRAW_PERIOD = 6 // epicycle 跑完一整圈(描出整条曲线)的秒数
const STEP_INTERVAL = 0.18 // 分步绘制:每隔多少秒新增一个参与分量
const SPECTRUM_HALF = 16 // 频谱图显示的频率半宽(-16..16),低频已含绝大部分能量
const BLUE = '#4a90e2'

const round2 = (v) => Number(v.toFixed(2))

// 把任意点列按累积弧长等距重采样到 count 个点,使 DFT 的"匀速参数化"成立
function resample(points, count) {
  if (points.length < 2) return []
  // 闭合:首尾相连,保证封闭曲线
  const pts = [...points, points[0]]
  const segLen = []
  let total = 0
  for (let i = 1; i < pts.length; i += 1) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    segLen.push(d)
    total += d
  }
  if (total === 0) return []

  const out = []
  const step = total / count
  let seg = 0
  let acc = 0 // 已走过 seg 段的累积长度起点
  for (let i = 0; i < count; i += 1) {
    const target = i * step
    while (seg < segLen.length - 1 && acc + segLen[seg] < target) {
      acc += segLen[seg]
      seg += 1
    }
    const t = segLen[seg] === 0 ? 0 : (target - acc) / segLen[seg]
    out.push({
      x: pts[seg].x + (pts[seg + 1].x - pts[seg].x) * t,
      y: pts[seg].y + (pts[seg + 1].y - pts[seg].y) * t,
    })
  }
  return out
}

// 用前 active 个分量,在参数 s∈[0,1) 处合成曲线点(IDFT 几何形式)
function evalAt(components, active, s) {
  let x = 0
  let y = 0
  for (let i = 0; i < active; i += 1) {
    const c = components[i]
    const angle = TWO_PI * c.freq * s + c.phase
    x += c.amplitude * Math.cos(angle)
    y += c.amplitude * Math.sin(angle)
  }
  return { x, y }
}

export default function FinaleDrawing() {
  const [hasResult, setHasResult] = useState(false)
  const [bridgeOpen, setBridgeOpen] = useState(true) // 首次进入展示知识桥接
  const [selectedFreq, setSelectedFreq] = useState(null)

  const rawPointsRef = useRef([]) // 手绘原始点(CSS 像素)
  const drawingRef = useRef(false)
  const componentsRef = useRef([]) // dft2d 结果
  const playStartRef = useRef(0) // 解析后动画起始逻辑时间,用于分步进度

  // 主舞台:draw 模式显示手绘轨迹;play 模式画 epicycle 链 + 逐步成型的曲线
  const stageRef = useCanvasAnimation(({ ctx, width, height, time }) => {
    if (!hasResult) {
      drawSketch(ctx, width, height, rawPointsRef.current)
    } else {
      drawEpicycles(ctx, time, {
        components: componentsRef.current,
        playStart: playStartRef.current || (playStartRef.current = time),
        selectedFreq,
      })
    }
  })

  // 频谱舞台:二维振幅谱(带符号频率)
  const spectrumRef = useCanvasAnimation(({ ctx, width, height }) => {
    drawSpectrum(ctx, width, height, componentsRef.current, selectedFreq)
  })

  // --- 手绘 ---
  const onDown = (e) => {
    if (hasResult) return
    drawingRef.current = true
    rawPointsRef.current = []
    e.currentTarget.setPointerCapture(e.pointerId)
    pushPoint(e)
  }
  const onMove = (e) => {
    if (!drawingRef.current) return
    pushPoint(e)
  }
  const pushPoint = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    rawPointsRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  const onUp = () => {
    drawingRef.current = false
  }

  const analyze = () => {
    const sampled = resample(rawPointsRef.current, SAMPLE_COUNT)
    if (sampled.length < SAMPLE_COUNT) return // 画得太短,忽略
    componentsRef.current = dft2d(sampled)
    playStartRef.current = 0
    setSelectedFreq(null)
    setHasResult(true)
  }

  const reset = () => {
    rawPointsRef.current = []
    componentsRef.current = []
    setSelectedFreq(null)
    setHasResult(false)
  }

  // 频谱图点击:定位被点的频率柱,高亮对应圆
  const onSpectrumDown = (e) => {
    if (!hasResult) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const slot = rect.width / (2 * SPECTRUM_HALF + 1)
    const freq = Math.round((mx - rect.width / 2) / slot)
    setSelectedFreq((prev) => (prev === freq ? null : freq))
  }

  return (
    <div className="chapter">
      <header className="chapter__header">
        <h2 className="chapter__title">终章 · 神笔傅里叶</h2>
        <p className="chapter__goal">
          画一条封闭曲线,看它如何被一串旋转的圆,一笔笔重新画出来。
        </p>
      </header>

      <div className="control-row">
        {!hasResult ? (
          <button type="button" className="btn" onClick={analyze}>
            开始解析
          </button>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={reset}>
            重新绘制
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={() => setBridgeOpen(true)}>
          一维 ↔ 二维?
        </button>
      </div>

      <p className="chapter__hint">
        {hasResult
          ? '低频大圆先勾勒轮廓,高频小圆再补全细节 —— 和谐波合成方波是同一个思想。'
          : '在下方画板上按住拖动,画一个封闭图形(爱心、字母都行)。'}
      </p>
      <div className="chapter__stage" style={{ height: 320 }}>
        <canvas
          ref={stageRef}
          className="canvas-surface"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>

      {hasResult && (
        <>
          <p className="chapter__hint">
            二维频谱:横轴为频率(正=逆时针,负=顺时针),纵轴为振幅。点柱子可高亮对应的圆。
          </p>
          <div className="chapter__stage" style={{ height: 180 }}>
            <canvas ref={spectrumRef} className="canvas-surface" onPointerDown={onSpectrumDown} />
          </div>
        </>
      )}

      {bridgeOpen && <BridgeModal onClose={() => setBridgeOpen(false)} />}
    </div>
  )
}

// ===== 手绘轨迹绘制 =====

function drawSketch(ctx, width, height, points) {
  // 提示性中心十字
  ctx.strokeStyle = PALETTE.muted
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1
  line(ctx, width / 2, 0, width / 2, height)
  line(ctx, 0, height / 2, width, height / 2)
  ctx.globalAlpha = 1

  if (points.length < 2) return
  ctx.strokeStyle = BLUE
  ctx.lineWidth = 2.5
  ctx.beginPath()
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.stroke()
}

// ===== epicycle 旋转链 + 逐步成型的曲线 =====

function drawEpicycles(ctx, time, { components, playStart, selectedFreq }) {
  const total = components.length
  if (total === 0) return

  const elapsed = time - playStart
  // 分步绘制:参与分量数随时间增长(直流分量始终在内),最终全部参与
  const active = Math.min(total, 2 + Math.floor(elapsed / STEP_INTERVAL))
  const s = (elapsed / DRAW_PERIOD) % 1 // 画笔参数,循环描绘

  // 已成型曲线:用当前 active 分量,采样 s∈[0,1) 一整圈(展示"这么多圆能画成什么")
  ctx.strokeStyle = BLUE
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
    const p = evalAt(components, active, i / SAMPLE_COUNT)
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.stroke()

  // epicycle 链:从直流分量起,首尾相连画圆 + 矢量,末端就是画笔
  let x = 0
  let y = 0
  for (let i = 0; i < active; i += 1) {
    const c = components[i]
    const angle = TWO_PI * c.freq * s + c.phase
    const nx = x + c.amplitude * Math.cos(angle)
    const ny = y + c.amplitude * Math.sin(angle)
    const highlighted = selectedFreq !== null && c.freq === selectedFreq

    if (c.amplitude > 0.5) {
      ctx.strokeStyle = highlighted ? PALETTE.orange : '#ffffff33'
      ctx.lineWidth = highlighted ? 2.5 : 1
      ctx.beginPath()
      ctx.arc(x, y, c.amplitude, 0, TWO_PI)
      ctx.stroke()
      line(ctx, x, y, nx, ny, highlighted ? PALETTE.orange : '#ffffff55')
    }
    x = nx
    y = ny
  }
  // 画笔头
  dot(ctx, x, y, 4, PALETTE.orange)
}

// ===== 二维频谱图 =====

function drawSpectrum(ctx, width, height, components, selectedFreq) {
  if (components.length === 0) return
  const baseline = height - 26
  const top = 16
  const slot = width / (2 * SPECTRUM_HALF + 1)
  const fToX = (f) => width / 2 + f * slot

  // 振幅按最大值归一化到绘图高度
  let maxAmp = 0
  for (const c of components) if (Math.abs(c.freq) <= SPECTRUM_HALF) maxAmp = Math.max(maxAmp, c.amplitude)
  const maxBarH = baseline - top - 12

  // 基线 + 0 频标记
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, 0, baseline, width, baseline)

  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  for (const c of components) {
    if (Math.abs(c.freq) > SPECTRUM_HALF) continue
    const cx = fToX(c.freq)
    const barH = maxAmp > 0 ? (c.amplitude / maxAmp) * maxBarH : 0
    const selected = c.freq === selectedFreq
    // 正频蓝、负频橙,既区分转向又不触红绿
    ctx.fillStyle = selected ? PALETTE.text : c.freq >= 0 ? PALETTE.blue : PALETTE.orange
    ctx.fillRect(cx - slot * 0.3, baseline - barH, slot * 0.6, barH)
  }
  // 频率刻度(每 4 格)
  ctx.fillStyle = PALETTE.muted
  for (let f = -SPECTRUM_HALF; f <= SPECTRUM_HALF; f += 4) ctx.fillText(`${f}`, fToX(f), baseline + 16)
}

// ===== 知识桥接弹窗 =====

function BridgeModal({ onClose }) {
  return (
    <div className="wizard" role="dialog" aria-modal="true" aria-label="一维与二维的桥接" onClick={onClose}>
      <div className="wizard__panel" onClick={(e) => e.stopPropagation()}>
        <div className="wizard__head">
          <h3 className="wizard__title">同一个思想,两个维度</h3>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className="bridge-grid">
          <div className="bridge-cell">
            <div className="bridge-cell__tag" style={{ color: PALETTE.blue }}>
              一维信号
            </div>
            <p>正弦波叠加</p>
            <p className="bridge-cell__sub">不同振幅/相位的 sin 相加 → 方波、锯齿波</p>
          </div>
          <div className="bridge-cell">
            <div className="bridge-cell__tag" style={{ color: PALETTE.orange }}>
              二维曲线
            </div>
            <p>旋转圆叠加</p>
            <p className="bridge-cell__sub">不同半径/转速/转向的圆首尾相连 → 任意封闭曲线</p>
          </div>
        </div>
        <p className="wizard__text">
          一维是正弦波的叠加,二维是旋转圆的叠加 —— 同一个思想,在另一个维度上的壮丽投影。
          低频决定轮廓,高频刻画细节,两者完全一致。
        </p>
        <div className="wizard__actions">
          <span className="app__progress" />
          <button type="button" className="btn" onClick={onClose}>
            开始创作
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== 绘制小工具 =====

function line(ctx, x1, y1, x2, y2, color) {
  ctx.save()
  if (color) ctx.strokeStyle = color
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
