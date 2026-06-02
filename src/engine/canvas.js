// Canvas2D 初始化助手:屏蔽高分屏适配与 resize 细节。
// 之所以封装:Canvas 在 HiDPI(devicePixelRatio>1)下若不放大位图会发虚,
// 章节绘制代码应只用 CSS 像素坐标作画,缩放由本助手统一兜底。

/**
 * 初始化一个随容器自适应、已做 DPR 缩放的 2D 画布。
 * 绘制时使用返回的 width/height(CSS 像素),无需关心物理像素。
 * @param {HTMLCanvasElement} canvasEl
 * @returns {{ ctx: CanvasRenderingContext2D, width: number, height: number, clear: Function, destroy: Function }}
 */
export function setupCanvas(canvasEl) {
  const ctx = canvasEl.getContext('2d')

  // 以返回对象自身承载尺寸,resize 时就地更新,调用方持有引用即可读到最新值。
  const api = {
    ctx,
    width: 0,
    height: 0,
    clear() {
      // 用 CSS 像素清屏:已通过 setTransform 把坐标系缩放到 CSS 尺度。
      ctx.clearRect(0, 0, api.width, api.height)
    },
    destroy() {
      resizeObserver.disconnect()
    },
  }

  const applySize = () => {
    // 优先按元素实际占位(CSS 尺寸)设位图,保证显示比例与布局一致。
    const cssWidth = canvasEl.clientWidth
    const cssHeight = canvasEl.clientHeight
    const dpr = window.devicePixelRatio || 1

    // 位图按物理像素分配,避免高分屏下模糊。
    canvasEl.width = Math.round(cssWidth * dpr)
    canvasEl.height = Math.round(cssHeight * dpr)

    // 把绘图坐标系缩放回 CSS 像素,业务代码无感知 DPR。
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    api.width = cssWidth
    api.height = cssHeight
  }

  // 监听容器尺寸变化(响应式布局/旋屏)而非 window.resize,粒度更准。
  const resizeObserver = new ResizeObserver(applySize)
  resizeObserver.observe(canvasEl)

  applySize() // 首次同步尺寸,避免初始帧用到 0×0 画布

  return api
}
