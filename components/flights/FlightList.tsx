/**
 * FlightList - Componentă pentru afișarea listei de zboruri cu filtrare și sortare
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { FlightFilters } from '@/lib/flightRepository';

import { Search, Filter, SortAsc, SortDesc, RefreshCw, Plane } from 'lucide-react';

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Programat', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      active: { label: 'În Zbor', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      landed: { label: 'Aterizat', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      cancelled: { label: 'Anulat', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
      delayed: { label: 'Întârziat', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
      diverted: { label: 'Deviat', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      boarding: { label: 'Îmbarcare', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      departed: { label: 'Plecat', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      unknown: { label: 'Necunoscut', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
    };

    const config = statusConfig[status] || statusConfig.unknown;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* Zbor */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {flight.flight_number}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
          {flight.airline.code}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(flight.scheduled_time)}
        </div>
      </td>
      
      {/* Companie - ascuns pe mobile */}
      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {flight.airline.code}
            </span>
          </div>
          <div className="ml-2 sm:ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {flight.airline.name}
            </div>
          </div>
        </div>
      </td>
      
      {/* Destinație */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {relevantLocation.city}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          {relevantLocation.airport}
        </div>
      </td>
      
      {/* Ora */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatTime(flight.scheduled_time)}
        </div>
        {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Est: {formatTime(flight.estimated_time)}
          </div>
        )}
      </td>
      
      {/* Status */}
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        {getStatusBadge(flight.status)}
      </td>
      
      {/* Terminal - ascuns pe mobile și tablet mic */}
      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
        <div>
          {flight.terminal && (
            <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs mr-1">
              T{flight.terminal}
            </span>
          )}
          {flight.gate && (
            <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
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
  onRefresh?: () => void;
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
  onRefresh,
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
    const uniqueAirlines = new Set(flights.map(flight => flight.airline.name));
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
        flight.airline.name.toLowerCase().includes(search) ||
        flight.origin.city.toLowerCase().includes(search) ||
        flight.destination.city.toLowerCase().includes(search) ||
        flight.origin.code.toLowerCase().includes(search) ||
        flight.destination.code.toLowerCase().includes(search)
      );
    }

    // Filtru companie aeriană
    if (selectedAirline) {
      filtered = filtered.filter(flight => flight.airline.name === selectedAirline);
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
          aValue = a.airline.name;
          bValue = b.airline.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'destination':
          aValue = type === 'arrivals' ? a.origin.city : a.destination.city;
          bValue = type === 'arrivals' ? b.origin.city : b.destination.city;
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <Plane className="h-12 w-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Nu am putut încărca datele zborurilor
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Încearcă din nou
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header cu căutare și controale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Căutare */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={`Caută ${type === 'arrivals' ? 'sosiri' : 'plecări'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Controale */}
          <div className="flex items-center space-x-2">
            {/* Ultima actualizare */}
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Actualizat: {formatLastUpdated(lastUpdated)}
              </span>
            )}

            {/* Buton filtre */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtre</span>
            </button>

            {/* Buton refresh */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizează</span>
              </button>
            )}
          </div>
        </div>

        {/* Panoul de filtre */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtru companie aeriană */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Companie aeriană
                </label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toate companiile</option>
                  {airlines.map(airline => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>

              {/* Filtru status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toate statusurile</option>
                  {statuses.map(status => (
                    <option key={status} value={status} className="capitalize">{status}</option>
                  ))}
                </select>
              </div>

              {/* Sortare */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sortează după
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled_time">Ora</option>
                    <option value="airline">Companie</option>
                    <option value="status">Status</option>
                    <option value="destination">{type === 'arrivals' ? 'Origine' : 'Destinație'}</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Afișez {filteredAndSortedFlights.length} din {flights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
      </div>

      {/* Lista de zboruri - Tabel */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="animate-pulse">
            <div className="bg-gray-50 dark:bg-gray-900 h-12"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-t border-gray-200 dark:border-gray-700 h-16 bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      ) : filteredAndSortedFlights.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedAirline || selectedStatus 
              ? 'Nu există zboruri care să corespundă filtrelor selectate.'
              : `Nu sunt ${type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment.`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('scheduled_time')}
                      className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <span>Zbor</span>
                      {sortBy === 'scheduled_time' && (
                        sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('airline')}
                      className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <span>Companie</span>
                      {sortBy === 'airline' && (
                        sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('destination')}
                      className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <span>{type === 'arrivals' ? 'Din' : 'Spre'}</span>
                      {sortBy === 'destination' && (
                        sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ora
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <span>Status</span>
                      {sortBy === 'status' && (
                        sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Terminal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
      )}
    </div>
  );
}

export default FlightList;