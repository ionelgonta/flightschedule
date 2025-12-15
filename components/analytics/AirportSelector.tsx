'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, MapPin, Check } from 'lucide-react'
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">
              {currentAirport.city}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getAnalyticsTitle()} - {currentAirport.code}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-y-auto">
          {/* Current Selection */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Aeroport Curent
            </div>
          </div>
          <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-primary-900 dark:text-primary-100">
                  {currentAirport.city}
                </div>
                <div className="text-sm text-primary-700 dark:text-primary-300">
                  {currentAirport.name} ({currentAirport.code})
                </div>
              </div>
              <Check className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {/* Romanian Airports */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              România
            </div>
          </div>
          {romanianAirports
            .filter(airport => airport.code !== currentAirport.code)
            .map((airport) => (
            <Link
              key={airport.code}
              href={`/aeroport/${generateAirportSlug(airport)}/${analyticsType}`}
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {airport.city}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {airport.name} ({airport.code})
                  </div>
                </div>
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}

          {/* Moldovan Airports */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Moldova
            </div>
          </div>
          {moldovanAirports
            .filter(airport => airport.code !== currentAirport.code)
            .map((airport) => (
            <Link
              key={airport.code}
              href={`/aeroport/${generateAirportSlug(airport)}/${analyticsType}`}
              className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {airport.city}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {airport.name} ({airport.code})
                  </div>
                </div>
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}

          {/* View All Analytics */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-2">
            <Link
              href="/analize"
              className="block px-4 py-3 text-center bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="text-primary-700 dark:text-primary-300 font-medium">
                Vezi Toate Analizele
              </div>
              <div className="text-xs text-primary-600 dark:text-primary-400">
                Selectează alt tip de analiză
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}