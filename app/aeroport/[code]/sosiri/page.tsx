'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { getClientFlightService, ClientFlightFilters } from '@/lib/clientFlightService'
import { RawFlightData } from '@/lib/flightApiService'
import FlightList from '@/components/flights/FlightList'
import GroupedFlightList from '@/components/flights/GroupedFlightList'
import { AdBanner } from '@/components/ads/AdBanner'
import { ArrowLeft, Plane } from 'lucide-react'

interface ArrivalsPageProps {
  params: {
    code: string
  }
}

export default function ArrivalsPage({ params }: ArrivalsPageProps) {
  const [flights, setFlights] = useState<RawFlightData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')

  const airport = getAirportByCodeOrSlug(params.code)
  const clientFlightService = getClientFlightService()

  if (!airport) {
    notFound()
  }

  const fetchFlights = async (filters?: ClientFlightFilters) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await clientFlightService.getArrivals(airport.code, filters)
      
      if (response.success) {
        setFlights(response.data)
        setLastUpdated(response.last_updated)
        setError(null)
      } else {
        setError(response.error || 'Nu am putut încărca datele zborurilor')
        // Păstrează datele existente dacă sunt din cache
        if (response.data.length > 0) {
          setFlights(response.data)
          setLastUpdated(response.last_updated)
        }
      }
    } catch (err) {
      setError('Eroare la încărcarea datelor de zbor')
      console.error('Error fetching arrivals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
    
    // Get cache config from admin and set auto-refresh interval
    const setupAutoRefresh = async () => {
      try {
        const response = await fetch('/api/admin/cache-config')
        if (response.ok) {
          const data = await response.json()
          const intervalMinutes = data.success && data.config.realtimeInterval 
            ? data.config.realtimeInterval 
            : 10 // fallback to 10 minutes
          
          console.log(`Setting auto-refresh interval to ${intervalMinutes} minutes`)
          
          const interval = setInterval(() => {
            fetchFlights()
          }, intervalMinutes * 60 * 1000)

          return interval
        }
      } catch (error) {
        console.warn('Could not load cache config, using default 10 minutes:', error)
      }
      
      // Fallback to 10 minutes if config loading fails
      return setInterval(() => {
        fetchFlights()
      }, 10 * 60 * 1000)
    }

    let intervalId: NodeJS.Timeout
    setupAutoRefresh().then(interval => {
      intervalId = interval
    })

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [airport.code])



  const handleFiltersChange = (filters: any) => {
    // Filtrele sunt aplicate local în FlightList
    // Aici putem adăuga logică suplimentară dacă e necesar
  }

  return (
    <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-4"
        />
      </div>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="flex items-center space-x-2 text-green-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Înapoi la {airport.city}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Sosiri - {airport.city}
              </h1>
              <p className="text-green-100 text-lg">
                {airport.city} - {airport.name}, {airport.country}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                {lastUpdated && (
                  <p className="text-sm text-green-100">
                    Actualizat: {new Date(lastUpdated).toLocaleTimeString()}
                  </p>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="md:hidden mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actualizat: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Toggle pentru modul de vizualizare */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'grouped'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Grupat pe Rute
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Lista Completă
                </button>
              </div>
            </div>

            {viewMode === 'grouped' ? (
              <GroupedFlightList
                flights={flights}
                type="arrivals"
                loading={loading}
                error={error || undefined}
                lastUpdated={lastUpdated || undefined}
                onFiltersChange={handleFiltersChange}
              />
            ) : (
              <FlightList
                flights={flights}
                type="arrivals"
                loading={loading}
                error={error || undefined}
                lastUpdated={lastUpdated || undefined}
                onFiltersChange={handleFiltersChange}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Linkuri Rapide
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/aeroport/${generateAirportSlug(airport)}/plecari`}
                  className="block w-full text-left px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  Vezi Plecări
                </Link>
                <Link
                  href={`/aeroport/${generateAirportSlug(airport)}`}
                  className="block w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Prezentare Aeroport
                </Link>
              </div>
            </div>

            {/* Flight Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistici Sosiri
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Zboruri</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{flights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">La timp</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {flights.filter(f => f.status === 'scheduled' || f.status === 'landed' || f.status === 'arrived').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Întârziate</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {flights.filter(f => f.status === 'delayed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Anulate</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {flights.filter(f => f.status === 'cancelled').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Square Ad */}
            <AdBanner 
              slot="sidebar-square"
              size="300x250"
            />
          </div>
        </div>
      </div>
    </div>
  )
}