'use client'

import { useState, useEffect } from 'react'
import { RawFlightData } from '@/lib/flightApiService'
import { getAirlineName } from '@/lib/airlineMapping'
import { AirlineLogo } from '@/components/ui/AirlineLogo'
import { Plane } from 'lucide-react'

interface SimpleFlightListProps {
  airportCode: string
  type: 'arrivals' | 'departures'
}

// Status badge cu suport pentru dark mode
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    scheduled: { label: 'Programat', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: '🕐' },
    active: { label: 'În Zbor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: '✈️' },
    landed: { label: 'Aterizat', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: '🛬' },
    arrived: { label: 'Sosit', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: '✅' },
    cancelled: { label: 'Anulat', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: '❌' },
    delayed: { label: 'Întârziat', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: '⏰' },
    estimated: { label: 'Estimat', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400', icon: '📊' },
    boarding: { label: 'Îmbarcare', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', icon: '🚪' },
    departed: { label: 'Plecat', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: '🛫' },
    gate_closed: { label: 'Poartă închisă', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: '🚪' },
    taxiing: { label: 'La sol', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: '🚕' },
    in_flight: { label: 'În zbor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: '✈️' },
    unknown: { label: 'Necunoscut', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: '❓' }
  };

  const config = statusMap[status.toLowerCase()] || statusMap.unknown;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

const formatTime = (timeString: string) => {
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('ro-RO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return timeString;
  }
};

export default function SimpleFlightList({ airportCode, type }: SimpleFlightListProps) {
  const [flights, setFlights] = useState<RawFlightData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true)
        
        // Calculează intervalul de timp: 7 zile în urmă + toate din viitor
        // (pentru a include zborurile din 18 decembrie)
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000))
        
        // Construiește URL cu filtrele de timp
        const url = new URL(`/api/flights/${airportCode}/${type}`, window.location.origin)
        url.searchParams.set('start_time', sevenDaysAgo.toISOString())
        url.searchParams.set('end_time', tomorrow.toISOString())
        
        const response = await fetch(url.toString())
        const data = await response.json()
        
        if (data.success && data.data) {
          setFlights(data.data)
          setError(null)
        } else {
          setError('Nu am putut încărca datele zborurilor')
        }
      } catch (err) {
        console.error('Error fetching flights:', err)
        setError('Eroare la încărcarea datelor')
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [airportCode, type])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && flights.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 text-center">
        <Plane className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
          Eroare la încărcarea datelor
        </h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (flights.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-8 text-center">
        <Plane className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-2">
          Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
        </h3>
        <p className="text-blue-700 dark:text-blue-300">
          Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header cu statistici */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-400">
              {flights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Ultimele 7 zile + programate
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {type === 'arrivals' ? 'Din' : 'Spre'}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Companie
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                Ora
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {flights.slice(0, 50).map((flight, index) => {
              const location = type === 'arrivals' ? flight.origin : flight.destination;
              
              if (!location?.city) return null;

              return (
                <tr key={`${flight.flight_number}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                        <Plane className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {location.city}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {flight.flight_number}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {location.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <AirlineLogo 
                        airlineCode={flight.airline?.code || 'XX'} 
                        size="sm"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getAirlineName(flight.airline?.code || 'XX')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {flight.airline?.code || 'XX'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 text-center">
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                      {formatTime(flight.scheduled_time)}
                    </div>
                    {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Est: {formatTime(flight.estimated_time)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    {getStatusBadge(flight.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {flights.slice(0, 50).map((flight, index) => {
          const location = type === 'arrivals' ? flight.origin : flight.destination;
          
          if (!location?.city) return null;
          
          return (
            <div
              key={`${flight.flight_number}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                      {location.city}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {location.code}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {formatTime(flight.scheduled_time)}
                  </div>
                  {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Est: {formatTime(flight.estimated_time)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <AirlineLogo 
                    airlineCode={flight.airline?.code || 'XX'} 
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {getAirlineName(flight.airline?.code || 'XX')}
                    </div>
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      {flight.flight_number}
                    </div>
                  </div>
                </div>
                
                <div>
                  {getStatusBadge(flight.status)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}