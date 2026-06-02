import { ACHIEVEMENTS, useAchievements } from '../achievements/AchievementContext.jsx'

// 成就面板:展示全部徽章及解锁进度;未解锁置灰。
export default function AchievementPanel({ onClose }) {
  const { unlocked } = useAchievements()
  const count = unlocked.size

  return (
    <div className="wizard" role="dialog" aria-modal="true" aria-label="成就" onClick={onClose}>
      <div className="wizard__panel" onClick={(e) => e.stopPropagation()}>
        <div className="wizard__head">
          <h3 className="wizard__title">
            成就 · {count} / {ACHIEVEMENTS.length}
          </h3>
          <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <ul className="badge-list">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.id)
            return (
              <li key={a.id} className={`badge${got ? ' is-unlocked' : ''}`}>
                <span className="badge__icon" aria-hidden="true">
                  {got ? '🏅' : '🔒'}
                </span>
                <span className="badge__body">
                  <span className="badge__name">{got ? a.name : '???'}</span>
                  <span className="badge__desc">{a.desc}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
