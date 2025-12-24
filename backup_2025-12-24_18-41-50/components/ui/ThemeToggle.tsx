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
      <div className="w-9 h-9 rounded-md bg-gray-100 animate-pulse" />
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
        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-label="Schimbă tema"
      >
        {getThemeIcon()}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <button
            onClick={() => {
              setTheme('light')
              setIsOpen(false)
            }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              theme === 'light' 
                ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Sun className="h-4 w-4" />
            <span>Luminos</span>
          </button>
          
          <button
            onClick={() => {
              setTheme('dark')
              setIsOpen(false)
            }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              theme === 'dark' 
                ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Moon className="h-4 w-4" />
            <span>Întunecat</span>
          </button>
          
          <button
            onClick={() => {
              setTheme('system')
              setIsOpen(false)
            }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              theme === 'system' 
                ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>Sistem</span>
          </button>
        </div>
      )}
    </div>
  )
}