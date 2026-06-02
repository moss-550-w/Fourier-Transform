import { useEffect, useRef } from 'react'
import { setupCanvas } from '../engine/canvas.js'
import { createAnimationLoop } from '../engine/animationLoop.js'

/**
 * 把 engine 的 Canvas2D 初始化 + rAF 循环 接到一个 <canvas> 上的 React 适配层。
 * 设计动机(对应 CLAUDE.md 铁律):engine 为纯命令式模块、不依赖 React;
 * 由本 hook 负责生命周期与桥接,组件只写一个纯绘制函数即可。
 *
 * @param {(frame: { ctx, width, height, time, dt }) => void} draw 每帧绘制回调
 * @param {{ speed?: number }} options 慢动作倍率(0.01~1),变化时热更新而不重建循环
 * @returns {import('react').RefObject<HTMLCanvasElement>} 绑定到 <canvas> 的 ref
 */
export function useCanvasAnimation(draw, { speed = 1 } = {}) {
  const canvasRef = useRef(null)
  // 用 ref 持有最新 draw:参数(振幅/频率…)变化时无需重建 rAF,闭包每帧取最新值
  const drawRef = useRef(draw)
  drawRef.current = draw
  const loopRef = useRef(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return undefined

    const surface = setupCanvas(canvasEl)
    const loop = createAnimationLoop()
    loopRef.current = loop
    loop.setSpeed(speed) // 用挂载时的初始倍率;后续变化由下方 effect 同步

    const unsubscribe = loop.subscribe(({ time, dt }) => {
      surface.clear()
      drawRef.current?.({ ctx: surface.ctx, width: surface.width, height: surface.height, time, dt })
    })
    loop.start()

    return () => {
      unsubscribe()
      loop.stop()
      surface.destroy()
      loopRef.current = null
    }
    // 仅挂载一次:draw 走 ref、speed 走下方 effect,故依赖为空
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 慢动作倍率热更新:只调 setSpeed,不打断正在运行的循环
  useEffect(() => {
    loopRef.current?.setSpeed(speed)
  }, [speed])

  return canvasRef
}
