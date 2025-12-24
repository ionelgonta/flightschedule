/**
 * Flight Search Page - Căutare avansată de zboruri
 */

'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Căutare Zboruri
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Căutați zboruri după numărul de zbor sau explorați rute între aeroporturi
            </p>
          </div>

          {/* Search Type Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setSearchType('flight')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'flight'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Căutare după numărul zborului
              </button>
              <button
                onClick={() => setSearchType('route')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === 'route'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Căutare rută
              </button>
            </div>

            {/* Flight Number Search */}
            {searchType === 'flight' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numărul zborului
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="ex: RO123, LH456"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Route Search */}
            {searchType === 'route' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    De la (aeroport)
                  </label>
                  <input
                    type="text"
                    value={fromAirport}
                    onChange={(e) => setFromAirport(e.target.value)}
                    placeholder="ex: OTP"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    La (aeroport)
                  </label>
                  <input
                    type="text"
                    value={toAirport}
                    onChange={(e) => setToAirport(e.target.value)}
                    placeholder="ex: LHR"
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                  />
                </div>
              </div>
            )}

            {/* Date and Search Button */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Căutare...' : 'Căutare'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Flight Results */}
          {flightResults.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Rezultate căutare zbor ({flightResults.length})
              </h2>
              <div className="space-y-4">
                {flightResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {result.flight.number?.iata || result.flight.number?.icao}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.flight.airline?.name}
                        </p>
                      </div>
                      <span className="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                        Relevanță: {result.relevanceScore}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Plecare:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {result.flight.departure?.airport?.name} ({result.flight.departure?.airport?.iata})
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {result.flight.departure?.scheduledTime?.local && 
                            new Date(result.flight.departure.scheduledTime.local).toLocaleString('ro-RO')
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Sosire:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {result.flight.arrival?.airport?.name} ({result.flight.arrival?.airport?.iata})
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {result.flight.arrival?.scheduledTime?.local && 
                            new Date(result.flight.arrival.scheduledTime.local).toLocaleString('ro-RO')
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.flight.status?.text?.toLowerCase().includes('cancel') 
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          : result.flight.status?.text?.toLowerCase().includes('delay')
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      }`}>
                        {result.flight.status?.text || 'Unknown'}
                      </span>
                      
                      {result.flight.aircraft?.model && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {result.flight.aircraft.model}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Info */}
          {routeInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Informații Rută
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Plecare</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {routeInfo.departure.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {routeInfo.departure.municipalityName}, {routeInfo.departure.countryCode}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {routeInfo.departure.iata} / {routeInfo.departure.icao}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Sosire</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {routeInfo.arrival.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {routeInfo.arrival.municipalityName}, {routeInfo.arrival.countryCode}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {routeInfo.arrival.iata} / {routeInfo.arrival.icao}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {routeInfo.distance ? formatDistance(routeInfo.distance) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Distanță</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {routeInfo.averageFlightTime ? formatDuration(routeInfo.averageFlightTime) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Durata medie</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {routeInfo.flights.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Zboruri astăzi</p>
                </div>
              </div>

              {routeInfo.flights.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Zboruri disponibile ({routeInfo.flights.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {routeInfo.flights.map((flight, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {flight.number?.iata || flight.number?.icao}
                            </span>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {flight.airline?.name}
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-900 dark:text-white">
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
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
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