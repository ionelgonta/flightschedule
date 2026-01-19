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
   * Verifică dacă un zbor este privat, tehnic sau invalid (de exclus)
   * Returnează true dacă zborul trebuie EXCLUS
   */
  private isPrivateOrTechnicalFlight(flight: AviationStackFlight): boolean {
    const airlineIata = flight.airline?.iata || '';
    const airlineName = (flight.airline?.name || '').toLowerCase();
    const flightNumber = (flight.flight?.iata || flight.flight?.number || '').toUpperCase().trim();
    const flightNumberOnly = flight.flight?.number || '';
    
    // Exclude zboruri fără cod IATA de companie (de obicei private)
    if (!airlineIata || airlineIata.length !== 2) {
      console.log(`[AviationStack Filter] Excluding flight ${flightNumber}: no valid airline IATA code`);
      return true;
    }
    
    // Exclude companii cargo, charter VIP, private - coduri IATA
    const excludedAirlineCodes = new Set([
      'AG',  // Aruba Airlines / cargo
      'QY',  // European Air Transport (DHL cargo)
      '5X',  // UPS Airlines (cargo)
      'FX',  // FedEx Express (cargo)
      'CV',  // Cargolux (cargo)
      'C8',  // Cargolux Italia (cargo)
      'LD',  // Air Hong Kong (cargo)
      'CA',  // Air China (check if cargo variant)
      'SQ',  // Singapore Airlines (check if cargo variant)
      'KE',  // Korean Air (check if cargo variant)
      '5Y',  // Atlas Air (cargo)
      'PO',  // Polar Air Cargo (cargo)
      'KZ',  // Nippon Cargo Airlines (cargo)
      'RU',  // AirBridgeCargo (cargo)
      'C5',  // CAL Cargo Airlines (cargo)
      'QR',  // Qatar Airways (check if cargo variant)
      'EY',  // Etihad (check if cargo variant)
      'EK',  // Emirates (check if cargo variant)
      'TG',  // Thai Airways (check if cargo variant)
      'CK',  // China Cargo Airlines (cargo)
      'MH',  // Malaysia Airlines (check if cargo variant)
      'KC',  // Air Astana (check if cargo variant)
      'VI',  // Volga-Dnepr Airlines (cargo)
      'ADB', // Antonov Airlines (cargo)
      'VJ',  // VistaJet (private)
      'NJ',  // NetJets Europe (private)
      'EJ',  // NetJets Aviation (private)
      'XS',  // ExecuJet (private)
      'LX',  // Flexjet (private) - careful, also Swiss
      'BZ',  // Bluebird Airways (check context)
      'TOY', // Toy Airlines (charter)
    ]);
    
    if (excludedAirlineCodes.has(airlineIata)) {
      // Double check - some codes like EK, QR are also passenger airlines
      // Only exclude if name contains cargo/freight keywords
      const cargoKeywords = ['cargo', 'freight', 'express', 'logistics'];
      if (cargoKeywords.some(kw => airlineName.includes(kw))) {
        console.log(`[AviationStack Filter] Excluding cargo flight ${flightNumber}: ${flight.airline?.name}`);
        return true;
      }
    }
    
    // Exclude zboruri cu număr invalid (prea scurt, doar cifre fără cod, etc.)
    // Format valid: XX1234 sau XX123 (2 litere + 1-4 cifre)
    const validFlightNumberPattern = /^[A-Z]{2}\d{1,4}$/;
    if (!flightNumber || !validFlightNumberPattern.test(flightNumber)) {
      console.log(`[AviationStack Filter] Excluding flight "${flightNumber}": invalid flight number format`);
      return true;
    }
    
    // Exclude dacă numărul zborului este doar 1-2 cifre (ex: "1", "12")
    if (flightNumberOnly && /^\d{1,2}$/.test(flightNumberOnly)) {
      console.log(`[AviationStack Filter] Excluding flight ${flightNumber}: flight number too short "${flightNumberOnly}"`);
      return true;
    }
    
    // Exclude codeshare-uri (zboruri operate de altă companie)
    if (flight.flight?.codeshared) {
      const operatingFlight = flight.flight.codeshared.flight_iata || flight.flight.codeshared.flight_number || 'unknown';
      console.log(`[AviationStack Filter] Excluding codeshare ${flightNumber} (operated by ${operatingFlight})`);
      return true;
    }
    
    // Exclude companii de aviație privată/business/cargo cunoscute - după nume
    const privateAirlines = [
      'netjets', 'vistajet', 'execujet', 'luxaviation', 'air charter',
      'private', 'executive', 'business jet', 'charter service',
      'air ambulance', 'medevac', 'cargo', 'freight', 'express cargo',
      'dhl', 'fedex', 'ups', 'tnt', 'dpd', 'gls',
      'military', 'air force', 'navy', 'army', 'force aerienne',
      'luftwaffe', 'aeronautica', 'fuerza aerea'
    ];
    
    if (privateAirlines.some(keyword => airlineName.includes(keyword))) {
      console.log(`[AviationStack Filter] Excluding flight ${flightNumber}: private/business/cargo airline "${flight.airline?.name}"`);
      return true;
    }
    
    // Exclude zboruri tehnice (ferry flights, positioning, test flights)
    const technicalPatterns = [
      /^[A-Z]{2}\d{4}[A-Z]$/,  // Zboruri de poziționare (ex: W64820P)
      /^FERRY/i,
      /^TEST/i,
      /^POS/i,
      /^TRN/i,  // Training
      /^CHK/i,  // Check flights
    ];
    
    if (technicalPatterns.some(pattern => pattern.test(flightNumber))) {
      console.log(`[AviationStack Filter] Excluding flight ${flightNumber}: technical/positioning flight`);
      return true;
    }
    
    // Exclude dacă nu are destinație sau origine validă (cod IATA de 3 litere)
    const validAirportCode = /^[A-Z]{3}$/;
    if (!flight.departure?.iata || !validAirportCode.test(flight.departure.iata) ||
        !flight.arrival?.iata || !validAirportCode.test(flight.arrival.iata)) {
      console.log(`[AviationStack Filter] Excluding flight ${flightNumber}: invalid origin/destination (${flight.departure?.iata} -> ${flight.arrival?.iata})`);
      return true;
    }
    
    return false;
  }

  /**
   * Convertește datele AviationStack la formatul standard
   * FILTREAZĂ zborurile private și tehnice - păstrează doar rute regulate și chartere
   */
  convertToStandardFormat(flights: AviationStackFlight[], type: 'arrivals' | 'departures'): any[] {
    const originalCount = flights.length;
    
    // Filtrează zborurile private și tehnice
    const filteredFlights = flights.filter(flight => !this.isPrivateOrTechnicalFlight(flight));
    
    const excludedCount = originalCount - filteredFlights.length;
    if (excludedCount > 0) {
      console.log(`[AviationStack Filter] Excluded ${excludedCount} private/technical flights out of ${originalCount} total`);
    }
    
    return filteredFlights.map(flight => {
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