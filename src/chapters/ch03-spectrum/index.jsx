// 第三章:从"指纹"到"谱" —— 占位骨架
// 核心目标:建立时域与频域的一一对应关系,理解频谱图。

const styles = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  title: { color: '#4a90e2', margin: '0 0 8px' },
  goal: { color: '#f5a623', fontWeight: 600, margin: 0 },
}

export default function Spectrum() {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>第三章:从"指纹"到"谱"——探索频域的二元性</h2>
      <p style={styles.goal}>建立"时域"与"频域"的一一对应关系,理解频谱图。</p>
      {/* TODO: 见 design.md 第三章 —— 主交互与关键改进:
          "频域与波形的双向对话":上屏旋转圆+合成波(时域),下屏频谱图(频域);
          双向绑定(拖圆半径↔拖频谱柱子);关键改进:"随机化相位"破坏性实验
          (振幅不变、相位打乱 → 频谱纹丝不动、波形面目全非),
          配合 Web Audio 视听同步(强化高频刺耳、削弱高频沉闷)。 */}
    </div>
  )
}
