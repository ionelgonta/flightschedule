/**
 * FlightList - Componentă pentru afișarea listei de zboruri cu filtrare și sortare
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { FlightFilters } from '@/lib/flightRepository';
import FlightCard from './FlightCard';
import { Search, Filter, SortAsc, SortDesc, RefreshCw, Plane } from 'lucide-react';

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

      {/* Lista de zboruri */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredAndSortedFlights.length === 0 ? (
        <div className="text-center py-12">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedFlights.map((flight, index) => (
            <FlightCard
              key={`${flight.flight_number}-${index}`}
              flight={flight}
              type={type}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FlightList;