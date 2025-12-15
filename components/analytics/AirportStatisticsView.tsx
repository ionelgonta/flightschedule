'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Plane } from 'lucide-react'
import { Airport } from '@/types/flight'
import { AirportStatistics } from '@/lib/flightAnalyticsService'
import { getAirlineName, getCityName } from '@/lib/airlineMapping'

interface Props {
  airport: Airport
  initialPeriod: 'daily' | 'weekly' | 'monthly'
}

export function AirportStatisticsView({ airport, initialPeriod }: Props) {
  const [statistics, setStatistics] = useState<AirportStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(initialPeriod)

  // Fetch statistics
  const fetchStatistics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/aeroport/${airport.code}/statistici?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Eroare la încărcarea statisticilor')
      }
      
      const data = await response.json()
      setStatistics(data.statistics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [period, airport.code])

  // Format percentage
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  // Format delay time
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Get delay index color
  const getDelayIndexColor = (index: number) => {
    if (index <= 30) return 'text-green-600 bg-green-100'
    if (index <= 50) return 'text-yellow-600 bg-yellow-100'
    if (index <= 70) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  // Get performance color
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
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
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nu sunt disponibile statistici pentru această perioadă.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Statistici Performanță
          </h2>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'daily'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Zilnic
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'weekly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Săptămânal
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'monthly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Lunar
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Flights */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Zboruri</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {statistics.totalFlights.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* On-Time Performance */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">La Timp</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(statistics.onTimePercentage)} dark:text-green-100`}>
                  {formatPercentage(statistics.onTimePercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Average Delay */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Întârziere Medie</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatDelay(statistics.averageDelay)}
                </p>
              </div>
            </div>
          </div>

          {/* Delay Index */}
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Indice Întârzieri</p>
                <p className={`text-2xl font-bold px-2 py-1 rounded ${getDelayIndexColor(statistics.delayIndex)}`}>
                  {statistics.delayIndex}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flight Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuția Statusurilor
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">La timp</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {statistics.onTimeFlights.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatPercentage((statistics.onTimeFlights / statistics.totalFlights) * 100)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Întârziate</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {statistics.delayedFlights.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatPercentage((statistics.delayedFlights / statistics.totalFlights) * 100)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Anulate</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {statistics.cancelledFlights.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatPercentage((statistics.cancelledFlights / statistics.totalFlights) * 100)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Delay Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ore de Vârf pentru Întârzieri
          </h3>
          <div className="space-y-3">
            {statistics.peakDelayHours.map((hour, index) => (
              <div key={hour} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-red-500' : 
                    index === 1 ? 'bg-orange-500' : 
                    index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aceste ore reprezintă intervalele cu cele mai multe întârzieri înregistrate în perioada selectată.
            </p>
          </div>
        </div>
      </div>

      {/* Top Routes */}
      {statistics.mostFrequentRoutes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cele Mai Frecvente Rute (Top 15)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Destinație</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Zboruri</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Întârziere Medie</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">La Timp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {statistics.mostFrequentRoutes.slice(0, 15).map((route, index) => (
                  <tr key={`${route.origin}-${route.destination}`}>
                    <td className="py-3 text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <span className="font-medium">
                          {route.destination === route.origin ? 
                            `${getCityName(route.destination)} (${route.destination})` : 
                            `${getCityName(route.destination)} (${route.destination})`
                          }
                        </span>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          ({route.airlines.slice(0, 2).map(code => getAirlineName(code)).join(', ')})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                      {route.flightCount}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatDelay(route.averageDelay)}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${getPerformanceColor(route.onTimePercentage)}`}>
                        {formatPercentage(route.onTimePercentage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}