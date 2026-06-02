import { useState } from 'react'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import Slider from '../components/Slider.jsx'
import { useCanvasAnimation } from '../hooks/useCanvasAnimation.js'
import { PARAM_RANGES, PALETTE, TWO_PI } from '../constants/index.js'

// 分屏对比实验室(design.md "对比实验室"模式):
// 左右两侧独立设置波形/谐波数,实时并排对比合成波形,让"微小差异 → 巨大变化"一目了然。
// 自包含模态,不依赖具体章节;复用第二章的谐波合成思路。

const WAVEFORMS = [
  { value: 'square', label: '方波' },
  { value: 'sawtooth', label: '锯齿波' },
]
const PX_PER_SEC = 60

// 与第二章一致的谐波生成,保证两处行为统一
function buildHarmonics(waveform, count) {
  const list = []
  for (let i = 1; i <= count; i += 1) {
    if (waveform === 'square') {
      const k = 2 * i - 1
      list.push({ k, mag: 4 / (Math.PI * k), ph: 0 })
    } else {
      const k = i
      list.push({ k, mag: 2 / (Math.PI * k), ph: i % 2 === 1 ? 0 : Math.PI })
    }
  }
  return list
}

// 单侧对比面板:自带波形+谐波数控制与一块画布
function ComparePane({ side, color }) {
  const [waveform, setWaveform] = useState('square')
  const [count, setCount] = useState(side === 'left' ? 3 : 12)
  const harmonics = buildHarmonics(waveform, count)

  const canvasRef = useCanvasAnimation(({ ctx, width, height, time }) => {
    drawWave(ctx, width, height, time, harmonics, color)
  })

  return (
    <div className="lab-pane">
      <ToggleSwitch label={`${side === 'left' ? '左' : '右'}侧波形`} options={WAVEFORMS} value={waveform} onChange={setWaveform} />
      <div className="lab-pane__stage">
        <canvas ref={canvasRef} className="canvas-surface" />
      </div>
      <Slider
        label="谐波数量"
        value={count}
        min={PARAM_RANGES.harmonicCount.min}
        max={PARAM_RANGES.harmonicCount.max}
        step={PARAM_RANGES.harmonicCount.step}
        onChange={(v) => setCount(Math.round(v))}
      />
    </div>
  )
}

export default function ComparisonLab({ onClose }) {
  return (
    <div className="wizard" role="dialog" aria-modal="true" aria-label="分屏对比实验室" onClick={onClose}>
      <div className="wizard__panel wizard__panel--wide" onClick={(e) => e.stopPropagation()}>
        <div className="wizard__head">
          <h3 className="wizard__title">分屏对比实验室</h3>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <p className="wizard__text">左右独立设置,实时对比 —— 看微小的参数差异如何带来截然不同的波形。</p>
        <div className="lab-grid">
          <ComparePane side="left" color={PALETTE.blue} />
          <ComparePane side="right" color={PALETTE.orange} />
        </div>
      </div>
    </div>
  )
}

function drawWave(ctx, width, height, time, harmonics, color) {
  const margin = 12
  const midY = height / 2
  const left = margin
  const right = width - margin
  const omega0 = TWO_PI // 基频 1Hz
  const scale = height * 0.32 // 方波/锯齿幅度约 1,留边距

  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(left, midY)
  ctx.lineTo(right, midY)
  ctx.stroke()

  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let x = left; x <= right; x += 1) {
    const t = time - (x - left) / PX_PER_SEC
    let v = 0
    for (const h of harmonics) v += h.mag * Math.sin(h.k * omega0 * t + h.ph)
    const y = midY - v * scale
    x === left ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}
