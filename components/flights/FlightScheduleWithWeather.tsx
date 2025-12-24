'use client'

import { useState, useEffect } from 'react'
import WeatherAlert from '@/components/weather/WeatherAlert'
import WeatherWidget from '@/components/weather/WeatherWidget'

interface FlightData {
  flight_number: string
  airline: {
    name: string
    code: string
  }
  origin: {
    airport: string
    code: string
    city: string
  }
  destination: {
    airport: string
    code: string
    city: string
  }
  scheduled_time: string
  estimated_time?: string
  actual_time?: string
  status: string
  gate?: string
  terminal?: string
  delay?: number
}

interface WeatherInfo {
  city: string
  temperature: number
  feelsLike: number
  description: string
  icon: string
  windSpeed: number
  visibility: number
  flightImpact: {
    severity: 'none' | 'low' | 'moderate' | 'high' | 'severe'
    factors: string[]
    alertMessage?: string
    delayProbability: number
  }
  lastUpdated: string
}

interface FlightApiResponse {
  success: boolean
  data: FlightData[]
  error?: string
  cached: boolean
  last_updated?: string
  airport_code: string
  type: 'arrivals' | 'departures'
  weather_info?: WeatherInfo
  hasWeatherAlert?: boolean
}

interface FlightScheduleWithWeatherProps {
  airportCode: string
  type: 'arrivals' | 'departures'
  className?: string
}

export default function FlightScheduleWithWeather({ 
  airportCode, 
  type, 
  className = '' 
}: FlightScheduleWithWeatherProps) {
  const [flightData, setFlightData] = useState<FlightApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFlightData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/flights/${airportCode}/${type}`)
      const data = await response.json()

      setFlightData(data)

      if (!data.success && data.error) {
        setError(data.error)
      }
    } catch (err) {
      console.error('Error loading flight data:', err)
      setError('Eroare de rețea la încărcarea datelor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlightData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadFlightData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [airportCode, type])

  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--'
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return '--:--'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on time':
      case 'landed':
      case 'departed':
        return 'text-green-600 bg-green-50'
      case 'delayed':
        return 'text-orange-600 bg-orange-50'
      case 'cancelled':
      case 'canceled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'on time': 'La timp',
      'delayed': 'Întârziat',
      'cancelled': 'Anulat',
      'canceled': 'Anulat',
      'landed': 'Aterizat',
      'departed': 'Plecat',
      'boarding': 'Îmbarcare',
      'gate open': 'Poartă deschisă',
      'scheduled': 'Programat'
    }
    return statusMap[status.toLowerCase()] || status
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Weather Alert - Only show if there's a significant weather impact */}
      {flightData?.hasWeatherAlert && (
        <WeatherAlert airportCode={airportCode} />
      )}

      {/* Compact Weather Widget */}
      {flightData?.weather_info && (
        <WeatherWidget 
          city={flightData.weather_info.city} 
          compact={true}
          className="mb-4"
        />
      )}

      {/* Flight Schedule Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {type === 'arrivals' ? 'Sosiri' : 'Plecări'} - {airportCode}
          </h2>
          
          {flightData?.weather_info?.flightImpact && 
           flightData.weather_info.flightImpact.delayProbability > 0 && (
            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Risc întârzieri: {flightData.weather_info.flightImpact.delayProbability}%
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Flight List */}
        {flightData?.success && flightData.data.length > 0 ? (
          <div className="space-y-2">
            {flightData.data.slice(0, 10).map((flight, index) => (
              <div 
                key={`${flight.flight_number}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Flight Info */}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {flight.flight_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {flight.airline.name}
                    </div>
                  </div>

                  {/* Route */}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {type === 'arrivals' 
                        ? `${flight.origin.city} → ${flight.destination.city}`
                        : `${flight.origin.city} → ${flight.destination.city}`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {type === 'arrivals' ? flight.origin.code : flight.destination.code}
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(flight.scheduled_time)}
                    </div>
                    {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                      <div className="text-xs text-orange-600">
                        Est: {formatTime(flight.estimated_time)}
                      </div>
                    )}
                    {flight.actual_time && (
                      <div className="text-xs text-green-600">
                        Real: {formatTime(flight.actual_time)}
                      </div>
                    )}
                  </div>

                  {/* Status & Gate */}
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
                      {getStatusText(flight.status)}
                    </span>
                    {flight.gate && (
                      <div className="text-xs text-gray-600 mt-1">
                        Poarta {flight.gate}
                      </div>
                    )}
                    {flight.delay && flight.delay > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        +{flight.delay} min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {flightData?.success 
              ? 'Nu sunt zboruri programate în acest moment'
              : 'Datele nu sunt disponibile momentan'
            }
          </div>
        )}

        {/* Cache Info */}
        {flightData && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>
              {flightData.cached ? 'Date din cache' : 'Date live'} • 
              Actualizat: {flightData.last_updated ? 
                new Date(flightData.last_updated).toLocaleTimeString('ro-RO') : 
                'necunoscut'
              }
            </span>
            {flightData.weather_info && (
              <span>
                Meteo: {flightData.weather_info.lastUpdated ? 
                  new Date(flightData.weather_info.lastUpdated).toLocaleTimeString('ro-RO') : 
                  'necunoscut'
                }
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}