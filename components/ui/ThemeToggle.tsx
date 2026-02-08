'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-white/10 animate-pulse" />
    )
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Luminos'
      case 'dark':
        return 'Întunecat'
      case 'system':
        return 'Sistem'
      default:
        return 'Sistem'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
        aria-label="Schimbă tema"
      >
        {getThemeIcon()}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 glass-card shadow-xl py-2 z-50">
          <button
            onClick={() => { setTheme('light'); setIsOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors ${theme === 'light' ? 'bg-white/15' : ''}`}
          >
            <Sun className="h-4 w-4" />
            <span>Luminos</span>
          </button>
          <button
            onClick={() => { setTheme('dark'); setIsOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors ${theme === 'dark' ? 'bg-white/15' : ''}`}
          >
            <Moon className="h-4 w-4" />
            <span>Întunecat</span>
          </button>
          <button
            onClick={() => { setTheme('system'); setIsOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors ${theme === 'system' ? 'bg-white/15' : ''}`}
          >
            <Monitor className="h-4 w-4" />
            <span>Sistem</span>
          </button>
        </div>
      )}
    </div>
  )
}