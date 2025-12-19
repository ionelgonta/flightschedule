'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, BarChart3 } from 'lucide-react'
import { WeeklyScheduleData } from '@/lib/weeklyScheduleAnalyzer'
import { MAJOR_AIRPORTS } from '@/lib/airports'

interface WeeklyScheduleViewProps {
  className?: string
  initialAirportFilter?: string
}

export default function WeeklyScheduleView({ className = '', initialAirportFilter = '' }: WeeklyScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData[]>([])
  const [filteredData, setFilteredData] = useState<WeeklyScheduleData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [autoUpdateEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataRange, setDataRange] = useState<{ from: string; to: string } | null>(null)
  
  // Filters
  const [airportFilter, setAirportFilter] = useState(initialAirportFilter)
  const [destinationFilter, setDestinationFilter] = useState('')
  const [airlineFilter, setAirlineFilter] = useState('')
  const [sortBy, setSortBy] = useState<'airport' | 'destination' | 'airline' | 'frequency'>('airport')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Helper function to convert airport codes to display names
  const getAirportDisplayName = (code: string): string => {
    const airport = MAJOR_AIRPORTS.find(a => a.code === code)
    return airport ? airport.city : code
  }

  // Get Romanian and Moldovan airports for filters
  const romanianMoldovanAirports = MAJOR_AIRPORTS.filter(airport => 
    airport.country === 'România' || airport.country === 'Moldova'
  )

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      const data = await response.json()
      
      if (data.success) {
        // Convert airport codes to city names synchronously using MAJOR_AIRPORTS
        const processedData = data.data.map((item: WeeklyScheduleData) => ({
          ...item,
          airport: getAirportDisplayName(item.airport),
          destination: getAirportDisplayName(item.destination)
        }))
        
        setScheduleData(processedData)
        setFilteredData(processedData)
        
        // Set data range if available
        if (data.dataRange) {
          setDataRange(data.dataRange)
        }
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

  // Auto-update schedule table from cache (runs automatically)
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

  // Group similar routes and apply filters/sorting
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
    
    // Group similar routes (same origin-destination pair)
    const routeGroups = new Map<string, WeeklyScheduleData[]>()
    
    filtered.forEach(item => {
      const routeKey = `${item.airport} → ${item.destination}`
      if (!routeGroups.has(routeKey)) {
        routeGroups.set(routeKey, [])
      }
      routeGroups.get(routeKey)!.push(item)
    })
    
    // Create grouped data with combined information
    const groupedData: WeeklyScheduleData[] = []
    
    routeGroups.forEach((flights, routeKey) => {
      if (flights.length === 1) {
        // Single flight, keep as is
        groupedData.push(flights[0])
      } else {
        // Multiple flights on same route, create grouped entry
        const airlines = [...new Set(flights.map(f => f.airline))].join(', ')
        const flightNumbers = flights.map(f => f.flightNumber).join(', ')
        const totalFrequency = flights.reduce((sum, f) => sum + f.frequency, 0)
        
        // Combine weekly patterns (OR operation)
        const combinedPattern = {
          monday: flights.some(f => f.weeklyPattern.monday),
          tuesday: flights.some(f => f.weeklyPattern.tuesday),
          wednesday: flights.some(f => f.weeklyPattern.wednesday),
          thursday: flights.some(f => f.weeklyPattern.thursday),
          friday: flights.some(f => f.weeklyPattern.friday),
          saturday: flights.some(f => f.weeklyPattern.saturday),
          sunday: flights.some(f => f.weeklyPattern.sunday)
        }
        
        groupedData.push({
          airport: flights[0].airport,
          destination: flights[0].destination,
          airline: airlines,
          flightNumber: flightNumbers,
          weeklyPattern: combinedPattern,
          frequency: totalFrequency,
          lastUpdated: flights[0].lastUpdated,
          dataSource: flights[0].dataSource
        })
      }
    })
    
    // Apply sorting
    groupedData.sort((a, b) => {
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
    
    setFilteredData(groupedData)
  }, [scheduleData, airportFilter, destinationFilter, airlineFilter, sortBy, sortOrder])

  // Handle URL parameters for pre-filtering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const airportParam = urlParams.get('airport')
      if (airportParam && airportParam !== airportFilter) {
        setAirportFilter(airportParam)
      }
    }
  }, [])

  // Load data on component mount and set up auto-update
  useEffect(() => {
    loadScheduleData()
    
    // Auto-update schedule table on first load if no data exists
    const autoUpdate = async () => {
      try {
        const response = await fetch('/api/admin/weekly-schedule?action=get')
        const data = await response.json()
        
        if (data.success && data.count === 0) {
          console.log('No schedule data found, auto-updating from cache...')
          setUpdating(true)
          
          const updateResponse = await fetch('/api/admin/weekly-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update' })
          })
          
          const updateData = await updateResponse.json()
          
          if (updateData.success) {
            console.log('Schedule updated successfully, reloading data...')
            await loadScheduleData()
          } else {
            console.error('Failed to update schedule:', updateData.error)
            setError(updateData.error || 'Failed to auto-update schedule')
          }
          
          setUpdating(false)
        }
      } catch (err) {
        console.error('Auto-update error:', err)
        setError('Failed to auto-update schedule data')
        setUpdating(false)
      }
    }
    
    autoUpdate()
    
    // Set up periodic auto-update every 30 minutes
    const interval = setInterval(() => {
      if (autoUpdateEnabled) {
        console.log('Auto-updating weekly schedule from cache...')
        updateScheduleTable()
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    return () => clearInterval(interval)
  }, [autoUpdateEnabled])

  // Get unique values for filter dropdowns from Romanian and Moldovan airports
  const departureAirports = romanianMoldovanAirports
    .filter(airport => scheduleData.some(item => item.airport.includes(airport.code)))
    .map(airport => `${airport.city} (${airport.code})`)
    .sort()
  
  const arrivalAirports = romanianMoldovanAirports
    .filter(airport => scheduleData.some(item => item.destination.includes(airport.code)))
    .map(airport => `${airport.city} (${airport.code})`)
    .sort()
  
  const uniqueAirlines = [...new Set(scheduleData.map(item => item.airline))].sort()



  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Se încarcă programul săptămânal...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Program Săptămânal Zboruri
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} rute
              {dataRange && (
                <span className="ml-2">
                  • Perioada: {new Date(dataRange.from).toLocaleDateString('ro-RO')} - {new Date(dataRange.to).toLocaleDateString('ro-RO')}
                </span>
              )}
            </p>
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
              Plecări din România/Moldova
            </label>
            <select
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Toate aeroporturile</option>
              {departureAirports.map(airport => (
                <option key={airport} value={airport}>{airport}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sosiri în România/Moldova
            </label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Toate destinațiile</option>
              {arrivalAirports.map(airport => (
                <option key={airport} value={airport}>{airport}</option>
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
              Se generează programul săptămânal...
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sistemul procesează automat datele pentru a genera programul săptămânal.
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
                  Lun
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mar
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mie
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joi
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sam
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dum
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frecvență
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.airport} → {item.destination}
                    </div>
                    {item.airline.includes(',') && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Rută cu multiple companii
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {item.flightNumber.length > 20 ? 
                        `${item.flightNumber.substring(0, 20)}...` : 
                        item.flightNumber
                      }
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.airline.length > 30 ? 
                        `${item.airline.substring(0, 30)}...` : 
                        item.airline
                      }
                    </div>
                    {item.airline.includes(',') && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {item.airline.split(',').length} companii
                      </div>
                    )}
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