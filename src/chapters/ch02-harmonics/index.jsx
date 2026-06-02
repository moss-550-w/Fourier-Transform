// 第二章:圆舞曲(谐波雕塑家) —— 占位骨架
// 核心目标:任何周期波形都是一系列不同半径/速度/起点的圆首尾相连后的末端投影。

const styles = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  title: { color: '#4a90e2', margin: '0 0 8px' },
  goal: { color: '#f5a623', fontWeight: 600, margin: 0 },
}

export default function Harmonics() {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>第二章:圆舞曲——傅里叶级数的几何交响乐</h2>
      <p style={styles.goal}>任何周期波形,都是一系列不同半径、速度、起点的圆首尾相连后末端的垂直投影。</p>
      {/* TODO: 见 design.md 第二章 —— 主交互与关键改进:
          "谐波雕塑家":首尾相接旋转矢量 + 末端投影波形,谐波数量滑块 1→50;
          关键改进:>10 圆自动启用聚焦模式(悬停高亮、余圆半透明、同色单波叠加),
          慢动作拨盘 1x→0.01x,以及"求解 A_k/φ_k"分步推导向导(正交性可视化:
          探针相乘 → 周期内累加面积 → 异频抵消、同频留存 → 最后淡入积分公式)。 */}
    </div>
  )
}
