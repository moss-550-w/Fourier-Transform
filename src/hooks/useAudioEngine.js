import { useCallback, useEffect, useRef, useState } from 'react'
import { createAudioEngine } from '../engine/audio.js'

// 同步节流间隔(ms):playHarmonics 每次会重建振荡器,拖动时若逐帧调用会爆音/卡顿,
// 故 trailing 节流——听感仍连续变化,但重建频率受控。
const SYNC_INTERVAL = 100

/**
 * Web Audio 引擎的 React 适配层:管理引擎生命周期、用户手势开关、节流同步。
 * 设计动机:engine 为命令式模块;音频必须在用户手势后 resume(浏览器自动播放策略)。
 *
 * @returns {{ enabled: boolean, enable: () => Promise<void>, disable: () => void, sync: (harmonics) => void }}
 */
export function useAudioEngine() {
  const engineRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  // 节流状态:last 上次实际同步时刻,timer 待触发计时器,pending 最新待发谐波
  const throttleRef = useRef({ last: 0, timer: null, pending: null })

  useEffect(() => {
    engineRef.current = createAudioEngine()
    const throttle = throttleRef.current
    return () => {
      if (throttle.timer) clearTimeout(throttle.timer)
      engineRef.current?.stop()
      engineRef.current = null
    }
  }, [])

  const enable = useCallback(async () => {
    await engineRef.current?.resume()
    setEnabled(true)
  }, [])

  const disable = useCallback(() => {
    engineRef.current?.stop()
    setEnabled(false)
  }, [])

  // 节流同步:合并高频更新,最多每 SYNC_INTERVAL 触发一次(trailing)
  const sync = useCallback((harmonics) => {
    const throttle = throttleRef.current
    throttle.pending = harmonics
    if (throttle.timer) return // 已有待触发任务,只更新 pending 即可

    const wait = Math.max(0, SYNC_INTERVAL - (performance.now() - throttle.last))
    throttle.timer = setTimeout(() => {
      throttle.last = performance.now()
      throttle.timer = null
      engineRef.current?.playHarmonics(throttle.pending)
    }, wait)
  }, [])

  return { enabled, enable, disable, sync }
}
