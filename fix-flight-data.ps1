# Fix Flight Data Loading - Environment Variables Issue
$ServerIP = "23.88.113.154"
$Password = "FlightSchedule2024!"

Write-Host "Fixing flight data loading issue..." -ForegroundColor Cyan

# Create updated flight repository with proper environment handling
$flightRepoContent = @'
/**
 * Flight Repository - Gestionează cache-ul local și logica de preluare date
 * Implementează cache în memorie cu fallback la localStorage pentru persistență
 */

import FlightApiService, { FlightApiResponse, RawFlightData, API_CONFIGS } from './flightApiService';

export interface CachedFlightData {
  airport_code: string;
  type: 'arrivals' | 'departures';
  data: RawFlightData[];
  updated_at: string;
  expires_at: string;
  success: boolean;
  error?: string;
}

export interface FlightFilters {
  airline?: string;
  status?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

class FlightRepository {
  private cache: Map<string, CachedFlightData> = new Map();
  private apiService: FlightApiService;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly STORAGE_KEY = 'flight_cache';

  constructor() {
    // Inițializează API service cu configurația din environment
    const provider = (process.env.NEXT_PUBLIC_FLIGHT_API_PROVIDER || 'aerodatabox') as keyof typeof API_CONFIGS;
    
    // Get API key from environment - try multiple sources
    const apiKey = process.env.NEXT_PUBLIC_FLIGHT_API_KEY || 
                   process.env.FLIGHT_API_KEY || 
                   'cmj2peefi0001la04p5rkbbcc'; // fallback to known working key
    
    console.log('FlightRepository: Initializing with provider:', provider);
    console.log('FlightRepository: API key available:', !!apiKey);
    console.log('FlightRepository: API key prefix:', apiKey.substring(0, 8) + '...');
    
    const apiConfig = {
      ...API_CONFIGS[provider],
      apiKey: apiKey
    };
    
    this.apiService = new FlightApiService(apiConfig);
    this.loadCacheFromStorage();
  }

  /**
   * Încarcă cache-ul din localStorage la inițializare
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        Object.entries(parsedCache).forEach(([key, value]) => {
          this.cache.set(key, value as CachedFlightData);
        });
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  /**
   * Salvează cache-ul în localStorage
   */
  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheObject = Object.fromEntries(this.cache);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  /**
   * Generează cheia de cache
   */
  private getCacheKey(airportCode: string, type: 'arrivals' | 'departures'): string {
    return `${airportCode}_${type}`;
  }

  /**
   * Verifică dacă datele din cache sunt valide
   */
  private isCacheValid(cachedData: CachedFlightData): boolean {
    const now = new Date();
    const expiresAt = new Date(cachedData.expires_at);
    return now < expiresAt;
  }

  /**
   * Obține sosirile pentru un aeroport (cu cache)
   */
  async getArrivals(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    const cacheKey = this.getCacheKey(airportCode, 'arrivals');
    const cachedData = this.cache.get(cacheKey);

    // Verifică cache-ul
    if (cachedData && this.isCacheValid(cachedData)) {
      console.log(`Cache HIT for ${airportCode} arrivals`);
      
      return {
        success: cachedData.success,
        data: this.applyFilters(cachedData.data, filters),
        error: cachedData.error,
        cached: true,
        last_updated: cachedData.updated_at,
        airport_code: airportCode,
        type: 'arrivals'
      };
    }

    // Cache miss - fetch din API
    console.log(`Cache MISS for ${airportCode} arrivals - fetching from API`);
    
    try {
      const apiResponse = await this.apiService.getArrivals(airportCode);
      
      // Salvează în cache
      const cacheData: CachedFlightData = {
        airport_code: airportCode,
        type: 'arrivals',
        data: apiResponse.data,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
        success: apiResponse.success,
        error: apiResponse.error
      };
      
      this.cache.set(cacheKey, cacheData);
      this.saveCacheToStorage();

      return {
        ...apiResponse,
        data: this.applyFilters(apiResponse.data, filters),
        cached: false
      };

    } catch (error) {
      console.error(`Error fetching arrivals for ${airportCode}:`, error);
      
      // Returnează cache expirat dacă există, altfel eroare
      if (cachedData) {
        return {
          success: false,
          data: this.applyFilters(cachedData.data, filters),
          error: 'API unavailable, showing cached data',
          cached: true,
          last_updated: cachedData.updated_at,
          airport_code: airportCode,
          type: 'arrivals'
        };
      }

      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Obține plecările pentru un aeroport (cu cache)
   */
  async getDepartures(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    const cacheKey = this.getCacheKey(airportCode, 'departures');
    const cachedData = this.cache.get(cacheKey);

    // Verifică cache-ul
    if (cachedData && this.isCacheValid(cachedData)) {
      console.log(`Cache HIT for ${airportCode} departures`);
      
      return {
        success: cachedData.success,
        data: this.applyFilters(cachedData.data, filters),
        error: cachedData.error,
        cached: true,
        last_updated: cachedData.updated_at,
        airport_code: airportCode,
        type: 'departures'
      };
    }

    // Cache miss - fetch din API
    console.log(`Cache MISS for ${airportCode} departures - fetching from API`);
    
    try {
      const apiResponse = await this.apiService.getDepartures(airportCode);
      
      // Salvează în cache
      const cacheData: CachedFlightData = {
        airport_code: airportCode,
        type: 'departures',
        data: apiResponse.data,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
        success: apiResponse.success,
        error: apiResponse.error
      };
      
      this.cache.set(cacheKey, cacheData);
      this.saveCacheToStorage();

      return {
        ...apiResponse,
        data: this.applyFilters(apiResponse.data, filters),
        cached: false
      };

    } catch (error) {
      console.error(`Error fetching departures for ${airportCode}:`, error);
      
      // Returnează cache expirat dacă există
      if (cachedData) {
        return {
          success: false,
          data: this.applyFilters(cachedData.data, filters),
          error: 'API unavailable, showing cached data',
          cached: true,
          last_updated: cachedData.updated_at,
          airport_code: airportCode,
          type: 'departures'
        };
      }

      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }
  }

  /**
   * Aplică filtrele pe datele de zbor
   */
  private applyFilters(flights: RawFlightData[], filters?: FlightFilters): RawFlightData[] {
    if (!filters) return flights;

    let filtered = flights;

    // Filtru după companie aeriană
    if (filters.airline) {
      const airlineFilter = filters.airline.toLowerCase();
      filtered = filtered.filter(flight => 
        flight.airline.name.toLowerCase().includes(airlineFilter) ||
        flight.airline.code.toLowerCase().includes(airlineFilter)
      );
    }

    // Filtru după status
    if (filters.status) {
      filtered = filtered.filter(flight => flight.status === filters.status);
    }

    // Filtru după interval orar
    if (filters.timeRange) {
      filtered = filtered.filter(flight => {
        const flightTime = new Date(flight.scheduled_time);
        const startTime = new Date(filters.timeRange!.start);
        const endTime = new Date(filters.timeRange!.end);
        
        return flightTime >= startTime && flightTime <= endTime;
      });
    }

    return filtered;
  }

  /**
   * Preîncarcă datele pentru toate aeroporturile importante
   */
  async preloadAirports(airportCodes: string[]): Promise<void> {
    console.log('Preloading flight data for airports:', airportCodes);
    
    const promises = airportCodes.flatMap(code => [
      this.getArrivals(code),
      this.getDepartures(code)
    ]);

    try {
      await Promise.allSettled(promises);
      console.log('Airport data preloading completed');
    } catch (error) {
      console.error('Error during airport preloading:', error);
    }
  }

  /**
   * Curăță cache-ul expirat
   */
  cleanExpiredCache(): void {
    const now = new Date();
    let cleanedCount = 0;

    this.cache.forEach((data, key) => {
      if (new Date(data.expires_at) < now) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} expired cache entries`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Obține statistici cache
   */
  getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    hitRate: number;
  } {
    const now = new Date();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach((data) => {
      if (new Date(data.expires_at) > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(this.cache.size, 1)
    };
  }

  /**
   * Invalidează cache-ul pentru un aeroport specific
   */
  invalidateAirport(airportCode: string): void {
    const arrivalsKey = this.getCacheKey(airportCode, 'arrivals');
    const departuresKey = this.getCacheKey(airportCode, 'departures');
    
    this.cache.delete(arrivalsKey);
    this.cache.delete(departuresKey);
    this.saveCacheToStorage();
    
    console.log(`Cache invalidated for airport ${airportCode}`);
  }

  /**
   * Curăță complet cache-ul
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    console.log('Flight cache cleared completely');
  }
}

// Singleton instance
let flightRepositoryInstance: FlightRepository | null = null;

export function getFlightRepository(): FlightRepository {
  if (!flightRepositoryInstance) {
    flightRepositoryInstance = new FlightRepository();
  }
  return flightRepositoryInstance;
}

export default FlightRepository;
'@

# Save the updated file
$flightRepoContent | Out-File -FilePath "flightRepository-fixed.ts" -Encoding UTF8

# Upload to server
Write-Host "Uploading fixed flight repository..." -ForegroundColor Yellow
pscp -pw $Password "flightRepository-fixed.ts" root@${ServerIP}:/tmp/

# Update the file on server and restart
Write-Host "Applying fix on server..." -ForegroundColor Yellow
$updateCmd = "plink -ssh -pw $Password root@$ServerIP `"cd /opt/anyway-flight-schedule && cp /tmp/flightRepository-fixed.ts lib/flightRepository.ts && docker-compose restart flight-schedule`""
Invoke-Expression $updateCmd

# Clean up
Remove-Item "flightRepository-fixed.ts" -ErrorAction SilentlyContinue

Write-Host "Flight data fix applied! Testing..." -ForegroundColor Green