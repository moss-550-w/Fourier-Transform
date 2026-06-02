import { useState } from 'react'
import Slider from '../../components/Slider.jsx'
import ToggleSwitch from '../../components/ToggleSwitch.jsx'
import FormulaCard from '../../components/FormulaCard.jsx'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { PARAM_RANGES, PALETTE, SEMANTIC_COLORS, TWO_PI } from '../../constants/index.js'

// 第一章:旋转的种子 —— 一个圆,造出所有波。
// 几何布局:圆在左上;垂直投影(sin,虚部,橙)沿横轴向右展开成波形,
// 水平投影(cos,实部,蓝)沿纵轴向下展开成波形。两条投影连线天然正交,
// 直观说明"一个旋转矢量同时孕育正弦与余弦",消除虚部恐惧。

const VIEW_MODES = [
  { value: 'vertical', label: '只看垂直投影' },
  { value: 'horizontal', label: '只看水平投影' },
  { value: 'full', label: '完整旋转矢量' },
]

// 公式分项:复振幅(静态,频谱中的一根柱子)与旋转单位矢量(动态)。
const FORMULA_TERMS = [
  { id: 'amplitude', latex: 'A e^{i\\varphi}', label: '复振幅(静态)' },
  { id: 'rotor', latex: 'e^{i\\omega t}', label: '旋转单位矢量(动态)' },
]

const round = (value, digits) => Number(value.toFixed(digits))

export default function RotatingSeed() {
  const [amplitude, setAmplitude] = useState(PARAM_RANGES.amplitude.default)
  const [frequency, setFrequency] = useState(PARAM_RANGES.frequency.default)
  const [phase, setPhase] = useState(PARAM_RANGES.phase.default)
  const [mode, setMode] = useState('full')
  const [activeTerm, setActiveTerm] = useState(null)

  const canvasRef = useCanvasAnimation(({ ctx, width, height, time }) => {
    drawScene(ctx, width, height, time, { amplitude, frequency, phase, mode, activeTerm })
  })

  return (
    <div className="chapter">
      <header className="chapter__header">
        <h2 className="chapter__title">第一章 · 旋转的种子</h2>
        <p className="chapter__goal">一个圆,造出所有波:匀速旋转的投影,就是正弦波。</p>
      </header>

      <ToggleSwitch
        label="虚实分离:选择观察视角"
        options={VIEW_MODES}
        value={mode}
        onChange={setMode}
      />

      <div className="chapter__stage">
        <canvas ref={canvasRef} className="canvas-surface" />
      </div>

      <div className="chapter__controls">
        <Slider
          label="振幅 A(圆半径)"
          value={amplitude}
          min={PARAM_RANGES.amplitude.min}
          max={PARAM_RANGES.amplitude.max}
          step={PARAM_RANGES.amplitude.step}
          onChange={(v) => setAmplitude(round(v, 2))}
        />
        <Slider
          label="频率 ω(转速)"
          value={frequency}
          min={PARAM_RANGES.frequency.min}
          max={PARAM_RANGES.frequency.max}
          step={PARAM_RANGES.frequency.step}
          onChange={(v) => setFrequency(round(v, 1))}
          unit=" Hz"
        />
        <Slider
          label="相位 φ(起始角)"
          value={phase}
          min={PARAM_RANGES.phase.min}
          max={PARAM_RANGES.phase.max}
          step={PARAM_RANGES.phase.step}
          onChange={(v) => setPhase(round(v, 2))}
          unit=" rad"
        />
      </div>

      <FormulaCard
        latex={'A e^{i\\varphi} \\cdot e^{i\\omega t}'}
        terms={FORMULA_TERMS}
        activeTermId={activeTerm}
        onTermClick={(id) => setActiveTerm((prev) => (prev === id ? null : id))}
      />
      <p className="chapter__hint">
        点击公式分项:高亮「复振幅」看半径与起始角,高亮「旋转矢量」看它如何转动。
      </p>
    </div>
  )
}

// ===== 纯绘制函数(不依赖 React,便于推理与复用) =====

const GAP = 24 // 圆与波形区的间隙
const PX_PER_SEC = 80 // 波形时间轴像素密度:每秒 80px

function drawScene(ctx, width, height, time, params) {
  const { amplitude, frequency, phase, mode, activeTerm } = params
  const showSin = mode === 'vertical' || mode === 'full' // 垂直投影 → 右侧波形
  const showCos = mode === 'horizontal' || mode === 'full' // 水平投影 → 下方波形

  const margin = 16
  // 圆区盒子:为右侧/下方波形预留空间,取较小边的一部分
  const circleBox = Math.min(width, height) * 0.42
  const maxRadius = (circleBox / 2) * 0.9
  const cx = margin + maxRadius
  const cy = margin + maxRadius

  const omega = TWO_PI * frequency
  const theta = omega * time + phase
  const radius = amplitude * maxRadius
  // 矢量末端(canvas y 向下,故 sin 取负使正值朝上)
  const px = cx + radius * Math.cos(theta)
  const py = cy - radius * Math.sin(theta)

  // 波形起点:圆右侧 / 下方
  const waveLeft = cx + maxRadius + GAP
  const waveTop = cy + maxRadius + GAP
  const waveRight = width - margin
  const waveBottom = height - margin

  // --- 基准轴(0 值线),淡色 ---
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  if (showSin) drawLine(ctx, waveLeft, cy, waveRight, cy)
  if (showCos) drawLine(ctx, cx, waveTop, cx, waveBottom)

  // --- 圆 ---
  const amplitudeFocus = activeTerm === 'amplitude'
  const rotorFocus = activeTerm === 'rotor'
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TWO_PI)
  ctx.stroke()

  // --- 相位弧(复振幅高亮时强调起始角) ---
  if (amplitudeFocus && radius > 1) {
    ctx.strokeStyle = PALETTE.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.4, 0, -phase, true) // 屏幕坐标 y 向下,角度取负
    ctx.stroke()
  }

  // --- 旋转矢量 ---
  ctx.strokeStyle = rotorFocus ? PALETTE.accent : PALETTE.text
  ctx.lineWidth = rotorFocus ? 4 : 2.5
  drawLine(ctx, cx, cy, px, py)
  dot(ctx, px, py, 5, PALETTE.text)

  // --- 垂直投影(sin):右侧波形 + 水平连线 ---
  if (showSin) {
    drawLine(ctx, px, py, waveLeft, py, SEMANTIC_COLORS.imaginary, true) // 水平虚线
    ctx.strokeStyle = SEMANTIC_COLORS.imaginary
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let x = waveLeft; x <= waveRight; x += 1) {
      const t = time - (x - waveLeft) / PX_PER_SEC
      const y = cy - radius * Math.sin(omega * t + phase)
      x === waveLeft ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    dot(ctx, waveLeft, py, 4, SEMANTIC_COLORS.imaginary)
  }

  // --- 水平投影(cos):下方波形 + 竖直连线 ---
  if (showCos) {
    drawLine(ctx, px, py, px, waveTop, SEMANTIC_COLORS.real, true) // 竖直虚线
    ctx.strokeStyle = SEMANTIC_COLORS.real
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let y = waveTop; y <= waveBottom; y += 1) {
      const t = time - (y - waveTop) / PX_PER_SEC
      const x = cx + radius * Math.cos(omega * t + phase)
      y === waveTop ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    dot(ctx, px, waveTop, 4, SEMANTIC_COLORS.real)
  }
}

// 画线;dashed=true 时为虚线,可选 color
function drawLine(ctx, x1, y1, x2, y2, color, dashed = false) {
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
