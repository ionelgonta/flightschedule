/**
 * AeroDataBox Service - Implementare completă bazată pe OpenAPI spec
 * Suportă toate endpoint-urile disponibile în AeroDataBox API
 */

import { getIcaoCode, getIataCode } from './icaoMapping';

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

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }

    this.requestCount++;

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      headers: {
        'x-magicapi-key': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
    const icaoCode = getIcaoCode(airportCode);
    const today = new Date().toISOString().split('T')[0];
    const from = fromTime || `${today}T00:00`;
    const to = toTime || `${today}T23:59`;
    
    const endpoint = `/flights/airports/icao/${icaoCode}/${type}/${from}/${to}`;
    const response = await this.makeRequest<FlightResponse>(endpoint);
    
    return type === 'arrivals' ? (response.arrivals || []) : (response.departures || []);
  }

  /**
   * Obține informații despre un aeroport
   */
  async getAirportInfo(airportCode: string): Promise<Airport> {
    const icaoCode = getIcaoCode(airportCode);
    const endpoint = `/airports/icao/${icaoCode}`;
    return this.makeRequest<Airport>(endpoint);
  }

  /**
   * Obține statistici pentru un aeroport
   */
  async getAirportStats(airportCode: string): Promise<AirportStats> {
    const icaoCode = getIcaoCode(airportCode);
    const endpoint = `/airports/icao/${icaoCode}/stats`;
    return this.makeRequest<AirportStats>(endpoint);
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
    const depIcao = getIcaoCode(departureAirport);
    const arrIcao = getIcaoCode(arrivalAirport);
    const flightDate = date || new Date().toISOString().split('T')[0];
    
    const endpoint = `/flights/airports/icao/${depIcao}/${arrIcao}/${flightDate}`;
    return this.makeRequest<Flight[]>(endpoint);
  }

  /**
   * Obține informații despre o aeronavă
   */
  async getAircraftInfo(registration: string): Promise<Aircraft> {
    const endpoint = `/aircraft/reg/${registration}`;
    return this.makeRequest<Aircraft>(endpoint);
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
   * Convertește Flight în formatul nostru standard
   */
  convertToStandardFormat(flight: Flight, type: 'arrivals' | 'departures') {
    const movement = type === 'arrivals' ? flight.arrival : flight.departure;
    const otherMovement = type === 'arrivals' ? flight.departure : flight.arrival;

    return {
      flight_number: flight.number.iata || flight.number.icao || 'N/A',
      airline: {
        name: flight.airline.name,
        code: flight.airline.iata || flight.airline.icao || 'XX',
        logo: undefined
      },
      origin: {
        airport: flight.departure.airport.name,
        code: flight.departure.airport.iata || flight.departure.airport.icao,
        city: flight.departure.airport.municipalityName
      },
      destination: {
        airport: flight.arrival.airport.name,
        code: flight.arrival.airport.iata || flight.arrival.airport.icao,
        city: flight.arrival.airport.municipalityName
      },
      scheduled_time: movement.scheduledTime.local,
      estimated_time: movement.estimatedTime?.local,
      actual_time: movement.actualTime?.local,
      status: this.normalizeStatus(flight.status.text),
      gate: movement.gate,
      terminal: movement.terminal,
      aircraft: flight.aircraft?.model,
      delay: this.calculateDelay(movement),
      // Informații suplimentare disponibile în AeroDataBox
      callSign: flight.callSign,
      isCargo: flight.isCargo,
      baggageBelt: movement.baggageBelt,
      runway: movement.runway,
      registration: flight.aircraft?.reg,
      quality: movement.quality,
      lastUpdated: flight.lastUpdatedUtc
    };
  }

  private calculateDelay(movement: Movement): number | undefined {
    if (!movement.scheduledTime || !movement.actualTime) return undefined;
    
    const scheduled = new Date(movement.scheduledTime.utc);
    const actual = new Date(movement.actualTime.utc);
    
    return Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60)); // minutes
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
    
    return 'unknown';
  }
}

export default AeroDataBoxService;