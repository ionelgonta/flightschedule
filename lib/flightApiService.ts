/**
 * Flight API Service - REAL-TIME cu backup AviationStack
 * Folosește AeroDataBox ca provider principal și AviationStack ca backup
 */

import AeroDataBoxService from './aerodataboxService';
import AviationStackService from './aviationStackService';
import { formatDelayInRomanian } from './flightUtils';

export interface FlightApiConfig {
  provider: 'aerodatabox' | 'aviationstack';
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  backupProvider?: {
    type: 'aviationstack';
    apiKey: string;
  };
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
  private aviationStackService?: AviationStackService;
  private config: FlightApiConfig;

  constructor(config: FlightApiConfig) {
    this.config = config;
    
    // Initialize AeroDataBox service with correct API.Market configuration
    this.aeroDataBoxService = new AeroDataBoxService({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      rateLimit: config.rateLimit
    });

    // Initialize backup AviationStack service if configured
    if (config.backupProvider?.type === 'aviationstack' && config.backupProvider.apiKey) {
      this.aviationStackService = new AviationStackService(config.backupProvider.apiKey);
      console.log('AviationStack backup service initialized');
    }
  }

  /**
   * Fetch arrivals pentru un aeroport - REAL-TIME cu backup
   */
  async getArrivals(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Fetching REAL-TIME arrivals for ${airportCode} from AeroDataBox`);
    
    try {
      // Try primary provider (AeroDataBox)
      const flights = await this.aeroDataBoxService.getFlights(airportCode, 'arrivals');
      
      // Convert to our standard format with Romanian delay formatting
      const convertedFlights = flights
        .map(flight => this.aeroDataBoxService.convertToStandardFormat(flight, 'arrivals', airportCode))
        .filter(converted => converted !== null) // Filter out flights without valid airport codes
        .map(converted => ({
          ...converted,
          delay: converted.delay ? converted.delay : undefined
        }));

      console.log(`Successfully fetched ${convertedFlights.length} real arrivals for ${airportCode} from AeroDataBox`);
      
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
      
      // Try backup provider (AviationStack) if available
      if (this.aviationStackService) {
        console.log(`Trying backup AviationStack for ${airportCode} arrivals`);
        
        try {
          const backupFlights = await this.aviationStackService.getArrivals(airportCode);
          const convertedBackupFlights = this.aviationStackService.convertToStandardFormat(backupFlights, 'arrivals');
          
          console.log(`Successfully fetched ${convertedBackupFlights.length} real arrivals for ${airportCode} from AviationStack backup`);
          
          return {
            success: true,
            data: convertedBackupFlights,
            cached: false,
            last_updated: new Date().toISOString(),
            airport_code: airportCode,
            type: 'arrivals',
            source: 'AviationStack (backup)'
          };
          
        } catch (backupError) {
          console.error(`AviationStack backup also failed for ${airportCode} arrivals:`, backupError);
        }
      }
      
      // Both providers failed - return error
      return {
        success: false,
        data: [],
        error: `Real-time data unavailable from all providers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Fetch departures pentru un aeroport - REAL-TIME cu backup
   */
  async getDepartures(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Fetching REAL-TIME departures for ${airportCode} from AeroDataBox`);
    
    try {
      // Try primary provider (AeroDataBox)
      const flights = await this.aeroDataBoxService.getFlights(airportCode, 'departures');
      
      // Convert to our standard format with Romanian delay formatting
      const convertedFlights = flights
        .map(flight => this.aeroDataBoxService.convertToStandardFormat(flight, 'departures', airportCode))
        .filter(converted => converted !== null) // Filter out flights without valid airport codes
        .map(converted => ({
          ...converted,
          delay: converted.delay ? converted.delay : undefined
        }));

      console.log(`Successfully fetched ${convertedFlights.length} real departures for ${airportCode} from AeroDataBox`);
      
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
      
      // Try backup provider (AviationStack) if available
      if (this.aviationStackService) {
        console.log(`Trying backup AviationStack for ${airportCode} departures`);
        
        try {
          const backupFlights = await this.aviationStackService.getDepartures(airportCode);
          const convertedBackupFlights = this.aviationStackService.convertToStandardFormat(backupFlights, 'departures');
          
          console.log(`Successfully fetched ${convertedBackupFlights.length} real departures for ${airportCode} from AviationStack backup`);
          
          return {
            success: true,
            data: convertedBackupFlights,
            cached: false,
            last_updated: new Date().toISOString(),
            airport_code: airportCode,
            type: 'departures',
            source: 'AviationStack (backup)'
          };
          
        } catch (backupError) {
          console.error(`AviationStack backup also failed for ${airportCode} departures:`, backupError);
        }
      }
      
      // Both providers failed - return error
      return {
        success: false,
        data: [],
        error: `Real-time data unavailable from all providers: ${error instanceof Error ? error.message : 'Unknown error'}`,
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