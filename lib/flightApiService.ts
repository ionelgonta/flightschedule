/**
 * Flight API Service - REAL-TIME AeroDataBox via API.Market
 * No demo data - only live flight information
 */

import AeroDataBoxService from './aerodataboxService';
import { formatDelayInRomanian } from './flightUtils';

export interface FlightApiConfig {
  provider: 'aerodatabox';
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
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
  source?: string;
}

class FlightApiService {
  private aeroDataBoxService: AeroDataBoxService;

  constructor(config: FlightApiConfig) {
    // Initialize AeroDataBox service with correct API.Market configuration
    this.aeroDataBoxService = new AeroDataBoxService({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      rateLimit: config.rateLimit
    });
  }

  /**
   * Fetch arrivals pentru un aeroport - REAL-TIME AeroDataBox
   */
  async getArrivals(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Fetching REAL-TIME arrivals for ${airportCode} from AeroDataBox`);
    
    try {
      // Get real-time data from AeroDataBox via API.Market
      const flights = await this.aeroDataBoxService.getFlights(airportCode, 'arrivals');
      
      // Convert to our standard format with Romanian delay formatting
      const convertedFlights = flights
        .map(flight => this.aeroDataBoxService.convertToStandardFormat(flight, 'arrivals', airportCode))
        .filter(converted => converted !== null) // Filter out flights without valid airport codes
        .map(converted => ({
          ...converted,
          delay: converted.delay ? converted.delay : undefined
        }));

      console.log(`Successfully fetched ${convertedFlights.length} real arrivals for ${airportCode}`);
      
      return {
        success: true,
        data: convertedFlights,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals',
        source: 'AeroDataBox'
      };
      
    } catch (error) {
      console.error(`AeroDataBox API failed for ${airportCode} arrivals:`, error);
      
      // NO DEMO DATA - Return error if real-time fails
      return {
        success: false,
        data: [],
        error: `Real-time data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Fetch departures pentru un aeroport - REAL-TIME AeroDataBox
   */
  async getDepartures(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Fetching REAL-TIME departures for ${airportCode} from AeroDataBox`);
    
    try {
      // Get real-time data from AeroDataBox via API.Market
      const flights = await this.aeroDataBoxService.getFlights(airportCode, 'departures');
      
      // Convert to our standard format with Romanian delay formatting
      const convertedFlights = flights
        .map(flight => this.aeroDataBoxService.convertToStandardFormat(flight, 'departures', airportCode))
        .filter(converted => converted !== null) // Filter out flights without valid airport codes
        .map(converted => ({
          ...converted,
          delay: converted.delay ? converted.delay : undefined
        }));

      console.log(`Successfully fetched ${convertedFlights.length} real departures for ${airportCode}`);
      
      return {
        success: true,
        data: convertedFlights,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures',
        source: 'AeroDataBox'
      };
      
    } catch (error) {
      console.error(`AeroDataBox API failed for ${airportCode} departures:`, error);
      
      // NO DEMO DATA - Return error if real-time fails
      return {
        success: false,
        data: [],
        error: `Real-time data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }
  }


}

// AeroDataBox via API.Market configuration - REAL-TIME DATA ONLY
export const API_CONFIGS = {
  aerodatabox: {
    provider: 'aerodatabox' as const,
    baseUrl: 'https://prod.api.market/api/v1/aedbx/aerodatabox',
    apiKey: process.env.NEXT_PUBLIC_FLIGHT_API_KEY || process.env.AERODATABOX_API_KEY || 'cmj2m39qs0001k00404cmwu75', // Use env variable
    rateLimit: 150 // requests per minute
  }
};

export default FlightApiService;