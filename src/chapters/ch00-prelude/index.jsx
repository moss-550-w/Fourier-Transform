import { useEffect, useRef, useState } from 'react'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useUnlock } from '../../achievements/AchievementContext.jsx'
import { PALETTE, A4_FREQUENCY } from '../../constants/index.js'

// 序幕:声音的配方 —— 三种乐器演奏同一个 A4(440Hz)。
// 音高相同(基频都是 440),但时域波形完全不同 —— 因为各自的"谐波配方"不同。
// 伏笔:相同主料(基频)、不同香料(谐波),我们能找到这份配方吗?(→ 后续章节)

// 各乐器的谐波振幅配方(教学近似,index i = 第 i+1 次谐波相对基波的振幅)。
// 钢琴:谐波快速衰减,接近纯净;小提琴:谐波丰富(锯齿感);单簧管:奇次谐波为主。
const INSTRUMENTS = [
  { id: 'piano', name: '钢琴', recipe: [1, 0.5, 0.28, 0.16, 0.09, 0.05, 0.03] },
  { id: 'violin', name: '小提琴', recipe: [1, 0.78, 0.62, 0.5, 0.4, 0.32, 0.24, 0.18] },
  { id: 'clarinet', name: '单簧管', recipe: [1, 0.04, 0.6, 0.05, 0.42, 0.03, 0.28, 0.02] },
]

const PLAY_SECONDS = 1.6 // 单次播放时长后自动停,避免长鸣

// 把配方映射成 audio 引擎所需的谐波列表(k 次谐波频率 = k * 基频)
const toHarmonics = (recipe) =>
  recipe.map((amplitude, i) => ({ freq: (i + 1) * A4_FREQUENCY, amplitude, phase: 0 }))

export default function Prelude() {
  const [active, setActive] = useState('piano')
  const { enabled, enable, disable, sync } = useAudioEngine()
  const stopTimerRef = useRef(null)
  const unlock = useUnlock()

  const recipe = INSTRUMENTS.find((ins) => ins.id === active).recipe

  // 静态波形:画一个周期,叠加该乐器谐波配方(不依赖 time,故 hook 仅作画布托管)
  const waveRef = useCanvasAnimation(({ ctx, width, height }) => {
    drawWaveform(ctx, width, height, recipe)
  })

  // 卸载时清掉自动停的定时器
  useEffect(() => () => clearTimeout(stopTimerRef.current), [])

  const play = async (instrument) => {
    setActive(instrument.id)
    await enable() // 用户手势内 resume,满足自动播放策略
    sync(toHarmonics(instrument.recipe))
    clearTimeout(stopTimerRef.current)
    stopTimerRef.current = setTimeout(() => disable(), PLAY_SECONDS * 1000)
    unlock('prelude-listen')
  }

  return (
    <div className="chapter">
      <header className="chapter__header">
        <h2 className="chapter__title">序幕 · 声音的配方</h2>
        <p className="chapter__goal">三种乐器,同一个音符。听起来一样高,看起来却完全不同。</p>
      </header>

      <div className="instrument-row" role="group" aria-label="选择乐器演奏 A4">
        {INSTRUMENTS.map((ins) => (
          <button
            key={ins.id}
            type="button"
            className={`instrument-btn${ins.id === active ? ' is-active' : ''}`}
            onClick={() => play(ins)}
            aria-pressed={ins.id === active}
          >
            <span className="instrument-btn__name">{ins.name}</span>
            <span className="instrument-btn__note">A4 · 440 Hz</span>
          </button>
        ))}
      </div>

      <p className="chapter__hint">
        当前波形:{INSTRUMENTS.find((i) => i.id === active).name}
        {enabled ? '(演奏中…)' : ''}
      </p>
      <div className="chapter__stage" style={{ height: 240 }}>
        <canvas ref={waveRef} className="canvas-surface" />
      </div>

      <p className="chapter__conclusion is-active">
        它们拥有相同的<strong>主料</strong>(基频 440Hz),却有完全不同的<strong>香料</strong>(谐波)。
        我们能找到这份配方吗?
      </p>
    </div>
  )
}

// ===== 静态时域波形:叠加谐波配方,画两个周期 =====

function drawWaveform(ctx, width, height, recipe) {
  const margin = 16
  const midY = height / 2
  const left = margin
  const right = width - margin

  // 归一化峰值,使不同配方都铺满视高
  let peak = 0
  for (let phase = 0; phase < 1; phase += 0.002) {
    let v = 0
    for (let k = 0; k < recipe.length; k += 1) v += recipe[k] * Math.sin((k + 1) * 2 * Math.PI * phase)
    peak = Math.max(peak, Math.abs(v))
  }
  const yScale = peak > 0 ? (height * 0.38) / peak : 1
  const CYCLES = 2 // 视窗内画两个周期,既见周期性又见波形细节

  // 0 值轴
  ctx.strokeStyle = PALETTE.muted
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(left, midY)
  ctx.lineTo(right, midY)
  ctx.stroke()

  // 波形
  ctx.strokeStyle = PALETTE.blue
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let x = left; x <= right; x += 1) {
    const phase = ((x - left) / (right - left)) * CYCLES // 0..CYCLES
    let v = 0
    for (let k = 0; k < recipe.length; k += 1) v += recipe[k] * Math.sin((k + 1) * 2 * Math.PI * phase)
    const y = midY - v * yScale
    x === left ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}
