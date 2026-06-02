# CLAUDE.md — 《看见傅里叶》交互式科普网站

> 本文件为项目级工作约定，优先级高于模型默认行为。完整设计见 [`design.md`](./design.md)，本文件只提炼**开发必须遵守的约束与决策**。

## 一、项目概述

面向**零高等数学基础**用户的交互式科普网站，通过几何直觉与主动探索讲透傅里叶变换。核心体验路径：**看见波形 → 触碰频率 → 在频域中思考**。

- 产品形态：纯静态单页应用（SPA），移动端优先，左右滑动切换章节。
- 当前状态：**alpha + beta + v1.0 已实现**（第一至四章交互完成，含 Web Audio 视听同步、周期拉伸 ∑→∫）；序幕、终章为占位骨架。

## 二、技术栈（强制）

| 领域 | 选型 | 说明 |
|------|------|------|
| 框架 | React | 仅管理 UI 状态与组件，**不参与逐帧动画** |
| 渲染 | Canvas 2D API | 承载所有高性能动画；复杂 3D 局部才引入 Three.js |
| 构建 | Vite | 静态产物，无 SSR |
| 数学 | 自研轻量 FFT | 仅终章绘图用；级数合成动画用预设参数实时累加，**不走 FFT** |
| 音频 | Web Audio API | `OscillatorNode` 合成 → `AnalyserNode` 可视化 → 输出 |
| 公式 | KaTeX | 需支持公式分项高亮与点击交互 |
| 部署 | GitHub Pages / Vercel | 纯静态 + CDN |

约束：
- React 状态层与 Canvas 渲染层**严格分离**。动画循环用 `requestAnimationFrame`，不通过 React state 驱动每帧重绘。
- 优先 Function Component + Hooks；动画/音频等命令式资源用 `useRef` 持有，在 `useEffect` 中管理生命周期。
- 纯静态，**不引入后端**。所有计算在前端完成。

## 三、章节架构（叙事即认知闭环）

每章 = 一个核心交互实验 + 一个认知闭环，互相解耦，可独立开发。

| 章节 | 核心交互 | 关键机制 |
|------|----------|----------|
| 序幕 | 三种乐器同音 A4 对比 | 同音高、异波形，抛出"配方"问题 |
| 第一章 | 单圆三参数（半径/转速/相位） | "虚实分离"三段开关，消除虚部恐惧 |
| 第二章 | 谐波雕塑家（1–50 圆首尾相连） | 聚焦模式、慢动作拨盘、分步推导向导（正交性可视化） |
| 第三章 | 时域↔频域双向绑定 | "随机化相位"破坏性实验、视听同步 |
| 第四章 | 周期极限拉伸 T→∞ | 边界虚线、显微镜、∑→∫ 飞跃动画 |
| 终章 | 神笔傅里叶（2D DFT 绘图） | 分步绘制、二维频谱图、一维/二维知识桥接 |

建议代码组织：每章独立目录（如 `src/chapters/ch02-harmonics/`），共享能力沉淀到 `src/engine/`（动画循环、Canvas 封装、FFT、音频）与 `src/components/`（滑块、开关、公式卡片等）。

## 四、设计铁律（实现时不可妥协）

1. **几何直觉优先于代数**：公式是对可视化现象的精确描述，**绝不作为出发点**。任何公式出现前，必须先有对应的动画/可触摸交互。
2. **交互即推导**：每个滑块/点击都是推导的一步。数学卡片是交互的自然延伸，不是附属说明。
3. **错误驱动理解**：保留并强化"破坏性实验"（如随机化相位）、试错探索路径，不要替用户给结论。
4. **反黑箱**：终章绘图、分步推导等必须**分步可见**，禁止"一键出结果"式黑箱。
5. **认知过载防护**：信息密度高的场景（>10 圆）默认启用聚焦/半透明/高亮联动。

## 五、可访问性与移动端（每个组件都要满足）

- 全键盘可操作；交互元素有可见焦点态。
- 配色用**蓝–橙**主色调（色盲友好），**禁止用红绿区分关键信息**。
- 所有动画提供文字描述层（aria / 旁白文案）。
- 触屏优先：大号滑块与按钮、双指缩放画布与频谱图。

## 六、开发迭代路线（按此顺序推进）

1. **alpha**：第一章 + 第二章（含聚焦模式、慢动作、分步推导）——项目灵魂，最先做。
2. **beta**：第三章频谱双向联动 + 随机化相位 + Web Audio 视听同步。
3. **v1.0**：第四章周期拉伸、参数动态显示、显微镜工具。
4. **v2.0**：终章神笔傅里叶（分步绘制 + 二维频谱 + 知识桥接）。
5. **v3.0**：分屏对比实验室、挑战任务/成就系统、移动端深度适配、可访问性收尾。

## 七、编码约定

- 命名语义化，见名知意；杜绝魔法值（频率/振幅/相位等常量集中到 `constants`）。
- 注释精简，只解释"为什么"，不复述代码。
- 数学/物理量统一命名（如 `amplitude`、`frequency`、`phase`、`omega`、`harmonicCount`），全项目一致。
- 修改保持向下兼容，不破坏已通过验收的章节交互。

## 八、命令与目录结构

### 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（Vite dev server，默认 http://localhost:5173）
npm run build    # 生产构建，产物输出到 dist/
npm run preview  # 本地预览构建产物
```

依赖版本基线：React 19、Vite 8、KaTeX 0.17。

> lint / format / test 尚未接入。后续引入 ESLint + Prettier、Vitest 后回填命令。

### 目录结构

```
.
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置（@vitejs/plugin-react）
├── design.md               # 完整设计方案（需求与体验细节的唯一权威来源）
├── CLAUDE.md               # 本文件：开发约定
└── src/
    ├── main.jsx            # React 挂载入口
    ├── App.jsx             # 分页式叙事容器（按 chapters 顺序渲染）
    ├── index.css           # 全局样式 + 蓝橙配色 CSS 变量
    ├── constants/
    │   └── index.js        # 全局常量：PALETTE、参数范围、A4=440 等（消灭魔法值）
    ├── hooks/              # engine 与 React 的适配层（engine 仍零 React 依赖）
    │   ├── useCanvasAnimation.js  # 绑定 canvas + rAF 循环,组件只写纯绘制函数
    │   └── useAudioEngine.js      # 管理音频生命周期 + 用户手势开关 + 节流同步
    ├── engine/             # 命令式底层引擎（与 React 解耦）
    │   ├── animationLoop.js  # rAF 循环管理，支持慢动作倍率
    │   ├── canvas.js         # Canvas2D 初始化（DPR 缩放 + resize）
    │   ├── fft.js            # 复数 DFT/IDFT 与 dft2d（终章绘图）
    │   └── audio.js          # Web Audio 引擎（惰性 AudioContext + Analyser）
    ├── components/         # 可复用 UI 组件（可访问 + 触屏优先）
    │   ├── Slider.jsx        # 范围滑块
    │   ├── ToggleSwitch.jsx  # N 段分段开关（如"虚实分离"三段式）
    │   └── FormulaCard.jsx   # KaTeX 公式卡片，支持分项点击高亮
    └── chapters/           # 各章节模块，互相解耦
        ├── index.js          # 导出有序 chapters 数组 [{ id, title, Component }]
        ├── ch00-prelude/         # 序幕：声音的配方
        ├── ch01-rotating-seed/   # 第一章：旋转的种子
        ├── ch02-harmonics/       # 第二章：圆舞曲（谐波雕塑家）
        ├── ch03-spectrum/        # 第三章：从"指纹"到"谱"
        ├── ch04-bridge-to-continuous/  # 第四章：通往连续的桥梁
        └── ch05-finale-drawing/  # 终章：神笔傅里叶
```

### 约定补充

- 新增章节：在 `src/chapters/` 下建目录写 `index.jsx`（默认导出组件），并在 `src/chapters/index.js` 的 `chapters` 数组中按叙事顺序登记 `{ id, title, Component }`。
- 章节业务组件可依赖 `engine/`、`components/`、`constants/`；`engine/` 为纯命令式模块，**不得反向依赖 React 组件**。
- 当前各章节为占位骨架，主交互逐章按 design.md 落地（见第六节迭代路线）。
