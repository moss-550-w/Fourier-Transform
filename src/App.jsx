import { useEffect, useRef, useState } from 'react'
import { chapters } from './chapters/index.js'

// 分页式叙事容器:一次只挂载当前章(切换时 key 变化 → 卸载旧章,清理其 rAF/音频)。
// 导航三通道:① 底部按钮 ② 键盘左右箭头 ③ 触屏左右滑动手势(移动优先)。

const SWIPE_THRESHOLD = 60 // 触发切章的最小水平位移(px)
const SWIPE_SLOP = 40 // 纵向位移超此值视为滚动而非横滑,放弃切章

export default function App() {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(0) // 进场方向:1=向后翻、-1=向前翻,驱动切换动画
  const touchRef = useRef(null) // { x, y } 触摸起点

  const { id, title, Component } = chapters[index]
  const atStart = index === 0
  const atEnd = index === chapters.length - 1

  const go = (delta) => {
    setIndex((i) => {
      const next = Math.min(chapters.length - 1, Math.max(0, i + delta))
      if (next !== i) setDir(delta)
      return next
    })
  }

  // 键盘左右箭头切章(输入控件内不拦截,避免干扰滑块)
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 触屏左右滑动:横向位移达阈值且纵向位移小,才切章(区分滑动与滚动)
  const onTouchStart = (e) => {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e) => {
    const start = touchRef.current
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    touchRef.current = null
    if (Math.abs(dy) > SWIPE_SLOP) return // 偏纵向 → 视为滚动
    if (dx <= -SWIPE_THRESHOLD) go(1) // 左滑 → 下一章
    else if (dx >= SWIPE_THRESHOLD) go(-1) // 右滑 → 上一章
  }

  return (
    <div className="app" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <a href="#viewport" className="skip-link">
        跳到主内容
      </a>

      <section
        className="app__viewport"
        id="viewport"
        key={id}
        data-dir={dir}
        aria-label={title}
        aria-live="polite"
      >
        <Component />
      </section>

      <nav className="app__nav" aria-label="章节导航">
        <button
          type="button"
          className="app__nav-btn"
          onClick={() => go(-1)}
          disabled={atStart}
          aria-label="上一章"
        >
          ←
        </button>
        <span className="app__progress">
          {index + 1} / {chapters.length} · {title}
        </span>
        <button
          type="button"
          className="app__nav-btn"
          onClick={() => go(1)}
          disabled={atEnd}
          aria-label="下一章"
        >
          →
        </button>
      </nav>
    </div>
  )
}
