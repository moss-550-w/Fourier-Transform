import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * 公式卡片:用 KaTeX 渲染数学公式,并预留"分项点击高亮"能力。
 * 设计动机(对应 design.md"公式栏高亮""分项点击"):
 * - 公式是交互的自然延伸——用户点击某一分项,对应动画/分量应高亮,反之亦然。
 * - KaTeX 输出静态 HTML,无 React 节点;故整条公式用 renderToString + dangerouslySetInnerHTML,
 *   渲染开销大,用 useMemo 按 latex 缓存,避免父组件每次重渲染都重算。
 *
 * props:
 *   latex       完整公式的 LaTeX 字符串(必填)
 *   terms?      可点击分项 [{ id, latex, label? }],用于把公式拆成可独立高亮/点击的片段
 *   onTermClick? 分项点击回调,入参为 term.id
 *   activeTermId? 当前高亮分项 id,驱动高亮 className
 */
export default function FormulaCard({ latex, terms, onTermClick, activeTermId }) {
  // 整条公式渲染:displayMode 居中大号展示,throwOnError=false 避免脏输入崩溃整页
  const html = useMemo(
    () => katex.renderToString(latex, { displayMode: true, throwOnError: false }),
    [latex],
  );

  return (
    <div className="formula-card">
      {/* 主公式:KaTeX 输出可信(来自代码内 latex 常量),故 dangerouslySetInnerHTML 安全 */}
      <div
        className="formula-card__display"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* 分项区:把公式拆成可点击片段,点击触发高亮联动。
          TODO: 后续接入 design.md 的双向高亮——分项高亮 ↔ Canvas 对应分量高亮(同色)。
          TODO: 分项目前各自独立 renderToString,若分项很多可考虑批量缓存优化。 */}
      {terms?.length > 0 && (
        <div className="formula-card__terms" role="group" aria-label="公式分项">
          {terms.map((term) => (
            <FormulaTerm
              key={term.id}
              term={term}
              active={term.id === activeTermId}
              onClick={onTermClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 单个可点击分项:渲染自身片段 latex,选中时挂高亮 className 钩子。 */
function FormulaTerm({ term, active, onClick }) {
  const html = useMemo(
    () => katex.renderToString(term.latex, { throwOnError: false }),
    [term.latex],
  );

  return (
    <button
      type="button"
      // is-active 即高亮钩子,样式留给 CSS;无障碍名称优先用 label,缺省回退到 latex
      className={`formula-card__term${active ? ' is-active' : ''}`}
      aria-pressed={active}
      aria-label={term.label ?? term.latex}
      onClick={() => onClick?.(term.id)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
