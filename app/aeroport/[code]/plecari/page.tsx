'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { getClientFlightService, ClientFlightFilters } from '@/lib/clientFlightService'
import { RawFlightData } from '@/lib/flightApiService'
import FlightList from '@/components/flights/FlightList'
import { AdBanner } from '@/components/ads/AdBanner'
import WeatherWidget from '@/components/weather/WeatherWidget'
import WeatherAlert from '@/components/weather/WeatherAlert'
import { getWeatherCityForAirport } from '@/lib/weatherUtils'
import { ArrowLeft, Plane } from 'lucide-react'

interface DeparturesPageProps {
  params: {
    code: string
  }
}

export default function DeparturesPage({ params }: DeparturesPageProps) {
  const [flights, setFlights] = useState<RawFlightData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const airport = getAirportByCodeOrSlug(params.code)
  const clientFlightService = getClientFlightService()

  if (!airport) {
    notFound()
  }

  const weatherCity = getWeatherCityForAirport(airport.code)

  const fetchFlights = async (filters?: ClientFlightFilters) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await clientFlightService.getDepartures(airport.code, filters)
      
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
      console.error('Error fetching departures:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchFlights()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
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
      <section className="bg-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Înapoi la {airport.city}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                Plecări - {airport.city}
              </h1>
              <p className="text-blue-100 text-sm">
                {airport.city} - {airport.name}, {airport.country}
              </p>
            </div>
          </div>
          
          {/* Quick Navigation - Removed Vezi Sosiri button */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
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
        {/* Weather Alert - Show at the top if weather impacts flights */}
        <WeatherAlert airportCode={airport.code} className="mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="md:hidden mb-6">
                <p className="text-sm text-gray-600">
                  Actualizat: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            )}

            <FlightList
              flights={flights}
              type="departures"
              loading={loading}
              error={error || undefined}
              lastUpdated={lastUpdated || undefined}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Weather Widget */}
            <WeatherWidget city={weatherCity} />
            
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Flight Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Statistici Plecări
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">Total Zboruri</span>
                  <span className="font-semibold text-gray-900 text-xs">{flights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">La timp</span>
                  <span className="font-semibold text-green-600 text-xs">
                    {flights.filter(f => f.status === 'scheduled' || f.status === 'active' || f.status === 'departed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">Întârziate</span>
                  <span className="font-semibold text-orange-600 text-xs">
                    {flights.filter(f => f.status === 'delayed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">Anulate</span>
                  <span className="font-semibold text-red-600 text-xs">
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