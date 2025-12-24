'use client'

import { useState, useEffect } from 'react'
import { RawFlightData } from '@/lib/flightApiService'
import FlightList from '@/components/flights/FlightList'
import GroupedFlightList from '@/components/flights/GroupedFlightList'

interface ClientOnlyFlightListProps {
  airportCode: string
  type: 'arrivals' | 'departures'
  viewMode?: 'grouped' | 'list'
  onFiltersChange?: (filters: any) => void
}

export default function ClientOnlyFlightList({ 
  airportCode, 
  type, 
  viewMode: initialViewMode = 'list',
  onFiltersChange 
}: ClientOnlyFlightListProps) {
  const [flights, setFlights] = useState<RawFlightData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>(initialViewMode)
  const [mounted, setMounted] = useState(false)

  const fetchFlights = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = `/api/flights/${airportCode}/${type}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setFlights(data.data)
        setLastUpdated(data.last_updated)
        setError(null)
      } else {
        setError(data.error || 'Nu am putut încărca datele zborurilor')
        // Păstrează datele existente dacă sunt din cache
        if (data.data && data.data.length > 0) {
          setFlights(data.data)
          setLastUpdated(data.last_updated)
        }
      }
    } catch (err) {
      setError('Eroare la încărcarea datelor de zbor')
      console.error('Error fetching flights:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchFlights()
    
    // Set up auto-refresh interval (10 minutes)
    const intervalId = setInterval(() => {
      fetchFlights()
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [airportCode, type])

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for controls */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-300 p-1">
            <div className="px-3 py-1 rounded-md bg-gray-200 animate-pulse h-6 w-20"></div>
            <div className="px-3 py-1 rounded-md bg-gray-200 animate-pulse h-6 w-24"></div>
          </div>
        </div>
        
        {/* Loading skeleton for flight list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="animate-pulse">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-16"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-t border-gray-100 h-20 bg-gradient-to-r from-gray-50 to-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Last Updated Info - Mobile */}
      <div className="md:hidden mb-4">
        {lastUpdated ? (
          <p className="text-xs text-gray-600">
            Actualizat: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            Se încarcă...
          </p>
        )}
      </div>

      {/* Toggle pentru modul de vizualizare - Compact */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-300 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lista Completă
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              viewMode === 'grouped'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grupat pe Rute
          </button>
        </div>
      </div>

      {/* Flight List */}
      {viewMode === 'grouped' ? (
        <GroupedFlightList
          flights={flights}
          type={type}
          loading={loading}
          error={error || undefined}
          lastUpdated={lastUpdated || undefined}
          onFiltersChange={onFiltersChange}
        />
      ) : (
        <FlightList
          flights={flights}
          type={type}
          loading={loading}
          error={error || undefined}
          lastUpdated={lastUpdated || undefined}
          onFiltersChange={onFiltersChange}
        />
      )}

      {/* Flight Statistics - Updated with real data */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:hidden">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Statistici {type === 'arrivals' ? 'Sosiri' : 'Plecări'}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total Zboruri</span>
            <span className="font-semibold text-gray-900">{flights.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">La timp</span>
            <span className="font-semibold text-green-600">
              {flights.filter(f => f.status === 'scheduled' || f.status === 'active' || f.status === 'departed').length}
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
    </div>
  )
}