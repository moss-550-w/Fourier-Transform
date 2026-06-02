import { useState } from 'react'
import { chapters } from './chapters/index.js'

// 分页式叙事容器:一次只渲染当前章(切换时 key 变化 → 卸载旧章,清理其 rAF/音频)。
// 当前为按钮导航的轻量版;后续可叠加触屏左右滑动手势(design.md:移动优先)。
export default function App() {
  const [index, setIndex] = useState(0)
  const { id, title, Component } = chapters[index]

  const go = (delta) =>
    setIndex((i) => Math.min(chapters.length - 1, Math.max(0, i + delta)))

  return (
    <div className="app">
      <section className="app__viewport" key={id} aria-label={title}>
        <Component />
      </section>

      <nav className="app__nav" aria-label="章节导航">
        <button
          type="button"
          className="app__nav-btn"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="上一章"
        >
          ←
        </button>
        <span className="app__progress" aria-live="polite">
          {index + 1} / {chapters.length} · {title}
        </span>
        <button
          type="button"
          className="app__nav-btn"
          onClick={() => go(1)}
          disabled={index === chapters.length - 1}
          aria-label="下一章"
        >
          →
        </button>
      </nav>
    </div>
  )
}
