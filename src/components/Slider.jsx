import { useId } from 'react';

/**
 * 可访问的范围滑块。
 * 设计动机:
 * - 触屏优先,故用大号轨道与滑块(尺寸走内联样式,后续可抽到 CSS)。
 * - 原生 <input type="range"> 自带全键盘支持(方向键/Home/End)与正确语义,
 *   无需自造 div 滑块,避免重复实现可访问性。
 * - 仍显式补齐 aria-* 以覆盖屏幕阅读器对自定义样式 range 的兼容差异。
 *
 * props:
 *   label    标签文本(必填,作为无障碍名称)
 *   value    当前值(受控)
 *   min/max/step 取值范围,通常从 constants/PARAM_RANGES 展开
 *   onChange 值变更回调,入参为 number
 *   unit?    数值单位后缀(如 'Hz'),仅用于显示
 */
export default function Slider({ label, value, min, max, step, onChange, unit = '' }) {
  // 关联 label 与 input,屏幕阅读器据此朗读名称
  const inputId = useId();

  // 原生 range 的 value 是字符串,统一转为 number 交给上层,杜绝下游类型困扰
  const handleChange = (e) => onChange(Number(e.target.value));

  return (
    <div className="slider">
      <label htmlFor={inputId} className="slider__label">
        <span className="slider__label-text">{label}</span>
        {/* 实时回显当前值,兼顾视觉反馈与认知负荷 */}
        <span className="slider__value">
          {value}
          {unit}
        </span>
      </label>
      <input
        id={inputId}
        type="range"
        className="slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        // 显式声明 ARIA 数值语义,确保自定义样式下仍被正确朗读
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        // 触屏大号热区:足够大的高度便于手指拖拽
        style={{ width: '100%', height: '2.5rem', cursor: 'pointer' }}
      />
    </div>
  );
}
