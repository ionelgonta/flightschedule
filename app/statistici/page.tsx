'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, Minus, BarChart3, Clock, Plane, AlertTriangle, CheckCircle } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

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
    { code: 'BCM', name: 'Bacău' },
    { code: 'RMO', name: 'Chișinău' }
  ]

  const periods = [
    { value: '7d', label: 'Ultimele 7 zile' },
    { value: '30d', label: 'Ultimele 30 zile' },
    { value: '90d', label: 'Ultimele 90 zile' }
  ]

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchDailyStats = async () => {
    try {
      console.log('Fetching daily stats for:', selectedAirport)
      setLoading(true)
      setError(null)
      
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/stats/daily?airport=${selectedAirport}&date=${today}`)
      
      console.log('Daily stats response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca statisticile zilnice')
      }
      
      const data = await response.json()
      console.log('Daily stats data:', data)
      
      if (data.success) {
        setDailyStats(data.data)
      } else {
        throw new Error(data.message || 'Eroare la încărcarea datelor')
      }
    } catch (err) {
      console.error('Error fetching daily stats:', err)
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendStats = async () => {
    try {
      console.log('Fetching trend stats for:', selectedAirport, selectedPeriod)
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/stats/trends?airport=${selectedAirport}&period=${selectedPeriod}`)
      
      console.log('Trend stats response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca tendințele')
      }
      
      const data = await response.json()
      console.log('Trend stats data:', data)
      
      if (data.success) {
        setTrendStats(data.data)
      } else {
        throw new Error(data.message || 'Eroare la încărcarea datelor')
      }
    } catch (err) {
      console.error('Error fetching trend stats:', err)
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      console.log('Component mounted, fetching data...')
      fetchDailyStats()
      fetchTrendStats()
    }
  }, [selectedAirport, selectedPeriod, mounted])

  // Don't render anything until hydrated
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Se încarcă...</p>
          </div>
        </div>
      </div>
    )
  }

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < -5) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-green-600'
    if (change < -5) return 'text-red-600'
    return 'text-gray-500'
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  // Function to get full airline name from IATA code
  const getAirlineName = (code: string) => {
    const airlines: { [key: string]: string } = {
      'LX': 'Swiss International Air Lines',
      'FR': 'Ryanair',
      'RO': 'TAROM',
      'KL': 'KLM Royal Dutch Airlines',
      'W4': 'Wizz Air',
      'LH': 'Lufthansa',
      'OS': 'Austrian Airlines',
      'VL': 'Volotea',
      'BA': 'British Airways',
      'LG': 'Luxair',
      'AF': 'Air France',
      'TK': 'Turkish Airlines',
      'QR': 'Qatar Airways',
      'EK': 'Emirates',
      'LO': 'LOT Polish Airlines',
      'SN': 'Brussels Airlines',
      'AZ': 'ITA Airways',
      'U2': 'easyJet',
      'W6': 'Wizz Air',
      '0B': 'Blue Air',
      'HV': 'Transavia',
      'PC': 'Pegasus Airlines',
      'FB': 'Bulgaria Air',
      '2L': 'Helvetic Airways',
      'EN': 'Air Dolomiti',
      'EW': 'Eurowings',
      'OU': 'Croatia Airlines',
      'JU': 'Air Serbia',
      'YM': 'Montenegro Airlines',
      'BT': 'Air Baltic',
      'SK': 'SAS Scandinavian Airlines',
      'DY': 'Norwegian Air',
      'FI': 'Icelandair',
      'WF': 'Widerøe',
      'D8': 'Norwegian Air International',
      'VY': 'Vueling',
      'UX': 'Air Europa',
      'IB': 'Iberia',
      'TP': 'TAP Air Portugal',
      'S7': 'S7 Airlines',
      'SU': 'Aeroflot',
      'UT': 'UTair',
      'FZ': 'flydubai',
      'WY': 'Oman Air',
      'MS': 'EgyptAir',
      'RJ': 'Royal Jordanian',
      'ME': 'Middle East Airlines',
      'GF': 'Gulf Air',
      'KC': 'Air Astana',
      'HY': 'Uzbekistan Airways',
      'B2': 'Belavia',
      'PS': 'Ukraine International Airlines',
      'VV': 'Aerosvit Airlines'
    }
    return airlines[code] || code
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Statistici Zboruri
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analize istorice și tendințe pentru aeroporturile din România și Moldova
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-blue-600" />
              <select 
                value={selectedAirport} 
                onChange={(e) => setSelectedAirport(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-[200px]"
              >
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.code} - {airport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <select 
                value={selectedPeriod} 
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-[160px]"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Se actualizează...</span>
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
            <p className="text-sm text-yellow-700">Mounted: {mounted ? 'Yes' : 'No'}</p>
            <p className="text-sm text-yellow-700">Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-sm text-yellow-700">Error: {error || 'None'}</p>
            <p className="text-sm text-yellow-700">Daily Stats: {dailyStats ? 'Loaded' : 'Not loaded'}</p>
            <p className="text-sm text-yellow-700">Trend Stats: {trendStats ? 'Loaded' : 'Not loaded'}</p>
            <p className="text-sm text-yellow-700">Selected Airport: {selectedAirport}</p>
            <p className="text-sm text-yellow-700">Selected Period: {selectedPeriod}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-700 font-medium">⚠️ {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Se încarcă statisticile...</p>
          </div>
        )}

        {/* Daily Statistics Cards */}
        {dailyStats && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Zboruri</h3>
                <Plane className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{dailyStats.summary.totalFlights}</div>
              <p className="text-sm text-gray-500">
                Azi, {new Date(dailyStats.date).toLocaleDateString('ro-RO')}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">La Timp</h3>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {dailyStats.summary.onTimePercentage}%
              </div>
              <p className="text-sm text-gray-500">
                {dailyStats.summary.onTimeFlights} din {dailyStats.summary.totalFlights} zboruri
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Întârziate</h3>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {dailyStats.summary.delayedFlights}
              </div>
              <p className="text-sm text-gray-500">
                Întârziere medie: {dailyStats.summary.averageDelay} min
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Anulate</h3>
                <Minus className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {dailyStats.summary.cancelledFlights}
              </div>
              <p className="text-sm text-gray-500">
                Zboruri anulate azi
              </p>
            </div>
          </div>
        )}

        {/* Trend Analysis */}
        {trendStats && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tendințe Trafic</h2>
                  <p className="text-sm text-gray-600">
                    Analiza pentru {periods.find(p => p.value === selectedPeriod)?.label}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Schimbare Trafic:</span>
                  <div className={`flex items-center gap-2 ${getTrendColor(trendStats.insights.trafficChange)}`}>
                    {getTrendIcon(trendStats.insights.trafficChange)}
                    <span className="font-bold">
                      {trendStats.insights.trafficChange > 0 ? '+' : ''}{trendStats.insights.trafficChange}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Schimbare Întârzieri:</span>
                  <div className={`flex items-center gap-2 ${getTrendColor(-trendStats.insights.delayChange)}`}>
                    {getTrendIcon(-trendStats.insights.delayChange)}
                    <span className="font-bold">
                      {trendStats.insights.delayChange > 0 ? '+' : ''}{trendStats.insights.delayChange}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <p><strong>Cea mai bună zi:</strong> {new Date(trendStats.insights.bestPerformingDay).toLocaleDateString('ro-RO')}</p>
                    <p><strong>Cea mai slabă zi:</strong> {new Date(trendStats.insights.worstPerformingDay).toLocaleDateString('ro-RO')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Peak Hours */}
            {dailyStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Ore de Vârf</h2>
                    <p className="text-sm text-gray-600">
                      Orele cu cel mai mult trafic
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {dailyStats.peakHours.map((hour, index) => (
                    <div key={hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        #{index + 1} - {formatHour(hour)}
                      </span>
                      <div className="text-sm text-gray-600 font-medium">
                        {dailyStats.hourlyDistribution.find(h => h.hour === hour)?.flights || 0} zboruri
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Airlines */}
        {dailyStats && dailyStats.topAirlines.length > 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Top Companii Aeriene</h2>
            <p className="text-sm text-gray-600 mb-6">
              Performanța companiilor pentru {new Date(dailyStats.date).toLocaleDateString('ro-RO')}
            </p>
            
            <div className="space-y-4">
              {dailyStats.topAirlines.slice(0, 5).map((airline, index) => (
                <div key={airline.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{getAirlineName(airline.code)}</div>
                      <div className="text-sm text-gray-600">{airline.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{airline.flights} zboruri</div>
                    <div className="text-sm">
                      <span className={airline.onTimePercentage >= 80 ? 'text-green-600' : 'text-orange-600'}>
                        {airline.onTimePercentage}% la timp
                      </span>
                      {airline.averageDelay > 0 && (
                        <span className="text-gray-600 ml-2">
                          ({airline.averageDelay} min întârziere)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {trendStats && trendStats.insights.recommendations.length > 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">💡 Recomandări</h2>
            <p className="text-sm text-gray-600 mb-6">
              Pe baza analizei tendințelor
            </p>
            
            <ul className="space-y-3">
              {trendStats.insights.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 mt-1 font-bold">•</span>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}