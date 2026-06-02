import { chapters } from './chapters/index.js'

// 骨架:按章节顺序渲染占位。后续替换为分页式叙事容器(左右滑动切章)。
export default function App() {
  return (
    <main style={{ minHeight: '100%' }}>
      {chapters.map(({ id, title, Component }) => (
        <section key={id} id={id} aria-label={title}>
          <Component />
        </section>
      ))}
    </main>
  )
}
