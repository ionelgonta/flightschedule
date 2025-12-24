'use client'

import { useState, useEffect } from 'react'
import { RawFlightData } from '@/lib/flightApiService'
import { getAirlineName } from '@/lib/airlineMapping'
import { AirlineLogo } from '@/components/ui/AirlineLogo'
import { Plane } from 'lucide-react'

interface ClientOnlyFlightListProps {
  airportCode: string
  type: 'arrivals' | 'departures'
  viewMode?: 'grouped' | 'list'
}

// Helper function pentru status badge cu design Material M3
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
    scheduled: { 
      label: 'Programat', 
      className: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 shadow-sm',
      icon: '🕐'
    },
    active: { 
      label: 'În Zbor', 
      className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm animate-pulse',
      icon: '✈️'
    },
    landed: { 
      label: 'Aterizat', 
      className: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 shadow-sm',
      icon: '🛬'
    },
    arrived: { 
      label: 'Sosit', 
      className: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 shadow-sm',
      icon: '✅'
    },
    cancelled: { 
      label: 'Anulat', 
      className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 shadow-sm',
      icon: '❌'
    },
    delayed: { 
      label: 'Întârziat', 
      className: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200 shadow-sm',
      icon: '⏰'
    },
    estimated: { 
      label: 'Estimat', 
      className: 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200 shadow-sm',
      icon: '📊'
    },
    boarding: { 
      label: 'Îmbarcare', 
      className: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200 shadow-sm',
      icon: '🚪'
    },
    departed: { 
      label: 'Plecat', 
      className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm',
      icon: '🛫'
    },
    gate_closed: { 
      label: 'Poartă închisă', 
      className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 shadow-sm',
      icon: '🚪'
    },
    taxiing: { 
      label: 'La sol', 
      className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm',
      icon: '🚕'
    },
    in_flight: { 
      label: 'În zbor', 
      className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm',
      icon: '✈️'
    },
    unknown: { 
      label: 'Necunoscut', 
      className: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-gray-200 shadow-sm',
      icon: '❓'
    }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.unknown;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.className} transition-all duration-200 hover:scale-105`}>
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default function ClientOnlyFlightList({ 
  airportCode, 
  type, 
  viewMode: initialViewMode = 'list'
}: ClientOnlyFlightListProps) {
  const [flights, setFlights] = useState<RawFlightData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>(initialViewMode)
  const [isClient, setIsClient] = useState(false)

  const fetchFlights = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = `/api/flights/${airportCode}/${type}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setFlights(data.data)
        setLastUpdated(data.last_updated)
        setError(null)
      } else {
        setError(data.error || 'Nu am putut încărca datele zborurilor')
        if (data.data && data.data.length > 0) {
          setFlights(data.data)
          setLastUpdated(data.last_updated)
        }
      }
    } catch (err) {
      console.error('Error fetching flights:', err)
      setError('Eroare la încărcarea datelor de zbor')
    } finally {
      setLoading(false)
    }
  }

  // Ensure this only runs on client
  useEffect(() => {
    setIsClient(true)
    fetchFlights()
    
    const intervalId = setInterval(() => {
      fetchFlights()
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [airportCode, type])

  // Group flights by route for grouped view
  const groupFlightsByRoute = (flights: RawFlightData[]) => {
    const routeMap = new Map<string, {
      route: string
      flights: RawFlightData[]
      city: string
      airportCode: string
    }>()

    flights.forEach(flight => {
      let routeKey: string
      let city: string
      let airportCode: string

      if (type === 'arrivals') {
        city = flight.origin?.city || flight.origin?.airport || 'Unknown'
        airportCode = flight.origin?.code || 'XXX'
        routeKey = `${airportCode}-${city}`
      } else {
        city = flight.destination?.city || flight.destination?.airport || 'Unknown'
        airportCode = flight.destination?.code || 'XXX'
        routeKey = `${city}-${airportCode}`
      }

      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          route: routeKey,
          flights: [],
          city,
          airportCode
        })
      }

      routeMap.get(routeKey)!.flights.push(flight)
    })

    // Sort routes by flight count (descending)
    return Array.from(routeMap.values()).sort((a, b) => b.flights.length - a.flights.length)
  }

  const groupedRoutes = groupFlightsByRoute(flights)

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

  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ro-RO', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  // Show loading during SSR - simplified
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && flights.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 rounded-2xl border border-red-200 shadow-lg p-6 text-center">
          <div className="p-3 bg-red-600 rounded-lg w-fit mx-auto mb-4">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">
            Nu am putut încărca datele zborurilor
          </h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchFlights}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Toggle pentru modul de vizualizare cu design Material M3 */}
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-white rounded-xl border-2 border-blue-200 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 Lista Completă
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  viewMode === 'grouped'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🗂️ Grupat pe Rute
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">
                Actualizat: {formatLastUpdated(lastUpdated)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Statistici cu design Material M3 */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {flights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
            </div>
            <div className="text-sm text-gray-600">
              {viewMode === 'grouped' ? `${groupedRoutes.length} rute` : 'Lista completă'}
            </div>
          </div>
        </div>
      </div>

      {/* Flight List - Conditional rendering based on view mode */}
      {viewMode === 'list' ? (
        <>
          {flights.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plane className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment. Verifică din nou mai târziu.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table - Design Material M3 */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                          {type === 'arrivals' ? 'Din' : 'Spre'}
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                          Companie
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Ora
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flights.slice(0, 50).map((flight, index) => {
                        const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;
                        
                        if (!relevantLocation || !relevantLocation.city) {
                          return null;
                        }

                        return (
                          <tr key={`${flight.flight_number}-${index}`} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border-b border-gray-100 hover:border-blue-200 hover:shadow-sm">
                            {/* Destinație/Origine - Design Material M3 */}
                            <td className="px-4 py-4 first:pl-6">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                                  <Plane className="h-5 w-5 text-white transform group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-900 transition-colors duration-300">
                                    {relevantLocation?.city || 'N/A'}
                                  </div>
                                  <div className="text-sm font-semibold text-blue-600 mt-0.5 group-hover:text-blue-700 transition-colors duration-300">
                                    {flight.flight_number}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                      {relevantLocation?.code || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Companie - Design Material M3 */}
                            <td className="px-4 py-4 hidden sm:table-cell">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <AirlineLogo 
                                    airlineCode={flight.airline?.code || 'XX'} 
                                    size="md"
                                    className="ring-2 ring-white shadow-md group-hover:ring-blue-200 transition-all duration-300"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-900 transition-colors duration-300">
                                    {getAirlineName(flight.airline?.code || 'XX')}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {flight.airline?.code || 'XX'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Ora - Design Material M3 */}
                            <td className="px-4 py-4">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <div className="text-lg font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                                    {formatTime(flight.scheduled_time)}
                                  </div>
                                </div>
                                {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                                  <div className="flex items-center justify-center space-x-1 mt-1">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <div className="text-xs text-orange-600 font-semibold">
                                      Est: {formatTime(flight.estimated_time)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* Status - Design Material M3 */}
                            <td className="px-4 py-4 last:pr-6">
                              <div className="flex justify-end">
                                {getStatusBadge(flight.status)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards - Design premium Material M3 */}
              <div className="md:hidden space-y-4">
                {flights.slice(0, 50).map((flight, index) => {
                  const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;
                  
                  if (!relevantLocation) {
                    return null;
                  }
                  
                  return (
                    <div
                      key={`${flight.flight_number}-${index}`}
                      className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:scale-[1.02] p-6"
                    >
                      {/* Header cu destinație și timp */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <Plane className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xl font-bold text-gray-900 leading-tight mb-1">
                              {relevantLocation?.city || 'N/A'}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium">
                                {relevantLocation?.code || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timp în colțul din dreapta */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center justify-end space-x-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="text-2xl font-bold text-gray-900">
                              {formatTime(flight.scheduled_time)}
                            </div>
                          </div>
                          {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                            <div className="flex items-center justify-end space-x-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <div className="text-sm text-orange-600 font-semibold">
                                Est: {formatTime(flight.estimated_time)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Footer cu companie și status */}
                      <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                        <div className="flex items-center space-x-3 flex-1">
                          <AirlineLogo 
                            airlineCode={flight.airline?.code || 'XX'} 
                            size="md"
                            className="flex-shrink-0 ring-2 ring-white shadow-md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-600 truncate">
                              {getAirlineName(flight.airline?.code || 'XX')}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {flight.flight_number}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          {getStatusBadge(flight.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        /* Grouped View - Design Material M3 îmbunătățit */
        <div className="space-y-6">
          {groupedRoutes.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plane className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment.
              </p>
            </div>
          ) : (
            groupedRoutes.map((route, routeIndex) => (
              <div key={route.route} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Header pentru rută */}
                <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center shadow-md">
                        <Plane className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white">
                          {route.city}
                        </h4>
                        <p className="text-blue-100 text-sm">
                          {route.airportCode} • {route.flights.length} zboruri
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        {route.flights.length}
                      </div>
                      <div className="text-blue-100 text-sm">
                        zboruri
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lista zborurilor pentru această rută */}
                <div className="p-6">
                  <div className="grid gap-4">
                    {route.flights.slice(0, 20).map((flight, index) => (
                      <div
                        key={`${flight.flight_number}-${routeIndex}-${index}`}
                        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300 transform hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between">
                          {/* Informații zbor */}
                          <div className="flex items-center space-x-4 flex-1">
                            <AirlineLogo 
                              airlineCode={flight.airline?.code || 'XX'} 
                              size="md"
                              className="flex-shrink-0 ring-2 ring-white shadow-md"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xl font-bold text-blue-600 mb-1">
                                {flight.flight_number}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {getAirlineName(flight.airline?.code || 'XX')}
                              </div>
                            </div>
                          </div>
                          
                          {/* Ora și status */}
                          <div className="flex items-center space-x-6 flex-shrink-0">
                            <div className="text-right">
                              <div className="flex items-center justify-end space-x-2 mb-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatTime(flight.scheduled_time)}
                                </div>
                              </div>
                              {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                                <div className="flex items-center justify-end space-x-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <div className="text-sm text-orange-600 font-semibold">
                                    Est: {formatTime(flight.estimated_time)}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0">
                              {getStatusBadge(flight.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer cu statistici pentru rută */}
                  {route.flights.length > 20 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                      <p className="text-blue-700 font-medium">
                        Și încă {route.flights.length - 20} zboruri pentru {route.city}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}