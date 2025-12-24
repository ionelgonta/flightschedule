'use client'

import Link from 'next/link'
import { Plane, MapPin, BarChart3, Clock } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'

interface InternalLinksProps {
  currentPage?: string
  className?: string
}

export function InternalLinks({ currentPage, className = '' }: InternalLinksProps) {
  const topAirports = MAJOR_AIRPORTS.slice(0, 6)
  
  const mainPages = [
    { name: 'Toate Aeroporturile', href: '/aeroporturi', icon: MapPin },
    { name: 'Analize și Statistici', href: '/analize', icon: BarChart3 },
    { name: 'Despre Noi', href: '/despre', icon: Plane },
    { name: 'Căutare Zboruri', href: '/cautare', icon: Clock }
  ]

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Navigare Rapidă
      </h3>
      
      {/* Main Pages */}
      <div className="space-y-3 mb-6">
        {mainPages.map((page) => {
          const Icon = page.icon
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                currentPage === page.href
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{page.name}</span>
            </Link>
          )
        })}
      </div>

      {/* Top Airports */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Aeroporturi Populare
        </h4>
        <div className="space-y-2">
          {topAirports.map((airport) => (
            <Link
              key={airport.code}
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="block p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>{airport.city}</span>
                <span className="text-xs text-gray-500">{airport.code}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RelatedPages({ currentAirport }: { currentAirport?: { name: string; city: string; code: string; country: string; timezone: string } }) {
  if (!currentAirport) return null

  const airportSlug = generateAirportSlug(currentAirport)
  
  const relatedPages = [
    { name: 'Sosiri', href: `/aeroport/${airportSlug}/sosiri` },
    { name: 'Plecări', href: `/aeroport/${airportSlug}/plecari` },
    { name: 'Statistici', href: `/aeroport/${airportSlug}/statistici` },
    { name: 'Program Zboruri', href: `/aeroport/${airportSlug}/program-zboruri` },
    { name: 'Istoric Zboruri', href: `/aeroport/${airportSlug}/istoric-zboruri` },
    { name: 'Analize Zboruri', href: `/aeroport/${airportSlug}/analize-zboruri` }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {currentAirport.name} - Pagini Relacionate
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {relatedPages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="p-3 text-center bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-sm font-medium"
          >
            {page.name}
          </Link>
        ))}
      </div>
    </div>
  )
}