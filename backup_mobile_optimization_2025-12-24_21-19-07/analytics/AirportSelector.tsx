'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, MapPin, Check, Plane } from 'lucide-react'
import { Airport } from '@/types/flight'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'

interface Props {
  currentAirport: Airport
  analyticsType: 'statistici' | 'program-zboruri' | 'istoric-zboruri' | 'analize-zboruri'
  className?: string
}

export function AirportSelector({ currentAirport, analyticsType, className = '' }: Props) {
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

  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  const getAnalyticsTitle = () => {
    switch (analyticsType) {
      case 'statistici': return 'Statistici'
      case 'program-zboruri': return 'Program Zboruri'
      case 'istoric-zboruri': return 'Istoric Zboruri'
      case 'analize-zboruri': return 'Analize Rute'
      default: return 'Analize'
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Modern Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-base">
              {currentAirport.city}
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {getAnalyticsTitle()} • {currentAirport.code}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-blue-500 transition-transform duration-200 group-hover:text-blue-600 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Modern Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {/* Current Selection Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">
                    {currentAirport.city}
                  </div>
                  <div className="text-blue-100 text-xs">
                    {currentAirport.code} • Aeroport Curent
                  </div>
                </div>
              </div>
              <div className="text-white/80 text-xs bg-white/10 px-2 py-1 rounded-full">
                Activ
              </div>
            </div>
          </div>

          {/* Romanian Airports Section */}
          <div className="p-2">
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 bg-gradient-to-b from-blue-500 to-yellow-400 rounded-sm"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  România
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              {romanianAirports
                .filter(airport => airport.code !== currentAirport.code)
                .map((airport) => (
                <Link
                  key={airport.code}
                  href={`/aeroport/${generateAirportSlug(airport)}/${analyticsType}`}
                  className="group block px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                        <MapPin className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm group-hover:text-blue-900">
                          {airport.city}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-blue-600">
                          {airport.code} • {airport.name.split(' ').slice(0, 3).join(' ')}
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <ChevronDown className="h-3 w-3 text-blue-600 -rotate-90" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Moldovan Airports Section */}
          {moldovanAirports.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 mb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-3 bg-gradient-to-b from-blue-500 to-yellow-400 rounded-sm"></div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Moldova
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                {moldovanAirports
                  .filter(airport => airport.code !== currentAirport.code)
                  .map((airport) => (
                  <Link
                    key={airport.code}
                    href={`/aeroport/${generateAirportSlug(airport)}/${analyticsType}`}
                    className="group block px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                          <MapPin className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm group-hover:text-blue-900">
                            {airport.city}
                          </div>
                          <div className="text-xs text-gray-500 group-hover:text-blue-600">
                            {airport.code} • {airport.name.split(' ').slice(0, 3).join(' ')}
                          </div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <ChevronDown className="h-3 w-3 text-blue-600 -rotate-90" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="border-t border-gray-100 p-2">
            <Link
              href="/analize"
              className="group flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                  <Plane className="h-3 w-3 text-indigo-600" />
                </div>
                <div className="text-center">
                  <div className="text-indigo-700 font-medium text-sm">
                    Vezi Toate Analizele
                  </div>
                  <div className="text-xs text-indigo-500">
                    Explorează alte tipuri de analize
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}