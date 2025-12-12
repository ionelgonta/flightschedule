/**
 * Real-time Flight Service - Multiple API providers for live flight data
 * No demo data - only real-time information
 */

import { getIcaoCode } from './icaoMapping';

export interface RealTimeFlightConfig {
  provider: 'aviationstack' | 'flightlabs' | 'airlabs';
  apiKey: string;
  baseUrl: string;
}

export interface RealTimeFlightData {
  flight_number: string;
  airline: {
    name: string;
    code: string;
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

export interface RealTimeApiResponse {
  success: boolean;
  data: RealTimeFlightData[];
  error?: string;
  last_updated: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
  source: string;
}

class RealTimeFlightService {
  private config: RealTimeFlightConfig;

  constructor(config: RealTimeFlightConfig) {
    this.config = config;
  }

  /**
   * Get real-time arrivals for an airport
   */
  async getArrivals(airportCode: string): Promise<RealTimeApiResponse> {
    console.log(`Fetching real-time arrivals for ${airportCode} from ${this.config.provider}`);
    
    try {
      switch (this.config.provider) {
        case 'aviationstack':
          return await this.getAviationStackData(airportCode, 'arrivals');
        case 'flightlabs':
          return await this.getFlightLabsData(airportCode, 'arrivals');
        case 'airlabs':
          return await this.getAirLabsData(airportCode, 'arrivals');
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error(`Real-time API failed for ${airportCode}:`, error);
      throw new Error(`Failed to fetch real-time data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time departures for an airport
   */
  async getDepartures(airportCode: string): Promise<RealTimeApiResponse> {
    console.log(`Fetching real-time departures for ${airportCode} from ${this.config.provider}`);
    
    try {
      switch (this.config.provider) {
        case 'aviationstack':
          return await this.getAviationStackData(airportCode, 'departures');
        case 'flightlabs':
          return await this.getFlightLabsData(airportCode, 'departures');
        case 'airlabs':
          return await this.getAirLabsData(airportCode, 'departures');
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error(`Real-time API failed for ${airportCode}:`, error);
      throw new Error(`Failed to fetch real-time data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * AviationStack API implementation
   */
  private async getAviationStackData(airportCode: string, type: 'arrivals' | 'departures'): Promise<RealTimeApiResponse> {
    const icaoCode = getIcaoCode(airportCode);
    const url = `${this.config.baseUrl}/flights?access_key=${this.config.apiKey}&${type === 'arrivals' ? 'arr_icao' : 'dep_icao'}=${icaoCode}&flight_status=active,scheduled,landed,departed,delayed,cancelled&limit=50`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`AviationStack API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`AviationStack API error: ${data.error.message || 'Unknown error'}`);
    }
    
    const flights = data.data?.map((flight: any) => this.convertAviationStackFlight(flight, type)) || [];
    
    return {
      success: true,
      data: flights,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type,
      source: 'AviationStack'
    };
  }

  /**
   * FlightLabs API implementation
   */
  private async getFlightLabsData(airportCode: string, type: 'arrivals' | 'departures'): Promise<RealTimeApiResponse> {
    const icaoCode = getIcaoCode(airportCode);
    const url = `${this.config.baseUrl}/schedules?access_key=${this.config.apiKey}&${type === 'arrivals' ? 'arr_icao' : 'dep_icao'}=${icaoCode}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`FlightLabs API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`FlightLabs API error: ${data.error.message || 'Unknown error'}`);
    }
    
    const flights = data.data?.map((flight: any) => this.convertFlightLabsFlight(flight, type)) || [];
    
    return {
      success: true,
      data: flights,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type,
      source: 'FlightLabs'
    };
  }

  /**
   * AirLabs API implementation
   */
  private async getAirLabsData(airportCode: string, type: 'arrivals' | 'departures'): Promise<RealTimeApiResponse> {
    const icaoCode = getIcaoCode(airportCode);
    const url = `${this.config.baseUrl}/schedules?api_key=${this.config.apiKey}&${type === 'arrivals' ? 'arr_icao' : 'dep_icao'}=${icaoCode}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`AirLabs API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`AirLabs API error: ${data.error || 'Unknown error'}`);
    }
    
    const flights = data.response?.map((flight: any) => this.convertAirLabsFlight(flight, type)) || [];
    
    return {
      success: true,
      data: flights,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type,
      source: 'AirLabs'
    };
  }

  /**
   * Convert AviationStack flight data to our format
   */
  private convertAviationStackFlight(flight: any, type: 'arrivals' | 'departures'): RealTimeFlightData {
    const movement = type === 'arrivals' ? flight.arrival : flight.departure;
    const otherMovement = type === 'arrivals' ? flight.departure : flight.arrival;
    
    return {
      flight_number: flight.flight?.iata || flight.flight?.icao || 'N/A',
      airline: {
        name: flight.airline?.name || 'Unknown',
        code: flight.airline?.iata || flight.airline?.icao || 'XX'
      },
      origin: {
        airport: flight.departure?.airport || 'Unknown',
        code: flight.departure?.iata || flight.departure?.icao || 'XXX',
        city: flight.departure?.timezone || 'Unknown'
      },
      destination: {
        airport: flight.arrival?.airport || 'Unknown',
        code: flight.arrival?.iata || flight.arrival?.icao || 'XXX',
        city: flight.arrival?.timezone || 'Unknown'
      },
      scheduled_time: movement?.scheduled || new Date().toISOString(),
      estimated_time: movement?.estimated,
      actual_time: movement?.actual,
      status: this.normalizeStatus(flight.flight_status || 'unknown'),
      gate: movement?.gate,
      terminal: movement?.terminal,
      aircraft: flight.aircraft?.registration,
      delay: movement?.delay ? parseInt(movement.delay) : undefined
    };
  }

  /**
   * Convert FlightLabs flight data to our format
   */
  private convertFlightLabsFlight(flight: any, type: 'arrivals' | 'departures'): RealTimeFlightData {
    return {
      flight_number: flight.flight_iata || flight.flight_icao || 'N/A',
      airline: {
        name: flight.airline_name || 'Unknown',
        code: flight.airline_iata || flight.airline_icao || 'XX'
      },
      origin: {
        airport: flight.dep_name || 'Unknown',
        code: flight.dep_iata || flight.dep_icao || 'XXX',
        city: flight.dep_city || 'Unknown'
      },
      destination: {
        airport: flight.arr_name || 'Unknown',
        code: flight.arr_iata || flight.arr_icao || 'XXX',
        city: flight.arr_city || 'Unknown'
      },
      scheduled_time: type === 'arrivals' ? flight.arr_time : flight.dep_time,
      estimated_time: type === 'arrivals' ? flight.arr_estimated : flight.dep_estimated,
      actual_time: type === 'arrivals' ? flight.arr_actual : flight.dep_actual,
      status: this.normalizeStatus(flight.status || 'unknown'),
      gate: type === 'arrivals' ? flight.arr_gate : flight.dep_gate,
      terminal: type === 'arrivals' ? flight.arr_terminal : flight.dep_terminal,
      aircraft: flight.aircraft_icao,
      delay: flight.delay ? parseInt(flight.delay) : undefined
    };
  }

  /**
   * Convert AirLabs flight data to our format
   */
  private convertAirLabsFlight(flight: any, type: 'arrivals' | 'departures'): RealTimeFlightData {
    return {
      flight_number: flight.flight_iata || flight.flight_number || 'N/A',
      airline: {
        name: flight.airline_name || 'Unknown',
        code: flight.airline_iata || 'XX'
      },
      origin: {
        airport: flight.dep_name || 'Unknown',
        code: flight.dep_iata || 'XXX',
        city: flight.dep_city || 'Unknown'
      },
      destination: {
        airport: flight.arr_name || 'Unknown',
        code: flight.arr_iata || 'XXX',
        city: flight.arr_city || 'Unknown'
      },
      scheduled_time: type === 'arrivals' ? flight.arr_time : flight.dep_time,
      estimated_time: type === 'arrivals' ? flight.arr_time_ts : flight.dep_time_ts,
      status: this.normalizeStatus(flight.status || 'unknown'),
      gate: flight.gate,
      terminal: flight.terminal,
      aircraft: flight.aircraft_icao,
      delay: flight.delayed ? 30 : undefined // AirLabs doesn't provide exact delay minutes
    };
  }

  /**
   * Normalize flight status across different APIs
   */
  private normalizeStatus(status: string): string {
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

// API Configurations for different providers
export const REAL_TIME_API_CONFIGS = {
  aviationstack: {
    provider: 'aviationstack' as const,
    baseUrl: 'http://api.aviationstack.com/v1',
    // Free tier: 1000 requests/month
  },
  flightlabs: {
    provider: 'flightlabs' as const,
    baseUrl: 'https://app.goflightlabs.com/api',
    // Free tier: 1000 requests/month
  },
  airlabs: {
    provider: 'airlabs' as const,
    baseUrl: 'https://airlabs.co/api/v9',
    // Free tier: 1000 requests/month
  }
};

export default RealTimeFlightService;