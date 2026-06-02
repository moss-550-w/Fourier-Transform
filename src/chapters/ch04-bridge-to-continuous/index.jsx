import { useRef, useState } from 'react'
import Slider from '../../components/Slider.jsx'
import FormulaCard from '../../components/FormulaCard.jsx'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { PALETTE } from '../../constants/index.js'

// 第四章:通往连续的桥梁 —— 非周期信号是"周期无限长"的周期信号。
// 信号:固定脉宽 τ 的矩形脉冲串,周期 T 可调。
// 关键洞察:谱线始终落在同一条 sinc 包络上(包络只由 τ 决定,与 T 无关);
//   增大 T → 基频 f₀=1/T 变小、谱线间隔 Δf=1/T 变密,但包络纹丝不动。
//   T→∞ 时:Δf→df、∑→∫、离散谱线融合成连续频谱 —— 这就是傅里叶变换。

const TAU = 0.5 // 固定脉冲宽度
const T_RANGE = { min: 1, max: 12, step: 0.1, default: 2 }
const F_MAX = 8 // 频谱横轴上限(τ=0.5 时 sinc 零点在 2/4/6)
const NEAR_INFINITY = 0.92 // 滑块比例超过此值,视为趋近 T→∞,触发飞跃

// sinc(x) = sin(πx)/(πx),归一化形式;矩形脉冲的频谱包络
const sinc = (x) => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x))
const envelope = (f) => Math.abs(sinc(TAU * f)) // 振幅谱取绝对值

export default function BridgeToContinuous() {
  const [period, setPeriod] = useState(T_RANGE.default)
  const pointerRef = useRef(null) // 频谱画布上的指针位置(显微镜),{x,y} 或 null

  const f0 = 1 / period // 基频 = 谱线间隔 Δf
  const ratio = (period - T_RANGE.min) / (T_RANGE.max - T_RANGE.min)
  const nearInfinity = ratio >= NEAR_INFINITY

  // 时域:矩形脉冲串(静态依赖 state,逐帧重画以反映最新 period)
  const timeCanvasRef = useCanvasAnimation(({ ctx, width, height }) => {
    drawPulseTrain(ctx, width, height, period)
  })

  // 频域:离散谱线 + 固定 sinc 包络 + 显微镜
  const freqCanvasRef = useCanvasAnimation(({ ctx, width, height }) => {
    drawSpectrum(ctx, width, height, period, nearInfinity, pointerRef.current)
  })

  const onFreqMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <div className="chapter">
      <header className="chapter__header">
        <h2 className="chapter__title">第四章 · 通往连续的桥梁</h2>
        <p className="chapter__goal">把周期拉到无穷长,求和就优雅地变成了积分。</p>
      </header>

      <p className="chapter__hint">时域:周期脉冲串(灰色虚线标出相邻周期的位置)</p>
      <div className="chapter__stage" style={{ height: 180 }}>
        <canvas ref={timeCanvasRef} className="canvas-surface" />
      </div>

      <p className="chapter__hint">
        频域:离散谱线落在固定的 sinc 包络上(把指针移到频谱上 = 显微镜放大)
      </p>
      <div className="chapter__stage" style={{ height: 240 }}>
        <canvas
          ref={freqCanvasRef}
          className="canvas-surface"
          onPointerMove={onFreqMove}
          onPointerLeave={() => {
            pointerRef.current = null
          }}
        />
      </div>

      <div className="param-readout" aria-live="polite">
        <span>
          周期 <strong>T = {period.toFixed(1)}</strong>
        </span>
        <span>
          基频 <strong>f₀ = 1/T = {f0.toFixed(3)}</strong>
        </span>
        <span>
          谱线间隔 <strong>Δf = {f0.toFixed(3)}</strong>
        </span>
      </div>

      <Slider
        label="周期 T(向右拉伸 → 趋近 ∞)"
        value={period}
        min={T_RANGE.min}
        max={T_RANGE.max}
        step={T_RANGE.step}
        onChange={(v) => setPeriod(Number(v.toFixed(1)))}
      />

      <div className={`leap-banner${nearInfinity ? ' is-active' : ''}`}>
        {nearInfinity ? (
          <>
            <strong>T → ∞:</strong> Δf 坍缩为微分 df,求和 ∑ 拉伸为积分 ∫,
            离散谱线融合成连续曲线 —— 我们从傅里叶级数,走进了傅里叶变换。
          </>
        ) : (
          '继续向右拉伸周期 T,观察谱线如何越来越密……'
        )}
      </div>

      <FormulaCard
        latex={
          nearInfinity
            ? 'F(\\omega) = \\int_{-\\infty}^{\\infty} f(t)\\,e^{-i\\omega t}\\,dt'
            : 'c_k = \\frac{1}{T}\\int_{T} f(t)\\,e^{-i k \\omega_0 t}\\,dt \\quad,\\quad \\Delta f = \\frac{1}{T}'
        }
      />
    </div>
  )
}

// ===== 时域:矩形脉冲串 =====

function drawPulseTrain(ctx, width, height, period) {
  const margin = 16
  const baseline = height - 24
  const pulseTop = 24
  const pxPerUnit = (width - 2 * margin) / 12 // 视窗固定显示 12 个时间单位
  const left = margin

  // 0 值轴
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, left, baseline, width - margin, baseline)

  // 相邻周期边界(灰虚线):脉冲中心落在 t = n·T
  ctx.save()
  ctx.setLineDash([3, 4])
  ctx.strokeStyle = PALETTE.muted
  ctx.globalAlpha = 0.6
  for (let n = 0; n * period <= 12; n += 1) {
    const x = left + n * period * pxPerUnit
    line(ctx, x, pulseTop - 8, x, baseline)
  }
  ctx.restore()

  // 矩形脉冲(蓝):中心 t=n·T,宽度 τ
  ctx.fillStyle = PALETTE.blue
  for (let n = 0; n * period <= 12; n += 1) {
    const center = n * period
    const x0 = left + (center - TAU / 2) * pxPerUnit
    const w = TAU * pxPerUnit
    ctx.fillRect(x0, pulseTop, w, baseline - pulseTop)
  }
}

// ===== 频域:离散谱线 + sinc 包络 + 显微镜 =====

function drawSpectrum(ctx, width, height, period, nearInfinity, pointer) {
  const margin = 24
  const baseline = height - 28
  const top = 16
  const left = margin
  const right = width - margin
  const plotW = right - left
  const plotH = baseline - top

  const fToX = (f) => left + (f / F_MAX) * plotW
  const ampToY = (a) => baseline - a * plotH

  // 0 值轴 + 频率刻度
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  line(ctx, left, baseline, right, baseline)
  ctx.fillStyle = PALETTE.muted
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  for (let f = 0; f <= F_MAX; f += 2) ctx.fillText(`${f}`, fToX(f), baseline + 14)

  // sinc 包络曲线:T→∞ 时高亮加粗并填充(代表已连续化)
  ctx.strokeStyle = nearInfinity ? PALETTE.orange : PALETTE.muted
  ctx.lineWidth = nearInfinity ? 2.5 : 1.5
  ctx.beginPath()
  for (let px = left; px <= right; px += 1) {
    const f = ((px - left) / plotW) * F_MAX
    const y = ampToY(envelope(f))
    px === left ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
  }
  ctx.stroke()
  if (nearInfinity) {
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = PALETTE.orange
    ctx.lineTo(right, baseline)
    ctx.lineTo(left, baseline)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // 离散谱线:f = k·f₀(= k/T),高度落在包络上。趋近∞时谱线极密,弱化以突出连续包络
  const f0 = 1 / period
  ctx.strokeStyle = PALETTE.blue
  ctx.globalAlpha = nearInfinity ? 0.35 : 1
  ctx.lineWidth = 1.5
  for (let k = 0; k * f0 <= F_MAX; k += 1) {
    const f = k * f0
    const x = fToX(f)
    line(ctx, x, baseline, x, ampToY(envelope(f)))
  }
  ctx.globalAlpha = 1

  // 显微镜:在指针处画放大镜,内部放大局部离散谱线,证明"仍是离散竖线"
  if (pointer && !nearInfinity) drawMagnifier(ctx, pointer, { left, right, plotW, baseline, plotH, period })
}

const MAG_RADIUS = 56 // 放大镜半径
const MAG_ZOOM = 6 // 放大倍率(频率轴)

function drawMagnifier(ctx, pointer, geo) {
  const { left, plotW, baseline, plotH, period } = geo
  const f0 = 1 / period
  const fToX = (f) => left + (f / F_MAX) * plotW
  const ampToY = (a) => baseline - a * plotH

  const cx = pointer.x
  const cy = pointer.y
  const centerF = ((cx - left) / plotW) * F_MAX // 放大镜中心对应频率
  if (centerF < 0 || centerF > F_MAX) return

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, MAG_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.bg
  ctx.fill()
  ctx.clip() // 后续绘制裁到圆内

  // 圆内重画放大后的谱线:以 centerF 为中心、放大 MAG_ZOOM 倍
  ctx.strokeStyle = PALETTE.blue
  ctx.lineWidth = 2
  for (let k = 0; k * f0 <= F_MAX; k += 1) {
    const f = k * f0
    const x = cx + (fToX(f) - fToX(centerF)) * MAG_ZOOM
    if (x < cx - MAG_RADIUS || x > cx + MAG_RADIUS) continue
    const h = envelope(f) * plotH
    line(ctx, x, cy + MAG_RADIUS, x, cy + MAG_RADIUS - h * 0.6)
  }
  ctx.restore()

  // 放大镜边框
  ctx.strokeStyle = PALETTE.orange
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, MAG_RADIUS, 0, Math.PI * 2)
  ctx.stroke()
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}
