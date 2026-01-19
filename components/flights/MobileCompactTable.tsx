/**
 * MobileCompactTable - Tabelă ultra-compactă pentru mobile
 * Design inspirat din exemplul clasic, optimizat pentru ecrane mici
 */

'use client';

import { useState, useMemo } from 'react';
import { RawFlightData } from '@/lib/flightApiService';
import { formatTime } from '@/lib/flightUtils';
import { Search, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Status badge ultra-compact
const getUltraCompactStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'PROGRAMAT', className: 'bg-green-500 text-white' },
    active: { label: 'ÎN ZBOR', className: 'bg-blue-500 text-white' },
    landed: { label: 'ATERIZAT', className: 'bg-green-500 text-white' },
    arrived: { label: 'SOSIT', className: 'bg-green-500 text-white' },
    cancelled: { label: 'ANULAT', className: 'bg-red-500 text-white' },
    delayed: { label: 'ÎNTÂRZIAT', className: 'bg-orange-500 text-white' },
    diverted: { label: 'DEVIAT', className: 'bg-yellow-500 text-white' },
    boarding: { label: 'ÎMBARCARE', className: 'bg-purple-500 text-white' },
    departed: { label: 'PLECAT', className: 'bg-blue-500 text-white' },
    estimated: { label: 'ESTIMAT', className: 'bg-indigo-500 text-white' },
    unknown: { label: 'NECUNOSCUT', className: 'bg-gray-500 text-white' }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.unknown;
  
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
};

interface MobileCompactTableProps {
  flights: RawFlightData[];
  type: 'arrivals' | 'departures';
  loading?: boolean;
  error?: string;
}

export function MobileCompactTable({ 
  flights, 
  type, 
  loading = false, 
  error 
}: MobileCompactTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>(type);
  const router = useRouter();

  // Filtrare și sortare
  const filteredFlights = useMemo(() => {
    let filtered = flights;

    // Filtrare pe timp: 10 ore în urmă + toate viitoare
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
        (flight.origin?.city || '').toLowerCase().includes(search) ||
        (flight.destination?.city || '').toLowerCase().includes(search) ||
        (flight.origin?.code || '').toLowerCase().includes(search) ||
        (flight.destination?.code || '').toLowerCase().includes(search)
      );
    }

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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="animate-pulse space-y-2 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header compact cu tabs */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Tabs - FUNCȚIONALE */}
        <div className="flex">
          <button
            onClick={() => handleTabChange('arrivals')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium border-r border-gray-200 ${
              activeTab === 'arrivals' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-500 bg-white'
            }`}
          >
            <Plane className="h-4 w-4 rotate-45" />
            <span>Sosiri</span>
          </button>
          <button
            onClick={() => handleTabChange('departures')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium ${
              activeTab === 'departures' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-500 bg-white'
            }`}
          >
            <Plane className="h-4 w-4 -rotate-45" />
            <span>Plecări</span>
          </button>
        </div>

        {/* Căutare */}
        <div className="border-t border-gray-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Caută zbor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabelă ultra-compactă - Full width, no borders */}
      <div className="bg-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        {filteredFlights.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Plane className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Nu există zboruri' : `Nu sunt ${activeTab === 'arrivals' ? 'sosiri' : 'plecări'}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Header tabel ultra-compact - layout fix */}
            <div className="bg-gray-50 border-b border-gray-200 min-w-[400px]">
              <div className="grid grid-cols-5 gap-1 px-1 py-1 text-xs font-semibold text-gray-600 uppercase">
                <div className="text-left">CURSĂ</div>
                <div className="text-left">DEST</div>
                <div className="text-center">PROG</div>
                <div className="text-center">EST</div>
                <div className="text-center">STATUS</div>
              </div>
            </div>

            {/* Rânduri tabel ultra-compact - layout fix */}
            <div className="divide-y divide-gray-100 min-w-[400px]">
              {filteredFlights.map((flight, index) => {
                const relevantLocation = activeTab === 'arrivals' ? flight.origin : flight.destination;
                
                return (
                  <div 
                    key={`${flight.flight_number}-${index}`}
                    className="grid grid-cols-5 gap-1 px-1 py-1 hover:bg-gray-50 text-xs"
                  >
                    {/* Cursă */}
                    <div className="flex items-center">
                      <div className="font-bold text-gray-900 text-sm">
                        {flight.flight_number}
                      </div>
                    </div>

                    {/* Destinație */}
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
                      {flight.actual_time && (flight.status === 'landed' || flight.status === 'arrived') ? (
                        <div className="text-sm font-semibold text-green-600">
                          {formatTime(flight.actual_time)}
                        </div>
                      ) : flight.estimated_time && formatTime(flight.estimated_time) !== formatTime(flight.scheduled_time) ? (
                        <div className="text-sm font-semibold text-orange-600">
                          {formatTime(flight.estimated_time)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Status - cu text complet */}
                    <div className="flex items-center justify-center">
                      {getUltraCompactStatusBadge(flight.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredFlights.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Total: <span className="font-semibold">{filteredFlights.length}</span> zboruri
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 font-medium"
              >
                Resetează
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileCompactTable;