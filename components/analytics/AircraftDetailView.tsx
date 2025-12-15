'use client'

import { useState, useEffect } from 'react'
import { Plane, Calendar, MapPin, Clock, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react'
import { AircraftInfo } from '@/lib/flightAnalyticsService'

interface Props {
  icao24: string
}

interface FlightHistory {
  date: string
  flightNumber: string
  origin: string
  destination: string
  departure: string
  arrival: string
  delay: number
  status: string
}

export function AircraftDetailView({ icao24 }: Props) {
  const [aircraft, setAircraft] = useState<AircraftInfo | null>(null)
  const [flightHistory, setFlightHistory] = useState<FlightHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch aircraft details
  const fetchAircraftDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/aeronave/${icao24}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Aeronava nu a fost găsită')
        }
        throw new Error('Eroare la încărcarea detaliilor aeronavei')
      }
      
      const data = await response.json()
      setAircraft(data.aircraft)
      
      // Also fetch flight history
      fetchFlightHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  // Fetch flight history
  const fetchFlightHistory = async () => {
    setHistoryLoading(true)
    
    try {
      const response = await fetch(`/api/aeronave/${icao24}/istoric`)
      
      if (response.ok) {
        const data = await response.json()
        setFlightHistory(data.history || [])
      }
    } catch (err) {
      console.error('Error fetching flight history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchAircraftDetails()
  }, [icao24])

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Necunoscut'
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format time
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format delay
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'text-green-600 bg-green-100'
      case 'delayed':
        return 'text-orange-600 bg-orange-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchAircraftDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Încearcă din nou
            </button>
            <a
              href="/aeronave"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la catalog
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!aircraft) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <Plane className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Aeronava nu a fost găsită.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <a
          href="/aeronave"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi la catalog
        </a>
      </div>

      {/* Aircraft Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start space-x-6">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            <Plane className="h-8 w-8" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {aircraft.registration}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  ICAO24: {aircraft.icao24}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Model</div>
                <div className="text-gray-600 dark:text-gray-400">{aircraft.model}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Producător</div>
                <div className="text-gray-600 dark:text-gray-400">{aircraft.manufacturer}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Operator</div>
                <div className="text-gray-600 dark:text-gray-400">{aircraft.operator}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Primul zbor</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {formatDate(aircraft.firstFlightDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Zboruri</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {aircraft.totalFlights.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Întârziere Medie</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatDelay(aircraft.averageDelay)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Performanță</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {aircraft.averageDelay < 15 ? 'Excelentă' : aircraft.averageDelay < 30 ? 'Bună' : 'Medie'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flight History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Istoric Zboruri Recente
          </h2>
        </div>

        {historyLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Se încarcă istoricul zborurilor...</p>
          </div>
        ) : flightHistory.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {flightHistory.slice(0, 10).map((flight, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="font-semibold text-lg text-gray-900 dark:text-white">
                        {flight.flightNumber}
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
                        {flight.status === 'on-time' ? 'La timp' : 
                         flight.status === 'delayed' ? 'Întârziat' : 
                         flight.status === 'cancelled' ? 'Anulat' : 'Programat'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Ruta:</span>
                        <span className="ml-1">{flight.origin} → {flight.destination}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Plecare:</span>
                        <span className="ml-1">{formatTime(flight.departure)}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Sosire:</span>
                        <span className="ml-1">{formatTime(flight.arrival)}</span>
                      </div>
                      
                      {flight.delay > 0 && (
                        <div>
                          <span className="font-medium">Întârziere:</span>
                          <span className="ml-1 text-orange-600">{formatDelay(flight.delay)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(flight.date).toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Nu sunt disponibile date despre istoricul zborurilor.</p>
          </div>
        )}
      </div>
    </div>
  )
}