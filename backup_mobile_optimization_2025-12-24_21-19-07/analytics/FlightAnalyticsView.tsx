'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plane, Clock, Award, TrendingUp, AlertCircle } from 'lucide-react'
import { Airport } from '@/types/flight'
import { RouteAnalysis } from '@/lib/flightAnalyticsService'

interface Props {
  airport: Airport
  initialView: 'routes' | 'airlines' | 'punctuality'
  initialPeriod: 'week' | 'month' | 'quarter'
}

interface AirlineAnalysis {
  name: string
  code: string
  flightCount: number
  marketShare: number
  averageDelay: number
  onTimePercentage: number
  routes: string[]
}

interface PunctualityAnalysis {
  flightNumber: string
  airline: string
  route: string
  averageDelay: number
  onTimePercentage: number
  flightCount: number
  type: 'punctual' | 'delayed'
}

export function FlightAnalyticsView({ airport, initialView, initialPeriod }: Props) {
  const [routes, setRoutes] = useState<RouteAnalysis[]>([])
  const [airlines, setAirlines] = useState<AirlineAnalysis[]>([])
  const [punctuality, setPunctuality] = useState<PunctualityAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [view, setView] = useState(initialView)
  const [period, setPeriod] = useState(initialPeriod)

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/aeroport/${airport.code}/analize-zboruri?${params}`)
      
      if (!response.ok) {
        throw new Error('Eroare la încărcarea analizelor')
      }
      
      const data = await response.json()
      setRoutes(data.routes || [])
      setAirlines(data.airlines || [])
      setPunctuality(data.punctuality || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period, airport.code])

  // Format percentage
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  // Format delay
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Get performance color
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
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
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('routes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'routes'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Rute
            </button>
            <button
              onClick={() => setView('airlines')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'airlines'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Companii
            </button>
            <button
              onClick={() => setView('punctuality')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'punctuality'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Punctualitate
            </button>
          </div>

          {/* Period Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Săptămâna
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Luna
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'quarter'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Trimestrul
            </button>
          </div>
        </div>
      </div>

      {/* Routes View */}
      {view === 'routes' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Rute Frecvente
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {routes.length} rute analizate
            </div>
          </div>

          {routes.length > 0 ? (
            <div className="space-y-4">
              {routes.map((route, index) => (
                <div key={`${route.origin}-${route.destination}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {airport.code} → {route.destination}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {route.airlines.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {route.flightCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">zboruri</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Întârziere medie:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formatDelay(route.averageDelay)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">La timp:</span>
                      <span className={`ml-2 font-medium ${getPerformanceColor(route.onTimePercentage)}`}>
                        {formatPercentage(route.onTimePercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Nu sunt disponibile date despre rute pentru această perioadă.</p>
            </div>
          )}
        </div>
      )}

      {/* Airlines View */}
      {view === 'airlines' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Plane className="h-5 w-5 mr-2" />
              Companii Aeriene
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {airlines.length} companii analizate
            </div>
          </div>

          {airlines.length > 0 ? (
            <div className="space-y-4">
              {airlines.map((airline, index) => (
                <div key={airline.code} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {airline.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {airline.code} • {airline.routes.length} rute
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {formatPercentage(airline.marketShare)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">cotă piață</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Zboruri:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {airline.flightCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Întârziere:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formatDelay(airline.averageDelay)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">La timp:</span>
                      <span className={`ml-2 font-medium ${getPerformanceColor(airline.onTimePercentage)}`}>
                        {formatPercentage(airline.onTimePercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Plane className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Nu sunt disponibile date despre companii aeriene pentru această perioadă.</p>
            </div>
          )}
        </div>
      )}

      {/* Punctuality View */}
      {view === 'punctuality' && (
        <div className="space-y-6">
          {/* Most Punctual */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
              <Award className="h-5 w-5 mr-2 text-green-600" />
              Cele Mai Punctuale Zboruri
            </h3>
            
            {punctuality.filter(p => p.type === 'punctual').length > 0 ? (
              <div className="space-y-3">
                {punctuality.filter(p => p.type === 'punctual').slice(0, 5).map((flight, index) => (
                  <div key={`${flight.flightNumber}-punctual`} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {flight.flightNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {flight.airline} • {flight.route}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {formatPercentage(flight.onTimePercentage)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {flight.flightCount} zboruri
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">Nu sunt disponibile date despre punctualitate.</p>
              </div>
            )}
          </div>

          {/* Most Delayed */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2 text-red-600" />
              Zborurile Cu Cele Mai Mari Întârzieri
            </h3>
            
            {punctuality.filter(p => p.type === 'delayed').length > 0 ? (
              <div className="space-y-3">
                {punctuality.filter(p => p.type === 'delayed').slice(0, 5).map((flight, index) => (
                  <div key={`${flight.flightNumber}-delayed`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {flight.flightNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {flight.airline} • {flight.route}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600 dark:text-red-400">
                        {formatDelay(flight.averageDelay)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {flight.flightCount} zboruri
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">Nu sunt disponibile date despre întârzieri.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}