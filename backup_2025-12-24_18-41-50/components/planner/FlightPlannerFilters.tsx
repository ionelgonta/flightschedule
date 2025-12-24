'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Search, Plane, TrendingUp } from 'lucide-react'
// Local type definition to avoid importing server-side code
interface Filters {
  departureDays: string[]
  returnDays: string[]
  departureTimeSlots: ('morning' | 'afternoon' | 'evening')[]
  returnTimeSlots: ('morning' | 'afternoon' | 'evening')[]
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
  { value: 'monday', label: 'Luni', short: 'Lu' },
  { value: 'tuesday', label: 'Marți', short: 'Ma' },
  { value: 'wednesday', label: 'Miercuri', short: 'Mi' },
  { value: 'thursday', label: 'Joi', short: 'Jo' },
  { value: 'friday', label: 'Vineri', short: 'Vi' },
  { value: 'saturday', label: 'Sâmbătă', short: 'Sâ' },
  { value: 'sunday', label: 'Duminică', short: 'Du' }
]

const TIME_SLOTS = [
  { value: 'morning', label: 'Dimineața', time: '06:00 - 12:00', icon: '🌅' },
  { value: 'afternoon', label: 'Amiaza', time: '12:00 - 18:00', icon: '☀️' },
  { value: 'evening', label: 'Seara', time: '18:00 - 24:00', icon: '🌙' }
] as const

export function FlightPlannerFilters({ filters, onChange, loading, showAdvanced = false }: FlightPlannerFiltersProps) {
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

  const handleDayToggle = (type: 'departure' | 'return', day: string) => {
    if (type === 'departure') {
      const currentDays = filters.departureDays || ['monday']
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day]
      
      // Ensure at least one day is selected
      if (newDays.length === 0) return
      
      onChange({ ...filters, departureDays: newDays })
    } else {
      const currentDays = filters.returnDays || ['sunday']
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day]
      
      // Ensure at least one day is selected
      if (newDays.length === 0) return
      
      onChange({ ...filters, returnDays: newDays })
    }
  }

  const handleTimeSlotChange = (type: 'departure' | 'return', slot: 'morning' | 'afternoon' | 'evening') => {
    if (type === 'departure') {
      const currentSlots = filters.departureTimeSlots || ['morning']
      const newSlots = currentSlots.includes(slot)
        ? currentSlots.filter(s => s !== slot)
        : [...currentSlots, slot]
      
      // Ensure at least one slot is selected
      if (newSlots.length === 0) return
      
      onChange({ ...filters, departureTimeSlots: newSlots })
    } else {
      const currentSlots = filters.returnTimeSlots || ['evening']
      const newSlots = currentSlots.includes(slot)
        ? currentSlots.filter(s => s !== slot)
        : [...currentSlots, slot]
      
      // Ensure at least one slot is selected
      if (newSlots.length === 0) return
      
      onChange({ ...filters, returnTimeSlots: newSlots })
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
    // Simple Mode - Clean Light Design with Multiple Day Selection
    return (
      <div className="space-y-8">
        {/* Origin Airport - Simple */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Plecare din
            </label>
            <select
              value={selectedOrigins[0] || 'RMO'}
              onChange={(e) => handleOriginAirportsChange([e.target.value])}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Exemplu căutare
            </label>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-800">
                <strong>{filters.departureDays.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.short).join(', ')}</strong> încolo, 
                <strong> {filters.returnDays.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.short).join(', ')}</strong> înapoi
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Din {getCityName(selectedOrigins[0] || 'RMO')} ce destinații sunt disponibile?
              </p>
              <p className="text-xs text-purple-600 mt-2 font-medium">
                Intervale: {(filters.departureTimeSlots || ['morning']).map(slot => 
                  TIME_SLOTS.find(s => s.value === slot)?.label
                ).join(', ')} → {(filters.returnTimeSlots || ['evening']).map(slot => 
                  TIME_SLOTS.find(s => s.value === slot)?.label
                ).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Day Selection with Integrated Time Slots */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Departure Days with Time Slots */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <label className="block text-sm font-semibold text-blue-900 mb-4 flex items-center">
              <Plane className="h-5 w-5 mr-2 rotate-45" />
              Zilele de plecare
            </label>
            
            {/* Day Selection - Centered */}
            <div className="flex justify-center mb-6">
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => handleDayToggle('departure', day.value)}
                    disabled={loading}
                    className={`w-12 h-12 rounded-lg text-center transition-all ${
                      filters.departureDays.includes(day.value)
                        ? 'bg-blue-600 text-white shadow-md scale-105'
                        : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105'
                    } disabled:opacity-50 flex items-center justify-center`}
                  >
                    <div className="font-bold text-sm">{day.short}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Slots - Compact */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-blue-900 mb-2">Intervale orare:</div>
              {TIME_SLOTS.map(slot => (
                <label key={slot.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.departureTimeSlots || ['morning']).includes(slot.value)}
                    onChange={() => handleTimeSlotChange('departure', slot.value)}
                    disabled={loading}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                  <span className="text-lg">{slot.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                    <span className="text-xs text-gray-600 ml-2">{slot.time}</span>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-blue-800">
              Selectate: {filters.departureDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')} • {(filters.departureTimeSlots || ['morning']).map(slot => 
                TIME_SLOTS.find(s => s.value === slot)?.label
              ).join(', ')}
            </div>
          </div>

          {/* Return Days with Time Slots */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <label className="block text-sm font-semibold text-green-900 mb-4 flex items-center">
              <Plane className="h-5 w-5 mr-2 -rotate-45" />
              Zilele de întoarcere
            </label>
            
            {/* Day Selection - Centered */}
            <div className="flex justify-center mb-6">
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => handleDayToggle('return', day.value)}
                    disabled={loading}
                    className={`w-12 h-12 rounded-lg text-center transition-all ${
                      filters.returnDays.includes(day.value)
                        ? 'bg-green-600 text-white shadow-md scale-105'
                        : 'bg-white text-gray-700 hover:bg-green-100 hover:scale-105'
                    } disabled:opacity-50 flex items-center justify-center`}
                  >
                    <div className="font-bold text-sm">{day.short}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Slots - Compact */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-green-900 mb-2">Intervale orare:</div>
              {TIME_SLOTS.map(slot => (
                <label key={slot.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.returnTimeSlots || ['evening']).includes(slot.value)}
                    onChange={() => handleTimeSlotChange('return', slot.value)}
                    disabled={loading}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-3 h-3"
                  />
                  <span className="text-lg">{slot.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                    <span className="text-xs text-gray-600 ml-2">{slot.time}</span>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-green-800">
              Selectate: {filters.returnDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')} • {(filters.returnTimeSlots || ['evening']).map(slot => 
                TIME_SLOTS.find(s => s.value === slot)?.label
              ).join(', ')}
            </div>
          </div>
        </div>

        {/* Search Button with City Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onChange(filters)}
            disabled={loading}
            className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
              <Plane className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Zboruri din {getCityName(selectedOrigins[0] || 'RMO')}:</span>
              <span className="font-bold text-gray-900">{cityStats.flights}</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Destinații:</span>
              <span className="font-bold text-gray-900">{cityStats.destinations}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Advanced Mode - Clean Light Design with Multiple Day Selection
  return (
    <div className="space-y-8">
      {/* Origin Airports Selection - Advanced */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Aeroporturi de plecare
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allAirports.map(airport => (
            <label key={airport.code} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
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
                <div className="font-bold text-base text-gray-900">{getCityName(airport.code)}</div>
                <div className="text-xs text-gray-600">
                  {airport.code} {airport.code === 'OTP' ? '- Henri Coandă' : 
                                 airport.code === 'BBU' ? '- Aurel Vlaicu' : 
                                 airport.code === 'RMO' ? '- Chișinău' : ''}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Day Selection with Integrated Time Slots */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Departure Days with Time Slots */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <label className="block text-sm font-semibold text-blue-900 mb-4 flex items-center">
            <Plane className="h-5 w-5 mr-2 rotate-45" />
            Plecare - Zilele preferate
          </label>
          
          {/* Day Selection - Centered */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle('departure', day.value)}
                  disabled={loading}
                  className={`w-12 h-12 rounded-lg text-center transition-all ${
                    filters.departureDays.includes(day.value)
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-white text-gray-700 hover:bg-blue-100'
                  } disabled:opacity-50 flex items-center justify-center`}
                >
                  <div className="font-bold text-sm">{day.short}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots - Compact */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-blue-900 mb-2">Intervale orare:</div>
            {TIME_SLOTS.map(slot => (
              <label key={slot.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.departureTimeSlots || ['morning']).includes(slot.value)}
                  onChange={() => handleTimeSlotChange('departure', slot.value)}
                  disabled={loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span className="text-lg">{slot.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                  <span className="text-xs text-gray-600 ml-2">{slot.time}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-3 text-xs text-blue-800">
            Selectate: {filters.departureDays.map(day => 
              DAYS_OF_WEEK.find(d => d.value === day)?.short
            ).join(', ')} • {(filters.departureTimeSlots || ['morning']).map(slot => 
              TIME_SLOTS.find(s => s.value === slot)?.label
            ).join(', ')}
          </div>
        </div>

        {/* Return Days with Time Slots */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <label className="block text-sm font-semibold text-green-900 mb-4 flex items-center">
            <Plane className="h-5 w-5 mr-2 -rotate-45" />
            Întoarcere - Zilele preferate
          </label>
          
          {/* Day Selection - Centered */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle('return', day.value)}
                  disabled={loading}
                  className={`w-12 h-12 rounded-lg text-center transition-all ${
                    filters.returnDays.includes(day.value)
                      ? 'bg-green-600 text-white shadow-md scale-105'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  } disabled:opacity-50 flex items-center justify-center`}
                >
                  <div className="font-bold text-sm">{day.short}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots - Compact */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-900 mb-2">Intervale orare:</div>
            {TIME_SLOTS.map(slot => (
              <label key={slot.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.returnTimeSlots || ['evening']).includes(slot.value)}
                  onChange={() => handleTimeSlotChange('return', slot.value)}
                  disabled={loading}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-3 h-3"
                />
                <span className="text-lg">{slot.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                  <span className="text-xs text-gray-600 ml-2">{slot.time}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-3 text-xs text-green-800">
            Selectate: {filters.returnDays.map(day => 
              DAYS_OF_WEEK.find(d => d.value === day)?.short
            ).join(', ')} • {(filters.returnTimeSlots || ['evening']).map(slot => 
              TIME_SLOTS.find(s => s.value === slot)?.label
            ).join(', ')}
          </div>
        </div>
      </div>

      {/* Search Summary - Advanced */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Rezumatul căutării avansate
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-purple-800">
              <strong>🛫 Plecare:</strong> {filters.departureDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')}
            </div>
            <div className="text-purple-700 text-xs">
              Intervale: {(filters.departureTimeSlots || ['morning']).map(slot => 
                TIME_SLOTS.find(s => s.value === slot)?.label
              ).join(', ')}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-purple-800">
              <strong>🛬 Întoarcere:</strong> {filters.returnDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')}
            </div>
            <div className="text-purple-700 text-xs">
              Intervale: {(filters.returnTimeSlots || ['evening']).map(slot => 
                TIME_SLOTS.find(s => s.value === slot)?.label
              ).join(', ')}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="text-purple-800 text-sm">
            <strong>📍 Aeroporturi:</strong> {selectedOrigins.map(code => getCityName(code)).join(', ')}
          </div>
        </div>
      </div>
    </div>
  )
}