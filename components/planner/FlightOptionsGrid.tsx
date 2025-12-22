'use client'

import { useState } from 'react'
import { MapPin, Plane, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { FlightOption, FlightMatch } from '@/lib/flightPlannerService'
import { getCityName } from '@/lib/airports'
import { AirlineLogo } from '@/components/ui/AirlineLogo'

interface FlightOptionsGridProps {
  options: FlightOption[]
}

export function FlightOptionsGrid({ options }: FlightOptionsGridProps) {
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set())

  const toggleExpanded = (uniqueKey: string) => {
    const newExpanded = new Set(expandedOptions)
    if (newExpanded.has(uniqueKey)) {
      newExpanded.delete(uniqueKey)
    } else {
      newExpanded.add(uniqueKey)
    }
    setExpandedOptions(newExpanded)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDay = (dateString: string) => {
    const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
    return days[new Date(dateString).getDay()]
  }

  const getTimeSlotIcon = (timeSlot: string) => {
    switch (timeSlot) {
      case 'morning': return '🌅'
      case 'afternoon': return '☀️'
      case 'evening': return '🌙'
      default: return '⏰'
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('on-time') || statusLower.includes('scheduled')) {
      return 'text-green-700 bg-green-100'
    }
    if (statusLower.includes('delayed')) {
      return 'text-yellow-700 bg-yellow-100'
    }
    if (statusLower.includes('cancelled')) {
      return 'text-red-700 bg-red-100'
    }
    return 'text-gray-700 bg-gray-100'
  }

  const FlightCard = ({ flight, type }: { flight: FlightMatch, type: 'outbound' | 'return' }) => (
    <div className={`p-4 rounded-lg border ${
      type === 'outbound' 
        ? 'border-blue-200 bg-blue-50/30' 
        : 'border-green-200 bg-green-50/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <AirlineLogo 
            airlineCode={flight.airline.code} 
            airlineName={flight.airline.name}
            size="sm"
          />
          <div>
            <span className="font-bold text-lg">{flight.flightNumber}</span>
            <div className="text-sm text-gray-600">
              {flight.airline.name}
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
          {flight.status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {flight.origin.city} → {flight.destination.city}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{getTimeSlotIcon(flight.timeSlot)}</span>
            <span>{flight.timeSlot === 'morning' ? 'Dimineața' : flight.timeSlot === 'afternoon' ? 'Amiaza' : 'Seara'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{formatTime(flight.scheduledTime)}</span>
            <span className="text-sm text-gray-500">
              ({formatDay(flight.scheduledTime)})
            </span>
          </div>
          {(flight.gate || flight.terminal) && (
            <div className="text-sm text-gray-600">
              {flight.terminal && `Terminal ${flight.terminal}`}
              {flight.gate && ` • Poarta ${flight.gate}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {options.map((option, index) => {
        const uniqueKey = `${option.destination.city}-${option.destination.code || 'unknown'}-${index}`
        const isExpanded = expandedOptions.has(uniqueKey)
        
        return (
          <div key={uniqueKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Destination Header */}
            <div 
              className="p-4 md:p-6 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(uniqueKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm">
                      {option.destination.code}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">
                      {getCityName(option.destination.code) !== option.destination.code 
                        ? getCityName(option.destination.code) 
                        : option.destination.city}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      {option.destination.name !== option.destination.city 
                        ? option.destination.name 
                        : `Aeroport ${option.destination.city}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 md:mt-2 text-xs md:text-sm text-gray-500">
                      <span className="flex items-center">
                        <Plane className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        {option.outboundFlights.length} plecare
                      </span>
                      <span className="flex items-center">
                        <Plane className="h-3 w-3 md:h-4 md:w-4 mr-1 transform rotate-180" />
                        {option.returnFlights.length} întoarcere
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg md:text-2xl font-bold text-blue-600">
                      {option.totalOptions}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      opțiuni
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Flight Details */}
            {isExpanded && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Outbound Flights */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Plane className="h-5 w-5 mr-2 text-blue-600" />
                      Zboruri de plecare ({option.outboundFlights.length})
                    </h4>
                    <div className="space-y-3">
                      {option.outboundFlights.slice(0, 5).map((flight, index) => (
                        <FlightCard key={`${flight.flightNumber}-${index}`} flight={flight} type="outbound" />
                      ))}
                      {option.outboundFlights.length > 5 && (
                        <div className="text-center py-2 text-sm text-gray-500">
                          ... și încă {option.outboundFlights.length - 5} zboruri
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Return Flights */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Plane className="h-5 w-5 mr-2 text-green-600 transform rotate-180" />
                      Zboruri de întoarcere ({option.returnFlights.length})
                    </h4>
                    {option.returnFlights.length > 0 ? (
                      <div className="space-y-3">
                        {option.returnFlights.slice(0, 5).map((flight, index) => (
                          <FlightCard key={`${flight.flightNumber}-${index}`} flight={flight} type="return" />
                        ))}
                        {option.returnFlights.length > 5 && (
                          <div className="text-center py-2 text-sm text-gray-500">
                            ... și încă {option.returnFlights.length - 5} zboruri
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nu am găsit zboruri de întoarcere pentru preferințele tale</p>
                        <p className="text-sm mt-1">Încearcă să modifici zilele sau intervalele orare</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <strong>Combinații dus-întors:</strong> {option.outboundFlights.length} plecare × {option.returnFlights.length} întoarcere = {option.totalOptions} opțiuni
                    </div>
                    <div className="flex space-x-3">
                      <a
                        href={`/aeroport/${option.destination.city.toLowerCase().replace(/\s+/g, '-')}-${option.destination.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Vezi aeroportul</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}