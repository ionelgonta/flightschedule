'use client'

import { useState } from 'react'
import { MapPin, Plane, Clock, Calendar, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { FlightOption, FlightMatch } from '@/lib/flightPlannerService'

interface FlightOptionsGridProps {
  options: FlightOption[]
}

export function FlightOptionsGrid({ options }: FlightOptionsGridProps) {
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set())

  const toggleExpanded = (destinationCode: string) => {
    const newExpanded = new Set(expandedOptions)
    if (newExpanded.has(destinationCode)) {
      newExpanded.delete(destinationCode)
    } else {
      newExpanded.add(destinationCode)
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
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
    }
    if (statusLower.includes('delayed')) {
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
    }
    if (statusLower.includes('cancelled')) {
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    }
    return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
  }

  const FlightCard = ({ flight, type }: { flight: FlightMatch, type: 'outbound' | 'return' }) => (
    <div className={`p-4 rounded-lg border-2 ${
      type === 'outbound' 
        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
        : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">{flight.flightNumber}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {flight.airline.name}
          </span>
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
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
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
            <div className="text-sm text-gray-600 dark:text-gray-400">
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
      {options.map((option) => {
        const isExpanded = expandedOptions.has(option.destination.code)
        
        return (
          <div key={option.destination.code} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Destination Header */}
            <div 
              className="p-6 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              onClick={() => toggleExpanded(option.destination.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {option.destination.code}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {option.destination.city}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {option.destination.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Plane className="h-4 w-4 mr-1" />
                        {option.outboundFlights.length} zboruri plecare
                      </span>
                      <span className="flex items-center">
                        <Plane className="h-4 w-4 mr-1 transform rotate-180" />
                        {option.returnFlights.length} zboruri întoarcere
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {option.totalOptions} combinații
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {option.totalOptions}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      opțiuni totale
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
              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Outbound Flights */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Plane className="h-5 w-5 mr-2 text-blue-600" />
                      Zboruri de plecare ({option.outboundFlights.length})
                    </h4>
                    <div className="space-y-3">
                      {option.outboundFlights.slice(0, 5).map((flight, index) => (
                        <FlightCard key={`${flight.flightNumber}-${index}`} flight={flight} type="outbound" />
                      ))}
                      {option.outboundFlights.length > 5 && (
                        <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                          ... și încă {option.outboundFlights.length - 5} zboruri
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Return Flights */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Plane className="h-5 w-5 mr-2 text-green-600 transform rotate-180" />
                      Zboruri de întoarcere ({option.returnFlights.length})
                    </h4>
                    {option.returnFlights.length > 0 ? (
                      <div className="space-y-3">
                        {option.returnFlights.slice(0, 5).map((flight, index) => (
                          <FlightCard key={`${flight.flightNumber}-${index}`} flight={flight} type="return" />
                        ))}
                        {option.returnFlights.length > 5 && (
                          <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                            ... și încă {option.returnFlights.length - 5} zboruri
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nu am găsit zboruri de întoarcere pentru preferințele tale</p>
                        <p className="text-sm mt-1">Încearcă să modifici zilele sau intervalele orare</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Combinații posibile:</strong> {option.outboundFlights.length} plecare × {Math.max(1, option.returnFlights.length)} întoarcere = {option.totalOptions} opțiuni
                    </div>
                    <div className="flex space-x-3">
                      <a
                        href={`/aeroport/${option.destination.city.toLowerCase().replace(/\s+/g, '-')}-${option.destination.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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