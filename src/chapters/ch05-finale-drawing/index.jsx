// 终章:万物皆可画(神笔傅里叶) —— 占位骨架
// 核心目标:任何封闭曲线都可分解为一系列特定半径/速度/旋转方向的圆的合运动。

const styles = {
  wrap: { padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#333' },
  title: { color: '#4a90e2', margin: '0 0 8px' },
  goal: { color: '#f5a623', fontWeight: 600, margin: 0 },
}

export default function FinaleDrawing() {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>终章:万物皆可画——二维傅里叶的魔法</h2>
      <p style={styles.goal}>任何封闭曲线,都可分解为一系列特定半径、速度和旋转方向的圆的合运动。</p>
      {/* TODO: 见 design.md 终章 —— 主交互与关键改进:
          "神笔傅里叶":左侧自由绘制图形,点击"开始解析"完成二维 DFT;
          关键改进:分步绘制(频率 0 静止圆定中心 → 低频画轮廓 → 高频刻细节)、
          二维频谱图(正频逆时针/负频顺时针,点柱子高亮对应圆)、
          一维方波↔二维曲线知识桥接弹窗,彻底告别"黑箱"。 */}
    </div>
  )
}
