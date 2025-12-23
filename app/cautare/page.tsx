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
      const response = await fetch(`/api/flights/route/${fromAirport.toUpperCase()}/${toAirport.toUpperCase()}?date=${searchDate}`);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Compact Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Search className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Căutare Zboruri
              </h1>
            </div>
            <p className="text-gray-600 text-sm">
              Căutați zboruri după numărul de zbor sau explorați rute între aeroporturi
            </p>
          </div>

          {/* Compact Search Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            {/* Search Type Selector - Compact */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setSearchType('flight')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'flight'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Număr zbor
              </button>
              <button
                onClick={() => setSearchType('route')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'route'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rută
              </button>
            </div>

            {/* Flight Number Search - Compact */}
            {searchType === 'flight' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Numărul zborului
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="ex: RO123, LH456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Route Search - Compact */}
            {searchType === 'route' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    De la (aeroport)
                  </label>
                  <input
                    type="text"
                    value={fromAirport}
                    onChange={(e) => setFromAirport(e.target.value)}
                    placeholder="ex: OTP"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 uppercase text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    La (aeroport)
                  </label>
                  <input
                    type="text"
                    value={toAirport}
                    onChange={(e) => setToAirport(e.target.value)}
                    placeholder="ex: LHR"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 uppercase text-sm"
                  />
                </div>
              </div>
            )}

            {/* Date and Search Button - Compact */}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loading ? 'Căutare...' : 'Căutare'}
                </button>
              </div>
            </div>

            {/* Error Message - Compact */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Flight Results - Compact */}
          {flightResults.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Rezultate căutare zbor ({flightResults.length})
              </h2>
              <div className="space-y-3">
                {flightResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {result.flight.number?.iata || result.flight.number?.icao}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {result.flight.airline?.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {result.relevanceScore}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600">Plecare:</p>
                        <p className="font-medium text-gray-900">
                          {result.flight.departure?.airport?.name} ({result.flight.departure?.airport?.iata})
                        </p>
                        <p className="text-gray-600">
                          {result.flight.departure?.scheduledTime?.local && 
                            new Date(result.flight.departure.scheduledTime.local).toLocaleString('ro-RO')
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sosire:</p>
                        <p className="font-medium text-gray-900">
                          {result.flight.arrival?.airport?.name} ({result.flight.arrival?.airport?.iata})
                        </p>
                        <p className="text-gray-600">
                          {result.flight.arrival?.scheduledTime?.local && 
                            new Date(result.flight.arrival.scheduledTime.local).toLocaleString('ro-RO')
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-3 text-xs">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.flight.status?.text?.toLowerCase().includes('cancel') 
                          ? 'bg-red-100 text-red-800'
                          : result.flight.status?.text?.toLowerCase().includes('delay')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {result.flight.status?.text || 'Unknown'}
                      </span>
                      
                      {result.flight.aircraft?.model && (
                        <span className="text-gray-600">
                          {result.flight.aircraft.model}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Info - Compact */}
          {routeInfo && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Informații Rută
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1 text-sm">Plecare</h3>
                  <p className="text-sm font-semibold text-gray-900">
                    {routeInfo.departure.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {routeInfo.departure.municipalityName}, {routeInfo.departure.countryCode}
                  </p>
                  <p className="text-xs text-gray-500">
                    {routeInfo.departure.iata} / {routeInfo.departure.icao}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1 text-sm">Sosire</h3>
                  <p className="text-sm font-semibold text-gray-900">
                    {routeInfo.arrival.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {routeInfo.arrival.municipalityName}, {routeInfo.arrival.countryCode}
                  </p>
                  <p className="text-xs text-gray-500">
                    {routeInfo.arrival.iata} / {routeInfo.arrival.icao}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-md">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {routeInfo.distance ? formatDistance(routeInfo.distance) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600">Distanță</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {routeInfo.averageFlightTime ? formatDuration(routeInfo.averageFlightTime) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600">Durata medie</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {routeInfo.flights.length}
                  </p>
                  <p className="text-xs text-gray-600">Zboruri astăzi</p>
                </div>
              </div>

              {routeInfo.flights.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">
                    Zboruri disponibile ({routeInfo.flights.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {routeInfo.flights.map((flight, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Plane className="h-3 w-3 text-blue-600" />
                            <div>
                              <span className="font-medium text-gray-900 text-sm">
                                {flight.number?.iata || flight.number?.icao}
                              </span>
                              <span className="ml-2 text-xs text-gray-600">
                                {flight.airline?.name}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <p className="text-gray-900 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {flight.departure?.scheduledTime?.local && 
                                  new Date(flight.departure.scheduledTime.local).toLocaleTimeString('ro-RO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                } → {flight.arrival?.scheduledTime?.local && 
                                  new Date(flight.arrival.scheduledTime.local).toLocaleTimeString('ro-RO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                }
                              </span>
                            </p>
                            <p className="text-gray-600">
                              {flight.status?.text || 'Unknown'}
                            </p>
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