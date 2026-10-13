import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'dark-mode'
const AUTO_KEY = 'dark-mode-auto'

/**
 * 黑夜模式状态管理 hook。
 * 优先级：手动切换（localStorage）> 自动跟随系统 > 默认浅色。
 * localStorage 不可用时降级为内存态，不报错不阻塞。
 *
 * 返回：
 * - enabled: 当前是否为黑夜模式
 * - auto: 是否开启系统主题跟随
 * - toggle: 手动切换黑夜模式（若 auto 开启则自动关闭 auto）
 * - setAuto: 开启/关闭系统主题跟随
 */
export function useDarkMode() {
  const [auto, setAutoState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTO_KEY)
      if (stored === 'false') return false
      // 默认开启 auto-follow
      return true
    } catch {
      return true
    }
  })

  const [enabled, setEnabled] = useState<boolean>(() => {
    const initial = getInitialDarkMode(auto)
    applyDarkMode(initial)
    return initial
  })

  // auto 变化时重新同步系统主题
  const mediaRef = useRef<MediaQueryList | null>(null)
  const mediaHandlerRef = useRef<((e: MediaQueryListEvent) => void) | null>(null)

  const syncFromSystem = useCallback(() => {
    if (!auto) return
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    setEnabled(dark)
    applyDarkMode(dark)
    // auto 模式下不需要存 localStorage dark-mode value
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 静默降级
    }
  }, [auto])

  // 初始化 + auto 变化时同步
  useEffect(() => {
    if (auto) {
      syncFromSystem()
    }
  }, [auto, syncFromSystem])

  // 监听系统主题变化
  useEffect(() => {
    if (!auto) {
      // 清理旧 listener
      if (mediaRef.current && mediaHandlerRef.current) {
        mediaRef.current.removeEventListener('change', mediaHandlerRef.current)
        mediaRef.current = null
        mediaHandlerRef.current = null
      }
      return
    }

    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mediaRef.current = mq
      const handler = (e: MediaQueryListEvent) => {
        setEnabled(e.matches)
        applyDarkMode(e.matches)
      }
      mediaHandlerRef.current = handler
      mq.addEventListener('change', handler)
    } catch {
      // 浏览器不支持 matchMedia，降级手动模式
    }

    return () => {
      if (mediaRef.current && mediaHandlerRef.current) {
        mediaRef.current.removeEventListener('change', mediaHandlerRef.current)
      }
    }
  }, [auto])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      // 如果 auto 开启，手动切换时关闭 auto
      if (auto) {
        setAutoState(false)
        try {
          localStorage.setItem(AUTO_KEY, 'false')
        } catch {
          // 静默降级
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
      } catch {
        // localStorage 不可用时降级为内存态
      }
      applyDarkMode(next)
      return next
    })
  }, [auto])

  const setAuto = useCallback((val: boolean) => {
    setAutoState(val)
    try {
      localStorage.setItem(AUTO_KEY, val ? 'true' : 'false')
    } catch {
      // 静默降级
    }
    if (val) {
      // 开启 auto 时，移除手动 localStorage 值
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // 静默降级
      }
    }
  }, [])

  return { enabled, auto, toggle, setAuto }
}

function getInitialDarkMode(auto: boolean): boolean {
  try {
    if (auto) {
      // 自动跟随系统
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return true
      }
      return false
    }
    // 手动模式
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
    return false
  } catch {
    return false
  }
}

function applyDarkMode(enabled: boolean) {
  const root = document.documentElement
  if (enabled) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
