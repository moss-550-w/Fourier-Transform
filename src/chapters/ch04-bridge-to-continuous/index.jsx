// 第四章:通往连续的桥梁 —— 占位骨架
// 核心目标:非周期信号是周期无限长的周期信号,引出傅里叶变换。

const styles = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  title: { color: '#4a90e2', margin: '0 0 8px' },
  goal: { color: '#f5a623', fontWeight: 600, margin: 0 },
}

export default function BridgeToContinuous() {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>第四章:通往连续的桥梁——从求和到积分的优雅一跃</h2>
      <p style={styles.goal}>非周期信号是周期无限长的周期信号,引出傅里叶变换。</p>
      {/* TODO: 见 design.md 第四章 —— 主交互与关键改进:
          "周期的极限拉伸":滑块连续增大脉冲串周期 T;
          关键改进:相邻周期灰色虚线边界可视化、实时显示 f₀=1/T 与 Δf 变密、
          "显微镜"工具放大查看频谱仍离散,推到 T→∞ 时触发飞跃动画
          (Δf 坍缩为 df、∑ 拉伸为 ∫、离散谱线融合成连续曲线)。 */}
    </div>
  )
}
