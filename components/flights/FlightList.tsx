/**
 * FlightList - Componentă pentru afișarea listei de zboruri cu filtrare și sortare
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { FlightFilters } from '@/lib/flightRepository';

import { Search, Filter, SortAsc, SortDesc, Plane } from 'lucide-react';

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
    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
};

// Componenta pentru afișarea unui rând în tabel
function FlightTableRow({ flight, type }: { flight: RawFlightData; type: 'arrivals' | 'departures' }) {
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

  const formatDate = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString('ro-RO', { 
        month: 'short', 
        day: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;
  
  // Safety check for undefined location or missing city
  if (!relevantLocation || !relevantLocation.city) {
    return null; // Nu afișa rândul dacă datele sunt incomplete
  }

  return (
    <tr className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-200 dark:border-gray-600">
      {/* Zbor */}
      <td className="px-4 py-4 first:pl-6">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {flight.flight_number}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 sm:hidden">
          {flight.airline?.code || 'XX'}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {formatDate(flight.scheduled_time)}
        </div>
      </td>
      
      {/* Companie - ascuns pe mobile */}
      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-xs font-bold text-white">
              {flight.airline?.code || 'XX'}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {flight.airline?.name || 'Unknown Airline'}
            </div>
          </div>
        </div>
      </td>
      
      {/* Destinație */}
      <td className="px-4 py-4">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {relevantLocation?.city || 'N/A'}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
          {relevantLocation?.airport && relevantLocation?.airport !== relevantLocation?.city 
            ? relevantLocation?.airport 
            : relevantLocation?.code || 'N/A'}
        </div>
      </td>
      
      {/* Ora */}
      <td className="px-4 py-4">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {formatTime(flight.scheduled_time)}
        </div>
        {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
            Est: {formatTime(flight.estimated_time)}
          </div>
        )}
      </td>
      
      {/* Status */}
      <td className="px-4 py-4">
        {getStatusBadge(flight.status)}
      </td>
      
      {/* Terminal - ascuns pe mobile și tablet mic */}
      <td className="px-4 py-4 last:pr-6 hidden md:table-cell">
        <div className="flex space-x-2">
          {flight.terminal && (
            <span className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-bold shadow-md">
              T{flight.terminal}
            </span>
          )}
          {flight.gate && (
            <span className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-bold shadow-md">
              {flight.gate}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

interface FlightListProps {
  flights: RawFlightData[];
  type: 'arrivals' | 'departures';
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
  onFiltersChange?: (filters: FlightFilters) => void;
}

type SortOption = 'scheduled_time' | 'airline' | 'status' | 'destination';
type SortDirection = 'asc' | 'desc';

export function FlightList({ 
  flights, 
  type, 
  loading = false, 
  error, 
  lastUpdated,
  onFiltersChange 
}: FlightListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAirline, setSelectedAirline] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('scheduled_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);

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

  // Aplică filtrarea și sortarea
  const filteredAndSortedFlights = useMemo(() => {
    let filtered = flights;

    // Filtru de căutare
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(flight => 
        flight.flight_number.toLowerCase().includes(search) ||
        (flight.airline?.name || '').toLowerCase().includes(search) ||
        (flight.origin?.city || '').toLowerCase().includes(search) ||
        (flight.destination?.city || '').toLowerCase().includes(search) ||
        (flight.origin?.code || '').toLowerCase().includes(search) ||
        (flight.destination?.code || '').toLowerCase().includes(search)
      );
    }

    // Filtru companie aeriană
    if (selectedAirline) {
      filtered = filtered.filter(flight => flight.airline?.name === selectedAirline);
    }

    // Filtru status
    if (selectedStatus) {
      filtered = filtered.filter(flight => flight.status === selectedStatus);
    }

    // Sortare
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'scheduled_time':
          aValue = new Date(a.scheduled_time);
          bValue = new Date(b.scheduled_time);
          break;
        case 'airline':
          aValue = a.airline?.name || 'Unknown';
          bValue = b.airline?.name || 'Unknown';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'destination':
          aValue = type === 'arrivals' ? (a.origin?.city || '') : (a.destination?.city || '');
          bValue = type === 'arrivals' ? (b.origin?.city || '') : (b.destination?.city || '');
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [flights, searchTerm, selectedAirline, selectedStatus, sortBy, sortDirection, type]);

  // Notifică părintele despre schimbările de filtre
  useEffect(() => {
    if (onFiltersChange) {
      const filters: FlightFilters = {};
      if (selectedAirline) filters.airline = selectedAirline;
      if (selectedStatus) filters.status = selectedStatus;
      onFiltersChange(filters);
    }
  }, [selectedAirline, selectedStatus, onFiltersChange]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Sortare */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Sortează după
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:border-blue-600 focus:border-2 focus:outline-none transition-all duration-200 shadow-sm"
                  >
                    <option value="scheduled_time">Ora</option>
                    <option value="airline">Companie</option>
                    <option value="status">Status</option>
                    <option value="destination">{type === 'arrivals' ? 'Origine' : 'Destinație'}</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistici */}
      <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Afișez {filteredAndSortedFlights.length} din {flights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
      </div>

      {/* Lista de zboruri - Tabel */}
      {loading ? (
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <div className="animate-pulse">
            <div className="bg-surface-container-high h-14"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-t border-outline-variant/50 h-16 bg-surface-container" />
            ))}
          </div>
        </div>
      ) : filteredAndSortedFlights.length === 0 ? (
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
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-b border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-4 first:pl-6 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                      <button
                        onClick={() => handleSort('scheduled_time')}
                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>Zbor</span>
                        {sortBy === 'scheduled_time' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                      <button
                        onClick={() => handleSort('airline')}
                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>Companie</span>
                        {sortBy === 'airline' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                      <button
                        onClick={() => handleSort('destination')}
                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>{type === 'arrivals' ? 'Din' : 'Spre'}</span>
                        {sortBy === 'destination' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                      Ora
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>Status</span>
                        {sortBy === 'status' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 last:pr-6 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                      Terminal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredAndSortedFlights.map((flight, index) => (
                    <FlightTableRow
                      key={`${flight.flight_number}-${index}`}
                      flight={flight}
                      type={type}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedFlights.map((flight, index) => {
              const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;
              
              // Safety check for undefined location
              if (!relevantLocation) {
                return null;
              }
              
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
              
              return (
                <div
                  key={`${flight.flight_number}-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {/* Header cu zbor și status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                        <Plane className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{flight.flight_number}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{flight.airline?.name || 'Unknown Airline'}</div>
                      </div>
                    </div>
                    {getStatusBadge(flight.status)}
                  </div>
                  
                  {/* Detalii zbor */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{type === 'arrivals' ? 'Din:' : 'Spre:'}</span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">{relevantLocation?.city || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ora:</span>
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900 dark:text-white">
                          {formatTime(flight.scheduled_time)}
                        </div>
                        {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                            Est: {formatTime(flight.estimated_time)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(flight.terminal || flight.gate) && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Terminal:</span>
                        <div className="flex space-x-2">
                          {flight.terminal && (
                            <span className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-bold shadow-md">
                              T{flight.terminal}
                            </span>
                          )}
                          {flight.gate && (
                            <span className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-bold shadow-md">
                              {flight.gate}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default FlightList;