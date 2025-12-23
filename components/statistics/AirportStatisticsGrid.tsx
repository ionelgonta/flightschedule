'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Clock, Plane, AlertTriangle, CheckCircle } from 'lucide-react'
import { generateAirportSlug } from '@/lib/airports'

// Helper function to create airport object for slug generation
const createAirportForSlug = (airport: AirportStatistics) => ({
  ...airport,
  timezone: 'Europe/Bucharest'
})

interface AirportStatistics {
  code: string
  name: string
  city: string
  country: string
  statistics: {
    totalFlights: number
    onTimePercentage: number
    averageDelay: number
    dailyFlights: number
    cancelledFlights: number
    delayedFlights: number
    lastUpdated: string
  } | null
  message?: string
}

interface StatisticsResponse {
  success: boolean
  data: AirportStatistics[]
  cached: boolean
  cacheAge?: number
  generatedAt?: string
}

export function AirportStatisticsGrid() {
  const [statistics, setStatistics] = useState<AirportStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add timestamp to force cache refresh
      const timestamp = Date.now()
      const response = await fetch(`/api/statistici-aeroporturi?t=${timestamp}`)
      const data: StatisticsResponse = await response.json()
      
      if (data.success) {
        setStatistics(data.data)
        setLastUpdated(data.generatedAt || new Date().toISOString())
      } else {
        setError('Nu s-au putut încărca statisticile aeroporturilor')
      }
    } catch (err) {
      console.error('Error fetching statistics:', err)
      setError('Eroare la încărcarea datelor')
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400'
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
    if (percentage >= 80) return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
  }

  const getDelayColor = (delay: number) => {
    if (delay <= 10) return 'text-green-600 dark:text-green-400'
    if (delay <= 20) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Încearcă din nou
        </button>
      </div>
    )
  }

  const romanianAirports = statistics.filter(a => a.country === 'România')
  const moldovanAirports = statistics.filter(a => a.country === 'Moldova')

  const renderAirportCard = (airport: AirportStatistics) => {
    if (!airport.statistics) {
      // No data available - show message
      return (
        <div
          key={airport.code}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 sm:p-6"
        >
          {/* Header with City Name Prominent */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 truncate">
                {airport.city}
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                {airport.code}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {airport.name}
            </p>
          </div>
          
          <div className="text-center py-6">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              {airport.message || 'Nu sunt suficiente date'}
            </p>
            <p className="text-xs text-gray-500">
              Datele vor fi disponibile în curând
            </p>
          </div>
        </div>
      )
    }

    // Has data - show statistics with modern design
    return (
      <Link
        key={airport.code}
        href={`/aeroport/${generateAirportSlug(createAirportForSlug(airport))}/statistici`}
        className="block bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:scale-[1.02] group"
      >
        {/* Header with City Name Prominent */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {airport.city}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {airport.code}
              </span>
              {getPerformanceIcon(airport.statistics.onTimePercentage)}
            </div>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {airport.name}
          </p>
        </div>

        {/* Performance Badge */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 mb-1">Punctualitate</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(airport.statistics.onTimePercentage)}`}>
                {airport.statistics.onTimePercentage}%
              </p>
            </div>
            <div className="text-right">
              {airport.statistics.onTimePercentage >= 85 ? 
                <TrendingUp className="h-6 w-6 text-green-500 mb-1" /> : 
                <TrendingDown className="h-6 w-6 text-red-500 mb-1" />
              }
              <p className="text-xs text-gray-500">
                {airport.statistics.onTimePercentage >= 85 ? 'Excelent' : 
                 airport.statistics.onTimePercentage >= 70 ? 'Bun' : 'Îmbunătățire'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Plane className="h-4 w-4 text-blue-500 mr-1" />
              <p className="text-xs text-gray-600">Zboruri/Zi</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {airport.statistics.dailyFlights}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Clock className="h-4 w-4 text-orange-500 mr-1" />
              <p className="text-xs text-gray-600">Întârziere</p>
            </div>
            <p className={`text-lg font-bold ${getDelayColor(airport.statistics.averageDelay)}`}>
              {airport.statistics.averageDelay} min
            </p>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total săptămânal</span>
            <span className="font-semibold text-gray-900">
              {airport.statistics.totalFlights} zboruri
            </span>
          </div>
          
          {(airport.statistics.delayedFlights > 0 || airport.statistics.cancelledFlights > 0) && (
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Întârziate: {airport.statistics.delayedFlights}</span>
              <span>Anulate: {airport.statistics.cancelledFlights}</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-12">
      {/* Romanian Airports */}
      {romanianAirports.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Statistici Aeroporturi România
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {romanianAirports.map(renderAirportCard)}
          </div>
        </section>
      )}

      {/* Moldovan Airports */}
      {moldovanAirports.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Statistici Aeroporturi Moldova
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moldovanAirports.map(renderAirportCard)}
          </div>
        </section>
      )}

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Ultima actualizare: {new Date(lastUpdated).toLocaleString('ro-RO')}
          <br />
          <span className="text-xs">Statistici calculate pe baza zborurilor din ultimele 7 zile</span>
        </div>
      )}
    </div>
  )
}