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
  // Smart weather integration
  weather_info?: {
    city: string;
    temperature: number;
    feelsLike: number;
    description: string;
    icon: string;
    windSpeed: number;
    visibility: number;
    flightImpact: {
      severity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
      factors: string[];
      alertMessage?: string;
      delayProbability: number;
    };
    lastUpdated: string;
  };
  hasWeatherAlert?: boolean;
}

class FlightRepository {
  constructor() {
    // NU inițializa cache manager-ul aici - se inițializează automat la primul acces
  }

  /**
   * Generează cheia de cache - folosește IATA direct
   */
  private getCacheKey(airportCode: string, type: 'arrivals' | 'departures'): string {
    return `${airportCode}_${type}`;
  }

  /**
   * Mapează datele din cache la formatul așteptat de componentă
   * Folosește getCityName pentru a converti codurile IATA în nume de orașe
   */
  private mapCacheDataToRawFlightData(cacheData: any[]): RawFlightData[] {
    // Handle null, undefined, or non-array data
    if (!cacheData || !Array.isArray(cacheData)) {
      console.log('[Flight Repository] Invalid cache data provided to mapCacheDataToRawFlightData:', typeof cacheData);
      
      // Try to extract flights from nested structure if it's an object
      if (cacheData && typeof cacheData === 'object' && 'flights' in cacheData) {
        let actualData = (cacheData as any).flights
        
        // Handle deeply nested flights structure (corruption fix)
        while (actualData && typeof actualData === 'object' && 'flights' in actualData && !Array.isArray(actualData)) {
          actualData = (actualData as any).flights
        }
        
        if (Array.isArray(actualData)) {
          console.log('[Flight Repository] Extracted flights array from nested structure:', actualData.length);
          return this.mapCacheDataToRawFlightData(actualData)
        }
      }
      
      return [];
    }

    // Import getCityName function
    const { getCityName } = require('./airports');
    
    return cacheData.map(flight => {
      const originCode = flight.originCode || flight.origin?.code || '';
      const destinationCode = flight.destinationCode || flight.destination?.code || '';
      
      return {
        flight_number: flight.flightNumber || flight.flight_number || '',
        airline: {
          name: flight.airlineName || flight.airline?.name || 'Unknown Airline',
          code: flight.airlineCode || flight.airline?.code || 'XX',
          logo: flight.airline?.logo
        },
        origin: {
          airport: flight.originName || flight.origin?.airport || originCode || '',
          code: originCode,
          city: getCityName(originCode) // Use getCityName to convert IATA to city name
        },
        destination: {
          airport: flight.destinationName || flight.destination?.airport || destinationCode || '',
          code: destinationCode,
          city: getCityName(destinationCode) // Use getCityName to convert IATA to city name
        },
        scheduled_time: flight.scheduledTime || flight.scheduled_time || '',
        estimated_time: flight.estimatedTime || flight.estimated_time,
        actual_time: flight.actualTime || flight.actual_time,
        status: flight.status || 'unknown',
        gate: flight.gate,
        terminal: flight.terminal,
        aircraft: flight.aircraft,
        delay: flight.delayMinutes || flight.delay,
        callSign: flight.callSign,
        isCargo: flight.isCargo,
        baggageBelt: flight.baggageBelt,
        runway: flight.runway,
        registration: flight.registration,
        quality: flight.quality,
        lastUpdated: flight.lastUpdated
      };
    });
  }

  /**
   * Obține sosirile pentru un aeroport (DOAR din cache) cu informații meteo integrate
   */
  async getArrivals(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    try {
      // Asigură-te că cache manager-ul este inițializat
      await cacheManager.initialize()
      
      // Folosește noua metodă care returnează și datele meteo integrate
      const { flights, weather_info, hasWeatherAlert } = cacheManager.getFlightDataWithWeather<any[]>(airportCode, 'arrivals');
      
      // Verifică dacă există date de zboruri în cache
      if (flights !== null) {
        console.log(`Cache HIT for ${airportCode} arrivals - ${Array.isArray(flights) ? flights.length : 'unknown'} flights`);
        
        // Ensure flights is an array before mapping
        const flightArray = Array.isArray(flights) ? flights : [];
        
        // Mapează datele din cache la formatul așteptat
        const mappedData = this.mapCacheDataToRawFlightData(flightArray);
        
        // Procesează automat codurile IATA noi găsite în datele de zboruri (doar pe server)
        if (typeof window === 'undefined') {
          this.processNewAirportCodes(flights);
        }
        
        return {
          success: true,
          data: this.applyFilters(mappedData, filters),
          cached: true,
          last_updated: new Date().toISOString(),
          airport_code: airportCode,
          type: 'arrivals',
          weather_info: weather_info || undefined,
          hasWeatherAlert: hasWeatherAlert || false
        };
      }

      // Nu există intrare în cache
      console.log(`No cached entry for ${airportCode} arrivals`);
      
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
   * Obține plecările pentru un aeroport (DOAR din cache) cu informații meteo integrate
   */
  async getDepartures(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    try {
      // Asigură-te că cache manager-ul este inițializat
      await cacheManager.initialize()
      
      // Folosește noua metodă care returnează și datele meteo integrate
      const { flights, weather_info, hasWeatherAlert } = cacheManager.getFlightDataWithWeather<any[]>(airportCode, 'departures');
      
      // Verifică dacă există date de zboruri în cache
      if (flights !== null) {
        console.log(`Cache HIT for ${airportCode} departures - ${Array.isArray(flights) ? flights.length : 'unknown'} flights`);
        
        // Ensure flights is an array before mapping
        const flightArray = Array.isArray(flights) ? flights : [];
        
        // Mapează datele din cache la formatul așteptat
        const mappedData = this.mapCacheDataToRawFlightData(flightArray);
        
        // Procesează automat codurile IATA noi găsite în datele de zboruri (doar pe server)
        if (typeof window === 'undefined') {
          this.processNewAirportCodes(flights);
        }
        
        return {
          success: true,
          data: this.applyFilters(mappedData, filters),
          cached: true,
          last_updated: new Date().toISOString(),
          airport_code: airportCode,
          type: 'departures',
          weather_info: weather_info || undefined,
          hasWeatherAlert: hasWeatherAlert || false
        };
      }

      // Nu există intrare în cache
      console.log(`No cached entry for ${airportCode} departures`);
      
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
   * Procesează codurile IATA noi găsite în datele de zboruri
   */
  private processNewAirportCodes(flights: any[]): void {
    if (!flights || flights.length === 0) return;

    // Nu procesează pe server-side - doar în browser
    if (typeof window === 'undefined') {
      return;
    }

    // Extrage codurile IATA din datele de zboruri
    const codes = new Set<string>();
    
    flights.forEach(flight => {
      if (flight.originCode && this.isValidIataCode(flight.originCode)) {
        codes.add(flight.originCode.toUpperCase());
      }
      if (flight.destinationCode && this.isValidIataCode(flight.destinationCode)) {
        codes.add(flight.destinationCode.toUpperCase());
      }
      if (flight.origin?.code && this.isValidIataCode(flight.origin.code)) {
        codes.add(flight.origin.code.toUpperCase());
      }
      if (flight.destination?.code && this.isValidIataCode(flight.destination.code)) {
        codes.add(flight.destination.code.toUpperCase());
      }
    });

    // Procesează codurile prin API în background doar în browser
    if (codes.size > 0) {
      const uniqueCodes = Array.from(codes);
      console.log(`[Flight Repository] Found ${uniqueCodes.length} IATA codes to process:`, uniqueCodes);
      
      // Apelează API-ul pentru fiecare cod în background
      uniqueCodes.forEach(code => {
        // Folosește setTimeout pentru a evita blocarea și a rula în următorul tick
        setTimeout(() => {
          fetch(`/api/airports/process?iata=${code}`)
            .catch(error => {
              console.error(`[Flight Repository] Failed to process ${code}:`, error);
            });
        }, 100);
      });
    }
  }

  /**
   * Verifică dacă un cod este un IATA code valid
   */
  private isValidIataCode(code: string): boolean {
    return typeof code === 'string' && 
           code.length === 3 && 
           /^[A-Z]{3}$/.test(code.toUpperCase());
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
        (flight.airline?.name || '').toLowerCase().includes(airlineFilter) ||
        (flight.airline?.code || '').toLowerCase().includes(airlineFilter)
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
   * Forțează popularea cache-ului pentru un aeroport
   */
  async forcePopulateCache(airportCode: string): Promise<void> {
    console.log(`[Flight Repository] Force populating cache for ${airportCode}`);
    
    // Inițializează cache manager-ul
    await cacheManager.initialize();
    
    // Forțează fetch pentru arrivals și departures
    await cacheManager.manualRefresh('flightData', airportCode);
    
    // Generează analytics din datele de zbor cache-ate
    await cacheManager.manualRefresh('analytics', airportCode);
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
      aircraft: { cronInterval: 360, cacheMaxAge: 360 },
      weather: { cronInterval: 30 }
    }
    
    await cacheManager.updateConfig({
      flightData: {
        cronInterval: realtimeInterval
      },
      analytics: currentConfig.analytics,
      aircraft: currentConfig.aircraft,
      weather: currentConfig.weather || { cronInterval: 30 }
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