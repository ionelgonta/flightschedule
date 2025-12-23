/**
 * FlightList - Componentă pentru afișarea listei de zboruri cu filtrare și sortare
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { FlightFilters } from '@/lib/flightRepository';
import { getAirlineName } from '@/lib/airlineMapping';
import { AirlineLogo } from '@/components/ui/AirlineLogo';

import { Search, Filter, SortAsc, SortDesc, Plane } from 'lucide-react';

// Helper function pentru status badge cu design îmbunătățit
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
    diverted: { 
      label: 'Deviat', 
      className: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 shadow-sm',
      icon: '🔄'
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
    unknown: { 
      label: 'Necunoscut', 
      className: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-gray-200 shadow-sm',
      icon: '❓'
    },
    estimated: { 
      label: 'Estimat', 
      className: 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200 shadow-sm',
      icon: '📊'
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

// Componenta pentru afișarea unui rând în tabel cu design îmbunătățit
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
    <tr className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border-b border-gray-100 hover:border-blue-200 hover:shadow-sm">
      {/* Destinație/Origine - Design îmbunătățit cu iconuri */}
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
              <span className="text-xs text-gray-400">
                {formatDate(flight.scheduled_time)}
              </span>
            </div>
          </div>
        </div>
      </td>
      
      {/* Companie - Design îmbunătățit */}
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
      
      {/* Ora - Design îmbunătățit cu iconuri de timp */}
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
      
      {/* Status - Design îmbunătățit */}
      <td className="px-4 py-4 last:pr-6">
        <div className="flex justify-end">
          {getStatusBadge(flight.status)}
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

  // Aplică filtrarea și sortarea cu filtrare pe timp (10 ore în urmă + toate viitoare)
  const filteredAndSortedFlights = useMemo(() => {
    let filtered = flights;

    // Filtrare pe timp: arată zborurile din ultimele 10 ore și toate zborurile viitoare
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 ore în urmă
    
    filtered = filtered.filter(flight => {
      const scheduledTime = new Date(flight.scheduled_time);
      // Arată doar zborurile care sunt:
      // 1. Programate în viitor (scheduledTime > now)
      // 2. Programate în ultimele 10 ore (scheduledTime > tenHoursAgo)
      return scheduledTime > tenHoursAgo;
    });

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
    <div className="space-y-8">
      {/* Header cu căutare și controale - Design îmbunătățit */}
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Căutare cu design îmbunătățit */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <input
              type="text"
              placeholder={`Caută ${type === 'arrivals' ? 'sosiri' : 'plecări'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl bg-white text-gray-900 placeholder-blue-400 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
            />
          </div>

          {/* Controale cu design îmbunătățit */}
          <div className="flex items-center space-x-4">
            {/* Ultima actualizare cu design îmbunătățit */}
            {lastUpdated && (
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">
                  Actualizat: {formatLastUpdated(lastUpdated)}
                </span>
              </div>
            )}

            {/* Buton filtre cu design îmbunătățit */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 ${
                showFilters 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtre</span>
              {showFilters && <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">Activ</span>}
            </button>
          </div>
        </div>

        {/* Panoul de filtre cu design îmbunătățit */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Filtru companie aeriană cu design îmbunătățit */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <span className="text-blue-600">✈️</span>
                  <span>Companie aeriană</span>
                </label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <option value="">🌐 Toate companiile</option>
                  {airlines.map(airline => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>

              {/* Filtru status cu design îmbunătățit */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <span className="text-green-600">📊</span>
                  <span>Status</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <option value="">📋 Toate statusurile</option>
                  {statuses.map(status => (
                    <option key={status} value={status} className="capitalize">{status}</option>
                  ))}
                </select>
              </div>

              {/* Sortare cu design îmbunătățit */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center space-x-2">
                  <span className="text-purple-600">🔄</span>
                  <span>Sortează după</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <option value="scheduled_time">🕐 Ora</option>
                    <option value="airline">✈️ Companie</option>
                    <option value="status">📊 Status</option>
                    <option value="destination">🌍 {type === 'arrivals' ? 'Origine' : 'Destinație'}</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:text-blue-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistici cu design îmbunătățit */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {filteredAndSortedFlights.length} {type === 'arrivals' ? 'sosiri' : 'plecări'}
            </div>
            <div className="text-sm text-gray-600">
              din {flights.length} total
            </div>
          </div>
        </div>
        {(searchTerm || selectedAirline || selectedStatus) && (
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              Filtrate
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAirline('');
                setSelectedStatus('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Resetează
            </button>
          </div>
        )}
      </div>

      {/* Lista de zboruri - Tabel cu design îmbunătățit */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="animate-pulse">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-16"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-t border-gray-100 h-20 bg-gradient-to-r from-gray-50 to-gray-100" />
            ))}
          </div>
        </div>
      ) : filteredAndSortedFlights.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Plane className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            {searchTerm || selectedAirline || selectedStatus 
              ? 'Nu există zboruri care să corespundă filtrelor selectate. Încearcă să modifici criteriile de căutare.'
              : `Nu sunt ${type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment. Verifică din nou mai târziu.`
            }
          </p>
          {(searchTerm || selectedAirline || selectedStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAirline('');
                setSelectedStatus('');
              }}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Resetează filtrele
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table - Design îmbunătățit */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('destination')}
                        className="flex items-center space-x-2 hover:text-blue-600 transition-colors duration-300 group"
                      >
                        <span>{type === 'arrivals' ? 'Din' : 'Spre'}</span>
                        {sortBy === 'destination' && (
                          <div className="text-blue-600">
                            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                          </div>
                        )}
                        <div className="w-0 group-hover:w-4 transition-all duration-300 overflow-hidden">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('airline')}
                        className="flex items-center space-x-2 hover:text-blue-600 transition-colors duration-300 group"
                      >
                        <span>Companie</span>
                        {sortBy === 'airline' && (
                          <div className="text-blue-600">
                            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                          </div>
                        )}
                        <div className="w-0 group-hover:w-4 transition-all duration-300 overflow-hidden">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                      </button>
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('scheduled_time')}
                        className="flex items-center justify-center space-x-2 hover:text-blue-600 transition-colors duration-300 group w-full"
                      >
                        <span>Ora</span>
                        {sortBy === 'scheduled_time' && (
                          <div className="text-blue-600">
                            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                          </div>
                        )}
                        <div className="w-0 group-hover:w-4 transition-all duration-300 overflow-hidden">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center justify-end space-x-2 hover:text-blue-600 transition-colors duration-300 group w-full"
                      >
                        <div className="w-0 group-hover:w-4 transition-all duration-300 overflow-hidden">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                        {sortBy === 'status' && (
                          <div className="text-blue-600">
                            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                          </div>
                        )}
                        <span>Status</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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

          {/* Mobile Cards - Design premium îmbunătățit */}
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
                          <span className="text-xs text-gray-400">
                            {new Date(flight.scheduled_time).toLocaleDateString('ro-RO', { 
                              month: 'short', 
                              day: '2-digit' 
                            })}
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
    </div>
  );
}

export default FlightList;