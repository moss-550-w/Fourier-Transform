// 章节导航契约:供 App.jsx 消费的有序数组。
// 顺序即叙事顺序,每项 { id, title, Component }:id 为目录名,title 为中文章节名,Component 为该章默认导出。
import Prelude from './ch00-prelude/index.jsx'
import RotatingSeed from './ch01-rotating-seed/index.jsx'
import Harmonics from './ch02-harmonics/index.jsx'
import Spectrum from './ch03-spectrum/index.jsx'
import BridgeToContinuous from './ch04-bridge-to-continuous/index.jsx'
import FinaleDrawing from './ch05-finale-drawing/index.jsx'

export const chapters = [
  { id: 'ch00-prelude', title: '序幕:声音的配方', Component: Prelude },
  { id: 'ch01-rotating-seed', title: '第一章:旋转的种子', Component: RotatingSeed },
  { id: 'ch02-harmonics', title: '第二章:圆舞曲(谐波雕塑家)', Component: Harmonics },
  { id: 'ch03-spectrum', title: '第三章:从"指纹"到"谱"', Component: Spectrum },
  { id: 'ch04-bridge-to-continuous', title: '第四章:通往连续的桥梁', Component: BridgeToContinuous },
  { id: 'ch05-finale-drawing', title: '终章:万物皆可画(神笔傅里叶)', Component: FinaleDrawing },
]
