'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plane, Menu, X, ChevronDown, BarChart3, Car, Sparkles } from 'lucide-react'
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isParkingOpen, setIsParkingOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const analyticsRef = useRef<HTMLDivElement>(null)
  const parkingRef = useRef<HTMLDivElement>(null)

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
      if (parkingRef.current && !parkingRef.current.contains(event.target as Node)) {
        setIsParkingOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled 
        ? 'glass-card border-b border-white/20 shadow-lg' 
        : 'bg-white/10 backdrop-blur-md border-b border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Compact Logo - weather-app style */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">
              Program Zboruri
            </span>
          </Link>

          {/* Desktop Navigation - white text, glass hover */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
            >
              Acasă
            </Link>
            <Link 
              href="/aeroporturi" 
              className="px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
            >
              Aeroporturi
            </Link>
            
            {/* Analytics Dropdown - glass card */}
            <div className="relative" ref={analyticsRef}>
              <button
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analize</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAnalyticsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAnalyticsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 glass-card shadow-xl py-2 z-50">
                  <Link
                    href="/statistici-aeroporturi"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Statistici Aeroporturi</div>
                    <div className="text-xs text-white/70">Performanță și punctualitate</div>
                  </Link>
                  <Link
                    href="/program-zboruri"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Program Zboruri</div>
                    <div className="text-xs text-white/70">Calendar interactiv</div>
                  </Link>
                  <Link
                    href="/statistici"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">📊 Statistici Live</div>
                    <div className="text-xs text-white/70">Date istorice și tendințe</div>
                  </Link>
                  <Link
                    href="/analize-istorice"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Analize Istorice</div>
                    <div className="text-xs text-white/70">Tendințe și evoluție</div>
                  </Link>
                  <Link
                    href="/analize-rute"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Analize Rute</div>
                    <div className="text-xs text-white/70">Rute și companii aeriene</div>
                  </Link>

                  <div className="border-t border-white/20 my-1"></div>
                  <Link
                    href="/aeronave"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Catalog Aeronave</div>
                    <div className="text-xs text-white/70">Căutare ICAO24 și înmatriculare</div>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Parking Dropdown - glass */}
            <div className="relative" ref={parkingRef}>
              <button
                onClick={() => setIsParkingOpen(!isParkingOpen)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Car className="h-4 w-4" />
                <span>Parcări</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isParkingOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isParkingOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 glass-card shadow-xl py-2 z-50">
                  <Link
                    href="/parcari-aeroporturi"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">🅿️ Toate Parcările</div>
                    <div className="text-xs text-white/70">România & Moldova</div>
                  </Link>
                  <div className="border-t border-white/20 my-1"></div>
                  <Link
                    href="/parcari-bucuresti"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">București</div>
                    <div className="text-xs text-white/70">Henri Coandă & Aurel Vlaicu</div>
                  </Link>
                  <Link
                    href="/parcari-cluj"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Cluj-Napoca</div>
                    <div className="text-xs text-white/70">Avram Iancu</div>
                  </Link>
                  <Link
                    href="/parcari-timisoara"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Timișoara</div>
                    <div className="text-xs text-white/70">Traian Vuia</div>
                  </Link>
                  <Link
                    href="/parcari-iasi"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Iași</div>
                    <div className="text-xs text-white/70">Internațional Iași</div>
                  </Link>
                  <Link
                    href="/parcari-chisinau"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Chișinău</div>
                    <div className="text-xs text-white/70">Internațional Chișinău</div>
                  </Link>
                  <div className="border-t border-white/20 my-1"></div>
                  <Link
                    href="/parcari-otopeni"
                    className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">📍 Parcări Otopeni</div>
                    <div className="text-xs text-white/70">Pagina originală detaliată</div>
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              href="/fly-finder" 
              className="px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1"
            >
              <Sparkles className="h-4 w-4 text-white/90" />
              <span>FlyFinder</span>
            </Link>
            <Link 
              href="/planificator-zboruri" 
              className="px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
            >
              Planificator
            </Link>
            <Link 
              href="/program-saptamanal" 
              className="px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
            >
              Program
            </Link>
            <Link 
              href="/despre" 
              className="px-3 py-2 rounded-xl text-sm font-medium text-white/95 hover:text-white hover:bg-white/10 transition-colors"
            >
              Despre
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              aria-label="Deschide meniul"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - glass style */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-1">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Acasă
              </Link>
              <Link 
                href="/aeroporturi" 
                className="px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Aeroporturi
              </Link>
              
              {/* Mobile Analytics - glass card */}
              <div className="glass-card p-3 my-2">
                <div className="text-sm font-medium text-white flex items-center mb-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analize
                </div>
                <div className="space-y-1 ml-6">
                  <Link href="/statistici-aeroporturi" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Statistici Aeroporturi</Link>
                  <Link href="/program-zboruri" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Program Zboruri</Link>
                  <Link href="/statistici" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>📊 Statistici Live</Link>
                  <Link href="/analize-istorice" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Analize Istorice</Link>
                  <Link href="/analize-rute" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Analize Rute</Link>
                  <Link href="/aeronave" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Catalog Aeronave</Link>
                </div>
              </div>
              
              {/* Mobile Parking Section - glass */}
              <div className="glass-card p-3 my-2">
                <div className="text-sm font-medium text-white flex items-center mb-2">
                  <Car className="h-4 w-4 mr-2" />
                  Parcări Aeroporturi
                </div>
                <div className="space-y-1 ml-6">
                  <Link href="/parcari-aeroporturi" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>🅿️ Toate Parcările</Link>
                  <Link href="/parcari-bucuresti" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>București</Link>
                  <Link href="/parcari-cluj" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Cluj-Napoca</Link>
                  <Link href="/parcari-timisoara" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Timișoara</Link>
                  <Link href="/parcari-iasi" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Iași</Link>
                  <Link href="/parcari-chisinau" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Chișinău</Link>
                  <Link href="/parcari-otopeni" className="block px-2 py-1 rounded text-xs text-white/90 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>📍 Parcări Otopeni</Link>
                </div>
              </div>
              
              <Link href="/fly-finder" className="px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors flex items-center space-x-1" onClick={() => setIsMenuOpen(false)}>
                <Sparkles className="h-4 w-4 text-white/90" />
                <span>FlyFinder</span>
              </Link>
              <Link href="/planificator-zboruri" className="px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Planificator Zboruri</Link>
              <Link href="/program-saptamanal" className="px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Program Săptămânal</Link>
              <Link href="/despre" className="px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>Despre</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}