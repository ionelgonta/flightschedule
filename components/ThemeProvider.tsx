'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark'

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (_: Theme) => void
  mounted: boolean
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => {},
  mounted: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = window.document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
  }, [mounted])

  const value = {
    theme: 'dark' as Theme,
    setTheme: () => {},
    mounted,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
