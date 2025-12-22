'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Search, Plus, Minus, Plane, TrendingUp } from 'lucide-react'
// Local type definition to avoid importing server-side code
interface Filters {
  departureDays: string[]
  returnDays: string[]
  departureTimeSlot: 'morning' | 'afternoon' | 'evening'
  returnTimeSlot: 'morning' | 'afternoon' | 'evening'
  departureDayFlexibility?: number
  returnDayFlexibility?: number
  originAirports?: string[]
}
import { MAJOR_AIRPORTS } from '@/lib/airports'
import { getCityName } from '@/lib/airports'

interface FlightPlannerFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  loading: boolean
  showAdvanced?: boolean
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

export function FlightPlannerFilters({ filters, onChange, loading, showAdvanced = false }: FlightPlannerFiltersProps) {
  const [selectedDepartureDay, setSelectedDepartureDay] = useState(filters.departureDays[0] || 'monday')
  const [selectedReturnDay, setSelectedReturnDay] = useState(filters.returnDays[0] || 'sunday')
  const [cityStats, setCityStats] = useState({ flights: 0, destinations: 0 })

  // Define selectedOrigins before useEffect that uses it
  const selectedOrigins = filters.originAirports || ['RMO']

  // Fetch city-specific stats when origin changes
  useEffect(() => {
    const fetchCityStats = async () => {
      const selectedCity = selectedOrigins[0] || 'RMO'
      try {
        const response = await fetch(`/api/flights/${selectedCity}/departures`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const destinations = new Set(data.data.map((flight: any) => 
            flight.destination?.city || flight.destination?.code || ''
          ).filter(Boolean))
          
          setCityStats({
            flights: data.data.length,
            destinations: destinations.size
          })
        }
      } catch (error) {
        console.error('Error fetching city stats:', error)
      }
    }
    
    fetchCityStats()
  }, [selectedOrigins[0]])

  const getExpandedDays = (day: string, flexibility: number): string[] => {
    const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === day)
    if (dayIndex === -1) return [day]

    const days = []
    for (let i = -flexibility; i <= flexibility; i++) {
      const targetIndex = (dayIndex + i + 7) % 7
      days.push(DAYS_OF_WEEK[targetIndex].value)
    }
    return days
  }

  const handleDepartureDayChange = (day: string) => {
    setSelectedDepartureDay(day)
    const expandedDays = getExpandedDays(day, filters.departureDayFlexibility || 0)
    onChange({
      ...filters,
      departureDays: expandedDays
    })
  }

  const handleReturnDayChange = (day: string) => {
    setSelectedReturnDay(day)
    const expandedDays = getExpandedDays(day, filters.returnDayFlexibility || 0)
    onChange({
      ...filters,
      returnDays: expandedDays
    })
  }

  const handleDepartureFlexibilityChange = (flexibility: number) => {
    const expandedDays = getExpandedDays(selectedDepartureDay, flexibility)
    onChange({
      ...filters,
      departureDayFlexibility: flexibility,
      departureDays: expandedDays
    })
  }

  const handleReturnFlexibilityChange = (flexibility: number) => {
    const expandedDays = getExpandedDays(selectedReturnDay, flexibility)
    onChange({
      ...filters,
      returnDayFlexibility: flexibility,
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

  const allAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România' || a.country === 'Moldova')

  if (!showAdvanced) {
    // Simple Mode - Material Design M3 with Enhanced UX
    return (
      <div className="space-y-8">
        {/* Origin Airport - Simple */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Plecare din
            </label>
            <select
              value={selectedOrigins[0] || 'RMO'}
              onChange={(e) => handleOriginAirportsChange([e.target.value])}
              className="w-full p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            >
              {allAirports.map(airport => {
                const cityName = getCityName(airport.code)
                const airportName = airport.code === 'OTP' ? 'Henri Coandă' : 
                                  airport.code === 'BBU' ? 'Aurel Vlaicu' :
                                  airport.code === 'RMO' ? 'Chișinău' : airport.name
                return (
                  <option key={airport.code} value={airport.code}>
                    {cityName} - {airport.code} {airportName !== cityName ? `(${airportName})` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Exemplu căutare
            </label>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                <strong>{DAYS_OF_WEEK.find(d => d.value === selectedDepartureDay)?.label}</strong> încolo, 
                <strong> {DAYS_OF_WEEK.find(d => d.value === selectedReturnDay)?.label}</strong> înapoi
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Din {getCityName(selectedOrigins[0] || 'RMO')} ce destinații sunt disponibile?
              </p>
              {((filters.departureDayFlexibility || 0) > 0 || (filters.returnDayFlexibility || 0) > 0) && (
                <p className="text-xs text-purple-600 dark:text-purple-300 mt-2 font-medium">
                  Flexibilitate: ±{filters.departureDayFlexibility || 0} plecare, ±{filters.returnDayFlexibility || 0} întoarcere
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Day Selection with Flexibility */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Departure Day with Simple Flexibility */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <Plane className="h-5 w-5 mr-2 rotate-45" />
              Ziua de plecare
            </label>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDepartureDayChange(day.value)}
                  disabled={loading}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedDepartureDay === day.value
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : filters.departureDays.includes(day.value)
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105'
                  } disabled:opacity-50`}
                >
                  <div className="font-bold text-sm">{day.short}</div>
                  <div className="text-xs mt-1">{day.label.slice(0, 3)}</div>
                </button>
              ))}
            </div>
            
            {/* Simple Flexibility Control */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Flexibilitate: ±{filters.departureDayFlexibility || 0} zile
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDepartureFlexibilityChange(Math.max(0, (filters.departureDayFlexibility || 0) - 1))}
                  disabled={loading || (filters.departureDayFlexibility || 0) === 0}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold text-blue-900 dark:text-blue-100">
                  {filters.departureDayFlexibility || 0}
                </span>
                <button
                  onClick={() => handleDepartureFlexibilityChange(Math.min(3, (filters.departureDayFlexibility || 0) + 1))}
                  disabled={loading || (filters.departureDayFlexibility || 0) === 3}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {filters.departureDays.length > 1 && (
              <div className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                Zilele incluse: {filters.departureDays.map(day => 
                  DAYS_OF_WEEK.find(d => d.value === day)?.short
                ).join(', ')}
              </div>
            )}
          </div>

          {/* Return Day with Simple Flexibility */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <label className="block text-sm font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
              <Plane className="h-5 w-5 mr-2 -rotate-45" />
              Ziua de întoarcere
            </label>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleReturnDayChange(day.value)}
                  disabled={loading}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedReturnDay === day.value
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : filters.returnDays.includes(day.value)
                      ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105'
                  } disabled:opacity-50`}
                >
                  <div className="font-bold text-sm">{day.short}</div>
                  <div className="text-xs mt-1">{day.label.slice(0, 3)}</div>
                </button>
              ))}
            </div>
            
            {/* Simple Flexibility Control */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Flexibilitate: ±{filters.returnDayFlexibility || 0} zile
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleReturnFlexibilityChange(Math.max(0, (filters.returnDayFlexibility || 0) - 1))}
                  disabled={loading || (filters.returnDayFlexibility || 0) === 0}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold text-green-900 dark:text-green-100">
                  {filters.returnDayFlexibility || 0}
                </span>
                <button
                  onClick={() => handleReturnFlexibilityChange(Math.min(3, (filters.returnDayFlexibility || 0) + 1))}
                  disabled={loading || (filters.returnDayFlexibility || 0) === 3}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {filters.returnDays.length > 1 && (
              <div className="text-xs text-green-800 dark:text-green-200 mt-2">
                Zilele incluse: {filters.returnDays.map(day => 
                  DAYS_OF_WEEK.find(d => d.value === day)?.short
                ).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Time Preferences - Compact Dropdowns */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Departure Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Interval plecare
            </label>
            <select
              value={filters.departureTimeSlot}
              onChange={(e) => handleTimeSlotChange('departure', e.target.value as 'morning' | 'afternoon' | 'evening')}
              disabled={loading}
              className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            >
              {TIME_SLOTS.map(slot => (
                <option key={slot.value} value={slot.value}>
                  {slot.icon} {slot.label} ({slot.time})
                </option>
              ))}
            </select>
          </div>

          {/* Return Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Interval întoarcere
            </label>
            <select
              value={filters.returnTimeSlot}
              onChange={(e) => handleTimeSlotChange('return', e.target.value as 'morning' | 'afternoon' | 'evening')}
              disabled={loading}
              className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
            >
              {TIME_SLOTS.map(slot => (
                <option key={slot.value} value={slot.value}>
                  {slot.icon} {slot.label} ({slot.time})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button with City Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onChange(filters)}
            disabled={loading}
            className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Căutare în curs...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-3" />
                Caută Zboruri
              </>
            )}
          </button>
          
          {/* Compact City Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <Plane className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-gray-600 dark:text-gray-400">Zboruri din {getCityName(selectedOrigins[0] || 'RMO')}:</span>
              <span className="font-bold text-gray-900 dark:text-white">{cityStats.flights}</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-600 dark:text-gray-400">Destinații:</span>
              <span className="font-bold text-gray-900 dark:text-white">{cityStats.destinations}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Advanced Mode - Full functionality
  return (
    <div className="space-y-8">
      {/* Origin Airports Selection - Advanced */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Aeroporturi de plecare
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allAirports.map(airport => (
            <label key={airport.code} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-bold text-base text-gray-900 dark:text-white">{getCityName(airport.code)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {airport.code} {airport.code === 'OTP' ? '- Henri Coandă' : 
                                 airport.code === 'BBU' ? '- Aurel Vlaicu' : 
                                 airport.code === 'RMO' ? '- Chișinău' : ''}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Day Selection with Flexibility */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Departure Day with Flexibility */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            <Plane className="h-5 w-5 mr-2 rotate-45" />
            Plecare - Ziua preferată
          </label>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                onClick={() => handleDepartureDayChange(day.value)}
                disabled={loading}
                className={`p-2 rounded-lg text-center transition-all text-xs ${
                  selectedDepartureDay === day.value
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : filters.departureDays.includes(day.value)
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                } disabled:opacity-50`}
              >
                <div className="font-bold">{day.short}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Flexibilitate: ±{filters.departureDayFlexibility || 0} zile
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDepartureFlexibilityChange(Math.max(0, (filters.departureDayFlexibility || 0) - 1))}
                disabled={loading || (filters.departureDayFlexibility || 0) === 0}
                className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-blue-900 dark:text-blue-100">
                {filters.departureDayFlexibility || 0}
              </span>
              <button
                onClick={() => handleDepartureFlexibilityChange(Math.min(3, (filters.departureDayFlexibility || 0) + 1))}
                disabled={loading || (filters.departureDayFlexibility || 0) === 3}
                className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-blue-800 dark:text-blue-200">
            Zilele selectate: {filters.departureDays.map(day => 
              DAYS_OF_WEEK.find(d => d.value === day)?.short
            ).join(', ')}
          </div>
        </div>

        {/* Return Day with Flexibility */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
          <label className="block text-sm font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
            <Plane className="h-5 w-5 mr-2 -rotate-45" />
            Întoarcere - Ziua preferată
          </label>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                onClick={() => handleReturnDayChange(day.value)}
                disabled={loading}
                className={`p-2 rounded-lg text-center transition-all text-xs ${
                  selectedReturnDay === day.value
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : filters.returnDays.includes(day.value)
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                } disabled:opacity-50`}
              >
                <div className="font-bold">{day.short}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Flexibilitate: ±{filters.returnDayFlexibility || 0} zile
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleReturnFlexibilityChange(Math.max(0, (filters.returnDayFlexibility || 0) - 1))}
                disabled={loading || (filters.returnDayFlexibility || 0) === 0}
                className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-green-900 dark:text-green-100">
                {filters.returnDayFlexibility || 0}
              </span>
              <button
                onClick={() => handleReturnFlexibilityChange(Math.min(3, (filters.returnDayFlexibility || 0) + 1))}
                disabled={loading || (filters.returnDayFlexibility || 0) === 3}
                className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-green-800 dark:text-green-200">
            Zilele selectate: {filters.returnDays.map(day => 
              DAYS_OF_WEEK.find(d => d.value === day)?.short
            ).join(', ')}
          </div>
        </div>
      </div>

      {/* Time Slots - Advanced */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Departure Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Interval preferat pentru plecare
          </label>
          <div className="space-y-3">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot.value}
                onClick={() => handleTimeSlotChange('departure', slot.value)}
                disabled={loading}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  filters.departureTimeSlot === slot.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-4">{slot.icon}</span>
                  <div>
                    <div className="font-semibold">{slot.label}</div>
                    <div className="text-sm opacity-75">{slot.time}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Return Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Interval preferat pentru întoarcere
          </label>
          <div className="space-y-3">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot.value}
                onClick={() => handleTimeSlotChange('return', slot.value)}
                disabled={loading}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  filters.returnTimeSlot === slot.value
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-4">{slot.icon}</span>
                  <div>
                    <div className="font-semibold">{slot.label}</div>
                    <div className="text-sm opacity-75">{slot.time}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Summary - Advanced */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Rezumatul căutării avansate
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-purple-800 dark:text-purple-200">
              <strong>🛫 Plecare:</strong> {DAYS_OF_WEEK.find(d => d.value === selectedDepartureDay)?.label} 
              {(filters.departureDayFlexibility || 0) > 0 && ` (±${filters.departureDayFlexibility} zile)`}
            </div>
            <div className="text-purple-700 dark:text-purple-300 text-xs">
              Zilele: {filters.departureDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')} • {TIME_SLOTS.find(s => s.value === filters.departureTimeSlot)?.label}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-purple-800 dark:text-purple-200">
              <strong>🛬 Întoarcere:</strong> {DAYS_OF_WEEK.find(d => d.value === selectedReturnDay)?.label}
              {(filters.returnDayFlexibility || 0) > 0 && ` (±${filters.returnDayFlexibility} zile)`}
            </div>
            <div className="text-purple-700 dark:text-purple-300 text-xs">
              Zilele: {filters.returnDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')} • {TIME_SLOTS.find(s => s.value === filters.returnTimeSlot)?.label}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
          <div className="text-purple-800 dark:text-purple-200 text-sm">
            <strong>📍 Aeroporturi:</strong> {selectedOrigins.map(code => getCityName(code)).join(', ')}
          </div>
        </div>
      </div>
    </div>
  )
}