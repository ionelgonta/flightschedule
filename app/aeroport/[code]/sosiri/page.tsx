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
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('list')

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
      <div className="bg-white border-b border-gray-200">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-2"
        />
      </div>

      {/* Page Header - Compact */}
      <section className="bg-green-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="flex items-center space-x-2 text-green-100 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Înapoi la {airport.city}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                Sosiri - {airport.city}
              </h1>
              <p className="text-green-100 text-sm">
                {airport.city} - {airport.name}, {airport.country}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                {lastUpdated && (
                  <p className="text-xs text-green-100">
                    Actualizat: {new Date(lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Navigation - Added higher up */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}/plecari`}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1 text-sm"
            >
              <Plane className="h-3 w-3" />
              <span>Vezi Plecări</span>
            </Link>
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="border border-white text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center space-x-1 text-sm"
            >
              <span>Prezentare Aeroport</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="md:hidden mb-4">
                <p className="text-xs text-gray-600">
                  Actualizat: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Toggle pentru modul de vizualizare - Compact */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lista Completă
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === 'grouped'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grupat pe Rute
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
          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Quick Links - Compact */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Linkuri Rapide
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/aeroport/${generateAirportSlug(airport)}/plecari`}
                  className="block w-full text-left px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                >
                  Vezi Plecări
                </Link>
                <Link
                  href={`/aeroport/${generateAirportSlug(airport)}`}
                  className="block w-full text-left px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                >
                  Prezentare Aeroport
                </Link>
              </div>
            </div>

            {/* Flight Statistics - Compact */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Statistici Sosiri
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total Zboruri</span>
                  <span className="font-semibold text-gray-900">{flights.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">La timp</span>
                  <span className="font-semibold text-green-600">
                    {flights.filter(f => f.status === 'scheduled' || f.status === 'landed' || f.status === 'arrived').length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Întârziate</span>
                  <span className="font-semibold text-orange-600">
                    {flights.filter(f => f.status === 'delayed').length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Anulate</span>
                  <span className="font-semibold text-red-600">
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