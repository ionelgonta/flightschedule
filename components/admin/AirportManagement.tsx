/**
 * Airport Management Component - Interfață pentru managementul bazei de date de aeroporturi
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Database, 
  Search, 
  Download, 
  RefreshCw, 
  MapPin, 
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface AirportRecord {
  id?: number;
  iata_code: string;
  icao_code?: string;
  name: string;
  short_name?: string;
  city?: string;
  municipality_name?: string;
  country_code?: string;
  country_name?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  elevation_feet?: number;
  source: string;
  discovered_from_cache: boolean;
  last_updated: string;
  created_at: string;
  is_active: boolean;
  has_flight_data: boolean;
  last_flight_check?: string;
}

interface AirportStats {
  totalAirports: number;
  activeAirports: number;
  airportsWithFlightData: number;
  countriesCount: number;
  lastUpdated: string | null;
}

interface ProcessingResults {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export default function AirportManagement() {
  const [stats, setStats] = useState<AirportStats | null>(null);
  const [airports, setAirports] = useState<AirportRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AirportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  const [cacheIataCodes, setCacheIataCodes] = useState<string[]>([]);

  // Încarcă statisticile la pornire
  useEffect(() => {
    loadStats();
    loadAirports();
    extractCacheIataCodes();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/airports?action=stats', {
        headers: {
          'Authorization': `Basic ${btoa('admin:FlightSchedule2024!')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load airport stats:', error);
    }
  };

  const loadAirports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/airports?action=list', {
        headers: {
          'Authorization': `Basic ${btoa('admin:FlightSchedule2024!')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAirports(data.airports);
      }
    } catch (error) {
      console.error('Failed to load airports:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractCacheIataCodes = async () => {
    try {
      const response = await fetch('/api/admin/airports?action=extract-cache', {
        headers: {
          'Authorization': `Basic ${btoa('admin:FlightSchedule2024!')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCacheIataCodes(data.iataCodes);
      }
    } catch (error) {
      console.error('Failed to extract cache IATA codes:', error);
    }
  };

  const searchAirports = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/airports?action=search&query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Basic ${btoa('admin:FlightSchedule2024!')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.airports);
      }
    } catch (error) {
      console.error('Failed to search airports:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAllAirports = async () => {
    try {
      setProcessing(true);
      setProcessingResults(null);
      
      const response = await fetch('/api/admin/airports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:FlightSchedule2024!')}`
        },
        body: JSON.stringify({ action: 'process-all' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProcessingResults(data.results);
        
        // Reîncarcă statisticile și lista de aeroporturi
        await loadStats();
        await loadAirports();
      } else {
        const error = await response.json();
        console.error('Failed to process airports:', error);
      }
    } catch (error) {
      console.error('Failed to process airports:', error);
    } finally {
      setProcessing(false);
    }
  };

  const processSingleAirport = async (iataCode: string) => {
    try {
      const response = await fetch('/api/airports/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ iataCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Successfully processed ${iataCode}`);
        // Reîncarcă datele
        await loadStats();
        await loadAirports();
      } else {
        console.error(`Failed to process ${iataCode}:`, data.message);
      }
    } catch (error) {
      console.error(`Error processing ${iataCode}:`, error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO');
  };

  const displayAirports = searchQuery.trim() ? searchResults : airports;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Managementul Aeroporturilor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestionează baza de date de aeroporturi din cache și AeroDataBox
          </p>
        </div>
        <Button
          onClick={processAllAirports}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {processing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Procesez...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Procesează Toate
            </>
          )}
        </Button>
      </div>

      {/* Statistici */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Aeroporturi</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAirports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeAirports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cu Date Zboruri</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.airportsWithFlightData}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Țări</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.countriesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cache IATA</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{cacheIataCodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rezultatele procesării */}
      {processingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Rezultatele Procesării</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{processingResults.processed}</p>
                <p className="text-sm text-gray-600">Procesate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{processingResults.successful}</p>
                <p className="text-sm text-gray-600">Reușite</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{processingResults.skipped}</p>
                <p className="text-sm text-gray-600">Omise</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{processingResults.failed}</p>
                <p className="text-sm text-gray-600">Eșuate</p>
              </div>
            </div>
            
            {processingResults.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Erori:</h4>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {processingResults.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Căutare */}
      <Card>
        <CardHeader>
          <CardTitle>Căutare Aeroporturi</CardTitle>
          <CardDescription>
            Caută după cod IATA, ICAO, nume, oraș sau țară
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Caută aeroporturi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAirports()}
            />
            <Button onClick={searchAirports} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de aeroporturi */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery.trim() ? `Rezultate căutare (${displayAirports.length})` : `Toate Aeroporturile (${displayAirports.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Se încarcă...</span>
            </div>
          ) : displayAirports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery.trim() ? 'Nu s-au găsit aeroporturi' : 'Nu există aeroporturi în baza de date'}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayAirports.map((airport) => (
                <div
                  key={airport.iata_code}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge className="font-mono border border-gray-300">
                          {airport.iata_code}
                        </Badge>
                        {airport.icao_code && (
                          <Badge className="font-mono text-xs bg-gray-100 text-gray-800">
                            {airport.icao_code}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {airport.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          {airport.city && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{airport.city}</span>
                            </span>
                          )}
                          {airport.country_code && (
                            <span className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>{airport.country_code}</span>
                            </span>
                          )}
                          {airport.timezone && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{airport.timezone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {airport.is_active && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Activ
                      </Badge>
                    )}
                    {airport.has_flight_data && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Date Zboruri
                      </Badge>
                    )}
                    {airport.discovered_from_cache && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Din Cache
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coduri IATA din cache */}
      {cacheIataCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Coduri IATA din Cache ({cacheIataCodes.length})</CardTitle>
            <CardDescription>
              Codurile IATA descoperite în cache-ul de zboruri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cacheIataCodes.map((code) => (
                <Badge key={code} className="font-mono border border-gray-300">
                  {code}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}