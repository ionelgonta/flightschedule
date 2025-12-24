'use client'

import { FlightFilters, Flight, FlightStatus } from '@/types/flight'
import { X } from 'lucide-react'

interface FlightFiltersComponentProps {
  filters: FlightFilters
  onFiltersChange: (filters: FlightFilters) => void
  flights: Flight[]
}

export function FlightFiltersComponent({ 
  filters, 
  onFiltersChange, 
  flights 
}: FlightFiltersComponentProps) {
  const airlines = Array.from(new Set(flights.map(f => f.airline.name))).sort()
  const statuses: FlightStatus[] = ['scheduled', 'active', 'landed', 'delayed', 'cancelled', 'diverted']

  const updateFilter = (key: keyof FlightFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Airline
          </label>
          <select
            value={filters.airline || ''}
            onChange={(e) => updateFilter('airline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Airlines</option>
            {airlines.map(airline => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value as FlightStatus)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Range
          </label>
          <select
            value={filters.timeRange ? `${filters.timeRange.start}-${filters.timeRange.end}` : ''}
            onChange={(e) => {
              if (e.target.value) {
                const [start, end] = e.target.value.split('-')
                updateFilter('timeRange', { start, end })
              } else {
                updateFilter('timeRange', undefined)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Times</option>
            <option value="00:00-06:00">Early Morning (00:00 - 06:00)</option>
            <option value="06:00-12:00">Morning (06:00 - 12:00)</option>
            <option value="12:00-18:00">Afternoon (12:00 - 18:00)</option>
            <option value="18:00-23:59">Evening (18:00 - 23:59)</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.airline && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                Airline: {filters.airline}
                <button
                  onClick={() => updateFilter('airline', undefined)}
                  className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                Status: {filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1) : filters.status}
                <button
                  onClick={() => updateFilter('status', undefined)}
                  className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.timeRange && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                Time: {filters.timeRange.start} - {filters.timeRange.end}
                <button
                  onClick={() => updateFilter('timeRange', undefined)}
                  className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}