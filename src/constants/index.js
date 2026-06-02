// 全局常量:集中管理配色、参数范围与物理量,消灭下游魔法值。
// 数值口径与 index.css 的 CSS 变量保持一致,组件优先引用此处或对应变量。

/**
 * 配色方案(色盲友好:蓝-橙主色调)。
 * 铁律:禁止用红绿区分关键信息——正/负、实/虚、低频/高频一律走蓝/橙。
 * 与 index.css 中 :root 的 CSS 变量一一对应,JS 侧(如 Canvas 绘制)直接取此处值。
 */
export const PALETTE = {
  blue: '#4a90e2', // 正 / 实部(cos) / 低频
  orange: '#f5a623', // 负 / 虚部(sin) / 高频
  bg: '#0f1117', // 页面背景
  surface: '#1a1d27', // 卡片 / 面板背景
  text: '#e8eaf0', // 主文字
  muted: '#5c6370', // 次要文字 / 分隔线 / 边界虚线
};

// 语义别名:让下游按"含义"取色,而非按"颜色名",降低误用红绿的可能。
export const SEMANTIC_COLORS = {
  positive: PALETTE.blue, // 正面积 / 正方向
  negative: PALETTE.orange, // 负面积 / 负方向
  real: PALETTE.blue, // 实部 (余弦投影)
  imaginary: PALETTE.orange, // 虚部 (正弦投影)
  lowFreq: PALETTE.blue, // 低频分量
  highFreq: PALETTE.orange, // 高频分量
};

/**
 * 圆周率两倍:相位与角频率换算的高频常量,单列避免下游重复书写 Math.PI * 2。
 */
export const TWO_PI = Math.PI * 2;

/**
 * 交互参数范围:统一 { min, max, step, default },供 Slider 等组件直接展开。
 * 命名遵循全项目一致的物理量词汇:amplitude / frequency / phase / harmonicCount / animationSpeed。
 */
export const PARAM_RANGES = {
  // 振幅:矢量半径,归一化到 [0, 1]
  amplitude: { min: 0, max: 1, step: 0.01, default: 0.5 },
  // 频率:每秒转数(Hz),圆周运动转速
  frequency: { min: 0, max: 10, step: 0.1, default: 1 },
  // 相位:起始角度,弧度制 [0, 2π)
  phase: { min: 0, max: TWO_PI, step: 0.01, default: 0 },
  // 谐波数量:第二章"谐波雕塑家"的圆个数,整数 1–50
  harmonicCount: { min: 1, max: 50, step: 1, default: 1 },
  // 动画速度倍率:慢动作拨盘,1x 实速 → 0.01x 极慢
  animationSpeed: { min: 0.01, max: 1, step: 0.01, default: 1 },
};

/**
 * 标准音高 A4 = 440Hz,序幕"声音的配方"与音频引擎共用。
 */
export const A4_FREQUENCY = 440;
