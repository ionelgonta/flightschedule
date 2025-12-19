'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'

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

interface GlobalStats {
  totalFlights: number
  onTimeFlights: number
  delayedFlights: number
  cancelledFlights: number
  onTimePercentage: number
  delayedPercentage: number
  cancelledPercentage: number
}

export function GlobalStatusDistribution() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGlobalStatistics()
  }, [])

  const fetchGlobalStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/statistici-aeroporturi')
      const data: StatisticsResponse = await response.json()
      
      if (data.success) {
        // Calculate global statistics from all airports
        let totalFlights = 0
        let totalOnTime = 0
        let totalDelayed = 0
        let totalCancelled = 0
        
        data.data.forEach(airport => {
          if (airport.statistics) {
            const stats = airport.statistics
            totalFlights += stats.totalFlights
            
            // Calculate on-time flights from percentage
            const onTimeFlights = Math.round((stats.onTimePercentage / 100) * stats.totalFlights)
            totalOnTime += onTimeFlights
            
            totalDelayed += stats.delayedFlights
            totalCancelled += stats.cancelledFlights
          }
        })
        
        const onTimePercentage = totalFlights > 0 ? (totalOnTime / totalFlights) * 100 : 0
        const delayedPercentage = totalFlights > 0 ? (totalDelayed / totalFlights) * 100 : 0
        const cancelledPercentage = totalFlights > 0 ? (totalCancelled / totalFlights) * 100 : 0
        
        setGlobalStats({
          totalFlights,
          onTimeFlights: totalOnTime,
          delayedFlights: totalDelayed,
          cancelledFlights: totalCancelled,
          onTimePercentage,
          delayedPercentage,
          cancelledPercentage
        })
      } else {
        setError('Nu s-au putut încărca statisticile')
      }
    } catch (err) {
      console.error('Error fetching global statistics:', err)
      setError('Eroare la încărcarea datelor')
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribuția Statusurilor
        </h3>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !globalStats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribuția Statusurilor
        </h3>
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error || 'Nu sunt disponibile date pentru această perioadă'}
          </p>
        </div>
      </div>
    )
  }

  return (
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
              {globalStats.onTimeFlights.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatPercentage(globalStats.onTimePercentage)}
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
              {globalStats.delayedFlights.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatPercentage(globalStats.delayedPercentage)}
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
              {globalStats.cancelledFlights.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatPercentage(globalStats.cancelledPercentage)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Total zboruri analizate: {globalStats.totalFlights.toLocaleString()}
        </div>
      </div>
    </div>
  )
}