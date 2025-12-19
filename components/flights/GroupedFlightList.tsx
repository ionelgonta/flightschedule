/**
 * GroupedFlightList - Componentă pentru afișarea grupată și prietenoasă a zborurilor
 * Grupează zborurile după rută și afișează denumirile orașelor în loc de coduri IATA
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { FlightFilters } from '@/lib/flightRepository';
import { getCityName } from '@/lib/airports';
import { Search, Filter, ChevronDown, ChevronUp, Plane, Clock, MapPin } from 'lucide-react';

// Helper function pentru status badge
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Programat', className: 'bg-green-600 text-white shadow-md' },
    active: { label: 'În Zbor', className: 'bg-blue-600 text-white shadow-md' },
    landed: { label: 'Aterizat', className: 'bg-gray-600 text-white shadow-md' },
    arrived: { label: 'Sosit', className: 'bg-blue-600 text-white shadow-md' },
    cancelled: { label: 'Anulat', className: 'bg-red-600 text-white shadow-md' },
    delayed: { label: 'Întârziat', className: 'bg-orange-600 text-white shadow-md' },
    diverted: { label: 'Deviat', className: 'bg-yellow-600 text-white shadow-md' },
    boarding: { label: 'Îmbarcare', className: 'bg-purple-600 text-white shadow-md' },
    departed: { label: 'Plecat', className: 'bg-blue-600 text-white shadow-md' },
    unknown: { label: 'Necunoscut', className: 'bg-gray-500 text-white shadow-md' },
    estimated: { label: 'Estimat', className: 'bg-indigo-600 text-white shadow-md' }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.unknown;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
};

// Helper function pentru formatarea timpului
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

// Folosim getCityName din serviciul de mapare care verifică automat baza de date

// Interfață pentru grupul de zboruri
interface FlightGroup {
  routeKey: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  flights: RawFlightData[];
  airlines: string[];
  timeSlots: string[];
}

interface GroupedFlightListProps {
  flights: RawFlightData[];
  type: 'arrivals' | 'departures';
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
  onFiltersChange?: (filters: FlightFilters) => void;
}

export function GroupedFlightList({ 
  flights, 
  type, 
  loading = false, 
  error, 
  lastUpdated,
  onFiltersChange 
}: GroupedFlightListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAirline, setSelectedAirline] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Grupează zborurile după rută
  const groupedFlights = useMemo(() => {
    let filtered = flights;

    // Aplică filtrele
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(flight => 
        flight.flight_number.toLowerCase().includes(search) ||
        (flight.airline?.name || '').toLowerCase().includes(search) ||
        getCityName(flight.origin?.code || '').toLowerCase().includes(search) ||
        getCityName(flight.destination?.code || '').toLowerCase().includes(search) ||
        (flight.origin?.code || '').toLowerCase().includes(search) ||
        (flight.destination?.code || '').toLowerCase().includes(search)
      );
    }

    if (selectedAirline) {
      filtered = filtered.filter(flight => flight.airline?.name === selectedAirline);
    }

    if (selectedStatus) {
      filtered = filtered.filter(flight => flight.status === selectedStatus);
    }

    // Grupează după rută
    const groups: Record<string, FlightGroup> = {};
    
    filtered.forEach(flight => {
      const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;
      if (!relevantLocation?.code) return;

      const routeKey = type === 'arrivals' 
        ? `${relevantLocation.code}-${flight.destination?.code || 'OTP'}`
        : `${flight.origin?.code || 'OTP'}-${relevantLocation.code}`;

      if (!groups[routeKey]) {
        const originCode = type === 'arrivals' ? relevantLocation.code : (flight.origin?.code || 'OTP');
        const destinationCode = type === 'arrivals' ? (flight.destination?.code || 'OTP') : relevantLocation.code;
        
        groups[routeKey] = {
          routeKey,
          originCode,
          originCity: getCityName(originCode),
          destinationCode,
          destinationCity: getCityName(destinationCode),
          flights: [],
          airlines: [],
          timeSlots: []
        };
      }

      groups[routeKey].flights.push(flight);
      
      // Adaugă compania aeriană dacă nu există
      const airlineName = flight.airline?.name || 'Unknown';
      if (!groups[routeKey].airlines.includes(airlineName)) {
        groups[routeKey].airlines.push(airlineName);
      }

      // Adaugă slot-ul de timp
      const timeSlot = formatTime(flight.scheduled_time);
      if (!groups[routeKey].timeSlots.includes(timeSlot)) {
        groups[routeKey].timeSlots.push(timeSlot);
      }
    });

    // Sortează grupurile după numărul de zboruri (descrescător)
    return Object.values(groups).sort((a, b) => b.flights.length - a.flights.length);
  }, [flights, searchTerm, selectedAirline, selectedStatus, type]);

  // Extrage companiile aeriene unice pentru filtru
  const airlines = useMemo(() => {
    const uniqueAirlines = new Set(flights.map(flight => flight.airline?.name || 'Unknown').filter(name => name !== 'Unknown'));
    return Array.from(uniqueAirlines).sort();
  }, [flights]);

  // Extrage statusurile unice pentru filtru
  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(flights.map(flight => flight.status));
    return Array.from(uniqueStatuses).sort();
  }, [flights]);

  const toggleGroup = (routeKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(routeKey)) {
      newExpanded.delete(routeKey);
    } else {
      newExpanded.add(routeKey);
    }
    setExpandedGroups(newExpanded);
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

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-300 dark:border-red-700 p-8 text-center shadow-lg">
        <div className="p-4 bg-red-600 rounded-2xl w-fit mx-auto mb-6 shadow-md">
          <Plane className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
          Nu am putut încărca datele zborurilor
        </h3>
        <p className="text-lg text-red-700 dark:text-red-300 mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header cu căutare și controale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Căutare */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={`Caută ${type === 'arrivals' ? 'sosiri' : 'plecări'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base focus:border-blue-600 focus:border-2 focus:outline-none transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Controale */}
          <div className="flex items-center space-x-3">
            {/* Ultima actualizare */}
            {lastUpdated && (
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Actualizat: {formatLastUpdated(lastUpdated)}
              </span>
            )}

            {/* Buton filtre */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-bold">Filtre</span>
            </button>
          </div>
        </div>

        {/* Panoul de filtre */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Filtru companie aeriană */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Companie aeriană
                </label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:border-blue-600 focus:border-2 focus:outline-none transition-all duration-200 shadow-sm"
                >
                  <option value="">Toate companiile</option>
                  {airlines.map(airline => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>

              {/* Filtru status */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:border-blue-600 focus:border-2 focus:outline-none transition-all duration-200 shadow-sm"
                >
                  <option value="">Toate statusurile</option>
                  {statuses.map(status => (
                    <option key={status} value={status} className="capitalize">{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistici */}
      <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
        {groupedFlights.length} rute • {groupedFlights.reduce((total, group) => total + group.flights.length, 0)} {type === 'arrivals' ? 'sosiri' : 'plecări'}
      </div>

      {/* Lista grupată de zboruri */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 p-6 animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : groupedFlights.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 p-12 text-center shadow-lg">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl w-fit mx-auto mb-6 shadow-md">
            <Plane className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {searchTerm || selectedAirline || selectedStatus 
              ? 'Nu există zboruri care să corespundă filtrelor selectate.'
              : `Nu sunt ${type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedFlights.map((group) => (
            <div
              key={group.routeKey}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {/* Header grupului */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleGroup(group.routeKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {group.originCity} → {group.destinationCity}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.originCode} → {group.destinationCode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {group.flights.length} {group.flights.length === 1 ? 'zbor' : 'zboruri'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {group.airlines.length} {group.airlines.length === 1 ? 'companie' : 'companii'}
                      </div>
                    </div>
                    
                    {expandedGroups.has(group.routeKey) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Preview info când grupul este închis */}
                {!expandedGroups.has(group.routeKey) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Companiile aeriene */}
                    <div className="flex flex-wrap gap-1">
                      {group.airlines.slice(0, 3).map((airline, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                        >
                          {airline}
                        </span>
                      ))}
                      {group.airlines.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                          +{group.airlines.length - 3}
                        </span>
                      )}
                    </div>
                    
                    {/* Orele de zbor */}
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>
                        {group.timeSlots.slice(0, 3).join(', ')}
                        {group.timeSlots.length > 3 && ` +${group.timeSlots.length - 3}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detaliile zborurilor când grupul este expandat */}
              {expandedGroups.has(group.routeKey) && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <div className="p-6 space-y-4">
                    {group.flights
                      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                      .map((flight, index) => (
                        <div
                          key={`${flight.flight_number}-${index}`}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <Plane className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {flight.flight_number}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {flight.airline?.name || 'Unknown Airline'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {formatTime(flight.scheduled_time)}
                              </div>
                              {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                  Est: {formatTime(flight.estimated_time)}
                                </div>
                              )}
                            </div>
                            
                            {getStatusBadge(flight.status)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupedFlightList;