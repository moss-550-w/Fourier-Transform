// Web Audio 引擎:把频域分量(谐波)实时合成为声音,并挂 AnalyserNode 供可视化。
// 惰性原则:浏览器自动播放策略要求 AudioContext 必须在用户手势后才能 resume,
// 故在首次 resume() 前不创建任何音频节点,避免 AudioContext 处于 suspended 浪费资源。

// 主输出增益。多谐波叠加易爆音,统一压一档总音量留出余量(非魔法值:防削波系数)。
const MASTER_GAIN = 0.3

// AnalyserNode 频域/时域数据点数。2048 兼顾波形细节与开销,为 2 的幂(FFT 约束)。
const ANALYSER_FFT_SIZE = 2048

/**
 * 创建惰性 Web Audio 引擎。
 * @returns {{ resume: Function, playHarmonics: Function, stop: Function, getAnalyser: Function }}
 */
export function createAudioEngine() {
  let audioContext = null
  let masterGain = null
  let analyser = null
  let voices = [] // 当前在发声的 { oscillator, gain } 列表,stop 时统一回收

  // 惰性装配:首次需要时才建 AudioContext 与公共节点链(master → analyser → 输出)。
  const ensureContext = () => {
    if (audioContext) return

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    audioContext = new AudioContextCtor()

    masterGain = audioContext.createGain()
    masterGain.gain.value = MASTER_GAIN

    analyser = audioContext.createAnalyser()
    analyser.fftSize = ANALYSER_FFT_SIZE

    // 信号流:各谐波 → masterGain → analyser → 扬声器。
    // analyser 串在主输出上,可视化拿到的就是最终听到的合成波形。
    masterGain.connect(analyser)
    analyser.connect(audioContext.destination)
  }

  // 停止并断开当前所有发声节点,释放资源(OscillatorNode 一次性,停后不可复用)。
  const releaseVoices = () => {
    for (const { oscillator, gain } of voices) {
      try {
        oscillator.stop()
      } catch {
        // 尚未 start 或已 stop 时 stop() 会抛错,忽略即可。
      }
      oscillator.disconnect()
      gain.disconnect()
    }
    voices = []
  }

  return {
    // 必须在用户手势(点击等)回调中调用,以满足自动播放策略并解挂 suspended。
    async resume() {
      ensureContext()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
    },

    /**
     * 用一组谐波实时合成并发声。重复调用会先停掉上一组,实现"换音色"。
     * @param {Array<{freq:number, amplitude:number, phase:number}>} harmonics
     */
    playHarmonics(harmonics) {
      ensureContext()
      releaseVoices() // 先清场,避免叠加旧声音

      const startTime = audioContext.currentTime
      for (const { freq, amplitude, phase } of harmonics) {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()

        oscillator.frequency.value = freq
        gain.gain.value = amplitude

        // Web Audio 原生振荡器无相位参数,用 setValueAtTime 起始偏移近似初相,
        // 让多谐波叠加的合成波形形状正确(相位决定波形,见 design.md 第三章)。
        oscillator.connect(gain)
        gain.connect(masterGain)
        oscillator.start(startTime + phase / (2 * Math.PI * (freq || 1)))

        voices.push({ oscillator, gain })
      }
    },

    // 停止全部发声,但保留 AudioContext(下次 playHarmonics 可立即复用)。
    stop() {
      if (!audioContext) return
      releaseVoices()
    },

    // 返回 AnalyserNode 供 Canvas 可视化读取频域/时域数据;未初始化则返回 null。
    getAnalyser() {
      return analyser
    },
  }
}
