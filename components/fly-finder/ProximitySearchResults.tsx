'use client'

import React from 'react'
import { MapPin, Clock, Navigation, Plane, AlertCircle, CheckCircle } from 'lucide-react'
import { ProximityResult, AirportWithDistance, formatDrivingTime, formatDistance } from '@/lib/proximity'

// Capitalize each word in a string
function capitalizeWords(str: string): string {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

// Format message with capitalized city name
function formatMessage(message: string | undefined): string {
  if (!message) return ''
  // Match "în apropiere de CITY" pattern and capitalize the city
  return message.replace(/în apropiere de ([^.]+)/gi, (match, city) => 
    `în apropiere de ${capitalizeWords(city.trim())}`
  )
}

// Animated car SVG component
function AnimatedCar() {
  return (
    <div className="relative w-full h-8 overflow-hidden">
      {/* Road */}
      <div className="absolute bottom-1 left-0 right-0 h-1 bg-gray-300 rounded-full" />
      
      {/* Animated car */}
      <svg 
        className="absolute bottom-2 animate-drive" 
        width="32" 
        height="20" 
        viewBox="0 0 32 20"
        style={{
          animation: 'drive 2s ease-in-out infinite',
        }}
      >
        {/* Car body */}
        <rect x="2" y="8" width="28" height="8" rx="2" fill="#3B82F6" />
        {/* Car top */}
        <path d="M8 8 L12 2 L22 2 L26 8" fill="#3B82F6" />
        {/* Windows */}
        <path d="M10 7 L13 3 L21 3 L24 7" fill="#93C5FD" />
        {/* Wheels */}
        <circle cx="8" cy="16" r="3" fill="#1F2937" />
        <circle cx="24" cy="16" r="3" fill="#1F2937" />
        {/* Wheel centers */}
        <circle cx="8" cy="16" r="1.5" fill="#6B7280" />
        <circle cx="24" cy="16" r="1.5" fill="#6B7280" />
        {/* Headlight */}
        <rect x="28" y="10" width="2" height="3" rx="1" fill="#FCD34D" />
      </svg>
      
      <style jsx>{`
        @keyframes drive {
          0% { left: -10%; }
          100% { left: 100%; }
        }
        .animate-drive {
          animation: drive 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

interface ProximitySearchResultsProps {
  result: ProximityResult | null
  isSearching: boolean
  isCalculatingRoutes: boolean
  error: string | null
  onSelectDestination?: (airportCode: string, cityName: string) => void
}

export function ProximitySearchResults({
  result,
  isSearching,
  isCalculatingRoutes,
  error,
  onSelectDestination
}: ProximitySearchResultsProps) {
  // Loading state
  if (isSearching) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
        <div className="flex flex-col items-center space-y-2">
          <AnimatedCar />
          <span className="text-blue-700 font-medium text-sm">
            {isCalculatingRoutes ? 'Calculăm traseul rutier...' : 'Căutăm locația...'}
          </span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    )
  }

  // No result
  if (!result) {
    return null
  }

  // Direct flights available
  if (result.hasDirectFlights && result.nearbyAirports.length > 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-3">
        <div className="flex items-center space-x-3 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700 font-medium">{result.message}</span>
        </div>
        <div className="space-y-2">
          {result.nearbyAirports.map((airport) => (
            <button
              key={airport.code}
              onClick={() => onSelectDestination?.(airport.code, airport.city)}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plane className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{airport.city}</div>
                  <div className="text-sm text-gray-500">{airport.code} • {airport.country}</div>
                </div>
              </div>
              <div className="text-green-600 font-medium text-sm">
                Zbor direct →
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // No nearby airports found
  if (result.nearbyAirports.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <span className="text-amber-700 font-medium block">{result.message}</span>
            <span className="text-amber-600 text-sm mt-1 block">
              Încearcă să cauți un oraș mai mare din apropiere sau verifică ortografia.
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Nearby airports found
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
      <div className="flex items-center space-x-3 mb-3">
        <MapPin className="h-5 w-5 text-blue-600" />
        <span className="text-blue-700 font-medium">{formatMessage(result.message)}</span>
      </div>
      
      <div className="space-y-2">
        {result.nearbyAirports.map((airport, index) => (
          <button
            key={airport.code}
            onClick={() => onSelectDestination?.(airport.code, airport.city)}
            className="w-full flex flex-col p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <span className={`font-bold text-sm ${
                    index === 0 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {airport.code}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{airport.city}</div>
                  <div className="text-sm text-gray-500">{airport.country}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  {/* Driving time */}
                  {airport.drivingTimeSeconds && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {formatDrivingTime(airport.drivingTimeSeconds)}
                      </span>
                    </div>
                  )}
                  
                  {/* Distance */}
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Navigation className="h-4 w-4" />
                    <span className="text-sm">
                      {formatDistance(airport.drivingDistanceKm || airport.distanceKm)}
                    </span>
                  </div>
                </div>
                
                {index === 0 && (
                  <div className="text-xs text-blue-500 mt-1">Cel mai apropiat</div>
                )}
              </div>
            </div>
            
            {/* Flight info - shown directly without expanding */}
            {airport.flightInfo && airport.flightInfo.flightCount > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Origin cities */}
                  <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Plane className="h-3 w-3" />
                    <span>din {airport.flightInfo.originCities.slice(0, 2).join(', ')}</span>
                    {airport.flightInfo.originCities.length > 2 && (
                      <span className="text-green-500">+{airport.flightInfo.originCities.length - 2}</span>
                    )}
                  </div>
                  
                  {/* Airlines */}
                  <div className="flex items-center space-x-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    <span>{airport.flightInfo.airlines.slice(0, 2).join(', ')}</span>
                    {airport.flightInfo.airlines.length > 2 && (
                      <span className="text-purple-500">+{airport.flightInfo.airlines.length - 2}</span>
                    )}
                  </div>
                  
                  {/* Days */}
                  {airport.flightInfo.days.length > 0 && (
                    <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <span>{airport.flightInfo.days.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-blue-600 flex items-center space-x-1">
        <Navigation className="h-3 w-3" />
        <span>Distanțele sunt calculate pe traseu rutier</span>
      </div>
    </div>
  )
}
