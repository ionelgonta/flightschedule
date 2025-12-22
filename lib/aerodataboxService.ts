/**
 * AeroDataBox Service - Implementare completă bazată pe OpenAPI spec
 * Suportă toate endpoint-urile disponibile în AeroDataBox API
 */

// Removed ICAO imports - using IATA only
import { getAirportByCodeSync } from './airports';
// Server-side only import
let persistentApiRequestTracker: any = null
if (typeof window === 'undefined') {
  try {
    persistentApiRequestTracker = require('./persistentApiTracker').persistentApiRequestTracker
  } catch (e) {
    console.warn('Could not load persistentApiTracker:', e)
  }
}

export interface AeroDataBoxConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
}

// Types bazate pe OpenAPI spec
export interface Airport {
  icao: string;
  iata: string;
  name: string;
  shortName: string;
  municipalityName: string;
  location: {
    lat: number;
    lon: number;
  };
  countryCode: string;
  timeZone: string;
}

export interface Aircraft {
  model: string;
  reg: string;
}

export interface Airline {
  name: string;
  iata?: string;
  icao?: string;
}

export interface FlightNumber {
  iata?: string;
  icao?: string;
}

export interface Movement {
  airport: Airport;
  scheduledTime: {
    utc: string;
    local: string;
  };
  actualTime?: {
    utc: string;
    local: string;
  };
  estimatedTime?: {
    utc: string;
    local: string;
  };
  terminal?: string;
  gate?: string;
  baggageBelt?: string;
  runway?: string;
  quality: string[];
}

export interface FlightStatus {
  text: string;
  type: string;
  diverted?: Airport;
}

export interface Flight {
  number: FlightNumber;
  callSign?: string;
  status: FlightStatus;
  codeshareStatus: string;
  isCargo: boolean;
  aircraft?: Aircraft;
  airline: Airline;
  departure: Movement;
  arrival: Movement;
  lastUpdatedUtc: string;
}

export interface FlightResponse {
  departures?: Flight[];
  arrivals?: Flight[];
}

export interface AirportStats {
  airport: Airport;
  arrivals: {
    today: number;
    yesterday: number;
    tomorrow: number;
  };
  departures: {
    today: number;
    yesterday: number;
    tomorrow: number;
  };
}

export interface FlightTrack {
  latitude: number;
  longitude: number;
  altitude: {
    feet: number;
    meters: number;
  };
  speed: {
    kmh: number;
    kts: number;
  };
  verticalSpeed: {
    fpm: number;
    ms: number;
  };
  heading: number;
  squawk?: string;
  timestamp: string;
}

class AeroDataBoxService {
  private config: AeroDataBoxConfig;
  private requestCount: number = 0;
  private lastReset: number = Date.now();
  
  // Airports that have been discovered to have limited or no data in AeroDataBox (dynamically populated)
  private limitedDataAirports = new Set<string>();

  constructor(config: AeroDataBoxConfig) {
    this.config = config;
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    const minutesPassed = (now - this.lastReset) / (1000 * 60);
    
    if (minutesPassed >= 1) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    return this.requestCount < this.config.rateLimit;
  }

  private async makeRequest<T>(endpoint: string, requestType: 'arrivals' | 'departures' | 'statistics' | 'analytics' | 'aircraft' | 'routes' = 'statistics', airportCode?: string): Promise<T> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }

    this.requestCount++;
    const startTime = Date.now();

    // Use API.Market AeroDataBox URL structure
    const url = `https://prod.api.market/api/v1/aedbx/aerodatabox${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'x-api-market-key': this.config.apiKey,
          'accept': 'application/json'
        }
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        // Log failed request
        await persistentApiRequestTracker?.logRequest(
          endpoint,
          'GET',
          requestType,
          airportCode,
          false,
          duration,
          0,
          `API Error: ${response.status} ${response.statusText}`
        );
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Check if response has content
      const text = await response.text();
      if (!text || text.trim() === '') {
        // Log failed request
        await persistentApiRequestTracker?.logRequest(
          endpoint,
          'GET',
          requestType,
          airportCode,
          false,
          duration,
          0,
          'Empty response from API'
        );
        throw new Error('Empty response from API');
      }

      // Try to parse JSON
      try {
        const data = JSON.parse(text);
        
        // Log successful request
        await persistentApiRequestTracker?.logRequest(
          endpoint,
          'GET',
          requestType,
          airportCode,
          true,
          duration,
          text.length
        );
        
        return data;
      } catch (parseError) {
        console.error('JSON parse error for response:', text.substring(0, 200));
        
        // Log failed request
        await persistentApiRequestTracker?.logRequest(
          endpoint,
          'GET',
          requestType,
          airportCode,
          false,
          duration,
          text.length,
          `Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`
        );
        
        throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
      }
    } catch (error) {
      console.error(`AeroDataBox API request failed for ${endpoint}:`, error);
      
      // If not already logged, log the error
      if (!(error instanceof Error && error.message.includes('API Error'))) {
        const duration = Date.now() - startTime;
        await persistentApiRequestTracker?.logRequest(
          endpoint,
          'GET',
          requestType,
          airportCode,
          false,
          duration,
          0,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      
      throw error;
    }
  }

  /**
   * Obține zborurile pentru un aeroport (arrivals/departures)
   */
  async getFlights(
    airportCode: string, 
    type: 'arrivals' | 'departures',
    fromTime?: string,
    toTime?: string
  ): Promise<Flight[]> {
    try {
      // Use IATA codes directly for API calls
      const endpoint = `/flights/airports/Iata/${airportCode}`;
      console.log(`Making API request to: ${this.config.baseUrl}${endpoint}`);
      
      const response = await this.makeRequest<FlightResponse>(endpoint, type, airportCode);
      
      console.log(`API response keys:`, Object.keys(response));
      console.log(`Arrivals count: ${response.arrivals?.length || 0}, Departures count: ${response.departures?.length || 0}`);
      
      const flights = type === 'arrivals' ? (response.arrivals || []) : (response.departures || []);
      
      // Filter out codeshare flights - keep only IsOperator
      const operatorFlights = flights.filter(flight => {
        const codeshareStatus = flight.codeshareStatus || '';
        // Only keep flights where this airline is the actual operator
        // Exclude all codeshare variants except IsOperator
        return codeshareStatus === 'IsOperator';
      });
      
      // Additional deduplication based on flight number and time to handle any remaining duplicates
      const uniqueFlights = operatorFlights.filter((flight, index, array) => {
        const flightKey = `${flight.number?.iata || flight.number?.icao}-${flight.departure?.scheduledTime?.utc}-${flight.arrival?.scheduledTime?.utc}`;
        return array.findIndex(f => {
          const fKey = `${f.number?.iata || f.number?.icao}-${f.departure?.scheduledTime?.utc}-${f.arrival?.scheduledTime?.utc}`;
          return fKey === flightKey;
        }) === index;
      });
      
      console.log(`Extracted ${flights.length} total ${type} flights for ${airportCode}`);
      console.log(`Filtered to ${operatorFlights.length} operator flights (excluded codeshare)`);
      console.log(`Deduplicated to ${uniqueFlights.length} unique flights`);
      
      // If no flights returned, add to limited data list for future reference but still track the request
      if (uniqueFlights.length === 0) {
        console.warn(`Airport ${airportCode} returned no unique operator ${type} data after filtering - this may be normal if no flights are scheduled`);
        // Don't add to limited data list immediately - empty results can be normal
      }
      
      return uniqueFlights;
    } catch (error) {
      console.error(`Failed to get ${type} for airport ${airportCode}:`, error);
      
      // Add this airport to the limited data list if it consistently fails
      if (error instanceof Error && (
        error.message.includes('Empty response') || 
        error.message.includes('Invalid JSON') ||
        error.message.includes('Unexpected end of JSON input') ||
        error.message.includes('400 Bad Request')
      )) {
        console.warn(`Adding ${airportCode} to limited data airports list due to API issues: ${error.message}`);
        this.limitedDataAirports.add(airportCode);
      }
      
      // Return empty array instead of throwing - this allows the system to continue
      return [];
    }
  }

  /**
   * Obține informații despre un aeroport
   */
  async getAirportInfo(airportCode: string): Promise<Airport> {
    // Use IATA codes directly
    const endpoint = `/airports/Iata/${airportCode}?withRunways=false&withTime=false`;
    return this.makeRequest<Airport>(endpoint, 'statistics', airportCode);
  }

  /**
   * Obține statistici pentru un aeroport
   */
  async getAirportStats(airportCode: string): Promise<AirportStats> {
    const endpoint = `/airports/iata/${airportCode}/stats`;
    return this.makeRequest<AirportStats>(endpoint, 'statistics', airportCode);
  }

  /**
   * Caută aeroporturi după nume sau cod
   */
  async searchAirports(query: string): Promise<Airport[]> {
    const endpoint = `/airports/search/term/${encodeURIComponent(query)}`;
    return this.makeRequest<Airport[]>(endpoint);
  }

  /**
   * Obține aeroporturile dintr-o țară
   */
  async getAirportsByCountry(countryCode: string): Promise<Airport[]> {
    const endpoint = `/airports/search/country/${countryCode}`;
    return this.makeRequest<Airport[]>(endpoint);
  }

  /**
   * Obține detalii despre un zbor specific
   */
  async getFlightDetails(
    flightNumber: string,
    date?: string
  ): Promise<Flight[]> {
    const flightDate = date || new Date().toISOString().split('T')[0];
    const endpoint = `/flights/number/${flightNumber}/${flightDate}`;
    return this.makeRequest<Flight[]>(endpoint);
  }

  /**
   * Obține tracking pentru un zbor (dacă disponibil)
   */
  async getFlightTrack(
    flightNumber: string,
    date?: string
  ): Promise<FlightTrack[]> {
    const flightDate = date || new Date().toISOString().split('T')[0];
    const endpoint = `/flights/number/${flightNumber}/${flightDate}/track`;
    return this.makeRequest<FlightTrack[]>(endpoint);
  }

  /**
   * Obține zborurile unei companii aeriene
   */
  async getAirlineFlights(
    airlineCode: string,
    date?: string
  ): Promise<Flight[]> {
    const flightDate = date || new Date().toISOString().split('T')[0];
    const endpoint = `/flights/airline/iata/${airlineCode}/${flightDate}`;
    return this.makeRequest<Flight[]>(endpoint);
  }

  /**
   * Obține zborurile între două aeroporturi
   */
  async getRouteFlights(
    departureAirport: string,
    arrivalAirport: string,
    date?: string
  ): Promise<Flight[]> {
    // Use IATA codes directly
    const flightDate = date || new Date().toISOString().split('T')[0];
    
    const endpoint = `/flights/airports/iata/${departureAirport}/${arrivalAirport}/${flightDate}`;
    return this.makeRequest<Flight[]>(endpoint, 'routes', `${departureAirport}-${arrivalAirport}`);
  }

  /**
   * Obține informații despre o aeronavă
   */
  async getAircraftInfo(registration: string): Promise<Aircraft> {
    const endpoint = `/aircraft/reg/${registration}`;
    return this.makeRequest<Aircraft>(endpoint, 'aircraft');
  }

  /**
   * Obține zborurile unei aeronave
   */
  async getAircraftFlights(
    registration: string,
    date?: string
  ): Promise<Flight[]> {
    const flightDate = date || new Date().toISOString().split('T')[0];
    const endpoint = `/aircraft/reg/${registration}/flights/${flightDate}`;
    return this.makeRequest<Flight[]>(endpoint);
  }

  /**
   * Check if an airport is known to have limited data
   */
  hasLimitedData(airportCode: string): boolean {
    return this.limitedDataAirports.has(airportCode);
  }

  /**
   * Get list of airports with limited data
   */
  getLimitedDataAirports(): string[] {
    return Array.from(this.limitedDataAirports);
  }

  /**
   * Convertește Flight în formatul nostru standard - API.Market AeroDataBox structure
   */
  convertToStandardFormat(flight: any, type: 'arrivals' | 'departures', currentAirportCode?: string) {
    // Handle API.Market AeroDataBox structure - CORRECTED based on actual API response
    try {
      // Extract basic flight info - flight number is directly in 'number' field
      const flightNumber = flight.number || 'N/A';
      const airlineName = flight.airline?.name || 'Unknown';
      const airlineCode = flight.airline?.iata || flight.airline?.icao || 'XX';
      const status = flight.status || 'unknown';
      
      // Movement contains the OTHER airport (origin for arrivals, destination for departures)
      const movement = flight.movement || {};
      const otherAirport = movement.airport || {};
      
      // Time handling - use revisedTime if available, otherwise scheduledTime
      const scheduledTime = movement.scheduledTime || {};
      const revisedTime = movement.revisedTime || {}; // This is the estimated/actual time
      
      // Get current airport info dynamically (folosește versiunea sincronă)
      const currentAirport = currentAirportCode ? getAirportByCodeSync(currentAirportCode) : null;
      // Skip flights without valid IATA codes early
      const otherAirportCode = otherAirport.iata || otherAirport.icao;
      if (!otherAirportCode || !currentAirportCode) {
        return null; // Skip this flight - no valid airport codes
      }
      
      const currentAirportInfo = {
        airport: currentAirport?.name || 'Unknown Airport',
        code: currentAirportCode,
        city: currentAirport?.city || 'Unknown City'
      };
      
      // For arrivals: movement.airport = origin, current airport = destination
      // For departures: movement.airport = destination, current airport = origin
      const origin = type === 'arrivals' ? {
        airport: otherAirport.name || otherAirportCode,
        code: otherAirportCode,
        city: otherAirport.name || otherAirportCode // API doesn't provide city separately
      } : currentAirportInfo;
      
      const destination = type === 'departures' ? {
        airport: otherAirport.name || otherAirportCode,
        code: otherAirportCode,
        city: otherAirport.name || otherAirportCode
      } : currentAirportInfo;
      
      return {
        flight_number: flightNumber,
        airline: {
          name: airlineName,
          code: airlineCode,
          logo: undefined
        },
        origin,
        destination,
        scheduled_time: scheduledTime.local || scheduledTime.utc || new Date().toISOString(),
        estimated_time: revisedTime.local || revisedTime.utc,
        actual_time: revisedTime.local || revisedTime.utc, // revisedTime is the actual/estimated time
        status: this.normalizeStatus(status),
        gate: movement.gate,
        terminal: movement.terminal,
        aircraft: flight.aircraft?.model || flight.aircraft?.reg,
        delay: this.calculateDelayFromMovement(movement),
        // Additional info
        callSign: flight.callSign,
        isCargo: flight.isCargo || false,
        baggageBelt: movement.baggageBelt,
        runway: movement.runway,
        registration: flight.aircraft?.reg,
        quality: movement.quality || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error converting flight data:', error);
      console.error('Flight data that caused error:', JSON.stringify(flight, null, 2));
      // Return null for invalid flights instead of fallback structure
      return null;
    }
  }

  private calculateDelay(movement: Movement): number | undefined {
    if (!movement.scheduledTime || !movement.actualTime) return undefined;
    
    const scheduled = new Date(movement.scheduledTime.utc);
    const actual = new Date(movement.actualTime.utc);
    
    return Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60)); // minutes
  }

  private calculateDelayFromMovement(movement: any): number | undefined {
    try {
      if (!movement.scheduledTime || !movement.revisedTime) return undefined;
      
      const scheduledTime = movement.scheduledTime.utc || movement.scheduledTime.local;
      const revisedTime = movement.revisedTime.utc || movement.revisedTime.local;
      
      if (!scheduledTime || !revisedTime) return undefined;
      
      const scheduled = new Date(scheduledTime);
      const revised = new Date(revisedTime);
      
      const delayMinutes = Math.round((revised.getTime() - scheduled.getTime()) / (1000 * 60));
      
      // Only return positive delays (negative means early, which we don't show as delay)
      return delayMinutes > 0 ? delayMinutes : undefined;
    } catch (error) {
      return undefined;
    }
  }

  private normalizeStatus(status: string): string {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('scheduled')) return 'scheduled';
    if (statusLower.includes('active') || statusLower.includes('en-route')) return 'active';
    if (statusLower.includes('landed') || statusLower.includes('arrived')) return 'landed';
    if (statusLower.includes('delayed')) return 'delayed';
    if (statusLower.includes('cancelled')) return 'cancelled';
    if (statusLower.includes('boarding')) return 'boarding';
    if (statusLower.includes('departed')) return 'departed';
    if (statusLower.includes('diverted')) return 'diverted';
    
    // For unknown statuses, check if flight is in the future - if so, assume it's on-time/estimated
    return 'estimated'; // This will be displayed as "Estimat" in Romanian
  }
}

export default AeroDataBoxService;