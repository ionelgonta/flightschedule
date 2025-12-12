/**
 * Flight API Service - Returns demo flight data
 * Temporary implementation while API integration is being fixed
 */

import { generateDemoArrivals, generateDemoDepartures } from './demoFlightData';

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
  // Câmpuri suplimentare din AeroDataBox
  callSign?: string;
  isCargo?: boolean;
  baggageBelt?: string;
  runway?: string;
  registration?: string;
  quality?: string[];
  lastUpdated?: string;
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

  constructor(config: FlightApiConfig) {
    this.config = config;
  }

  /**
   * Fetch arrivals pentru un aeroport
   */
  async getArrivals(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Generating demo arrivals for ${airportCode}`);
    
    const demoData = generateDemoArrivals(airportCode, 15);
    
    return {
      success: true,
      data: demoData,
      error: 'Using demo data - API integration in progress',
      cached: false,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type: 'arrivals'
    };
  }

  /**
   * Fetch departures pentru un aeroport
   */
  async getDepartures(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Generating demo departures for ${airportCode}`);
    
    const demoData = generateDemoDepartures(airportCode, 15);
    
    return {
      success: true,
      data: demoData,
      error: 'Using demo data - API integration in progress',
      cached: false,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type: 'departures'
    };
  }


}

// Configurații pentru demo
export const API_CONFIGS = {
  aerodatabox: {
    provider: 'aerodatabox' as const,
    baseUrl: 'demo',
    rateLimit: 150
  }
};

export default FlightApiService;