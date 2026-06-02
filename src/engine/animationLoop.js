// 动画循环管理器:统一的逐帧驱动源。
// 设计铁律——React 不参与逐帧重绘,所有动画走 rAF;此处把"墙上时间"换算成
// 受慢动作拨盘倍率影响的"逻辑时间",章节代码只消费 { time, dt } 无需关心倍率。

// 慢动作拨盘范围(见 design.md 第二章):0.01x(极慢精雕)~ 1x(常速)。
const SPEED_MIN = 0.01
const SPEED_MAX = 1

// 单帧最大真实步长(秒)。标签页切回后台再回前台时,rAF 会一次性补一大段时间差,
// 不钳制会导致动画"瞬移";钳到约两帧(60fps)避免跳变。
const MAX_REAL_DELTA = 1 / 30

const clampSpeed = (value) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, value))

/**
 * 创建一个 rAF 动画循环。
 * @returns {{ start: Function, stop: Function, subscribe: Function, setSpeed: Function }}
 */
export function createAnimationLoop() {
  const callbacks = new Set()

  let rafId = null // 非 null 表示已在运行,用于防止重复注册 rAF
  let speed = SPEED_MAX // 拨盘倍率,作用于逻辑时间推进速度
  let logicalTime = 0 // 累积逻辑时间(已乘倍率),供章节做相位/角度推进
  let lastRealTimestamp = 0 // 上一帧的 rAF 真实时间戳(ms)

  const frame = (timestamp) => {
    // 首帧无上一帧参照,真实步长记 0,避免用未初始化时间戳算出巨大 dt。
    const realDelta = lastRealTimestamp === 0
      ? 0
      : Math.min((timestamp - lastRealTimestamp) / 1000, MAX_REAL_DELTA)
    lastRealTimestamp = timestamp

    // dt 是已应用倍率的逻辑步长,慢动作时整体推进按比例放缓。
    const dt = realDelta * speed
    logicalTime += dt

    for (const callback of callbacks) {
      callback({ time: logicalTime, dt })
    }

    rafId = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (rafId !== null) return // 已运行则忽略,避免叠加多条 rAF 链
      lastRealTimestamp = 0 // 重置参照,让恢复后的首帧 dt 为 0 不跳变
      rafId = requestAnimationFrame(frame)
    },

    stop() {
      if (rafId === null) return
      cancelAnimationFrame(rafId)
      rafId = null
    },

    // 注册逐帧回调,返回取消订阅函数,便于在组件卸载时清理。
    subscribe(callback) {
      callbacks.add(callback)
      return () => callbacks.delete(callback)
    },

    // 设置慢动作倍率,自动钳制到合法区间。
    setSpeed(multiplier) {
      speed = clampSpeed(multiplier)
    },
  }
}
