/**
 * Flight Search Page - Căutare avansată de zboruri
 */

'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Search, Plane, MapPin, Clock } from 'lucide-react';

interface SearchResult {
  flight: any;
  relevanceScore: number;
}

interface RouteInfo {
  departure: any;
  arrival: any;
  distance?: number;
  flights: any[];
  averageFlightTime?: number;
}

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'flight' | 'route'>('flight');
  const [flightNumber, setFlightNumber] = useState('');
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [flightResults, setFlightResults] = useState<SearchResult[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchFlight = async () => {
    if (!flightNumber.trim()) {
      setError('Introduceți numărul zborului');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flights/search?flight=${encodeURIComponent(flightNumber)}&date=${searchDate}`);
      const data = await response.json();

      if (data.success) {
        setFlightResults(data.data);
        if (data.data.length === 0) {
          setError('Nu au fost găsite zboruri cu acest număr');
        }
      } else {
        setError(data.error || 'Eroare la căutarea zborului');
      }
    } catch (err) {
      setError('Eroare de conexiune');
    } finally {
      setLoading(false);
    }
  };

  const searchRoute = async () => {
    if (!fromAirport.trim() || !toAirport.trim()) {
      setError('Introduceți ambele aeroporturi');
      return;
    }

    if (fromAirport.length !== 3 || toAirport.length !== 3) {
      setError('Codurile aeroporturilor trebuie să aibă 3 caractere (ex: OTP)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flights/route/${(fromAirport || '').toUpperCase()}/${(toAirport || '').toUpperCase()}?date=${searchDate}`);
      const data = await response.json();

      if (data.success) {
        setRouteInfo(data.data);
      } else {
        setError(data.error || 'Eroare la căutarea rutei');
      }
    } catch (err) {
      setError('Eroare de conexiune');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchType === 'flight') {
      searchFlight();
    } else {
      searchRoute();
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (km: number) => {
    return `${Math.round(km)} km`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Search className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Căutare Zboruri</h1>
            </div>
            <p className="text-white/85 text-sm">Căutați zboruri după numărul de zbor sau explorați rute între aeroporturi</p>
          </div>

          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setSearchType('flight')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  searchType === 'flight' ? 'bg-white/25 text-white border border-white/20' : 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
                }`}
              >
                Număr zbor
              </button>
              <button
                onClick={() => setSearchType('route')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  searchType === 'route' ? 'bg-white/25 text-white border border-white/20' : 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
                }`}
              >
                Rută
              </button>
            </div>

            {searchType === 'flight' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white/90 mb-1">Numărul zborului</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="ex: RO123, LH456"
                    className="w-full px-3 py-2 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 text-sm"
                  />
                </div>
              </div>
            )}

            {searchType === 'route' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/90 mb-1">De la (aeroport)</label>
                  <input
                    type="text"
                    value={fromAirport}
                    onChange={(e) => setFromAirport(e.target.value)}
                    placeholder="ex: OTP"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/50 uppercase focus:ring-2 focus:ring-white/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/90 mb-1">La (aeroport)</label>
                  <input
                    type="text"
                    value={toAirport}
                    onChange={(e) => setToAirport(e.target.value)}
                    placeholder="ex: LHR"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/50 uppercase focus:ring-2 focus:ring-white/30 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-white/90 mb-1">Data</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-white/20 rounded-xl bg-white/10 text-white focus:ring-2 focus:ring-white/30 text-sm [color-scheme:dark]"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-white/25 text-white rounded-xl hover:bg-white/35 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loading ? 'Căutare...' : 'Căutare'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-400/40 rounded-xl">
                <p className="text-white text-sm">{error}</p>
              </div>
            )}
          </div>

          {flightResults.length > 0 && (
            <div className="glass-card rounded-2xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Rezultate căutare zbor ({flightResults.length})</h2>
              <div className="space-y-3">
                {flightResults.map((result, index) => (
                  <div key={index} className="bg-white/10 border border-white/20 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-white" />
                        <div>
                          <h3 className="font-semibold text-white text-sm">{result.flight.number?.iata || result.flight.number?.icao}</h3>
                          <p className="text-xs text-white/80">{result.flight.airline?.name}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-lg">{result.relevanceScore}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-white/70">Plecare:</p>
                        <p className="font-medium text-white">{result.flight.departure?.airport?.name} ({result.flight.departure?.airport?.iata})</p>
                        <p className="text-white/80">{result.flight.departure?.scheduledTime?.local && new Date(result.flight.departure.scheduledTime.local).toLocaleString('ro-RO')}</p>
                      </div>
                      <div>
                        <p className="text-white/70">Sosire:</p>
                        <p className="font-medium text-white">{result.flight.arrival?.airport?.name} ({result.flight.arrival?.airport?.iata})</p>
                        <p className="text-white/80">{result.flight.arrival?.scheduledTime?.local && new Date(result.flight.arrival.scheduledTime.local).toLocaleString('ro-RO')}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-3 text-xs">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        result.flight.status?.text?.toLowerCase().includes('cancel') ? 'bg-red-500/30 text-white'
                        : result.flight.status?.text?.toLowerCase().includes('delay') ? 'bg-amber-500/30 text-white'
                        : 'bg-emerald-500/30 text-white'
                      }`}>{result.flight.status?.text || 'Unknown'}</span>
                      {result.flight.aircraft?.model && <span className="text-white/80">{result.flight.aircraft.model}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {routeInfo && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white mb-3">Informații Rută</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-white mb-1 text-sm">Plecare</h3>
                  <p className="text-sm font-semibold text-white">{routeInfo.departure.name}</p>
                  <p className="text-xs text-white/80">{routeInfo.departure.municipalityName}, {routeInfo.departure.countryCode}</p>
                  <p className="text-xs text-white/60">{routeInfo.departure.iata} / {routeInfo.departure.icao}</p>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1 text-sm">Sosire</h3>
                  <p className="text-sm font-semibold text-white">{routeInfo.arrival.name}</p>
                  <p className="text-xs text-white/80">{routeInfo.arrival.municipalityName}, {routeInfo.arrival.countryCode}</p>
                  <p className="text-xs text-white/60">{routeInfo.arrival.iata} / {routeInfo.arrival.icao}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{routeInfo.distance ? formatDistance(routeInfo.distance) : 'N/A'}</p>
                  <p className="text-xs text-white/80">Distanță</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{routeInfo.averageFlightTime ? formatDuration(routeInfo.averageFlightTime) : 'N/A'}</p>
                  <p className="text-xs text-white/80">Durata medie</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{routeInfo.flights.length}</p>
                  <p className="text-xs text-white/80">Zboruri astăzi</p>
                </div>
              </div>
              {routeInfo.flights.length > 0 && (
                <div>
                  <h3 className="font-medium text-white mb-2 text-sm">Zboruri disponibile ({routeInfo.flights.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {routeInfo.flights.map((flight, index) => (
                      <div key={index} className="bg-white/10 border border-white/20 rounded-xl p-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Plane className="h-3 w-3 text-white" />
                            <div>
                              <span className="font-medium text-white text-sm">{flight.number?.iata || flight.number?.icao}</span>
                              <span className="ml-2 text-xs text-white/80">{flight.airline?.name}</span>
                            </div>
                          </div>
                          <div className="text-right text-xs text-white/90">
                            <p className="flex items-center justify-end space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {flight.departure?.scheduledTime?.local && new Date(flight.departure.scheduledTime.local).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                                → {flight.arrival?.scheduledTime?.local && new Date(flight.arrival.scheduledTime.local).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                            <p className="text-white/70">{flight.status?.text || 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}