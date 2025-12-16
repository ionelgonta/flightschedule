'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Search } from 'lucide-react'
import { FlightPlannerFilters as Filters } from '@/lib/flightPlannerService'
import { MAJOR_AIRPORTS } from '@/lib/airports'

interface FlightPlannerFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  loading: boolean
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Luni', short: 'L' },
  { value: 'tuesday', label: 'Marți', short: 'Ma' },
  { value: 'wednesday', label: 'Miercuri', short: 'Mi' },
  { value: 'thursday', label: 'Joi', short: 'J' },
  { value: 'friday', label: 'Vineri', short: 'V' },
  { value: 'saturday', label: 'Sâmbătă', short: 'S' },
  { value: 'sunday', label: 'Duminică', short: 'D' }
]

const TIME_SLOTS = [
  { value: 'morning', label: 'Dimineața', time: '06:00 - 12:00', icon: '🌅' },
  { value: 'afternoon', label: 'Amiaza', time: '12:00 - 18:00', icon: '☀️' },
  { value: 'evening', label: 'Seara', time: '18:00 - 24:00', icon: '🌙' }
] as const

export function FlightPlannerFilters({ filters, onChange, loading }: FlightPlannerFiltersProps) {
  const [selectedDepartureDay, setSelectedDepartureDay] = useState('friday')
  const [selectedReturnDay, setSelectedReturnDay] = useState('sunday')
  const [showOriginSelector, setShowOriginSelector] = useState(false)

  const getExpandedDays = (day: string): string[] => {
    const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === day)
    if (dayIndex === -1) return [day]

    const prevDay = DAYS_OF_WEEK[(dayIndex - 1 + 7) % 7].value
    const nextDay = DAYS_OF_WEEK[(dayIndex + 1) % 7].value

    return [prevDay, day, nextDay]
  }

  const handleDepartureDayChange = (day: string) => {
    setSelectedDepartureDay(day)
    const expandedDays = getExpandedDays(day)
    onChange({
      ...filters,
      departureDays: expandedDays
    })
  }

  const handleReturnDayChange = (day: string) => {
    setSelectedReturnDay(day)
    const expandedDays = getExpandedDays(day)
    onChange({
      ...filters,
      returnDays: expandedDays
    })
  }

  const handleTimeSlotChange = (type: 'departure' | 'return', slot: 'morning' | 'afternoon' | 'evening') => {
    if (type === 'departure') {
      onChange({ ...filters, departureTimeSlot: slot })
    } else {
      onChange({ ...filters, returnTimeSlot: slot })
    }
  }

  const handleOriginAirportsChange = (airportCodes: string[]) => {
    onChange({
      ...filters,
      originAirports: airportCodes.length === 0 ? undefined : airportCodes
    })
  }

  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const selectedOrigins = filters.originAirports || romanianAirports.map(a => a.code)

  return (
    <div className="space-y-8">
      {/* Origin Airports Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Aeroporturi de plecare
          </label>
          <button
            onClick={() => setShowOriginSelector(!showOriginSelector)}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {showOriginSelector ? 'Ascunde' : 'Personalizează'}
          </button>
        </div>
        
        {showOriginSelector ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {romanianAirports.map(airport => (
              <label key={airport.code} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrigins.includes(airport.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleOriginAirportsChange([...selectedOrigins, airport.code])
                    } else {
                      handleOriginAirportsChange(selectedOrigins.filter(code => code !== airport.code))
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {airport.code} - {airport.city}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Selectate: {selectedOrigins.length} aeroporturi din România
            {selectedOrigins.length < romanianAirports.length && (
              <span className="ml-2 text-primary-600">
                ({selectedOrigins.map(code => romanianAirports.find(a => a.code === code)?.city).join(', ')})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Departure Day Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Ziua preferată de plecare (±1 zi)
        </label>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day.value}
              onClick={() => handleDepartureDayChange(day.value)}
              disabled={loading}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedDepartureDay === day.value
                  ? 'bg-primary-600 text-white'
                  : filters.departureDays.includes(day.value)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              <div className="font-medium">{day.short}</div>
              <div className="text-xs mt-1">{day.label}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Zilele selectate: {filters.departureDays.map(day => 
            DAYS_OF_WEEK.find(d => d.value === day)?.label
          ).join(', ')}
        </div>
      </div>

      {/* Return Day Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Ziua preferată de întoarcere (±1 zi)
        </label>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day.value}
              onClick={() => handleReturnDayChange(day.value)}
              disabled={loading}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedReturnDay === day.value
                  ? 'bg-green-600 text-white'
                  : filters.returnDays.includes(day.value)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              <div className="font-medium">{day.short}</div>
              <div className="text-xs mt-1">{day.label}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Zilele selectate: {filters.returnDays.map(day => 
            DAYS_OF_WEEK.find(d => d.value === day)?.label
          ).join(', ')}
        </div>
      </div>

      {/* Time Slots */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Departure Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Interval preferat pentru plecare
          </label>
          <div className="space-y-2">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot.value}
                onClick={() => handleTimeSlotChange('departure', slot.value)}
                disabled={loading}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  filters.departureTimeSlot === slot.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center">
                      <span className="mr-2">{slot.icon}</span>
                      {slot.label}
                    </div>
                    <div className="text-sm opacity-75">{slot.time}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Return Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Interval preferat pentru întoarcere
          </label>
          <div className="space-y-2">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot.value}
                onClick={() => handleTimeSlotChange('return', slot.value)}
                disabled={loading}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  filters.returnTimeSlot === slot.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center">
                      <span className="mr-2">{slot.icon}</span>
                      {slot.label}
                    </div>
                    <div className="text-sm opacity-75">{slot.time}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
          <Search className="h-4 w-4 mr-2" />
          Rezumatul căutării
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p>
            <strong>Plecare:</strong> {filters.departureDays.map(day => 
              DAYS_OF_WEEK.find(d => d.value === day)?.label
            ).join(', ')} - {TIME_SLOTS.find(s => s.value === filters.departureTimeSlot)?.label}
          </p>
          <p>
            <strong>Întoarcere:</strong> {filters.returnDays.map(day => 
              DAYS_OF_WEEK.find(d => d.value === day)?.label
            ).join(', ')} - {TIME_SLOTS.find(s => s.value === filters.returnTimeSlot)?.label}
          </p>
          <p>
            <strong>Aeroporturi:</strong> {selectedOrigins.length} selectate din România
          </p>
        </div>
      </div>
    </div>
  )
}