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
    <div className="min-h-screen relative z-10">
      <div className="glass-card mx-4 mt-4 rounded-2xl overflow-hidden">
        <AdBanner slot="header-banner" size="728x90" className="max-w-7xl mx-auto py-2" />
      </div>

      <section className="px-4 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link href={`/aeroport/${generateAirportSlug(airport)}`} className="flex items-center space-x-2 text-white/85 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              <span>Înapoi la {airport.city}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2 text-white">Plecări - {airport.city}</h1>
              <p className="text-white/85 text-sm">{airport.city} - {airport.name}, {airport.country}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link href={`/aeroport/${generateAirportSlug(airport)}`} className="border border-white/30 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center space-x-1 text-sm">
              <span>Prezentare Aeroport</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <WeatherAlert airportCode={airport.code} className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {lastUpdated && (
              <div className="md:hidden mb-6">
                <p className="text-sm text-white/85">Actualizat: {new Date(lastUpdated).toLocaleTimeString()}</p>
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

          <div className="lg:col-span-1 space-y-6">
            <WeatherWidget city={weatherCity} />
            <div className="glass-card rounded-2xl overflow-hidden p-2">
              <AdBanner slot="sidebar-right" size="300x600" />
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Statistici Plecări</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/90"><span>Total Zboruri</span><span className="font-semibold text-white">{flights.length}</span></div>
                <div className="flex justify-between text-xs text-white/90"><span>La timp</span><span className="font-semibold text-white">{flights.filter(f => f.status === 'scheduled' || f.status === 'active' || f.status === 'departed').length}</span></div>
                <div className="flex justify-between text-xs text-white/90"><span>Întârziate</span><span className="font-semibold text-white">{flights.filter(f => f.status === 'delayed').length}</span></div>
                <div className="flex justify-between text-xs text-white/90"><span>Anulate</span><span className="font-semibold text-white">{flights.filter(f => f.status === 'cancelled').length}</span></div>
              </div>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden p-2">
              <AdBanner slot="sidebar-square" size="300x250" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}