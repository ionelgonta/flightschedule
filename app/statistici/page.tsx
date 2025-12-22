'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, TrendingUp, TrendingDown, Minus, BarChart3, Clock, Plane } from 'lucide-react'

interface DailyStats {
  airport: string
  date: string
  summary: {
    totalFlights: number
    onTimeFlights: number
    delayedFlights: number
    cancelledFlights: number
    onTimePercentage: number
    averageDelay: number
    delayIndex: number
  }
  peakHours: number[]
  topAirlines: Array<{
    code: string
    name: string
    flights: number
    onTimePercentage: number
    averageDelay: number
  }>
  hourlyDistribution: Array<{
    hour: number
    label: string
    flights: number
    averageDelay: number
    onTimePercentage: number
  }>
}

interface TrendStats {
  airport: string
  period: string
  insights: {
    trafficChange: number
    delayChange: number
    bestPerformingDay: string
    worstPerformingDay: string
    recommendations: string[]
  }
  dataPoints: Array<{
    date: string
    totalFlights: number
    onTimePercentage: number
    averageDelay: number
    delayIndex: number
  }>
}

export default function StatisticiPage() {
  const [selectedAirport, setSelectedAirport] = useState('OTP')
  const [selectedPeriod, setPeriod] = useState('7d')
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const airports = [
    { code: 'OTP', name: 'București Henri Coandă' },
    { code: 'BBU', name: 'București Băneasa' },
    { code: 'CND', name: 'Constanța' },
    { code: 'CLJ', name: 'Cluj-Napoca' },
    { code: 'TSR', name: 'Timișoara' },
    { code: 'IAS', name: 'Iași' },
    { code: 'SBZ', name: 'Sibiu' },
    { code: 'CRA', name: 'Craiova' },
    { code: 'BAY', name: 'Baia Mare' },
    { code: 'OMR', name: 'Oradea' },
    { code: 'SCV', name: 'Suceava' },
    { code: 'TGM', name: 'Târgu Mureș' },
    { code: 'RMN', name: 'Bacău' },
    { code: 'RMO', name: 'Chișinău' }
  ]

  const periods = [
    { value: '7d', label: 'Ultimele 7 zile' },
    { value: '30d', label: 'Ultimele 30 zile' },
    { value: '90d', label: 'Ultimele 90 zile' }
  ]

  const fetchDailyStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/stats/daily?airport=${selectedAirport}&date=${today}`)
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca statisticile zilnice')
      }
      
      const data = await response.json()
      if (data.success) {
        setDailyStats(data.data)
      } else {
        throw new Error(data.message || 'Eroare la încărcarea datelor')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
      console.error('Error fetching daily stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/stats/trends?airport=${selectedAirport}&period=${selectedPeriod}`)
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca tendințele')
      }
      
      const data = await response.json()
      if (data.success) {
        setTrendStats(data.data)
      } else {
        throw new Error(data.message || 'Eroare la încărcarea datelor')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
      console.error('Error fetching trend stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyStats()
    fetchTrendStats()
  }, [selectedAirport, selectedPeriod])

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-success" />
    if (change < -5) return <TrendingDown className="h-4 w-4 text-error" />
    return <Minus className="h-4 w-4 text-on-surface-variant" />
  }

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-success'
    if (change < -5) return 'text-error'
    return 'text-on-surface-variant'
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-on-surface mb-2">
            📊 Statistici Zboruri
          </h1>
          <p className="text-on-surface-variant">
            Analize istorice și tendințe pentru aeroporturile din România și Moldova
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary-40" />
            <Select value={selectedAirport} onValueChange={setSelectedAirport}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selectează aeroportul" />
              </SelectTrigger>
              <SelectContent>
                {airports.map((airport) => (
                  <SelectItem key={airport.code} value={airport.code}>
                    {airport.code} - {airport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-40" />
            <Select value={selectedPeriod} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selectează perioada" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => {
              fetchDailyStats()
              fetchTrendStats()
            }}
            disabled={loading}
          >
            {loading ? 'Se încarcă...' : 'Actualizează'}
          </Button>
        </div>

        {error && (
          <div className="bg-error-container border border-error rounded-lg p-4 mb-8">
            <p className="text-on-error-container">⚠️ {error}</p>
          </div>
        )}

        {/* Daily Statistics Cards */}
        {dailyStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Zboruri</CardTitle>
                <Plane className="h-4 w-4 text-on-surface-variant" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyStats.summary.totalFlights}</div>
                <p className="text-xs text-on-surface-variant">
                  Azi, {dailyStats.date}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">La Timp</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {dailyStats.summary.onTimePercentage}%
                </div>
                <p className="text-xs text-on-surface-variant">
                  {dailyStats.summary.onTimeFlights} din {dailyStats.summary.totalFlights} zboruri
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Întârziate</CardTitle>
                <TrendingDown className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {dailyStats.summary.delayedFlights}
                </div>
                <p className="text-xs text-on-surface-variant">
                  Întârziere medie: {dailyStats.summary.averageDelay} min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anulate</CardTitle>
                <Minus className="h-4 w-4 text-error" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-error">
                  {dailyStats.summary.cancelledFlights}
                </div>
                <p className="text-xs text-on-surface-variant">
                  Zboruri anulate azi
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trend Analysis */}
        {trendStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendințe Trafic
                </CardTitle>
                <CardDescription>
                  Analiza pentru {periods.find(p => p.value === selectedPeriod)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Schimbare Trafic:</span>
                    <div className={`flex items-center gap-1 ${getTrendColor(trendStats.insights.trafficChange)}`}>
                      {getTrendIcon(trendStats.insights.trafficChange)}
                      <span className="font-bold">
                        {trendStats.insights.trafficChange > 0 ? '+' : ''}{trendStats.insights.trafficChange}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Schimbare Întârzieri:</span>
                    <div className={`flex items-center gap-1 ${getTrendColor(-trendStats.insights.delayChange)}`}>
                      {getTrendIcon(-trendStats.insights.delayChange)}
                      <span className="font-bold">
                        {trendStats.insights.delayChange > 0 ? '+' : ''}{trendStats.insights.delayChange}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm">
                      <p><strong>Cea mai bună zi:</strong> {trendStats.insights.bestPerformingDay}</p>
                      <p><strong>Cea mai slabă zi:</strong> {trendStats.insights.worstPerformingDay}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            {dailyStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Ore de Vârf
                  </CardTitle>
                  <CardDescription>
                    Orele cu cel mai mult trafic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailyStats.peakHours.map((hour, index) => (
                      <div key={hour} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          #{index + 1} - {formatHour(hour)}
                        </span>
                        <div className="text-sm text-on-surface-variant">
                          {dailyStats.hourlyDistribution.find(h => h.hour === hour)?.flights || 0} zboruri
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Top Airlines */}
        {dailyStats && dailyStats.topAirlines.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Top Companii Aeriene</CardTitle>
              <CardDescription>
                Performanța companiilor pentru {dailyStats.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStats.topAirlines.slice(0, 5).map((airline, index) => (
                  <div key={airline.code} className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-40 text-on-primary rounded-full flex items-center justify-center text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-on-surface">{airline.name}</div>
                        <div className="text-sm text-on-surface-variant">{airline.code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-on-surface">{airline.flights} zboruri</div>
                      <div className="text-sm">
                        <span className={airline.onTimePercentage >= 80 ? 'text-success' : 'text-warning'}>
                          {airline.onTimePercentage}% la timp
                        </span>
                        {airline.averageDelay > 0 && (
                          <span className="text-on-surface-variant ml-2">
                            ({airline.averageDelay} min întârziere)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {trendStats && trendStats.insights.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>💡 Recomandări</CardTitle>
              <CardDescription>
                Pe baza analizei tendințelor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {trendStats.insights.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-40 mt-1">•</span>
                    <span className="text-sm text-on-surface">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}