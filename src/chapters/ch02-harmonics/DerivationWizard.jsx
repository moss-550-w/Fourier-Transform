import { useState } from 'react'
import FormulaCard from '../../components/FormulaCard.jsx'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { PALETTE, SEMANTIC_COLORS, TWO_PI } from '../../constants/index.js'

// 第二章·分步推导向导:用"正交性可视化"讲清 A_k 怎么求,而非直接抛积分。
// 固定一个 3 谐波方波信号,目标求基波振幅 A_1:
//   信号 → 乘探针 sin(ω0t) → 一周期内累加面积 → 异频抵消/同频留存 → 淡入积分公式。

const OMEGA0 = TWO_PI // 取基频 f0=1、周期 T=1,曲线画一个完整周期

// 固定信号:方波前 3 个谐波(k=1,3,5),基波振幅 A_1 = 4/π
const SIGNAL = [
  { k: 1, mag: 4 / Math.PI },
  { k: 3, mag: 4 / (3 * Math.PI) },
  { k: 5, mag: 4 / (5 * Math.PI) },
]

const signal = (t) => SIGNAL.reduce((sum, h) => sum + h.mag * Math.sin(h.k * OMEGA0 * t), 0)
const probe = (t) => Math.sin(OMEGA0 * t)
const product = (t) => signal(t) * probe(t)

const STEPS = [
  {
    title: '第 1 步:这是一个待分解的信号',
    text: '它由 3 个正弦谐波(k=1,3,5)合成。我们想知道:每个频率"出多大力"?先求基波 k=1 的振幅 A₁。',
    show: { signal: true },
  },
  {
    title: '第 2 步:拿一支"探针"去触碰它',
    text: '探针是已知的单位正弦 sin(ω₀t)(频率正好等于基波)。把信号与探针逐点相乘。',
    show: { signal: true, probe: true },
  },
  {
    title: '第 3 步:看乘积,在一个周期内累加面积',
    text: '蓝色为正面积、橙色为负面积。k=3、k=5 分量与探针的乘积,正负恰好抵消(正交);唯有 k=1 分量乘积恒为正。',
    show: { product: true, fill: true },
  },
  {
    title: '第 4 步:留存的面积,就是答案',
    text: '抵消之后只剩 k=1 项。乘积的一周期平均值正好等于 A₁/2 —— 这条水平线就是它。',
    show: { product: true, fill: true, mean: true },
  },
  {
    title: '第 5 步:把几何写成公式',
    text: '"相乘后在一周期内累加并取平均",用积分严谨地写出来,就是傅里叶系数公式。',
    show: { product: true, fill: true, mean: true, formula: true },
  },
]

export default function DerivationWizard({ onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const show = STEPS[step].show

  const finish = () => {
    onComplete?.()
    onClose()
  }

  const canvasRef = useCanvasAnimation(({ ctx, width, height }) => {
    drawDerivation(ctx, width, height, show)
  })

  return (
    <div
      className="wizard"
      role="dialog"
      aria-modal="true"
      aria-label="A_k 的分步推导"
      onClick={onClose}
    >
      {/* 阻止冒泡:点面板内部不关闭 */}
      <div className="wizard__panel" onClick={(e) => e.stopPropagation()}>
        <div className="wizard__head">
          <h3 className="wizard__title">{STEPS[step].title}</h3>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="wizard__canvas">
          <canvas ref={canvasRef} className="canvas-surface" />
        </div>

        <p className="wizard__text">{STEPS[step].text}</p>

        {show.formula && (
          <FormulaCard latex={'A_1 = \\frac{2}{T} \\int_0^{T} f(t)\\,\\sin(\\omega_0 t)\\,dt'} />
        )}

        <div className="wizard__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            上一步
          </button>
          <span className="app__progress">
            {step + 1} / {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn" onClick={() => setStep((s) => s + 1)}>
              下一步
            </button>
          ) : (
            <button type="button" className="btn" onClick={finish}>
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 静态曲线绘制(画一个周期 t∈[0,1]) =====

function drawDerivation(ctx, width, height, show) {
  const padX = 24
  const left = padX
  const right = width - padX
  const midY = height / 2
  const yScale = (height * 0.34) / 2 // 信号/乘积峰值约 ±2,留边距
  const tx = (t) => left + t * (right - left) // t∈[0,1] → x
  const py = (v) => midY - v * yScale

  // 横轴(0 值线)
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, left, midY, right, midY)

  // 乘积面积填充(正蓝/负橙竖线),放在最底层
  if (show.fill) {
    for (let x = left; x <= right; x += 1) {
      const t = (x - left) / (right - left)
      const v = product(t)
      ctx.strokeStyle = v >= 0 ? SEMANTIC_COLORS.positive : SEMANTIC_COLORS.negative
      ctx.globalAlpha = 0.3
      line(ctx, x, midY, x, py(v))
    }
    ctx.globalAlpha = 1
  }

  if (show.signal) drawCurve(ctx, tx, py, signal, PALETTE.text, 2.5)
  if (show.probe) drawCurve(ctx, tx, py, probe, PALETTE.muted, 2, true)
  if (show.product) drawCurve(ctx, tx, py, product, SEMANTIC_COLORS.imaginary, 2.5)

  // A_1/2 平均线
  if (show.mean) {
    const mean = SIGNAL[0].mag / 2 // = A_1/2,正交性使其余项不贡献
    ctx.strokeStyle = SEMANTIC_COLORS.real
    ctx.lineWidth = 2
    line(ctx, left, py(mean), right, py(mean), null, true)
  }
}

function drawCurve(ctx, tx, py, fn, color, lineWidth, dashed = false) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  if (dashed) ctx.setLineDash([5, 5])
  ctx.beginPath()
  for (let t = 0; t <= 1.0001; t += 0.005) {
    const x = tx(t)
    const y = py(fn(t))
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()
}

function line(ctx, x1, y1, x2, y2, color, dashed = false) {
  ctx.save()
  if (color) ctx.strokeStyle = color
  if (dashed) ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}
