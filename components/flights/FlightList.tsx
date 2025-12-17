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
    scheduled: { label: 'Programat', className: 'bg-secondary-container text-on-secondary-container' },
    active: { label: 'În Zbor', className: 'bg-primary-container text-on-primary-container' },
    landed: { label: 'Aterizat', className: 'bg-surface-container-high text-on-surface' },
    arrived: { label: 'Sosit', className: 'bg-primary-container text-on-primary-container' },
    cancelled: { label: 'Anulat', className: 'bg-error-container text-on-error-container' },
    delayed: { label: 'Întârziat', className: 'bg-tertiary-container text-on-tertiary-container' },
    diverted: { label: 'Deviat', className: 'bg-error-container text-on-error-container' },
    boarding: { label: 'Îmbarcare', className: 'bg-tertiary-container text-on-tertiary-container' },
    departed: { label: 'Plecat', className: 'bg-primary-container text-on-primary-container' },
    unknown: { label: 'Necunoscut', className: 'bg-surface-container-high text-on-surface-variant' }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.unknown;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg label-small font-medium ${config.className}`}>
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

  return (
    <tr className="state-layer hover:bg-surface-container-high transition-colors duration-200">
      {/* Zbor */}
      <td className="px-4 py-4 first:pl-6">
        <div className="body-medium font-medium text-on-surface">
          {flight.flight_number}
        </div>
        <div className="label-small text-on-surface-variant sm:hidden">
          {flight.airline.code}
        </div>
        <div className="label-small text-on-surface-variant">
          {formatDate(flight.scheduled_time)}
        </div>
      </td>
      
      {/* Companie - ascuns pe mobile */}
      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-primary-container rounded-full flex items-center justify-center">
            <span className="label-small font-medium text-on-primary-container">
              {flight.airline.code}
            </span>
          </div>
          <div className="ml-3">
            <div className="body-medium font-medium text-on-surface">
              {flight.airline.name}
            </div>
          </div>
        </div>
      </td>
      
      {/* Destinație */}
      <td className="px-4 py-4">
        <div className="body-medium font-medium text-on-surface">
          {relevantLocation.city}
        </div>
        <div className="label-small text-on-surface-variant hidden sm:block">
          {relevantLocation.airport && relevantLocation.airport !== relevantLocation.city 
            ? relevantLocation.airport 
            : relevantLocation.code}
        </div>
      </td>
      
      {/* Ora */}
      <td className="px-4 py-4">
        <div className="body-medium font-medium text-on-surface">
          {formatTime(flight.scheduled_time)}
        </div>
        {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
          <div className="label-small text-tertiary-40">
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
            <span className="inline-flex items-center px-2 py-1 bg-surface-container-high text-on-surface rounded-lg label-small font-medium">
              T{flight.terminal}
            </span>
          )}
          {flight.gate && (
            <span className="inline-flex items-center px-2 py-1 bg-surface-container-high text-on-surface rounded-lg label-small font-medium">
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
      <div className="bg-error-container rounded-xl border border-outline-variant p-8 text-center">
        <div className="p-4 bg-error rounded-2xl w-fit mx-auto mb-6">
          <Plane className="h-8 w-8 text-on-error" />
        </div>
        <h3 className="title-large text-on-error-container mb-4">
          Nu am putut încărca datele zborurilor
        </h3>
        <p className="body-large text-on-error-container mb-6">{error}</p>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header cu căutare și controale */}
      <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Căutare */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant h-5 w-5" />
            <input
              type="text"
              placeholder={`Caută ${type === 'arrivals' ? 'sosiri' : 'plecări'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-outline rounded-xl bg-surface text-on-surface placeholder-on-surface-variant body-large focus:border-primary-40 focus:border-2 focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Controale */}
          <div className="flex items-center space-x-3">
            {/* Ultima actualizare */}
            {lastUpdated && (
              <span className="body-small text-on-surface-variant">
                Actualizat: {formatLastUpdated(lastUpdated)}
              </span>
            )}

            {/* Buton filtre */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`state-layer flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="label-large font-medium">Filtre</span>
            </button>


          </div>
        </div>

        {/* Panoul de filtre */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Filtru companie aeriană */}
              <div>
                <label className="block label-large font-medium text-on-surface mb-2">
                  Companie aeriană
                </label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full px-4 py-4 border border-outline rounded-xl bg-surface text-on-surface body-large focus:border-primary-40 focus:border-2 focus:outline-none transition-all duration-200"
                >
                  <option value="">Toate companiile</option>
                  {airlines.map(airline => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>

              {/* Filtru status */}
              <div>
                <label className="block label-large font-medium text-on-surface mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-4 border border-outline rounded-xl bg-surface text-on-surface body-large focus:border-primary-40 focus:border-2 focus:outline-none transition-all duration-200"
                >
                  <option value="">Toate statusurile</option>
                  {statuses.map(status => (
                    <option key={status} value={status} className="capitalize">{status}</option>
                  ))}
                </select>
              </div>

              {/* Sortare */}
              <div>
                <label className="block label-large font-medium text-on-surface mb-2">
                  Sortează după
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-4 py-4 border border-outline rounded-xl bg-surface text-on-surface body-large focus:border-primary-40 focus:border-2 focus:outline-none transition-all duration-200"
                  >
                    <option value="scheduled_time">Ora</option>
                    <option value="airline">Companie</option>
                    <option value="status">Status</option>
                    <option value="destination">{type === 'arrivals' ? 'Origine' : 'Destinație'}</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="state-layer px-4 py-4 bg-surface-container-high text-on-surface rounded-xl hover:bg-surface-container-highest transition-all duration-200"
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
      <div className="body-medium text-on-surface-variant">
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
        <div className="bg-surface-container rounded-xl border border-outline-variant p-12 text-center">
          <div className="p-4 bg-surface-container-high rounded-2xl w-fit mx-auto mb-6">
            <Plane className="h-8 w-8 text-on-surface-variant" />
          </div>
          <h3 className="title-large text-on-surface mb-4">
            Nu sunt {type === 'arrivals' ? 'sosiri' : 'plecări'}
          </h3>
          <p className="body-large text-on-surface-variant">
            {searchTerm || selectedAirline || selectedStatus 
              ? 'Nu există zboruri care să corespundă filtrelor selectate.'
              : `Nu sunt ${type === 'arrivals' ? 'sosiri' : 'plecări'} programate în acest moment.`
            }
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-elevation-1">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-high border-b border-outline-variant">
                  <tr>
                    <th className="px-4 py-4 first:pl-6 text-left label-large font-medium text-on-surface-variant">
                      <button
                        onClick={() => handleSort('scheduled_time')}
                        className="state-layer flex items-center space-x-1 hover:text-on-surface transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>Zbor</span>
                        {sortBy === 'scheduled_time' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left label-large font-medium text-on-surface-variant">
                      <button
                        onClick={() => handleSort('airline')}
                        className="state-layer flex items-center space-x-1 hover:text-on-surface transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>Companie</span>
                        {sortBy === 'airline' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left label-large font-medium text-on-surface-variant">
                      <button
                        onClick={() => handleSort('destination')}
                        className="state-layer flex items-center space-x-1 hover:text-on-surface transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>{type === 'arrivals' ? 'Din' : 'Spre'}</span>
                        {sortBy === 'destination' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left label-large font-medium text-on-surface-variant">
                      Ora
                    </th>
                    <th className="px-4 py-4 text-left label-large font-medium text-on-surface-variant">
                      <button
                        onClick={() => handleSort('status')}
                        className="state-layer flex items-center space-x-1 hover:text-on-surface transition-colors duration-200 p-1 rounded-lg"
                      >
                        <span>Status</span>
                        {sortBy === 'status' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 last:pr-6 text-left label-large font-medium text-on-surface-variant">
                      Terminal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
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
          <div className="md:hidden space-y-3">
            {filteredAndSortedFlights.map((flight, index) => {
              const relevantLocation = type === 'arrivals' ? flight.origin : flight.destination;
              
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
                  className="bg-surface-container rounded-xl border border-outline-variant p-4 shadow-elevation-1"
                >
                  {/* Header cu zbor și status */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="title-medium text-on-surface font-medium">{flight.flight_number}</div>
                      <div className="body-small text-on-surface-variant">{flight.airline.name}</div>
                    </div>
                    {getStatusBadge(flight.status)}
                  </div>
                  
                  {/* Detalii zbor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="label-medium text-on-surface-variant">{type === 'arrivals' ? 'Din:' : 'Spre:'}</span>
                      <span className="body-medium text-on-surface font-medium">{relevantLocation.city}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="label-medium text-on-surface-variant">Ora:</span>
                      <div className="text-right">
                        <div className="body-medium text-on-surface font-medium">
                          {formatTime(flight.scheduled_time)}
                        </div>
                        {flight.estimated_time && flight.estimated_time !== flight.scheduled_time && (
                          <div className="label-small text-tertiary-40">
                            Est: {formatTime(flight.estimated_time)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(flight.terminal || flight.gate) && (
                      <div className="flex justify-between items-center">
                        <span className="label-medium text-on-surface-variant">Terminal:</span>
                        <div className="flex space-x-2">
                          {flight.terminal && (
                            <span className="inline-flex items-center px-2 py-1 bg-surface-container-high text-on-surface rounded-lg label-small font-medium">
                              T{flight.terminal}
                            </span>
                          )}
                          {flight.gate && (
                            <span className="inline-flex items-center px-2 py-1 bg-surface-container-high text-on-surface rounded-lg label-small font-medium">
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