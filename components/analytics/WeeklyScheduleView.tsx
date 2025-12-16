'use client'

import { useState, useEffect } from 'react'
import { Calendar, Download, Filter, RefreshCw, Trash2, BarChart3 } from 'lucide-react'
import { WeeklyScheduleData } from '@/lib/weeklyScheduleAnalyzer'

interface WeeklyScheduleViewProps {
  className?: string
}

export default function WeeklyScheduleView({ className = '' }: WeeklyScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData[]>([])
  const [filteredData, setFilteredData] = useState<WeeklyScheduleData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [airportFilter, setAirportFilter] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [airlineFilter, setAirlineFilter] = useState('')
  const [sortBy, setSortBy] = useState<'airport' | 'destination' | 'airline' | 'frequency'>('airport')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      const data = await response.json()
      
      if (data.success) {
        setScheduleData(data.data)
        setFilteredData(data.data)
      } else {
        setError(data.error || 'Failed to load schedule data')
      }
    } catch (err) {
      setError('Network error loading schedule data')
      console.error('Error loading schedule data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update schedule table from cache
  const updateScheduleTable = async () => {
    try {
      setUpdating(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadScheduleData() // Reload data after update
      } else {
        setError(data.error || 'Failed to update schedule table')
      }
    } catch (err) {
      setError('Network error updating schedule table')
      console.error('Error updating schedule table:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Clear schedule table
  const clearScheduleTable = async () => {
    if (!confirm('Sigur doriți să ștergeți toate datele din tabelul de programe săptămânale?')) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setScheduleData([])
        setFilteredData([])
      } else {
        setError(data.error || 'Failed to clear schedule table')
      }
    } catch (err) {
      setError('Network error clearing schedule table')
      console.error('Error clearing schedule table:', err)
    } finally {
      setLoading(false)
    }
  }

  // Export schedule data
  const exportSchedule = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/weekly-schedule?action=export&format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `weekly-schedule.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to export schedule data')
      }
    } catch (err) {
      setError('Network error exporting schedule data')
      console.error('Error exporting schedule data:', err)
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...scheduleData]
    
    // Apply filters
    if (airportFilter) {
      filtered = filtered.filter(item => 
        item.airport.toLowerCase().includes(airportFilter.toLowerCase())
      )
    }
    
    if (destinationFilter) {
      filtered = filtered.filter(item => 
        item.destination.toLowerCase().includes(destinationFilter.toLowerCase())
      )
    }
    
    if (airlineFilter) {
      filtered = filtered.filter(item => 
        item.airline.toLowerCase().includes(airlineFilter.toLowerCase())
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''
      
      switch (sortBy) {
        case 'airport':
          aValue = a.airport
          bValue = b.airport
          break
        case 'destination':
          aValue = a.destination
          bValue = b.destination
          break
        case 'airline':
          aValue = a.airline
          bValue = b.airline
          break
        case 'frequency':
          aValue = a.frequency
          bValue = b.frequency
          break
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      const comparison = aValue.toString().localeCompare(bValue.toString())
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    setFilteredData(filtered)
  }, [scheduleData, airportFilter, destinationFilter, airlineFilter, sortBy, sortOrder])

  // Load data on component mount
  useEffect(() => {
    loadScheduleData()
  }, [])

  // Get unique values for filter dropdowns
  const uniqueAirports = [...new Set(scheduleData.map(item => item.airport))].sort()
  const uniqueDestinations = [...new Set(scheduleData.map(item => item.destination))].sort()
  const uniqueAirlines = [...new Set(scheduleData.map(item => item.airline))].sort()

  // Day abbreviations
  const dayAbbreviations = {
    monday: 'L',
    tuesday: 'M',
    wednesday: 'M',
    thursday: 'J',
    friday: 'V',
    saturday: 'S',
    sunday: 'D'
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Se încarcă programul săptămânal...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Program Săptămânal Zboruri
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analiză bazată pe datele din cache (ultimele 3 luni) - {filteredData.length} rute
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={updateScheduleTable}
              disabled={updating}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Actualizez...' : 'Actualizează'}
            </button>
            
            <button
              onClick={() => exportSchedule('json')}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </button>
            
            <button
              onClick={() => exportSchedule('csv')}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </button>
            
            <button
              onClick={clearScheduleTable}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Șterge
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtre:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aeroport Origine
            </label>
            <select
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Toate aeroporturile</option>
              {uniqueAirports.map(airport => (
                <option key={airport} value={airport}>{airport}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destinație
            </label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Toate destinațiile</option>
              {uniqueDestinations.map(destination => (
                <option key={destination} value={destination}>{destination}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Companie Aeriană
            </label>
            <select
              value={airlineFilter}
              onChange={(e) => setAirlineFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Toate companiile</option>
              {uniqueAirlines.map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sortare
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="airport">Aeroport</option>
                <option value="destination">Destinație</option>
                <option value="airline">Companie</option>
                <option value="frequency">Frecvență</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nu există date de program săptămânal
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Apăsați "Actualizează" pentru a genera programul pe baza datelor din cache.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rută
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zbor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  L
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  M
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  M
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  J
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  V
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  S
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  D
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frecvență
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.airport} → {item.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {item.flightNumber}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.airline}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.monday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.monday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.tuesday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.tuesday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.wednesday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.wednesday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.thursday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.thursday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.friday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.friday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.saturday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.saturday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      item.weeklyPattern.sunday 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      {item.weeklyPattern.sunday ? '●' : '○'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {item.frequency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with metadata */}
      {filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Afișate: {filteredData.length} din {scheduleData.length} rute
            </div>
            <div>
              Ultima actualizare: {scheduleData.length > 0 ? new Date(scheduleData[0].lastUpdated).toLocaleString('ro-RO') : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}