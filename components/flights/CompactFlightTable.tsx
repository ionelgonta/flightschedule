/**
 * CompactFlightTable - Tabelă compactă pentru afișarea zborurilor
 * Inspirată din designul clasic de tabel, adaptată la Material Design 3
 */

'use client';

import { useState, useMemo } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { formatTime } from '@/lib/flightUtils';
import { AirlineLogo } from '@/components/ui/AirlineLogo';
import { Search, Plane, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Status badge compact cu culori Material Design 3
const getCompactStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { 
      label: 'PROGRAMAT',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    active: { 
      label: 'ÎN ZBOR',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    landed: { 
      label: 'ATERIZAT',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    arrived: { 
      label: 'SOSIT',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    cancelled: { 
      label: 'ANULAT',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    delayed: { 
      label: 'ÎNTÂRZIAT',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    diverted: { 
      label: 'DEVIAT',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    boarding: { 
      label: 'ÎMBARCARE',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    departed: { 
      label: 'PLECAT',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    estimated: { 
      label: 'ESTIMAT',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    unknown: { 
      label: 'NECUNOSCUT',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.unknown;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
};

interface CompactFlightTableProps {
  flights: RawFlightData[];
  type: 'arrivals' | 'departures';
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
}

export function CompactFlightTable({ 
  flights, 
  type, 
  loading = false, 
  error,
  lastUpdated 
}: CompactFlightTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>(type);
  const router = useRouter();

  // Filtrare pe timp: 10 ore în urmă + toate viitoare
  const filteredFlights = useMemo(() => {
    let filtered = flights;

    // Filtrare pe timp
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    
    filtered = filtered.filter(flight => {
      const scheduledTime = new Date(flight.scheduled_time);
      return scheduledTime > tenHoursAgo; // Show flights from 10 hours ago onwards
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

    // Sortare după ora programată
    return filtered.sort((a, b) => 
      new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
    );
  }, [flights, searchTerm]);

  // Handle tab change
  const handleTabChange = (newType: 'arrivals' | 'departures') => {
    setActiveTab(newType);
    const currentPath = window.location.pathname;
    const airportSlug = currentPath.split('/')[2]; // Extract airport slug
    const newPath = newType === 'arrivals' ? 
      `/aeroport/${airportSlug}/sosiri` : 
      `/aeroport/${airportSlug}/plecari`;
    router.push(newPath);
  };

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
        <Plane className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Eroare la încărcarea datelor
        </h3>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-gray-100 h-12"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border-t border-gray-100 h-16 bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header cu tabs și căutare */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col space-y-3">
          {/* Tabs pentru Sosiri/Plecări - FUNCȚIONALE */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('arrivals')}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                activeTab === 'arrivals' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plane className="h-4 w-4 rotate-45" />
              <span>Sosiri</span>
            </button>
            <button
              onClick={() => handleTabChange('departures')}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                activeTab === 'departures' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plane className="h-4 w-4 -rotate-45" />
              <span>Plecări</span>
            </button>
          </div>

          {/* Căutare */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Caută ${activeTab === 'arrivals' ? 'sosiri' : 'plecări'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabelă compactă - Full width, no borders */}
      <div className="bg-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        {/* Header tabel */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-1 px-1 py-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <div className="text-left">CURSĂ</div>
            <div className="text-left">{activeTab === 'arrivals' ? 'ORIGINE' : 'DESTINAȚIE'}</div>
            <div className="text-center">PROG</div>
            <div className="text-center">EST</div>
            <div className="text-center">STATUS</div>
          </div>
        </div>

        {/* Rânduri tabel */}
        <div className="divide-y divide-gray-100">
          {filteredFlights.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Plane className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {searchTerm 
                  ? 'Nu există zboruri care să corespundă căutării'
                  : `Nu sunt ${activeTab === 'arrivals' ? 'sosiri' : 'plecări'} programate`
                }
              </p>
            </div>
          ) : (
            filteredFlights.map((flight, index) => {
              const relevantLocation = activeTab === 'arrivals' ? flight.origin : flight.destination;
              
              return (
                <div 
                  key={`${flight.flight_number}-${index}`}
                  className="grid grid-cols-5 gap-1 px-1 py-1 hover:bg-gray-50 transition-colors text-xs"
                >
                  {/* Număr cursă */}
                  <div className="flex items-center">
                    <div className="font-bold text-gray-900 text-sm">
                      {flight.flight_number}
                    </div>
                  </div>

                  {/* Destinație/Origine */}
                  <div className="flex items-center">
                    <div className="min-w-0">
                      <div className="font-semibold text-blue-600 text-sm truncate">
                        {relevantLocation?.city || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({relevantLocation?.code || 'N/A'})
                      </div>
                    </div>
                  </div>

                  {/* Ora programată */}
                  <div className="flex items-center justify-center px-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatTime(flight.scheduled_time)}
                    </div>
                  </div>

                  {/* Ora estimată */}
                  <div className="flex items-center justify-center px-0">
                    {flight.actual_time && flight.status === 'landed' ? (
                      <div className="text-sm font-semibold text-green-600">
                        {formatTime(flight.actual_time)}
                      </div>
                    ) : flight.estimated_time && flight.status === 'estimated' ? (
                      <div className="text-sm font-semibold text-orange-600">
                        {formatTime(flight.estimated_time)}
                      </div>
                    ) : flight.estimated_time && flight.estimated_time !== flight.scheduled_time ? (
                      <div className="text-sm font-semibold text-blue-600">
                        {formatTime(flight.estimated_time)}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>

                  {/* Status - cu text complet */}
                  <div className="flex items-center justify-center">
                    {getCompactStatusBadge(flight.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer cu statistici */}
      {filteredFlights.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
              <span className="text-gray-600">
                Total: <span className="font-semibold text-gray-900">{filteredFlights.length}</span> zboruri
              </span>
              {lastUpdated && (
                <span className="text-gray-500 text-xs sm:text-sm">
                  Actualizat: {new Date(lastUpdated).toLocaleTimeString('ro-RO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800 font-medium text-left sm:text-right"
              >
                Resetează căutarea
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactFlightTable;