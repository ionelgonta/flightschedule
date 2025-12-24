'use client'

import { BarChart3, Database, Globe, Clock, TrendingUp } from 'lucide-react'
import { PlannerStats } from '@/lib/flightPlannerService'

interface PlannerStatsCardProps {
  stats: PlannerStats
}

export function PlannerStatsCard({ stats }: PlannerStatsCardProps) {
  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'acum'
    if (diffMinutes < 60) return `acum ${diffMinutes} min`
    if (diffMinutes < 1440) return `acum ${Math.floor(diffMinutes / 60)} ore`
    return date.toLocaleDateString('ro-RO')
  }

  const getCacheHealthColor = (hitRate: number) => {
    if (hitRate >= 0.8) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
    if (hitRate >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-primary-600" />
          Statistici sistem
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Actualizat: {formatLastUpdated(stats.lastUpdated)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Airports */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mx-auto mb-3">
            <Globe className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalAirportsScanned}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Aeroporturi scanate
          </div>
        </div>

        {/* Total Flights */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-3">
            <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalFlightsAnalyzed.toLocaleString('ro-RO')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Zboruri analizate
          </div>
        </div>

        {/* Available Destinations */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.availableDestinations}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Destinații disponibile
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-3">
            <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(stats.cacheHitRate * 100)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cache hit rate
          </div>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCacheHealthColor(stats.cacheHitRate)}`}>
            {stats.cacheHitRate >= 0.8 ? 'Excelent' : stats.cacheHitRate >= 0.6 ? 'Bun' : 'Scăzut'}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Sistem operațional - doar date locale
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Performanță optimizată - fără API externe
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Date actualizate automat din cache
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}