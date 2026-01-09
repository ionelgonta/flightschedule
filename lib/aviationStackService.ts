/**
 * AviationStack API Service - Backup pentru AeroDataBox
 * Furnizor alternativ pentru date de zboruri în timp real
 */

export interface AviationStackFlight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string;
    gate: string;
    delay: number;
    scheduled: string;
    estimated: string;
    actual: string;
    estimated_runway: string;
    actual_runway: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string;
    gate: string;
    baggage: string;
    delay: number;
    scheduled: string;
    estimated: string;
    actual: string;
    estimated_runway: string;
    actual_runway: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared: any;
  };
  aircraft: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
  };
  live: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
}

export interface AviationStackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: AviationStackFlight[];
}

export default class AviationStackService {
  private apiKey: string;
  private baseUrl: string = 'http://api.aviationstack.com/v1';
  private rateLimitDelay: number = 1000; // 1 second between requests

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Obține sosirile pentru un aeroport
   */
  async getArrivals(airportCode: string): Promise<AviationStackFlight[]> {
    try {
      console.log(`Fetching REAL-TIME arrivals for ${airportCode} from AviationStack`);
      
      const url = `${this.baseUrl}/flights?access_key=${this.apiKey}&arr_iata=${airportCode}&limit=100`;
      console.log(`Making API request to: ${url.replace(this.apiKey, '[API_KEY]')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`AviationStack API Error: ${response.status} ${response.statusText}`);
      }
      
      const data: AviationStackResponse = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log(`No arrivals data returned for ${airportCode}`);
        return [];
      }
      
      console.log(`Successfully fetched ${data.data.length} real arrivals for ${airportCode}`);
      return data.data;
      
    } catch (error) {
      console.error(`AviationStack API request failed for arrivals ${airportCode}:`, error);
      throw error;
    }
  }

  /**
   * Obține plecările pentru un aeroport
   */
  async getDepartures(airportCode: string): Promise<AviationStackFlight[]> {
    try {
      console.log(`Fetching REAL-TIME departures for ${airportCode} from AviationStack`);
      
      const url = `${this.baseUrl}/flights?access_key=${this.apiKey}&dep_iata=${airportCode}&limit=100`;
      console.log(`Making API request to: ${url.replace(this.apiKey, '[API_KEY]')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`AviationStack API Error: ${response.status} ${response.statusText}`);
      }
      
      const data: AviationStackResponse = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log(`No departures data returned for ${airportCode}`);
        return [];
      }
      
      console.log(`Successfully fetched ${data.data.length} real departures for ${airportCode}`);
      return data.data;
      
    } catch (error) {
      console.error(`AviationStack API request failed for departures ${airportCode}:`, error);
      throw error;
    }
  }

  /**
   * Convertește datele AviationStack la formatul standard
   */
  convertToStandardFormat(flights: AviationStackFlight[], type: 'arrivals' | 'departures'): any[] {
    return flights.map(flight => {
      const isArrival = type === 'arrivals';
      const relevantData = isArrival ? flight.arrival : flight.departure;
      const otherData = isArrival ? flight.departure : flight.arrival;
      
      return {
        flightNumber: flight.flight.iata || flight.flight.number,
        airlineCode: flight.airline.iata || 'XX',
        airlineName: flight.airline.name || 'Unknown Airline',
        originCode: flight.departure.iata || '',
        originName: flight.departure.airport || flight.departure.iata || '',
        destinationCode: flight.arrival.iata || '',
        destinationName: flight.arrival.airport || flight.arrival.iata || '',
        scheduledTime: relevantData.scheduled || '',
        actualTime: relevantData.actual || '',
        estimatedTime: relevantData.estimated || '',
        status: this.mapStatus(flight.flight_status),
        delayMinutes: relevantData.delay || 0,
        gate: relevantData.gate || '',
        terminal: relevantData.terminal || '',
        aircraft: flight.aircraft?.registration || '',
        runway: relevantData.actual_runway || '',
        baggageBelt: isArrival ? flight.arrival.baggage : '',
        lastUpdated: flight.live?.updated || new Date().toISOString(),
        source: 'aviationstack'
      };
    });
  }

  /**
   * Mapează statusurile AviationStack la statusurile standard
   */
  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'scheduled': 'scheduled',
      'active': 'active',
      'landed': 'landed',
      'cancelled': 'cancelled',
      'incident': 'delayed',
      'diverted': 'delayed'
    };
    
    return statusMap[status?.toLowerCase()] || 'unknown';
  }
}