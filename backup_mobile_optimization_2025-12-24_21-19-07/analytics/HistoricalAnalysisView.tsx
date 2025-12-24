'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Calendar, AlertCircle } from 'lucide-react'
import { Airport } from '@/types/flight'
import { HistoricalData } from '@/lib/flightAnalyticsService'

interface Props {
  airport: Airport
  initialFilters: {
    from?: string
    to?: string
    type?: 'volume' | 'delays' | 'performance'
  }
}

export function HistoricalAnalysisView({ airport, initialFilters }: Props) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState({
    from: initialFilters.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: initialFilters.to || new Date().toISOString().split('T')[0],
    type: initialFilters.type || 'volume' as 'volume' | 'delays' | 'performance'
  })

  // Fetch historical data
  const fetchHistoricalData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to
      })
      
      const response = await fetch(`/api/aeroport/${airport.code}/istoric-zboruri?${params}`)
      
      if (!response.ok) {
        throw new Error('Eroare la încărcarea datelor istorice')
      }
      
      const data = await response.json()
      setHistoricalData(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistoricalData()
  }, [filters.from, filters.to, airport.code])

  // Calculate trends
  const calculateTrend = (data: HistoricalData[], field: keyof HistoricalData) => {
    if (data.length < 2) return { trend: 'stable', percentage: 0 }
    
    const recent = data.slice(-7) // Last 7 days
    const previous = data.slice(-14, -7) // Previous 7 days
    
    if (recent.length === 0 || previous.length === 0) return { trend: 'stable', percentage: 0 }
    
    const recentAvg = recent.reduce((sum, item) => sum + (item[field] as number), 0) / recent.length
    const previousAvg = previous.reduce((sum, item) => sum + (item[field] as number), 0) / previous.length
    
    if (previousAvg === 0) return { trend: 'stable', percentage: 0 }
    
    const percentage = ((recentAvg - previousAvg) / previousAvg) * 100
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable'
    
    return { trend, percentage: Math.abs(percentage) }
  }

  // Get chart data based on selected type
  const getChartData = () => {
    switch (filters.type) {
      case 'volume':
        return historicalData.map(item => ({
          date: item.date,
          value: item.totalFlights,
          label: 'Zboruri'
        }))
      case 'delays':
        return historicalData.map(item => ({
          date: item.date,
          value: item.averageDelay,
          label: 'Întârziere (min)'
        }))
      case 'performance':
        return historicalData.map(item => ({
          date: item.date,
          value: item.onTimePercentage,
          label: 'La timp (%)'
        }))
      default:
        return []
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Get trend icon and color
  const getTrendDisplay = (trend: string, percentage: number) => {
    switch (trend) {
      case 'up':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: filters.type === 'performance' ? 'text-green-600' : 'text-red-600',
          text: `+${percentage.toFixed(1)}%`
        }
      case 'down':
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          color: filters.type === 'performance' ? 'text-red-600' : 'text-green-600',
          text: `-${percentage.toFixed(1)}%`
        }
      default:
        return {
          icon: <BarChart3 className="h-4 w-4" />,
          color: 'text-gray-600',
          text: 'Stabil'
        }
    }
  }

  const chartData = getChartData()
  const volumeTrend = calculateTrend(historicalData, 'totalFlights')
  const delayTrend = calculateTrend(historicalData, 'averageDelay')
  const performanceTrend = calculateTrend(historicalData, 'onTimePercentage')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            onClick={fetchHistoricalData}
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
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              De la
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Până la
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Analysis Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tip analiză
            </label>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setFilters({ ...filters, type: 'volume' })}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.type === 'volume'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Volum
              </button>
              <button
                onClick={() => setFilters({ ...filters, type: 'delays' })}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.type === 'delays'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Întârzieri
              </button>
              <button
                onClick={() => setFilters({ ...filters, type: 'performance' })}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.type === 'performance'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Performanță
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Volume Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Volum Zboruri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {historicalData.length > 0 ? Math.round(historicalData.reduce((sum, item) => sum + item.totalFlights, 0) / historicalData.length) : 0}
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${getTrendDisplay(volumeTrend.trend, volumeTrend.percentage).color}`}>
              {getTrendDisplay(volumeTrend.trend, volumeTrend.percentage).icon}
              <span className="text-sm font-medium">
                {getTrendDisplay(volumeTrend.trend, volumeTrend.percentage).text}
              </span>
            </div>
          </div>
        </div>

        {/* Delay Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Întârziere Medie</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {historicalData.length > 0 ? Math.round(historicalData.reduce((sum, item) => sum + item.averageDelay, 0) / historicalData.length) : 0} min
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${getTrendDisplay(delayTrend.trend, delayTrend.percentage).color}`}>
              {getTrendDisplay(delayTrend.trend, delayTrend.percentage).icon}
              <span className="text-sm font-medium">
                {getTrendDisplay(delayTrend.trend, delayTrend.percentage).text}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performanță La Timp</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {historicalData.length > 0 ? Math.round(historicalData.reduce((sum, item) => sum + item.onTimePercentage, 0) / historicalData.length) : 0}%
              </p>
            </div>
            <div className={`flex items-center space-x-1 ${getTrendDisplay(performanceTrend.trend, performanceTrend.percentage).color}`}>
              {getTrendDisplay(performanceTrend.trend, performanceTrend.percentage).icon}
              <span className="text-sm font-medium">
                {getTrendDisplay(performanceTrend.trend, performanceTrend.percentage).text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Evoluție {filters.type === 'volume' ? 'Volum Zboruri' : filters.type === 'delays' ? 'Întârzieri' : 'Performanță'}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {historicalData.length} zile analizate
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 relative">
            {/* Simple bar chart representation */}
            <div className="flex items-end justify-between h-full space-x-1">
              {chartData.slice(-30).map((item, index) => {
                const maxValue = Math.max(...chartData.map(d => d.value))
                const height = (item.value / maxValue) * 100
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 dark:bg-blue-400 rounded-t w-full min-h-[2px] transition-all hover:bg-blue-600 dark:hover:bg-blue-300"
                      style={{ height: `${height}%` }}
                      title={`${formatDate(item.date)}: ${item.value} ${item.label}`}
                    ></div>
                    {index % 5 === 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45 origin-left">
                        {formatDate(item.date)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Nu sunt disponibile date pentru perioada selectată</p>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      {historicalData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Date Detaliate
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Data</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Zboruri</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Întârziere Medie</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">La Timp</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Anulate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {historicalData.slice(-10).reverse().map((item, index) => (
                  <tr key={item.date}>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {new Date(item.date).toLocaleDateString('ro-RO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                      {item.totalFlights}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {item.averageDelay} min
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${
                        item.onTimePercentage >= 80 ? 'text-green-600' :
                        item.onTimePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.onTimePercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {item.cancelledFlights}
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