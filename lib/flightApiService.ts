/**
 * Flight API Service - Gestionează request-urile către API-ul extern de zboruri
 * Suportă AeroDataBox, FlightLabs și alte API-uri
 */

import { getIcaoCode } from './icaoMapping';

export interface FlightApiConfig {
  provider: 'aerodatabox' | 'flightlabs' | 'aviationstack';
  apiKey: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
}

export interface RawFlightData {
  flight_number: string;
  airline: {
    name: string;
    code: string;
    logo?: string;
  };
  origin: {
    airport: string;
    code: string;
    city: string;
  };
  destination: {
    airport: string;
    code: string;
    city: string;
  };
  scheduled_time: string;
  estimated_time?: string;
  actual_time?: string;
  status: string;
  gate?: string;
  terminal?: string;
  aircraft?: string;
  delay?: number;
}

export interface FlightApiResponse {
  success: boolean;
  data: RawFlightData[];
  error?: string;
  cached: boolean;
  last_updated: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
}

class FlightApiService {
  private config: FlightApiConfig;
  private requestCount: number = 0;
  private lastReset: number = Date.now();

  constructor(config: FlightApiConfig) {
    this.config = config;
  }

  /**
   * Rate limiting - verifică dacă putem face request
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const minutesPassed = (now - this.lastReset) / (1000 * 60);
    
    if (minutesPassed >= 1) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    return this.requestCount < this.config.rateLimit;
  }

  /**
   * Fetch arrivals pentru un aeroport
   */
  async getArrivals(airportCode: string): Promise<FlightApiResponse> {
    if (!this.canMakeRequest()) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }

    try {
      this.requestCount++;
      
      const url = this.buildUrl(airportCode, 'arrivals');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Configurează headers în funcție de provider
      if (this.config.baseUrl.includes('api.market')) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      } else if (this.config.baseUrl.includes('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = this.config.apiKey;
        headers['X-RapidAPI-Host'] = 'aerodatabox.p.rapidapi.com';
      } else {
        headers['X-API-Key'] = this.config.apiKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const processedData = this.processApiResponse(rawData, airportCode, 'arrivals');

      return {
        success: true,
        data: processedData,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };

    } catch (error) {
      console.error(`Flight API Error for ${airportCode} arrivals:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Fetch departures pentru un aeroport
   */
  async getDepartures(airportCode: string): Promise<FlightApiResponse> {
    if (!this.canMakeRequest()) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }

    try {
      this.requestCount++;
      
      const url = this.buildUrl(airportCode, 'departures');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Configurează headers în funcție de provider
      if (this.config.baseUrl.includes('api.market')) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      } else if (this.config.baseUrl.includes('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = this.config.apiKey;
        headers['X-RapidAPI-Host'] = 'aerodatabox.p.rapidapi.com';
      } else {
        headers['X-API-Key'] = this.config.apiKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const processedData = this.processApiResponse(rawData, airportCode, 'departures');

      return {
        success: true,
        data: processedData,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };

    } catch (error) {
      console.error(`Flight API Error for ${airportCode} departures:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }
  }

  /**
   * Construiește URL-ul pentru API în funcție de provider
   */
  private buildUrl(airportCode: string, type: 'arrivals' | 'departures'): string {
    const today = new Date().toISOString().split('T')[0];
    
    switch (this.config.provider) {
      case 'aerodatabox':
        // AeroDataBox folosește coduri ICAO
        const icaoCode = getIcaoCode(airportCode);
        return `${this.config.baseUrl}/flights/airports/icao/${icaoCode}/${type}/${today}T00:00/${today}T23:59`;
      
      case 'flightlabs':
        // FlightLabs folosește coduri IATA
        return `${this.config.baseUrl}/schedules?dep_iata=${type === 'departures' ? airportCode : ''}&arr_iata=${type === 'arrivals' ? airportCode : ''}`;
      
      case 'aviationstack':
        // AviationStack folosește coduri IATA
        return `${this.config.baseUrl}/flights?${type === 'arrivals' ? 'arr_iata' : 'dep_iata'}=${airportCode}`;
      
      default:
        throw new Error(`Unsupported API provider: ${this.config.provider}`);
    }
  }

  /**
   * Procesează răspunsul API și îl standardizează
   */
  private processApiResponse(rawData: any, airportCode: string, type: 'arrivals' | 'departures'): RawFlightData[] {
    try {
      let flights: any[] = [];

      // Procesează în funcție de provider
      switch (this.config.provider) {
        case 'aerodatabox':
          flights = rawData.arrivals || rawData.departures || [];
          break;
        
        case 'flightlabs':
          flights = rawData.data || [];
          break;
        
        case 'aviationstack':
          flights = rawData.data || [];
          break;
      }

      return flights.map((flight: any) => this.normalizeFlightData(flight, type)).filter((flight): flight is RawFlightData => flight !== null);
    } catch (error) {
      console.error('Error processing API response:', error);
      return [];
    }
  }

  /**
   * Normalizează datele de zbor pentru format standard
   */
  private normalizeFlightData(flight: any, type: 'arrivals' | 'departures'): RawFlightData | null {
    try {
      // Adaptează în funcție de structura API-ului
      const flightNumber = flight.number || flight.flight?.iata || flight.flight_iata || 'N/A';
      const airline = {
        name: flight.airline?.name || flight.airline_name || 'Unknown',
        code: flight.airline?.iata || flight.airline_iata || 'XX',
        logo: flight.airline?.logo || undefined
      };

      const origin = {
        airport: flight.departure?.airport || flight.dep_name || 'Unknown',
        code: flight.departure?.iata || flight.dep_iata || 'XXX',
        city: flight.departure?.city || flight.dep_city || 'Unknown'
      };

      const destination = {
        airport: flight.arrival?.airport || flight.arr_name || 'Unknown', 
        code: flight.arrival?.iata || flight.arr_iata || 'XXX',
        city: flight.arrival?.city || flight.arr_city || 'Unknown'
      };

      const scheduledTime = type === 'arrivals' 
        ? (flight.arrival?.scheduled || flight.arr_time)
        : (flight.departure?.scheduled || flight.dep_time);

      const estimatedTime = type === 'arrivals'
        ? (flight.arrival?.estimated || flight.arr_estimated)
        : (flight.departure?.estimated || flight.dep_estimated);

      return {
        flight_number: flightNumber,
        airline,
        origin,
        destination,
        scheduled_time: scheduledTime,
        estimated_time: estimatedTime,
        actual_time: flight.actual_time,
        status: this.normalizeStatus(flight.status || flight.flight_status),
        gate: flight.gate,
        terminal: flight.terminal,
        aircraft: flight.aircraft?.model || flight.aircraft_type,
        delay: flight.delay
      };
    } catch (error) {
      console.error('Error normalizing flight data:', error);
      return null;
    }
  }

  /**
   * Normalizează statusul zborului
   */
  private normalizeStatus(status: string): string {
    if (!status) return 'unknown';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('scheduled')) return 'scheduled';
    if (statusLower.includes('active') || statusLower.includes('en-route')) return 'active';
    if (statusLower.includes('landed') || statusLower.includes('arrived')) return 'landed';
    if (statusLower.includes('delayed')) return 'delayed';
    if (statusLower.includes('cancelled')) return 'cancelled';
    if (statusLower.includes('boarding')) return 'boarding';
    if (statusLower.includes('departed')) return 'departed';
    
    return 'unknown';
  }
}

// Configurații pentru diferiți provideri
export const API_CONFIGS = {
  aerodatabox: {
    provider: 'aerodatabox' as const,
    baseUrl: 'https://api.market/aerodatabox/v1',
    rateLimit: 150 // per minute
  },
  aerodatabox_rapidapi: {
    provider: 'aerodatabox' as const,
    baseUrl: 'https://aerodatabox.p.rapidapi.com',
    rateLimit: 150
  },
  flightlabs: {
    provider: 'flightlabs' as const,
    baseUrl: 'https://app.goflightlabs.com/api',
    rateLimit: 100
  },
  aviationstack: {
    provider: 'aviationstack' as const,
    baseUrl: 'http://api.aviationstack.com/v1',
    rateLimit: 100
  }
};

export default FlightApiService;