import { RawFlightData } from '@/lib/flightApiService'
import { getAirlineName } from '@/lib/airlineMapping'
import { AirlineLogo } from '@/components/ui/AirlineLogo'
import { Plane } from 'lucide-react'

interface ServerFlightListProps {
  flights: RawFlightData[]
  type: 'arrivals' | 'departures'
  lastUpdated?: string
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

export default function ServerFlightList({ flights, type, lastUpdated }: ServerFlightListProps) {
  if (flights.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
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
              Lista completă
            </div>
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
    </div>
  );
}