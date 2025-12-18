'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { Plane, Moon, Sun, Menu, X, ChevronDown, BarChart3 } from 'lucide-react'

export function Navbar() {
  const { theme, setTheme, mounted } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const analyticsRef = useRef<HTMLDivElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close analytics dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (analyticsRef.current && !analyticsRef.current.contains(event.target as Node)) {
        setIsAnalyticsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled 
        ? 'bg-surface/95 backdrop-blur-md shadow-elevation-2' 
        : 'bg-surface/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-container mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 state-layer rounded-lg p-2 -m-2">
            <div className="p-2 bg-primary-40 rounded-lg transition-colors duration-200">
              <Plane className="h-6 w-6 text-on-primary" />
            </div>
            <span className="title-large text-on-surface font-medium">
              Program Zboruri
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/" 
              className="state-layer px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-colors duration-200"
            >
              Acasă
            </Link>
            <Link 
              href="/aeroporturi" 
              className="state-layer px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-colors duration-200"
            >
              Aeroporturi
            </Link>
            
            {/* Analytics Dropdown */}
            <div className="relative" ref={analyticsRef}>
              <button
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                className="state-layer flex items-center space-x-1 px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analize</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAnalyticsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAnalyticsOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-surface-container rounded-xl shadow-elevation-3 border border-outline-variant py-2 z-50 animate-fade-in">
                  <Link
                    href="/statistici-aeroporturi"
                    className="state-layer block px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="label-large font-medium">Statistici Aeroporturi</div>
                    <div className="body-small text-on-surface-variant">Performanță și punctualitate</div>
                  </Link>
                  <Link
                    href="/program-zboruri"
                    className="state-layer block px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="label-large font-medium">Program Zboruri</div>
                    <div className="body-small text-on-surface-variant">Calendar interactiv</div>
                  </Link>
                  <Link
                    href="/statistici"
                    className="state-layer block px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="label-large font-medium">📊 Statistici Live</div>
                    <div className="body-small text-on-surface-variant">Date istorice și tendințe</div>
                  </Link>
                  <Link
                    href="/analize-istorice"
                    className="state-layer block px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="label-large font-medium">Analize Istorice</div>
                    <div className="body-small text-on-surface-variant">Tendințe și evoluție</div>
                  </Link>
                  <Link
                    href="/analize-rute"
                    className="state-layer block px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="label-large font-medium">Analize Rute</div>
                    <div className="body-small text-on-surface-variant">Rute și companii aeriene</div>
                  </Link>

                  <div className="border-t border-outline-variant my-2"></div>
                  <Link
                    href="/aeronave"
                    className="state-layer block px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="label-large font-medium">Catalog Aeronave</div>
                    <div className="body-small text-on-surface-variant">Căutare ICAO24 și înmatriculare</div>
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              href="/planificator-zboruri" 
              className="state-layer px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-colors duration-200"
            >
              Planificator
            </Link>
            <Link 
              href="/program-saptamanal" 
              className="state-layer px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-colors duration-200"
            >
              Program
            </Link>
            <Link 
              href="/parcari-otopeni" 
              className="state-layer px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-colors duration-200"
            >
              Parcări
            </Link>
            <Link 
              href="/despre" 
              className="state-layer px-4 py-2 rounded-lg label-large text-on-surface-variant hover:text-primary-40 transition-colors duration-200"
            >
              Despre
            </Link>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="state-layer p-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200"
              aria-label="Schimbă tema"
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-on-surface-variant" />
                ) : (
                  <Moon className="h-5 w-5 text-on-surface-variant" />
                )
              ) : (
                <Moon className="h-5 w-5 text-on-surface-variant" />
              )}
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="state-layer p-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200"
              aria-label="Schimbă tema"
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-on-surface-variant" />
                ) : (
                  <Moon className="h-5 w-5 text-on-surface-variant" />
                )
              ) : (
                <Moon className="h-5 w-5 text-on-surface-variant" />
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="state-layer p-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200"
              aria-label="Deschide meniul"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-on-surface-variant" />
              ) : (
                <Menu className="h-5 w-5 text-on-surface-variant" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-outline-variant animate-slide-down">
            <div className="flex flex-col space-y-1">
              <Link 
                href="/" 
                className="state-layer px-4 py-3 rounded-lg label-large text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Acasă
              </Link>
              <Link 
                href="/aeroporturi" 
                className="state-layer px-4 py-3 rounded-lg label-large text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Aeroporturi
              </Link>
              
              {/* Mobile Analytics Section */}
              <div className="bg-surface-container-low rounded-lg p-4 my-2">
                <div className="label-large font-medium text-primary-40 flex items-center mb-3">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analize
                </div>
                <div className="space-y-1 ml-6">
                  <Link 
                    href="/statistici-aeroporturi" 
                    className="state-layer block px-3 py-2 rounded-lg body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Statistici Aeroporturi
                  </Link>
                  <Link 
                    href="/program-zboruri" 
                    className="state-layer block px-3 py-2 rounded-lg body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Program Zboruri
                  </Link>
                  <Link 
                    href="/statistici" 
                    className="state-layer block px-3 py-2 rounded-lg body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Statistici Live
                  </Link>
                  <Link 
                    href="/analize-istorice" 
                    className="state-layer block px-3 py-2 rounded-lg body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analize Istorice
                  </Link>
                  <Link 
                    href="/analize-rute" 
                    className="state-layer block px-3 py-2 rounded-lg body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analize Rute
                  </Link>
                  <Link 
                    href="/aeronave" 
                    className="state-layer block px-3 py-2 rounded-lg body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Catalog Aeronave
                  </Link>
                </div>
              </div>
              
              <Link 
                href="/planificator-zboruri" 
                className="state-layer px-4 py-3 rounded-lg label-large text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Planificator Zboruri
              </Link>
              <Link 
                href="/program-saptamanal" 
                className="state-layer px-4 py-3 rounded-lg label-large text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Program Săptămânal
              </Link>
              <Link 
                href="/parcari-otopeni" 
                className="state-layer px-4 py-3 rounded-lg label-large text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Parcări Otopeni
              </Link>
              <Link 
                href="/despre" 
                className="state-layer px-4 py-3 rounded-lg label-large text-on-surface hover:bg-surface-container-high transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Despre
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}