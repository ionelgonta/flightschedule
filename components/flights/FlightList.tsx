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
    <tr className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
      {/* Zbor - Compact */}
      <td className="px-3 py-3 first:pl-4">
        <div className="text-sm font-bold text-gray-900">
          {flight.flight_number}
        </div>
        <div className="text-xs text-gray-500 sm:hidden">
          {flight.airline?.code || 'XX'}
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(flight.scheduled_time)}
        </div>
      </td>
      
      {/* Companie - Compact, ascuns pe mobile */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-6 w-6 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {flight.airline?.code || 'XX'}
            </span>
          </div>
          <div className="ml-2 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {flight.airline?.name || 'Unknown Airline'}
            </div>
          </div>
        </div>
      </td>
      
      {/* Destinație - Compact */}
      <td className="px-3 py-3">
        <div className="text-sm font-bold text-gray-900">
          {relevantLocation?.city || 'N/A'}
        </div>
        <div className="text-xs text-gray-500 hidden sm:block">
          {relevantLocation?.code || 'N/A'}
        </div>
      </td>
      
      {/* Ora - Compact */}
      <td className="px-3 py-3">
        <div className="text-sm font-bold text-gray-900">
          {formatTime(flight.scheduled_time)}
        </div>
        {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
          <div className="text-xs text-orange-600 font-semibold">
            Est: {formatTime(flight.estimated_time)}
          </div>
        )}
      </td>
      
      {/* Status - Compact */}
      <td className="px-3 py-3 last:pr-4">
        {getStatusBadge(flight.status)}
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
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
        <div className="p-3 bg-red-600 rounded-lg w-fit mx-auto mb-4">
          <Plane className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">
          Nu am putut încărca datele zborurilor
        </h3>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header cu căutare și controale */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          {/* Căutare */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={`Caută ${type === 'arrivals' ? 'sosiri' : 'plecări'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Controale */}
          <div className="flex items-center space-x-3">
            {/* Ultima actualizare */}
            {lastUpdated && (
              <span className="text-xs text-gray-500 font-medium">
                Actualizat: {formatLastUpdated(lastUpdated)}
              </span>
            )}

            {/* Buton filtre */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-3 w-3" />
              <span>Filtre</span>
            </button>
          </div>
        </div>

        {/* Panoul de filtre */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtru companie aeriană */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Companie aeriană
                </label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Toate companiile</option>
                  {airlines.map(airline => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>

              {/* Filtru status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Toate statusurile</option>
                  {statuses.map(status => (
                    <option key={status} value={status} className="capitalize">{status}</option>
                  ))}
                </select>
              </div>

              {/* Sortare */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sortează după
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="scheduled_time">Ora</option>
                    <option value="airline">Companie</option>
                    <option value="status">Status</option>
                    <option value="destination">{type === 'arrivals' ? 'Origine' : 'Destinație'}</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistici */}
      <div className="text-sm font-medium text-gray-600">
        Afișez {filteredAndSortedFlights.length} din {flights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
      </div>

      {/* Lista de zboruri - Tabel */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="animate-pulse">
            <div className="bg-gray-100 h-12"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-t border-gray-100 h-14 bg-gray-50" />
            ))}
          </div>
        </div>
      ) : filteredAndSortedFlights.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="p-3 bg-gray-100 rounded-lg w-fit mx-auto mb-4">
            <Plane className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
          </h3>
          <p className="text-sm text-gray-600">
            {searchTerm || selectedAirline || selectedStatus 
              ? 'Nu există zboruri care să corespundă filtrelor selectate.'
              : `Nu sunt ${type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment.`
            }
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table - Compact Design */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 first:pl-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('scheduled_time')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Zbor</span>
                        {sortBy === 'scheduled_time' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('airline')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Companie</span>
                        {sortBy === 'airline' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('destination')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>{type === 'arrivals' ? 'Din' : 'Spre'}</span>
                        {sortBy === 'destination' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Ora
                    </th>
                    <th className="px-3 py-3 last:pr-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Status</span>
                        {sortBy === 'status' && (
                          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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

          {/* Mobile Cards - Compact Design */}
          <div className="md:hidden space-y-3">
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
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Header compact cu zbor și status */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <Plane className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{flight.flight_number}</div>
                        <div className="text-xs text-gray-500">{flight.airline?.code || 'XX'}</div>
                      </div>
                    </div>
                    {getStatusBadge(flight.status)}
                  </div>
                  
                  {/* Detalii zbor - compact */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">{type === 'arrivals' ? 'Din:' : 'Spre:'}</span>
                      <div className="font-semibold text-gray-900">{relevantLocation?.city || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500">Ora:</span>
                      <div className="font-semibold text-gray-900">
                        {formatTime(flight.scheduled_time)}
                      </div>
                      {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                        <div className="text-xs text-orange-600 font-medium">
                          Est: {formatTime(flight.estimated_time)}
                        </div>
                      )}
                    </div>
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