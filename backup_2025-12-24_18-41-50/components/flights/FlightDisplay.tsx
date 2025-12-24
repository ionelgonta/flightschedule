'use client'

import { useState, useMemo } from 'react'
import { Flight, FlightFilters } from '@/types/flight'
import { FlightStatusBadge } from './FlightStatusBadge'
import { FlightFiltersComponent } from './FlightFilters'
import { LoadingSkeleton } from './LoadingSkeleton'
import { Search, Filter } from 'lucide-react'

interface FlightDisplayProps {
  flights: Flight[]
  loading?: boolean
  type: 'arrivals' | 'departures'
  onFiltersChange?: (filters: FlightFilters) => void
}

// Inline FlightRow component
function FlightRowComponent({ flight, type }: { flight: Flight; type: 'arrivals' | 'departures' }) {
  const relevantAirport = type === 'arrivals' ? flight.departure : flight.arrival
  const relevantTime = type === 'arrivals' ? flight.arrival : flight.departure

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit' 
    })
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* Zbor */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {flight.flightNumber}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
          {flight.airline.code}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(relevantTime.scheduled)}
        </div>
      </td>
      
      {/* Companie - ascuns pe mobile */}
      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {flight.airline.code}
            </span>
          </div>
          <div className="ml-2 sm:ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {flight.airline.name}
            </div>
          </div>
        </div>
      </td>
      
      {/* Destinație */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {relevantAirport.airport?.city || 'N/A'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          {relevantAirport.airport.name}
        </div>
      </td>
      
      {/* Ora */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatTime(relevantTime.scheduled)}
        </div>
        {relevantTime.estimated && relevantTime.estimated !== relevantTime.scheduled && (
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Est: {formatTime(relevantTime.estimated)}
          </div>
        )}
        {flight.delay && (
          <div className="text-xs text-red-600 dark:text-red-400">
            +{flight.delay}min
          </div>
        )}
      </td>
      
      {/* Status */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <FlightStatusBadge status={flight.status} />
      </td>
      
      {/* Terminal - ascuns pe mobile și tablet mic */}
      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
        <div>
          {relevantTime.terminal && (
            <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs mr-1">
              T{relevantTime.terminal}
            </span>
          )}
          {relevantTime.gate && (
            <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              {relevantTime.gate}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

export function FlightDisplay({ flights, loading, type, onFiltersChange }: FlightDisplayProps) {
  const [filters, setFilters] = useState<FlightFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFlights = useMemo(() => {
    let filtered = flights

    // Filtrare pe timp: arată zborurile din ultimele 10 ore și toate zborurile viitoare
    const now = new Date()
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000) // 10 ore în urmă
    
    filtered = filtered.filter(flight => {
      const relevantTime = type === 'arrivals' ? flight.arrival : flight.departure
      const scheduledTime = new Date(relevantTime.scheduled)
      // Arată doar zborurile care sunt:
      // 1. Programate în viitor (scheduledTime > now)
      // 2. Programate în ultimele 10 ore (scheduledTime > tenHoursAgo)
      return scheduledTime > tenHoursAgo
    })

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(flight => 
        flight.flightNumber.toLowerCase().includes(search) ||
        flight.airline.name.toLowerCase().includes(search) ||
        (type === 'arrivals' ? flight.departure.airport.city : flight.arrival.airport.city)
          .toLowerCase().includes(search)
      )
    }

    if (filters.airline) {
      filtered = filtered.filter(flight => 
        flight.airline.name.toLowerCase().includes(filters.airline!.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter(flight => flight.status === filters.status)
    }

    return filtered
  }, [flights, searchTerm, filters, type])

  const handleFiltersChange = (newFilters: FlightFilters) => {
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={`Caută ${type === 'arrivals' ? 'sosiri' : 'plecări'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtre</span>
        </button>
      </div>

      {showFilters && (
        <FlightFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          flights={flights}
        />
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Afișez {filteredFlights.length} din {flights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zbor
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Companie
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {type === 'arrivals' ? 'Din' : 'Spre'}
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ora
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Terminal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 sm:px-4 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="text-sm">Nu s-au găsit zboruri care să corespundă criteriilor</div>
                  </td>
                </tr>
              ) : (
                filteredFlights.map((flight) => (
                  <FlightRowComponent key={flight.id} flight={flight} type={type} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}