'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plane, Menu, X, ChevronDown, BarChart3, Car } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md border-b border-gray-200 dark:border-gray-700' 
        : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Compact Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Program Zboruri
            </span>
          </Link>

          {/* Desktop Navigation - Compact */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Acasă
            </Link>
            <Link 
              href="/aeroporturi" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Aeroporturi
            </Link>
            
            {/* Analytics Dropdown - Compact */}
            <div className="relative" ref={analyticsRef}>
              <button
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analize</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAnalyticsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAnalyticsOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <Link
                    href="/statistici-aeroporturi"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Statistici Aeroporturi</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Performanță și punctualitate</div>
                  </Link>
                  <Link
                    href="/program-zboruri"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Program Zboruri</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Calendar interactiv</div>
                  </Link>
                  <Link
                    href="/statistici"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">📊 Statistici Live</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Date istorice și tendințe</div>
                  </Link>
                  <Link
                    href="/analize-istorice"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Analize Istorice</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Tendințe și evoluție</div>
                  </Link>
                  <Link
                    href="/analize-rute"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Analize Rute</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Rute și companii aeriene</div>
                  </Link>

                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <Link
                    href="/aeronave"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <div className="font-medium">Catalog Aeronave</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Căutare ICAO24 și înmatriculare</div>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Parking Dropdown - Compact */}
            <div className="relative" ref={parkingRef}>
              <button
                onClick={() => setIsParkingOpen(!isParkingOpen)}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Car className="h-4 w-4" />
                <span>Parcări</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isParkingOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isParkingOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/parcari-aeroporturi"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">🅿️ Toate Parcările</div>
                    <div className="text-xs text-gray-500">România & Moldova</div>
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <Link
                    href="/parcari-bucuresti"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">București (OTP & BBU)</div>
                    <div className="text-xs text-gray-500">Henri Coandă & Aurel Vlaicu</div>
                  </Link>
                  <Link
                    href="/parcari-cluj"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Cluj-Napoca (CLJ)</div>
                    <div className="text-xs text-gray-500">Avram Iancu</div>
                  </Link>
                  <Link
                    href="/parcari-timisoara"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Timișoara (TSR)</div>
                    <div className="text-xs text-gray-500">Traian Vuia</div>
                  </Link>
                  <Link
                    href="/parcari-iasi"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Iași (IAS)</div>
                    <div className="text-xs text-gray-500">Internațional Iași</div>
                  </Link>
                  <Link
                    href="/parcari-chisinau"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">Chișinău (RMO)</div>
                    <div className="text-xs text-gray-500">Internațional Chișinău</div>
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <Link
                    href="/parcari-otopeni"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsParkingOpen(false)}
                  >
                    <div className="font-medium">📍 Parcări Otopeni</div>
                    <div className="text-xs text-gray-500">Pagina originală detaliată</div>
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              href="/planificator-zboruri" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Planificator
            </Link>
            <Link 
              href="/program-saptamanal" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Program
            </Link>
            <Link 
              href="/despre" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Despre
            </Link>
            
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

        {/* Mobile Navigation - Compact */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-1">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Acasă
              </Link>
              <Link 
                href="/aeroporturi" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Aeroporturi
              </Link>
              
              {/* Mobile Analytics Section - Compact */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 my-2">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center mb-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analize
                </div>
                <div className="space-y-1 ml-6">
                  <Link 
                    href="/statistici-aeroporturi" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Statistici Aeroporturi
                  </Link>
                  <Link 
                    href="/program-zboruri" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Program Zboruri
                  </Link>
                  <Link 
                    href="/statistici" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Statistici Live
                  </Link>
                  <Link 
                    href="/analize-istorice" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analize Istorice
                  </Link>
                  <Link 
                    href="/analize-rute" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analize Rute
                  </Link>
                  <Link 
                    href="/aeronave" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Catalog Aeronave
                  </Link>
                </div>
              </div>
              
              {/* Mobile Parking Section - Compact */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 my-2">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center mb-2">
                  <Car className="h-4 w-4 mr-2" />
                  Parcări Aeroporturi
                </div>
                <div className="space-y-1 ml-6">
                  <Link 
                    href="/parcari-aeroporturi" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🅿️ Toate Parcările
                  </Link>
                  <Link 
                    href="/parcari-bucuresti" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    București (OTP & BBU)
                  </Link>
                  <Link 
                    href="/parcari-cluj" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cluj-Napoca (CLJ)
                  </Link>
                  <Link 
                    href="/parcari-timisoara" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Timișoara (TSR)
                  </Link>
                  <Link 
                    href="/parcari-iasi" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iași (IAS)
                  </Link>
                  <Link 
                    href="/parcari-chisinau" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Chișinău (RMO)
                  </Link>
                  <Link 
                    href="/parcari-otopeni" 
                    className="block px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📍 Parcări Otopeni
                  </Link>
                </div>
              </div>
              
              <Link 
                href="/planificator-zboruri" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Planificator Zboruri
              </Link>
              <Link 
                href="/program-saptamanal" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Program Săptămânal
              </Link>
              <Link 
                href="/despre" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Despre
              </Link>
              
              {/* Mobile Theme Toggle */}
              <div className="px-3 py-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}