// 序幕:声音的配方 —— 占位骨架
// 核心目标:引出核心问题——复杂信号能否被分解?

const styles = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  title: { color: '#4a90e2', margin: '0 0 8px' },
  goal: { color: '#f5a623', fontWeight: 600, margin: 0 },
}

export default function Prelude() {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>序幕:声音的配方</h2>
      <p style={styles.goal}>引出核心问题——复杂信号能否被分解?</p>
      {/* TODO: 见 design.md 序幕 —— 主交互与关键改进:
          点击钢琴/小提琴/单簧管演奏同一音符 A4(440Hz),
          用户"听"到音高相同,但"看"到时域波形完全不同,
          抛出"配方"伏笔:相同主料、不同香料,能否找到这份配方? */}
    </div>
  )
}
