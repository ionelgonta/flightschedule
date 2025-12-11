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
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {flight.flightNumber}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(relevantTime.scheduled)}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {flight.airline.code}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {flight.airline.name}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {relevantAirport.airport.code}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {relevantAirport.airport.city}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatTime(relevantTime.scheduled)}
        </div>
        {relevantTime.estimated && relevantTime.estimated !== relevantTime.scheduled && (
          <div className="text-sm text-orange-600 dark:text-orange-400">
            Est: {formatTime(relevantTime.estimated)}
          </div>
        )}
        {flight.delay && (
          <div className="text-xs text-red-600 dark:text-red-400">
            +{flight.delay}min
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <FlightStatusBadge status={flight.status} />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        <div>
          {relevantTime.terminal && (
            <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs mr-1">
              {relevantTime.terminal}
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
            placeholder={`Search ${type}...`}
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
          <span>Filters</span>
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
        Showing {filteredFlights.length} of {flights.length} {type}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Flight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Airline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {type === 'arrivals' ? 'From' : 'To'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Terminal/Gate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No flights found matching your criteria
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