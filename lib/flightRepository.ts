/**
 * Flight Repository - Folosește noul sistem de cache centralizat
 * NU mai face request-uri API direct - doar citește din cache
 */

import { cacheManager } from './cacheManager';
import { RawFlightData } from './flightApiService';

export interface FlightFilters {
  airline?: string;
  status?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface FlightApiResponse {
  success: boolean;
  data: RawFlightData[];
  error?: string;
  cached: boolean;
  last_updated?: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
}

class FlightRepository {
  constructor() {
    // Inițializează cache manager-ul
    cacheManager.initialize().catch(console.error);
  }

  /**
   * Generează cheia de cache
   */
  private getCacheKey(airportCode: string, type: 'arrivals' | 'departures'): string {
    return `${airportCode}_${type}`;
  }

  /**
   * Obține sosirile pentru un aeroport (DOAR din cache)
   */
  async getArrivals(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    const cacheKey = this.getCacheKey(airportCode, 'arrivals');
    
    try {
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = cacheManager.getCachedData<RawFlightData[]>(cacheKey);
      
      if (cachedData && cachedData.length > 0) {
        console.log(`Cache HIT for ${airportCode} arrivals`);
        
        return {
          success: true,
          data: this.applyFilters(cachedData, filters),
          cached: true,
          last_updated: new Date().toISOString(),
          airport_code: airportCode,
          type: 'arrivals'
        };
      }

      // Nu există date în cache
      console.log(`No cached data for ${airportCode} arrivals`);
      
      return {
        success: false,
        data: [],
        error: 'Nu sunt disponibile date pentru acest aeroport. Cache-ul se actualizează automat.',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };

    } catch (error) {
      console.error(`Error getting cached arrivals for ${airportCode}:`, error);
      
      return {
        success: false,
        data: [],
        error: 'Eroare la accesarea datelor din cache',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Obține plecările pentru un aeroport (DOAR din cache)
   */
  async getDepartures(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    const cacheKey = this.getCacheKey(airportCode, 'departures');
    
    try {
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = cacheManager.getCachedData<RawFlightData[]>(cacheKey);
      
      if (cachedData && cachedData.length > 0) {
        console.log(`Cache HIT for ${airportCode} departures`);
        
        return {
          success: true,
          data: this.applyFilters(cachedData, filters),
          cached: true,
          last_updated: new Date().toISOString(),
          airport_code: airportCode,
          type: 'departures'
        };
      }

      // Nu există date în cache
      console.log(`No cached data for ${airportCode} departures`);
      
      return {
        success: false,
        data: [],
        error: 'Nu sunt disponibile date pentru acest aeroport. Cache-ul se actualizează automat.',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };

    } catch (error) {
      console.error(`Error getting cached departures for ${airportCode}:`, error);
      
      return {
        success: false,
        data: [],
        error: 'Eroare la accesarea datelor din cache',
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
   * Refresh manual pentru un aeroport specific
   */
  async refreshAirport(airportCode: string): Promise<void> {
    console.log(`Manual refresh triggered for airport ${airportCode}`);
    await cacheManager.manualRefresh('flightData', airportCode);
  }

  /**
   * Obține statistici cache din cache manager
   */
  getCacheStats() {
    return cacheManager.getCacheStats();
  }

  /**
   * Update cache configuration
   */
  async updateCacheConfig(realtimeInterval: number): Promise<void> {
    const currentStats = cacheManager.getCacheStats()
    const currentConfig = currentStats.config || {
      analytics: { cronInterval: 30, cacheMaxAge: 360 },
      aircraft: { cronInterval: 360, cacheMaxAge: 360 }
    }
    
    await cacheManager.updateConfig({
      flightData: {
        cronInterval: realtimeInterval,
        cacheUntilNext: true
      },
      analytics: currentConfig.analytics,
      aircraft: currentConfig.aircraft
    })
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