// 轻量傅里叶计算。复数统一用 { re, im } 表示。
// 设计取舍:级数合成动画走预设参数实时累加(不在此处),本模块只服务"需要真正变换"
// 的场景——通用 DFT/IDFT 与终章"神笔傅里叶"的二维曲线分解。
// TODO: 当前为朴素 O(n²) 实现,数学正确但大 N 偏慢;后续可替换为 radix-2 FFT(N 为 2 的幂),
//       接口保持不变(输入复数数组、输出复数数组),仅内部换算法。

const TWO_PI = Math.PI * 2

/**
 * 朴素离散傅里叶变换(DFT)。
 * X[k] = Σ_{n} x[n] · e^(-i·2π·k·n/N)
 * @param {Array<{re:number, im:number}>} samples 时域复数样本
 * @returns {Array<{re:number, im:number}>} 频域复数谱,长度同输入
 */
export function dft(samples) {
  const length = samples.length
  const spectrum = new Array(length)

  for (let k = 0; k < length; k += 1) {
    let re = 0
    let im = 0
    for (let n = 0; n < length; n += 1) {
      // 旋转因子 e^(-i·angle):cos(angle) - i·sin(angle)
      const angle = (TWO_PI * k * n) / length
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      // (a+bi)(cos - i·sin) = (a·cos + b·sin) + i(b·cos - a·sin)
      re += samples[n].re * cos + samples[n].im * sin
      im += samples[n].im * cos - samples[n].re * sin
    }
    spectrum[k] = { re, im }
  }

  return spectrum
}

/**
 * 朴素离散傅里叶逆变换(IDFT)。
 * x[n] = (1/N) Σ_{k} X[k] · e^(+i·2π·k·n/N)
 * 与 dft 互逆:idft(dft(x)) ≈ x(浮点误差内)。
 * @param {Array<{re:number, im:number}>} spectrum 频域复数谱
 * @returns {Array<{re:number, im:number}>} 还原的时域复数样本
 */
export function idft(spectrum) {
  const length = spectrum.length
  const samples = new Array(length)

  for (let n = 0; n < length; n += 1) {
    let re = 0
    let im = 0
    for (let k = 0; k < length; k += 1) {
      // 逆变换旋转因子符号为正:cos(angle) + i·sin(angle)
      const angle = (TWO_PI * k * n) / length
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      // (a+bi)(cos + i·sin) = (a·cos - b·sin) + i(a·sin + b·cos)
      re += spectrum[k].re * cos - spectrum[k].im * sin
      im += spectrum[k].re * sin + spectrum[k].im * cos
    }
    // 1/N 归一化使其与正变换严格互逆。
    samples[n] = { re: re / length, im: im / length }
  }

  return samples
}

/**
 * 二维封闭曲线的复数 DFT(终章"神笔傅里叶")。
 * 把平面点 {x, y} 视为复数 x + iy 喂给 DFT,每个频率分量对应一个旋转圆:
 * 振幅=圆半径、相位=起始角、频率=转速与转向(正逆时针/负顺时针)。
 * 返回按振幅降序排序——分步绘制时低频(大圆)先画轮廓、高频(小圆)后刻画细节。
 * @param {Array<{x:number, y:number}>} points 采样自封闭曲线的有序点列
 * @returns {Array<{freq:number, amplitude:number, phase:number}>} 按振幅降序的频域分量
 */
export function dft2d(points) {
  const length = points.length

  // 复用通用 DFT:点坐标 (x,y) 即复数 (re,im)。
  const samples = points.map((point) => ({ re: point.x, im: point.y }))
  const spectrum = dft(samples)

  const components = spectrum.map((value, k) => ({
    // 频率取带符号值:前半段 k 为正频率(逆时针),后半段映射为负频率(顺时针),
    // 与二维频谱图"正/负频率"的几何含义一致。
    freq: k <= length / 2 ? k : k - length,
    // 振幅与相位需对 DFT 结果归一化(除以 N),才等于该旋转圆的真实半径与初相。
    amplitude: Math.hypot(value.re, value.im) / length,
    phase: Math.atan2(value.im, value.re),
  }))

  // 大圆决定整体轮廓、应最先绘制,故按振幅降序。
  components.sort((a, b) => b.amplitude - a.amplitude)

  return components
}
