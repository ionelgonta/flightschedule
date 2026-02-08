'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { getClientFlightService, ClientFlightFilters } from '@/lib/clientFlightService'
import { RawFlightData } from '@/lib/flightApiService'
import FlightList from '@/components/flights/FlightList'
import { AdBanner } from '@/components/ads/AdBanner'
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
        <AdBanner slot="header-banner" size="728x90" className="max-w-7xl mx-auto py-4" />
      </div>

      <section className="px-4 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href={`/airport/${generateAirportSlug(airport)}`} className="flex items-center space-x-2 text-white/85 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Înapoi la {airport.city}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Plecări - {airport.city}</h1>
              <p className="text-white/85 text-lg">{airport.city} - {airport.name}, {airport.country}</p>
            </div>
            {lastUpdated && (
              <p className="text-sm text-white/85 hidden md:block">Actualizat: {new Date(lastUpdated).toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

          <div className="lg:col-span-1 space-y-8">
            <div className="glass-card rounded-2xl overflow-hidden p-2">
              <AdBanner slot="sidebar-right" size="300x600" />
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Linkuri Rapide</h3>
              <div className="space-y-3">
                <Link href={`/airport/${generateAirportSlug(airport)}/arrivals`} className="block w-full text-left px-4 py-2 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors">Vezi Sosiri</Link>
                <Link href={`/airport/${generateAirportSlug(airport)}`} className="block w-full text-left px-4 py-2 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-colors">Prezentare Aeroport</Link>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Statistici Plecări</h3>
              <div className="space-y-3 text-white/90">
                <div className="flex justify-between"><span>Total Zboruri</span><span className="font-semibold text-white">{flights.length}</span></div>
                <div className="flex justify-between"><span>La timp</span><span className="font-semibold text-white">{flights.filter(f => f.status === 'scheduled' || f.status === 'active' || f.status === 'departed').length}</span></div>
                <div className="flex justify-between"><span>Întârziate</span><span className="font-semibold text-white">{flights.filter(f => f.status === 'delayed').length}</span></div>
                <div className="flex justify-between"><span>Anulate</span><span className="font-semibold text-white">{flights.filter(f => f.status === 'cancelled').length}</span></div>
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