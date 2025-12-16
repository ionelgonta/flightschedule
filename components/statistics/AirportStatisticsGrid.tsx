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
      
      const response = await fetch('/api/statistici-aeroporturi')
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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="text-center mb-4">
            <div className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-2">
              {airport.city}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
              {airport.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Cod: {airport.code}
            </p>
          </div>
          
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {airport.message || 'Nu sunt suficiente date pentru a afișa această informație'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Datele vor fi disponibile pe măsură ce colectăm mai multe informații
            </p>
          </div>
        </div>
      )
    }

    // Has data - show statistics
    return (
      <Link
        key={airport.code}
        href={`/aeroport/${generateAirportSlug(createAirportForSlug(airport))}/statistici`}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
      >
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {airport.city}
            </div>
            {getPerformanceIcon(airport.statistics.onTimePercentage)}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
            {airport.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Cod: {airport.code}
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Punctualitate</span>
            <div className="flex items-center space-x-1">
              <span className={`font-semibold ${getPerformanceColor(airport.statistics.onTimePercentage)}`}>
                {airport.statistics.onTimePercentage}%
              </span>
              {airport.statistics.onTimePercentage >= 85 ? 
                <TrendingUp className="h-3 w-3 text-green-500" /> : 
                <TrendingDown className="h-3 w-3 text-red-500" />
              }
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Întârziere Medie</span>
            <span className={`font-semibold ${getDelayColor(airport.statistics.averageDelay)}`}>
              {airport.statistics.averageDelay} min
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Zboruri/Zi</span>
            <div className="flex items-center space-x-1">
              <Plane className="h-3 w-3 text-blue-500" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {airport.statistics.dailyFlights}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Săptămâna</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {airport.statistics.totalFlights}
            </span>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Întârziate: {airport.statistics.delayedFlights}</span>
              <span>Anulate: {airport.statistics.cancelledFlights}</span>
            </div>
          </div>
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