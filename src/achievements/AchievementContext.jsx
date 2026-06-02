import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// 成就系统:轻量全局状态 + localStorage 持久化。
// 设计动机(design.md "挑战任务与成就系统"):用趣味勋章激励用户探索各章关键交互。
// 各章只需在已有交互回调里调用 unlock(id),无需关心存储与去重。

const STORAGE_KEY = 'see-fourier.achievements'

// 徽章定义:id 唯一,name/desc 用于面板展示。新增徽章只改这里。
export const ACHIEVEMENTS = [
  { id: 'prelude-listen', name: '初闻配方', desc: '在序幕聆听三种乐器的同一个音' },
  { id: 'rotor-full', name: '虚实合一', desc: '在第一章切到「完整旋转矢量」视角' },
  { id: 'harmonics-many', name: '谐波雕塑家', desc: '在第二章把谐波数量加到 30 以上' },
  { id: 'derivation-done', name: '亲历推导', desc: '完整走完正交性分步推导向导' },
  { id: 'phase-chaos', name: '相位风暴', desc: '在第三章触发「随机化相位」实验' },
  { id: 'sound-on', name: '听见频率', desc: '在第三章开启声音' },
  { id: 'reach-infinity', name: '抵达无穷', desc: '在第四章把周期 T 拉到极限,见证 ∑→∫' },
  { id: 'draw-anything', name: '神笔在手', desc: '在终章用旋转的圆画出一条曲线' },
  { id: 'lab-compare', name: '对比实验员', desc: '打开分屏对比实验室' },
]

const AchievementContext = createContext(null)

function loadUnlocked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set() // 隐私模式/禁用存储时静默降级为内存态
  }
}

export function AchievementProvider({ children }) {
  const [unlocked, setUnlocked] = useState(loadUnlocked)
  const [toast, setToast] = useState(null) // 最近解锁的徽章,用于浮层提示

  // 持久化:每次集合变化写回 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]))
    } catch {
      // 忽略写入失败(配额/隐私模式)
    }
  }, [unlocked])

  // toast 自动消失
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const unlock = useCallback((id) => {
    setUnlocked((prev) => {
      if (prev.has(id)) return prev // 已解锁,幂等
      const meta = ACHIEVEMENTS.find((a) => a.id === id)
      if (!meta) return prev
      const next = new Set(prev)
      next.add(id)
      setToast(meta)
      return next
    })
  }, [])

  const value = useMemo(() => ({ unlocked, unlock, toast }), [unlocked, unlock, toast])

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>
}

// 章节内上报用:const unlock = useUnlock(); unlock('phase-chaos')
export function useUnlock() {
  const ctx = useContext(AchievementContext)
  return ctx ? ctx.unlock : () => {} // Provider 缺失时降级为空操作,不报错
}

// 面板/导航用:读取解锁状态与最近 toast
export function useAchievements() {
  return useContext(AchievementContext)
}
