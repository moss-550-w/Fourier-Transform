// 第一章:旋转的种子 —— 占位骨架
// 核心目标:匀速圆周运动的投影是正弦波,复数是描述旋转的天然几何语言。

const styles = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  title: { color: '#4a90e2', margin: '0 0 8px' },
  goal: { color: '#f5a623', fontWeight: 600, margin: 0 },
}

export default function RotatingSeed() {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>第一章:旋转的种子——一个圆,造出所有波</h2>
      <p style={styles.goal}>匀速圆周运动的投影是正弦波,复数是描述旋转的天然几何语言。</p>
      {/* TODO: 见 design.md 第一章 —— 主交互与关键改进:
          可拖拽圆矢量改变半径(振幅)/转速(频率)/起始角度(相位),
          实时显示垂直投影(正弦)与水平投影(余弦)轨迹;
          关键改进:"虚实分离"三段式开关(只看垂直/只看水平/完整旋转矢量),
          配合 Ae^(iφ)·e^(iωt) 公式分项高亮,消除"虚部恐惧"。 */}
    </div>
  )
}
