'use client'

import { useState, useEffect } from 'react'
import { Plane, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { Airport } from '@/types/flight'
import { FlightSchedule } from '@/lib/flightAnalyticsService'
import { getAirlineName, getCityName, formatAirportDisplay } from '@/lib/airlineMapping'

interface Props {
  airport: Airport
  initialType: 'arrivals' | 'departures'
  initialFilters?: {
    airline?: string
    status?: string
    from?: string
    to?: string
  }
}

export function FlightSchedulesView({ airport, initialType, initialFilters = {} }: Props) {
  const [type, setType] = useState<'arrivals' | 'departures'>(initialType)
  const [schedules, setSchedules] = useState<FlightSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Date range state
  const [fromDate, setFromDate] = useState(
    initialFilters.from || new Date().toISOString().split('T')[0]
  )
  const [toDate, setToDate] = useState(
    initialFilters.to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  
  // Filter state
  const [filters, setFilters] = useState({
    airline: initialFilters.airline || '',
    status: initialFilters.status || '',
    search: ''
  })
  
  // View mode state
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'custom'>('today')

  // Fetch schedules
  const fetchSchedules = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        type,
        from: fromDate,
        to: toDate
      })
      
      const response = await fetch(`/api/aeroport/${airport.code}/program-zboruri?${params}`)
      
      if (!response.ok) {
        throw new Error('Eroare la încărcarea programului de zboruri')
      }
      
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when parameters change
  useEffect(() => {
    fetchSchedules()
  }, [type, fromDate, toDate, airport.code])

  // Set date ranges based on view mode
  const handleViewModeChange = (mode: 'today' | 'week' | 'custom') => {
    const today = new Date()
    
    switch (mode) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0]
        setFromDate(todayStr)
        setToDate(todayStr)
        break
      case 'week':
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        setFromDate(today.toISOString().split('T')[0])
        setToDate(weekFromNow.toISOString().split('T')[0])
        break
      case 'custom':
        // Keep current dates
        break
    }
    
    setViewMode(mode)
  }

  // Filter schedules based on current filters
  const filteredSchedules = schedules.filter(schedule => {
    if (filters.airline && !schedule.airline.name.toLowerCase().includes(filters.airline.toLowerCase())) {
      return false
    }
    
    if (filters.status && schedule.status !== filters.status) {
      return false
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      return (
        schedule.flightNumber.toLowerCase().includes(searchTerm) ||
        schedule.airline.name.toLowerCase().includes(searchTerm) ||
        (type === 'arrivals' ? schedule.origin.city : schedule.destination.city)
          .toLowerCase().includes(searchTerm)
      )
    }
    
    return true
  })

  // Get unique airlines for filter
  const uniqueAirlines = Array.from(new Set(schedules.map(s => s.airline.name)))

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  // Get status icon and color
  const getStatusDisplay = (status: string, delay?: number) => {
    switch (status) {
      case 'on-time':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'La timp',
          color: 'text-green-600 bg-green-100'
        }
      case 'delayed':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: delay ? `Întârziere ${delay} min` : 'Întârziat',
          color: 'text-orange-600 bg-orange-100'
        }
      case 'cancelled':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Anulat',
          color: 'text-red-600 bg-red-100'
        }
      default:
        return {
          icon: <Plane className="h-4 w-4" />,
          text: 'Programat',
          color: 'text-blue-600 bg-blue-100'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Type Toggle */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setType('departures')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                type === 'departures'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Plecări
            </button>
            <button
              onClick={() => setType('arrivals')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                type === 'arrivals'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sosiri
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('today')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'today'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Astăzi
            </button>
            <button
              onClick={() => handleViewModeChange('week')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Săptămâna
            </button>
            <button
              onClick={() => handleViewModeChange('custom')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'custom'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Personalizat
            </button>
          </div>
        </div>

        {/* Date Range (for custom mode) */}
        {viewMode === 'custom' && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                De la
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Până la
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Căutare
            </label>
            <input
              type="text"
              placeholder="Număr zbor, companie, destinație..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Companie aeriană
            </label>
            <select
              value={filters.airline}
              onChange={(e) => setFilters({ ...filters, airline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Toate companiile</option>
              {uniqueAirlines.map(airline => (
                <option key={airline} value={airline}>{getAirlineName(airline)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Toate statusurile</option>
              <option value="on-time">La timp</option>
              <option value="delayed">Întârziat</option>
              <option value="cancelled">Anulat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 'departures' ? 'Plecări' : 'Sosiri'} - {airport.city}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredSchedules.length} zboruri găsite
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Se încarcă programul zborurilor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchSchedules}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Încearcă din nou
            </button>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-8 text-center">
            <Plane className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Nu au fost găsite zboruri pentru criteriile selectate.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSchedules.map((schedule, index) => {
              const statusDisplay = getStatusDisplay(schedule.status, schedule.delay)
              const otherAirport = type === 'departures' ? schedule.destination : schedule.origin
              
              return (
                <div key={`${schedule.flightNumber}-${index}`} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="font-semibold text-lg text-gray-900 dark:text-white">
                          {schedule.flightNumber}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {getAirlineName(schedule.airline.code)} ({schedule.airline.code})
                        </div>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.icon}
                          <span>{statusDisplay.text}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">{type === 'departures' ? 'Către' : 'De la'}:</span>
                          <span className="ml-1">{formatAirportDisplay(otherAirport.code)}</span>
                        </div>
                        
                        <div>
                          <span className="font-medium">Ora:</span>
                          <span className="ml-1">{formatTime(schedule.scheduledTime)}</span>
                          {schedule.actualTime && schedule.actualTime !== schedule.scheduledTime && (
                            <span className="ml-1 text-orange-600">
                              → {formatTime(schedule.actualTime)}
                            </span>
                          )}
                        </div>
                        
                        {schedule.gate && (
                          <div>
                            <span className="font-medium">Poarta:</span>
                            <span className="ml-1">{schedule.gate}</span>
                          </div>
                        )}
                        
                        {schedule.terminal && (
                          <div>
                            <span className="font-medium">Terminal:</span>
                            <span className="ml-1">{schedule.terminal}</span>
                          </div>
                        )}
                      </div>
                      
                      {schedule.aircraft && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          {schedule.aircraft}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(schedule.scheduledTime)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}