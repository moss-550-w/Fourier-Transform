import { useId } from 'react';

/**
 * 分段开关:N 段单选(本质是一组互斥选项)。
 * 典型用例:第一章"虚实分离"三段式——只看垂直投影 | 只看水平投影 | 完整旋转矢量。
 *
 * 设计动机:
 * - 语义上是单选,故用 role="radiogroup" + 每段 role="radio"/aria-checked,
 *   而非一堆 button,让屏幕阅读器朗读"x / N 已选中"。
 * - 全键盘可操作:左右方向键在段间循环切换,符合 WAI-ARIA radiogroup 惯例。
 * - 触屏优先:每段为大号热区。
 *
 * props:
 *   options  [{ value, label }] 段定义,顺序即视觉与键盘遍历顺序
 *   value    当前选中段的 value(受控)
 *   onChange 选中变更回调,入参为新 value
 *   label    整组的无障碍名称
 */
export default function ToggleSwitch({ options, value, onChange, label }) {
  const groupId = useId();

  // 方向键循环切换:基于当前索引前后移动,首尾环绕,避免到边界卡死
  const handleKeyDown = (e) => {
    const currentIndex = options.findIndex((opt) => opt.value === value);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else {
      return; // 非导航键不拦截,放行 Tab 等默认行为
    }
    e.preventDefault();
    onChange(options[nextIndex].value);
  };

  return (
    <div
      className="toggle-switch"
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((opt) => {
        const checked = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            className={`toggle-switch__segment${checked ? ' is-active' : ''}`}
            // roving tabindex:仅选中段进入 Tab 序列,组内切换交给方向键
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(opt.value)}
            // 触屏大号热区
            style={{ minHeight: '2.75rem', cursor: 'pointer' }}
            id={`${groupId}-${opt.value}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
