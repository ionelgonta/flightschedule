/**
 * Weekly Flight Schedule Analysis System
 * Analizează datele existente din cache pentru a genera programe săptămânale de zboruri
 * Funcționează complet offline, fără apeluri externe la API-uri
 */

import { MAJOR_AIRPORTS } from './airports';
import { getFlightRepository } from './flightRepository';
import { RawFlightData } from './flightApiService';

// Local type for cached flight data
interface CachedFlightData {
  airport_code: string
  type: 'arrivals' | 'departures'
  data: RawFlightData[]
  updated_at: string
  expires_at: string
  success: boolean
}

// Core Data Structures

export interface WeeklyScheduleData {
  airport: string;
  destination: string;
  airline: string;
  flightNumber: string;
  weeklyPattern: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  // Scheduled times for each day (HH:MM format)
  scheduledTimes?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  // Last seen date for each day (ISO date string) - for expiration tracking
  lastSeenDates?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  frequency: number;
  lastUpdated: string;
  dataSource: 'cache' | 'historical';
}

export interface FlightPattern {
  route: {
    origin: string;
    destination: string;
  };
  schedule: {
    dayOfWeek: DayOfWeek;
    scheduledTime: string;
    airline: string;
    flightNumber: string;
  }[];
  statistics: {
    totalFlights: number;
    averagePerWeek: number;
    operatingDays: DayOfWeek[];
  };
}

export interface AggregatedSchedule {
  routes: FlightPattern[];
  summary: {
    totalRoutes: number;
    totalFlights: number;
    airportsAnalyzed: string[];
    dataRange: {
      from: string;
      to: string;
    };
  };
  generatedAt: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeeklyPattern {
  [key: string]: boolean; // dayOfWeek -> boolean
}

// Component Interfaces

export interface CacheDataExtractor {
  getAllCachedFlights(): Promise<CachedFlightData[]>;
  getFlightsByAirport(airportCode: string): Promise<CachedFlightData[]>;
  getHistoricalData(months: number): Promise<CachedFlightData[]>;
}

export interface DayPatternGenerator {
  extractDayOfWeek(flightDate: string): DayOfWeek;
  generateWeeklyPattern(flights: RawFlightData[]): WeeklyPattern;
  aggregatePatterns(patterns: WeeklyPattern[]): WeeklyPattern;
}

export interface ScheduleTableManager {
  createTable(): Promise<void>;
  updateTable(data: WeeklyScheduleData[]): Promise<void>;
  getScheduleData(): Promise<WeeklyScheduleData[]>;
  clearTable(): Promise<void>;
}

export interface WeeklyScheduleAnalyzer {
  analyzeFlightPatterns(): Promise<AggregatedSchedule>;
  updateScheduleTable(): Promise<void>;
  exportSchedule(format: 'json' | 'csv'): Promise<string>;
  getScheduleData(): Promise<WeeklyScheduleData[]>;
  clearScheduleTable(): Promise<void>;
}

// Implementation Classes

export class CacheDataExtractorImpl implements CacheDataExtractor {
  private flightRepository = getFlightRepository();

  async getAllCachedFlights(): Promise<CachedFlightData[]> {
    console.log('[Weekly Schedule] Getting all cached flights from multiple sources...');
    
    const allFlights: CachedFlightData[] = [];
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // PRIORITY 1: Read from main cache (cache-data.json) - contains TODAY's flights
    try {
      const mainCachePath = path.join(process.cwd(), 'data', 'cache-data.json');
      console.log(`[Weekly Schedule] Reading main cache from: ${mainCachePath}`);
      const mainCacheContent = await fs.readFile(mainCachePath, 'utf8');
      const mainCacheEntries = JSON.parse(mainCacheContent);
      
      // Process main cache entries (format: array of cache entries with key like "OTP_arrivals")
      if (Array.isArray(mainCacheEntries)) {
        mainCacheEntries.forEach((entry: any) => {
          if (entry.category === 'flightData' && entry.key && entry.data) {
            const [airportCode, type] = entry.key.split('_');
            if (airportCode && (type === 'arrivals' || type === 'departures')) {
              // Extract flight data - handle both array and nested formats
              let flightData = entry.data;
              if (flightData && typeof flightData === 'object' && 'flights' in flightData) {
                flightData = flightData.flights;
              }
              
              if (Array.isArray(flightData) && flightData.length > 0) {
                allFlights.push({
                  airport_code: airportCode,
                  type: type as 'arrivals' | 'departures',
                  data: flightData,
                  updated_at: entry.createdAt || new Date().toISOString(),
                  expires_at: entry.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  success: entry.success !== false
                });
              }
            }
          }
        });
      }
      
      console.log(`[Weekly Schedule] Found ${allFlights.length} flight datasets from main cache`);
    } catch (error) {
      console.warn('[Weekly Schedule] Could not read main cache:', error);
    }
    
    // PRIORITY 2: Also read from persistent cache (flights_cache.json) for historical data
    try {
      const persistentCachePath = path.join(process.cwd(), 'data', 'flights_cache.json');
      const persistentCacheContent = await fs.readFile(persistentCachePath, 'utf8');
      const persistentCache = JSON.parse(persistentCacheContent);
      
      console.log(`[Weekly Schedule] Found ${Object.keys(persistentCache).length} entries in persistent cache`);
      
      // Group flights by airport and type
      const flightsByAirportType = new Map<string, { arrivals: any[], departures: any[] }>();
      
      Object.values(persistentCache).forEach((flight: any) => {
        if (!flight.airportCode || !flight.type) return;
        
        const key = flight.airportCode;
        if (!flightsByAirportType.has(key)) {
          flightsByAirportType.set(key, { arrivals: [], departures: [] });
        }
        
        if (flight.type === 'arrivals') {
          flightsByAirportType.get(key)!.arrivals.push(flight);
        } else if (flight.type === 'departures') {
          flightsByAirportType.get(key)!.departures.push(flight);
        }
      });
      
      // Convert to CachedFlightData format and add to allFlights
      flightsByAirportType.forEach((data, airportCode) => {
        if (data.arrivals.length > 0) {
          allFlights.push({
            airport_code: airportCode,
            type: 'arrivals',
            data: this.convertPersistentToRawFlightData(data.arrivals),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            success: true
          });
        }
        
        if (data.departures.length > 0) {
          allFlights.push({
            airport_code: airportCode,
            type: 'departures',
            data: this.convertPersistentToRawFlightData(data.departures),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            success: true
          });
        }
      });
      
      console.log(`[Weekly Schedule] Total flight datasets after persistent cache: ${allFlights.length}`);
    } catch (error) {
      console.warn('[Weekly Schedule] Could not read persistent cache:', error);
    }
    
    // If we have data from caches, return it
    if (allFlights.length > 0) {
      return allFlights;
    }
    
    // Fallback to historical data
    const historicalFlights = await this.getHistoricalFlights(30);
    
    if (historicalFlights.length > 0) {
      console.log(`[Weekly Schedule] Found ${historicalFlights.length} historical flight datasets`);
      return historicalFlights;
    }
    
    // Final fallback to flight repository
    console.log('[Weekly Schedule] Falling back to flight repository...');
    
    // Iterate through all airports and get cached data
    for (const airport of MAJOR_AIRPORTS) {
      try {
        const arrivals = await this.getFlightsByAirport(airport.code);
        allFlights.push(...arrivals);
      } catch (error) {
        console.warn(`Could not get cached flights for ${airport.code}:`, error);
      }
    }
    
    return allFlights;
  }

  private async getHistoricalFlights(days: number): Promise<CachedFlightData[]> {
    try {
      // Import historical cache manager
      const { historicalCacheManager } = await import('./historicalCacheManager');
      await historicalCacheManager.initialize();
      
      const allFlights: CachedFlightData[] = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      console.log(`[Weekly Schedule] Querying historical data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      // Get data for each airport and each day
      for (const airport of MAJOR_AIRPORTS) {
        try {
          // Get historical data for this airport for both arrivals and departures
          const arrivalsData = await historicalCacheManager.getDataForRange(
            airport.code, 
            startDate.toISOString().split('T')[0], 
            endDate.toISOString().split('T')[0],
            'arrivals'
          );
          
          const departuresData = await historicalCacheManager.getDataForRange(
            airport.code, 
            startDate.toISOString().split('T')[0], 
            endDate.toISOString().split('T')[0],
            'departures'
          );
          
          // Convert to the expected format
          const historicalData: any[] = [];
          
          // Group arrivals by date
          const arrivalsByDate = new Map<string, any[]>();
          arrivalsData.forEach(flight => {
            const date = flight.scheduledTime.split('T')[0];
            if (!arrivalsByDate.has(date)) {
              arrivalsByDate.set(date, []);
            }
            arrivalsByDate.get(date)!.push(flight);
          });
          
          // Group departures by date
          const departuresByDate = new Map<string, any[]>();
          departuresData.forEach(flight => {
            const date = flight.scheduledTime.split('T')[0];
            if (!departuresByDate.has(date)) {
              departuresByDate.set(date, []);
            }
            departuresByDate.get(date)!.push(flight);
          });
          
          // Create snapshots for each date
          const allDates = new Set([...arrivalsByDate.keys(), ...departuresByDate.keys()]);
          allDates.forEach(date => {
            if (arrivalsByDate.has(date)) {
              historicalData.push({
                date,
                type: 'arrivals',
                flights: arrivalsByDate.get(date)
              });
            }
            if (departuresByDate.has(date)) {
              historicalData.push({
                date,
                type: 'departures', 
                flights: departuresByDate.get(date)
              });
            }
          });
          
          if (historicalData.length > 0) {
            console.log(`[Weekly Schedule] Airport ${airport.code}: Found ${historicalData.length} historical snapshots`);
            
            // Group by date and type
            const groupedData = new Map<string, { arrivals: any[], departures: any[] }>();
            
            historicalData.forEach(snapshot => {
              const key = snapshot.date;
              if (!groupedData.has(key)) {
                groupedData.set(key, { arrivals: [], departures: [] });
              }
              
              if (snapshot.type === 'arrivals') {
                groupedData.get(key)!.arrivals = snapshot.flights || [];
              } else if (snapshot.type === 'departures') {
                groupedData.get(key)!.departures = snapshot.flights || [];
              }
            });
            
            // Convert to CachedFlightData format
            groupedData.forEach((data, date) => {
              if (data.arrivals.length > 0) {
                allFlights.push({
                  airport_code: airport.code,
                  type: 'arrivals',
                  data: this.convertHistoricalToRawFlightData(data.arrivals),
                  updated_at: `${date}T12:00:00.000Z`,
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  success: true
                });
              }
              
              if (data.departures.length > 0) {
                allFlights.push({
                  airport_code: airport.code,
                  type: 'departures',
                  data: this.convertHistoricalToRawFlightData(data.departures),
                  updated_at: `${date}T12:00:00.000Z`,
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  success: true
                });
              }
            });
          }
        } catch (error) {
          console.warn(`[Weekly Schedule] Could not get historical data for ${airport.code}:`, error);
        }
      }
      
      console.log(`[Weekly Schedule] Total historical flights collected: ${allFlights.length} datasets`);
      return allFlights;
      
    } catch (error) {
      console.error('[Weekly Schedule] Error accessing historical cache manager:', error);
      return [];
    }
  }

  private convertHistoricalToRawFlightData(historicalFlights: any[]): RawFlightData[] {
    return historicalFlights.map(flight => ({
      flight_number: flight.flightNumber || 'N/A',
      airline: {
        name: flight.airlineName || 'Unknown',
        code: flight.airlineCode || 'XX'
      },
      origin: {
        airport: flight.originName || flight.originCode || 'Unknown',
        code: flight.originCode || null,
        city: flight.originName || flight.originCode || 'Unknown'
      },
      destination: {
        airport: flight.destinationName || flight.destinationCode || 'Unknown', 
        code: flight.destinationCode || null,
        city: flight.destinationName || flight.destinationCode || 'Unknown'
      },
      scheduled_time: flight.scheduledTime || new Date().toISOString(),
      actual_time: flight.actualTime,
      estimated_time: flight.estimatedTime,
      status: flight.status || 'scheduled',
      delay: flight.delayMinutes || 0
    }));
  }

  private convertPersistentToRawFlightData(persistentFlights: any[]): RawFlightData[] {
    return persistentFlights.map(flight => ({
      flight_number: flight.flightNumber || 'N/A',
      airline: {
        name: flight.airlineName || 'Unknown',
        code: flight.airlineCode || 'XX'
      },
      origin: {
        airport: flight.originName || flight.originCode || 'Unknown',
        code: flight.originCode || null,
        city: flight.originName || flight.originCode || 'Unknown'
      },
      destination: {
        airport: flight.destinationName || flight.destinationCode || 'Unknown', 
        code: flight.destinationCode || null,
        city: flight.destinationName || flight.destinationCode || 'Unknown'
      },
      scheduled_time: flight.scheduledTime || new Date().toISOString(),
      actual_time: flight.actualTime,
      estimated_time: flight.estimatedTime,
      status: flight.status || 'scheduled',
      delay: flight.delayMinutes || 0
    }));
  }

  async getFlightsByAirport(airportCode: string): Promise<CachedFlightData[]> {
    const flights: CachedFlightData[] = [];
    
    try {
      // Get both arrivals and departures from cache - force cache usage
      const arrivalsResponse = await this.flightRepository.getArrivals(airportCode);
      const departuresResponse = await this.flightRepository.getDepartures(airportCode);
      
      console.log(`Airport ${airportCode} - Arrivals: ${arrivalsResponse.data.length} flights, Cached: ${arrivalsResponse.cached}`);
      console.log(`Airport ${airportCode} - Departures: ${departuresResponse.data.length} flights, Cached: ${departuresResponse.cached}`);
      
      // Include data regardless of cache status if we have flights
      if (arrivalsResponse.data.length > 0) {
        flights.push({
          airport_code: airportCode,
          type: 'arrivals',
          data: arrivalsResponse.data,
          updated_at: arrivalsResponse.last_updated || new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          success: arrivalsResponse.success
        });
      }
      
      if (departuresResponse.data.length > 0) {
        flights.push({
          airport_code: airportCode,
          type: 'departures',
          data: departuresResponse.data,
          updated_at: departuresResponse.last_updated || new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          success: departuresResponse.success
        });
      }
    } catch (error) {
      console.warn(`Error getting flights for airport ${airportCode}:`, error);
    }
    
    return flights;
  }

  async getHistoricalData(months: number): Promise<CachedFlightData[]> {
    const allFlights = await this.getAllCachedFlights();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    // Filter flights within the specified time range
    return allFlights.filter(flightData => {
      const updatedAt = new Date(flightData.updated_at);
      return updatedAt >= cutoffDate;
    });
  }
}

export class DayPatternGeneratorImpl implements DayPatternGenerator {
  private dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  extractDayOfWeek(flightDate: string): DayOfWeek {
    const date = new Date(flightDate);
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return this.dayNames[dayIndex];
  }

  generateWeeklyPattern(flights: RawFlightData[]): WeeklyPattern {
    const pattern: WeeklyPattern = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    };

    flights.forEach(flight => {
      const dayOfWeek = this.extractDayOfWeek(flight.scheduled_time);
      pattern[dayOfWeek] = true;
    });

    return pattern;
  }

  aggregatePatterns(patterns: WeeklyPattern[]): WeeklyPattern {
    const aggregated: WeeklyPattern = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    };

    patterns.forEach(pattern => {
      Object.keys(aggregated).forEach(day => {
        if (pattern[day]) {
          aggregated[day] = true;
        }
      });
    });

    return aggregated;
  }
}

export class ScheduleTableManagerImpl implements ScheduleTableManager {
  private readonly STORAGE_FILE = 'weekly_schedule_table.json';
  private readonly STORAGE_DIR = '.cache';

  async createTable(): Promise<void> {
    // Initialize empty table structure
    const emptyTable: WeeklyScheduleData[] = [];
    await this.saveToStorage(emptyTable);
  }

  async updateTable(data: WeeklyScheduleData[]): Promise<void> {
    await this.saveToStorage(data);
  }

  async getScheduleData(): Promise<WeeklyScheduleData[]> {
    return await this.loadFromStorage();
  }

  async clearTable(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), this.STORAGE_DIR, this.STORAGE_FILE);
      
      try {
        await fs.unlink(filePath);
        console.log('Weekly schedule table cleared');
      } catch (error) {
        // File doesn't exist, which is fine
        console.log('Weekly schedule table was already empty');
      }
    } catch (error) {
      console.error('Error clearing weekly schedule table:', error);
    }
  }

  private async saveToStorage(data: WeeklyScheduleData[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const storageDir = path.join(process.cwd(), this.STORAGE_DIR);
      const filePath = path.join(storageDir, this.STORAGE_FILE);
      
      // Ensure directory exists
      try {
        await fs.mkdir(storageDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      // Save data with metadata
      const dataWithMetadata = {
        data,
        metadata: {
          savedAt: new Date().toISOString(),
          count: data.length,
          version: '1.0'
        }
      };
      
      await fs.writeFile(filePath, JSON.stringify(dataWithMetadata, null, 2), 'utf8');
      console.log(`Weekly schedule saved: ${data.length} entries to ${filePath}`);
    } catch (error) {
      console.error('Error saving weekly schedule to storage:', error);
      throw error;
    }
  }

  private async loadFromStorage(): Promise<WeeklyScheduleData[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), this.STORAGE_DIR, this.STORAGE_FILE);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        // Handle both old format (array) and new format (object with data/metadata)
        if (Array.isArray(parsed)) {
          console.log(`Weekly schedule loaded: ${parsed.length} entries (legacy format)`);
          return parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          console.log(`Weekly schedule loaded: ${parsed.data.length} entries (saved: ${parsed.metadata?.savedAt})`);
          return parsed.data;
        } else {
          console.warn('Invalid weekly schedule file format, returning empty array');
          return [];
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log('Weekly schedule file not found, returning empty array');
          return [];
        }
        throw error;
      }
    } catch (error) {
      console.error('Error loading weekly schedule from storage:', error);
      return [];
    }
  }
}

export class WeeklyScheduleAnalyzerImpl implements WeeklyScheduleAnalyzer {
  private cacheExtractor: CacheDataExtractor;
  private patternGenerator: DayPatternGenerator;
  private tableManager: ScheduleTableManager;

  constructor() {
    this.cacheExtractor = new CacheDataExtractorImpl();
    this.patternGenerator = new DayPatternGeneratorImpl();
    this.tableManager = new ScheduleTableManagerImpl();
  }

  // Funcție pentru detectarea zborurilor codeshare
  private isCodeshareFlightNumber(flightNumber: string, airline: string): boolean {
    if (!flightNumber || !airline) return false
    
    // Codeshare-urile au de obicei numere de zbor cu prefixe diferite pentru același zbor
    const codesharePatterns = [
      /\*/, // Asterisk indicates codeshare
      /operated by/i,
      /op by/i,
    ]
    
    // Check if flight number contains codeshare indicators
    if (codesharePatterns.some(pattern => pattern.test(flightNumber))) {
      return true
    }
    
    // Extract flight prefix and number (e.g., "TK" and "9019" from "TK 9019")
    const cleanFlightNumber = flightNumber.replace(/\s+/g, ' ').trim()
    const match = cleanFlightNumber.match(/^([A-Z0-9]{2})\s*(\d+)$/i)
    
    if (!match) return false
    
    const flightPrefix = match[1].toUpperCase()
    const flightNum = parseInt(match[2], 10)
    const airlineUpper = airline.toUpperCase()
    
    // PATTERN 1: Flight numbers >= threshold are typically codeshares for major airlines
    // Different airlines have different codeshare number ranges
    const highNumberCodeshareAirlines = ['TK', 'AF', 'LH', 'UA', 'AC', 'SQ', 'ET', 'JU', 'LY', 'BT', 'EK', 'OS', 'SK', 'AY']
    if (highNumberCodeshareAirlines.includes(flightPrefix) && flightNum >= 5000) {
      console.log(`[Codeshare Detection] High number codeshare: ${flightNumber} (${flightPrefix} ${flightNum} >= 5000)`)
      return true
    }
    
    // KLM uses 2xxx-9xxx for codeshares (their own flights are typically < 2000)
    if (flightPrefix === 'KL' && flightNum >= 2000) {
      console.log(`[Codeshare Detection] KLM codeshare: ${flightNumber} (KL ${flightNum} >= 2000)`)
      return true
    }
    
    // Air France uses 6xxx-9xxx for codeshares
    if (flightPrefix === 'AF' && flightNum >= 6000) {
      console.log(`[Codeshare Detection] Air France codeshare: ${flightNumber} (AF ${flightNum} >= 6000)`)
      return true
    }
    
    // PATTERN 2: Airline code in flight number doesn't match operating airline
    // Map of airline codes to their names
    const airlineCodeMap: { [key: string]: string[] } = {
      'RO': ['TAROM'],
      'W4': ['WIZZ', 'W4', 'WIZZ AIR MALTA'],
      'W9': ['WIZZ'],
      'FR': ['RYANAIR'],
      'LH': ['LUFTHANSA'],
      'AF': ['AIR FRANCE'],
      'KL': ['KLM'],
      'TK': ['TURKISH'],
      'EK': ['EMIRATES'],
      'FZ': ['FLYDUBAI'],
      'A3': ['AEGEAN'],
      'H4': ['HISKY'],
      'A2': ['ANIMAWINGS', 'AWG'],
      'JU': ['AIR SERBIA'],
      'LY': ['EL AL'],
      'UA': ['UNITED'],
      'AC': ['AIR CANADA'],
      'SQ': ['SINGAPORE'],
      'ET': ['ETHIOPIAN'],
      'BT': ['AIRBALTIC'],
      'BZ': ['BLUE BIRD', 'BZ'],
      '5F': ['FLYONE'],
      'U5': ['SKYUP', 'SKY UP', 'AURA'],
    }
    
    // Check if the flight prefix matches the airline name
    const expectedAirlineNames = airlineCodeMap[flightPrefix]
    if (expectedAirlineNames) {
      const airlineMatches = expectedAirlineNames.some(name => airlineUpper.includes(name))
      if (!airlineMatches) {
        console.log(`[Codeshare Detection] Airline mismatch: ${flightNumber} operated by ${airline} (expected ${expectedAirlineNames.join(' or ')})`)
        return true
      }
    }
    
    // PATTERN 3: Known codeshare partnerships - specific mismatches
    const codeShareMismatches = [
      // Star Alliance codeshares
      { flight: 'LH', airline: 'UNITED' },
      { flight: 'UA', airline: 'LUFTHANSA' },
      { flight: 'AC', airline: 'LUFTHANSA' },
      { flight: 'SQ', airline: 'LUFTHANSA' },
      { flight: 'ET', airline: 'LUFTHANSA' },
      { flight: 'TK', airline: 'TAROM' },
      { flight: 'TK', airline: 'LUFTHANSA' },
      
      // SkyTeam codeshares
      { flight: 'AF', airline: 'TAROM' },
      { flight: 'AF', airline: 'KLM' },
      { flight: 'KL', airline: 'TAROM' },
      { flight: 'KL', airline: 'AIR FRANCE' },
      { flight: 'RO', airline: 'AIR FRANCE' },
      { flight: 'RO', airline: 'KLM' },
      
      // Other codeshares
      { flight: 'JU', airline: 'TAROM' },
      { flight: 'LY', airline: 'TAROM' },
      { flight: 'EK', airline: 'FLYDUBAI' },
      { flight: 'BT', airline: 'TAROM' },
    ]
    
    const isKnownCodeshare = codeShareMismatches.some(mismatch => 
      flightPrefix === mismatch.flight && airlineUpper.includes(mismatch.airline)
    )
    
    if (isKnownCodeshare) {
      console.log(`[Codeshare Detection] Known codeshare partnership: ${flightNumber} on ${airline}`)
      return true
    }
    
    return false
  }

  // Funcție pentru eliminarea duplicatelor de codeshare din datele brute
  private removeDuplicateCodeshares(flights: RawFlightData[]): RawFlightData[] {
    const flightMap = new Map<string, RawFlightData>()
    
    flights.forEach(flight => {
      // Create a unique key based on route, time, and airline
      const originCode = typeof flight.origin === 'string' ? flight.origin : flight.origin?.code || ''
      const destinationCode = typeof flight.destination === 'string' ? flight.destination : flight.destination?.code || ''
      const scheduledTime = new Date(flight.scheduled_time).toISOString().split('T')[0] // Date only
      const routeKey = `${originCode}-${destinationCode}-${scheduledTime}`
      
      const isCodeshare = this.isCodeshareFlightNumber(flight.flight_number, flight.airline?.name || '')
      
      if (!flightMap.has(routeKey)) {
        // First flight for this route/time, add it
        flightMap.set(routeKey, flight)
      } else {
        const existingFlight = flightMap.get(routeKey)!
        const existingIsCodeshare = this.isCodeshareFlightNumber(existingFlight.flight_number, existingFlight.airline?.name || '')
        
        // Dacă zborul existent este codeshare și noul nu este, înlocuiește
        if (existingIsCodeshare && !isCodeshare) {
          flightMap.set(routeKey, flight)
        } else if (!existingIsCodeshare && isCodeshare) {
          // Păstrează zborul existent (non-codeshare)
          return
        } else {
          // Ambele sunt codeshare sau ambele nu sunt - păstrează primul
          return
        }
      }
    })
    
    const deduplicatedFlights = Array.from(flightMap.values())
    console.log(`[Weekly Schedule] Codeshare deduplication: ${flights.length} → ${deduplicatedFlights.length} flights (removed ${flights.length - deduplicatedFlights.length} codeshares)`)
    
    return deduplicatedFlights
  }

  async analyzeFlightPatterns(): Promise<AggregatedSchedule> {
    console.log('Starting weekly flight pattern analysis...');
    
    // First try to get all cached flights to see what's available
    const allFlights = await this.cacheExtractor.getAllCachedFlights();
    console.log(`Total cached flights found: ${allFlights.length}`);
    
    // Get historical data from last 3 months
    const historicalData = await this.cacheExtractor.getHistoricalData(3);
    console.log(`Historical data (3 months): ${historicalData.length} flight datasets`);
    
    if (historicalData.length === 0) {
      console.warn('No historical flight data found in cache');
      // Try to get any available data regardless of age
      const anyData = await this.cacheExtractor.getAllCachedFlights();
      console.log(`Fallback: Found ${anyData.length} flight datasets of any age`);
      
      if (anyData.length === 0) {
        return this.createEmptySchedule();
      }
      
      // Use any available data as fallback
      return this.processFlightData(anyData);
    }
    
    return this.processFlightData(historicalData);
  }
  
  private processFlightData(flightData: CachedFlightData[]): AggregatedSchedule {

    const routes: FlightPattern[] = [];
    const routeMap = new Map<string, RawFlightData[]>();
    
    console.log(`Processing ${flightData.length} flight datasets...`);
    
    // Group flights by route (origin-destination pair) and apply codeshare filtering
    flightData.forEach(flightDataSet => {
      console.log(`Processing ${flightDataSet.airport_code} ${flightDataSet.type}: ${flightDataSet.data.length} flights`);
      
      // Apply codeshare deduplication to the flight data
      const deduplicatedFlights = this.removeDuplicateCodeshares(flightDataSet.data);
      
      deduplicatedFlights.forEach(flight => {
        let originCode: string;
        let destinationCode: string;
        
        if (flightDataSet.type === 'departures') {
          originCode = flightDataSet.airport_code;
          destinationCode = typeof flight.destination === 'string' ? flight.destination : flight.destination?.code || '';
        } else {
          originCode = typeof flight.origin === 'string' ? flight.origin : flight.origin?.code || '';
          destinationCode = flightDataSet.airport_code;
        }
        
        const routeKey = `${originCode}-${destinationCode}`;
        
        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, []);
        }
        
        // Create a modified flight object with string codes for easier processing
        const processedFlight = {
          ...flight,
          originCode,
          destinationCode
        };
        
        routeMap.get(routeKey)!.push(processedFlight as any);
      });
    });
    
    console.log(`Generated ${routeMap.size} unique routes from flight data (after codeshare deduplication)`);

    // Analyze each route
    routeMap.forEach((flights, routeKey) => {
      const [origin, destination] = routeKey.split('-');
      
      if (!origin || !destination || origin === destination) return;
      
      const schedule = flights.map((flight: any) => ({
        dayOfWeek: this.patternGenerator.extractDayOfWeek(flight.scheduled_time),
        scheduledTime: flight.scheduled_time,
        airline: flight.airline.name,
        flightNumber: flight.flight_number
      }));

      const operatingDays = [...new Set(schedule.map(s => s.dayOfWeek))];
      
      routes.push({
        route: { origin, destination },
        schedule,
        statistics: {
          totalFlights: flights.length,
          averagePerWeek: this.calculateAveragePerWeek(flights as RawFlightData[]),
          operatingDays
        }
      });
    });

    const airportsAnalyzed = [...new Set(flightData.map(d => d.airport_code))];
    const dateRange = this.calculateDateRange(flightData);

    return {
      routes,
      summary: {
        totalRoutes: routes.length,
        totalFlights: flightData.reduce((sum, d) => sum + d.data.length, 0),
        airportsAnalyzed,
        dataRange: dateRange
      },
      generatedAt: new Date().toISOString()
    };
  }

  async updateScheduleTable(): Promise<void> {
    console.log('=== Starting weekly schedule table update ===');
    
    const analysis = await this.analyzeFlightPatterns();
    console.log(`Analysis completed: ${analysis.routes.length} routes found`);
    console.log(`Total flights analyzed: ${analysis.summary.totalFlights}`);
    console.log(`Airports analyzed: ${analysis.summary.airportsAnalyzed.join(', ')}`);
    
    // IMPROVED: Load existing schedule data to MERGE patterns instead of overwriting
    const existingScheduleData = await this.tableManager.getScheduleData();
    const existingScheduleMap = new Map<string, WeeklyScheduleData>();
    
    // Create a map of existing entries by unique key (airport-destination-airline-flightNumber)
    existingScheduleData.forEach(entry => {
      const key = `${entry.airport}-${entry.destination}-${entry.airline}-${entry.flightNumber}`;
      existingScheduleMap.set(key, entry);
    });
    
    console.log(`[Weekly Schedule] Loaded ${existingScheduleMap.size} existing schedule entries for merging`);
    
    const scheduleData: WeeklyScheduleData[] = [];

    analysis.routes.forEach((route, routeIndex) => {
      console.log(`Processing route ${routeIndex + 1}/${analysis.routes.length}: ${route.route.origin} → ${route.route.destination} (${route.schedule.length} flights)`);
      
      // Group flights by airline and flight number
      const flightGroups = new Map<string, typeof route.schedule>();
      
      route.schedule.forEach(flight => {
        const key = `${flight.airline}-${flight.flightNumber}`;
        if (!flightGroups.has(key)) {
          flightGroups.set(key, []);
        }
        flightGroups.get(key)!.push(flight);
      });

      console.log(`  Found ${flightGroups.size} unique flight numbers for this route`);

      flightGroups.forEach((flights, key) => {
        const [airline, flightNumber] = key.split('-');
        
        // Skip codeshare flights at the schedule level as well
        if (this.isCodeshareFlightNumber(flightNumber, airline)) {
          console.log(`    Skipping codeshare flight: ${airline} ${flightNumber}`);
          return;
        }
        
        const newPattern = this.patternGenerator.generateWeeklyPattern(
          flights.map(f => ({ scheduled_time: f.scheduledTime } as RawFlightData))
        );

        // Extract scheduled times for each day
        // CRITICAL: Keep only ONE time per day per flight number
        // A flight operates once per day - prefer the MOST RECENT data
        const newScheduledTimes: {
          monday?: string[];
          tuesday?: string[];
          wednesday?: string[];
          thursday?: string[];
          friday?: string[];
          saturday?: string[];
          sunday?: string[];
        } = {};
        
        // Collect times with their timestamps to find the most recent one
        const timesPerDay: { [day: string]: { time: string; timestamp: Date }[] } = {};
        
        // Get airport code for timezone conversion (use origin airport)
        const airportCode = route.route.origin;
        
        flights.forEach(flight => {
          const dayOfWeek = this.patternGenerator.extractDayOfWeek(flight.scheduledTime);
          const timeStr = this.extractTimeFromSchedule(flight.scheduledTime, airportCode);
          const flightDate = new Date(flight.scheduledTime);
          
          if (timeStr) {
            if (!timesPerDay[dayOfWeek]) {
              timesPerDay[dayOfWeek] = [];
            }
            timesPerDay[dayOfWeek].push({ time: timeStr, timestamp: flightDate });
          }
        });
        
        // For each day, keep only the time from the MOST RECENT flight data
        // This ensures we use the latest schedule, not old/outdated times
        Object.keys(timesPerDay).forEach(day => {
          const timesWithDates = timesPerDay[day];
          if (timesWithDates.length > 0) {
            // Sort by timestamp descending (newest first)
            timesWithDates.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            // Use the time from the most recent data
            const mostRecentTime = timesWithDates[0].time;
            
            // Store only ONE time per day (the most recent)
            const dayKey = day as keyof typeof newScheduledTimes;
            newScheduledTimes[dayKey] = [mostRecentTime];
          }
        });

        const airportDisplay = this.getAirportDisplayName(route.route.origin);
        const destinationDisplay = this.getAirportDisplayName(route.route.destination);
        const entryKey = `${airportDisplay}-${destinationDisplay}-${airline}-${flightNumber}`;
        
        // IMPROVED: Merge with existing pattern if it exists
        const existingEntry = existingScheduleMap.get(entryKey);
        
        // Create merged pattern with explicit type
        let mergedPattern: {
          monday: boolean;
          tuesday: boolean;
          wednesday: boolean;
          thursday: boolean;
          friday: boolean;
          saturday: boolean;
          sunday: boolean;
        };
        
        // Merge scheduled times
        let mergedScheduledTimes: typeof newScheduledTimes = { ...newScheduledTimes };
        
        if (existingEntry) {
          // Merge patterns: keep existing TRUE values and add new TRUE values
          mergedPattern = {
            monday: existingEntry.weeklyPattern.monday || newPattern.monday || false,
            tuesday: existingEntry.weeklyPattern.tuesday || newPattern.tuesday || false,
            wednesday: existingEntry.weeklyPattern.wednesday || newPattern.wednesday || false,
            thursday: existingEntry.weeklyPattern.thursday || newPattern.thursday || false,
            friday: existingEntry.weeklyPattern.friday || newPattern.friday || false,
            saturday: existingEntry.weeklyPattern.saturday || newPattern.saturday || false,
            sunday: existingEntry.weeklyPattern.sunday || newPattern.sunday || false
          };
          
          // Merge scheduled times from existing entry
          // CRITICAL FIX: Keep only ONE time per day - prefer newer data
          if (existingEntry.scheduledTimes) {
            const days: (keyof typeof mergedScheduledTimes)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
              const existingTimes = existingEntry.scheduledTimes?.[day] || [];
              const newTimes = mergedScheduledTimes[day] || [];
              
              // Prefer new times over existing (newer data is more accurate)
              if (newTimes.length > 0) {
                // Keep only the first new time (most common/accurate)
                mergedScheduledTimes[day] = [newTimes[0]];
              } else if (existingTimes.length > 0) {
                // Fall back to existing time if no new data
                mergedScheduledTimes[day] = [existingTimes[0]];
              }
            });
          }
          
          console.log(`    Merged pattern for ${airline} ${flightNumber}: existing + new days`);
        } else {
          mergedPattern = {
            monday: newPattern.monday || false,
            tuesday: newPattern.tuesday || false,
            wednesday: newPattern.wednesday || false,
            thursday: newPattern.thursday || false,
            friday: newPattern.friday || false,
            saturday: newPattern.saturday || false,
            sunday: newPattern.sunday || false
          };
        }

        // Corectează numele companiilor aeriene greșite din API
        const correctedAirline = this.correctAirlineName(airline, flightNumber);

        // Calculate lastSeenDates for each day based on flight data
        const newLastSeenDates: {
          monday?: string;
          tuesday?: string;
          wednesday?: string;
          thursday?: string;
          friday?: string;
          saturday?: string;
          sunday?: string;
        } = {};
        
        // Set lastSeenDate for each day that has flights in the new data
        const today = new Date().toISOString().split('T')[0];
        flights.forEach(flight => {
          const dayOfWeek = this.patternGenerator.extractDayOfWeek(flight.scheduledTime) as keyof typeof newLastSeenDates;
          const flightDate = new Date(flight.scheduledTime).toISOString().split('T')[0];
          // Use the most recent date for each day
          if (!newLastSeenDates[dayOfWeek] || flightDate > newLastSeenDates[dayOfWeek]!) {
            newLastSeenDates[dayOfWeek] = flightDate;
          }
        });
        
        // Merge lastSeenDates with existing entry
        let mergedLastSeenDates: typeof newLastSeenDates = { ...newLastSeenDates };
        if (existingEntry?.lastSeenDates) {
          const days: (keyof typeof mergedLastSeenDates)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          days.forEach(day => {
            const existingDate = existingEntry.lastSeenDates?.[day];
            const newDate = newLastSeenDates[day];
            // Keep the more recent date
            if (existingDate && newDate) {
              mergedLastSeenDates[day] = existingDate > newDate ? existingDate : newDate;
            } else if (existingDate && !newDate) {
              mergedLastSeenDates[day] = existingDate;
            }
          });
        }

        const scheduleEntry: WeeklyScheduleData = {
          airport: airportDisplay,
          destination: destinationDisplay,
          airline: correctedAirline,
          flightNumber,
          weeklyPattern: mergedPattern,
          scheduledTimes: Object.keys(mergedScheduledTimes).length > 0 ? mergedScheduledTimes : undefined,
          lastSeenDates: Object.keys(mergedLastSeenDates).length > 0 ? mergedLastSeenDates : undefined,
          frequency: flights.length + (existingEntry?.frequency || 0),
          lastUpdated: new Date().toISOString(),
          dataSource: 'cache' as const
        };

        scheduleData.push(scheduleEntry);
        
        // Remove from existing map (we've processed it)
        existingScheduleMap.delete(entryKey);
        
        console.log(`    Added: ${airline} ${flightNumber} (${flights.length} flights) - ${scheduleEntry.airport} → ${scheduleEntry.destination}`);
      });
    });

    // IMPROVED: Keep existing entries that weren't in the new data (preserve historical patterns)
    existingScheduleMap.forEach((existingEntry, key) => {
      // Only keep if the entry is less than 30 days old
      const lastUpdated = new Date(existingEntry.lastUpdated);
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 30) {
        scheduleData.push(existingEntry);
        console.log(`    Preserved existing entry: ${existingEntry.airline} ${existingEntry.flightNumber} (${Math.round(daysSinceUpdate)} days old)`);
      } else {
        console.log(`    Expired entry removed: ${existingEntry.airline} ${existingEntry.flightNumber} (${Math.round(daysSinceUpdate)} days old)`);
      }
    });

    // FINAL DEDUPLICATION: Remove any remaining duplicates by unique key
    const finalDeduplicatedData = this.deduplicateScheduleEntries(scheduleData);
    
    console.log(`Generated ${finalDeduplicatedData.length} schedule entries (after final deduplication from ${scheduleData.length}), saving to storage...`);
    await this.tableManager.updateTable(finalDeduplicatedData);
    console.log(`=== Weekly schedule table updated successfully with ${finalDeduplicatedData.length} entries ===`);
  }

  // Helper function to correct airline names from API errors
  private correctAirlineName(airline: string, flightNumber: string): string {
    // Extract flight prefix (e.g., "U5" from "U5 708")
    const match = flightNumber.match(/^([A-Z0-9]{2})\s*\d+$/i)
    if (!match) return airline
    
    const flightPrefix = match[1].toUpperCase()
    
    // Map of flight prefixes to correct airline names
    const airlineCorrections: { [key: string]: string } = {
      'U5': 'SkyUp Airlines',
      'A2': 'Animawings',
      // Add more corrections as needed
    }
    
    if (airlineCorrections[flightPrefix]) {
      return airlineCorrections[flightPrefix]
    }
    
    return airline
  }

  // FINAL DEDUPLICATION: Merge entries with same airport-destination-flightNumber
  // CRITICAL FIX: Each flight number should only have ONE scheduled time per day
  // Prefer the MOST RECENT data (based on lastUpdated timestamp)
  private deduplicateScheduleEntries(entries: WeeklyScheduleData[]): WeeklyScheduleData[] {
    const entryMap = new Map<string, WeeklyScheduleData>();
    
    entries.forEach(entry => {
      // Create unique key based on airport, destination, and flight number (ignore airline variations)
      const key = `${entry.airport}-${entry.destination}-${entry.flightNumber}`;
      
      if (!entryMap.has(key)) {
        entryMap.set(key, entry);
      } else {
        // Merge with existing entry
        const existing = entryMap.get(key)!;
        
        // Determine which entry is newer
        const existingDate = new Date(existing.lastUpdated);
        const newDate = new Date(entry.lastUpdated);
        const newerEntry = newDate > existingDate ? entry : existing;
        const olderEntry = newDate > existingDate ? existing : entry;
        
        // Merge weekly patterns (OR operation)
        const mergedPattern = {
          monday: existing.weeklyPattern.monday || entry.weeklyPattern.monday,
          tuesday: existing.weeklyPattern.tuesday || entry.weeklyPattern.tuesday,
          wednesday: existing.weeklyPattern.wednesday || entry.weeklyPattern.wednesday,
          thursday: existing.weeklyPattern.thursday || entry.weeklyPattern.thursday,
          friday: existing.weeklyPattern.friday || entry.weeklyPattern.friday,
          saturday: existing.weeklyPattern.saturday || entry.weeklyPattern.saturday,
          sunday: existing.weeklyPattern.sunday || entry.weeklyPattern.sunday,
        };
        
        // CRITICAL FIX: For scheduled times, prefer the NEWER data
        // If newer entry has a time for a day, use it; otherwise fall back to older
        const mergedTimes: typeof entry.scheduledTimes = {};
        const days: (keyof typeof mergedTimes)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
          const newerTimes = newerEntry.scheduledTimes?.[day] || [];
          const olderTimes = olderEntry.scheduledTimes?.[day] || [];
          
          // Prefer newer data, fall back to older if newer doesn't have this day
          if (newerTimes.length > 0) {
            mergedTimes[day] = [newerTimes[0]]; // Keep only ONE time
          } else if (olderTimes.length > 0) {
            mergedTimes[day] = [olderTimes[0]]; // Keep only ONE time
          }
        });
        
        const mergedEntry: WeeklyScheduleData = {
          airport: existing.airport,
          destination: existing.destination,
          // Keep the airline from the newer entry
          airline: newerEntry.airline,
          flightNumber: existing.flightNumber,
          weeklyPattern: mergedPattern,
          scheduledTimes: Object.keys(mergedTimes).length > 0 ? mergedTimes : undefined,
          lastSeenDates: this.mergeLastSeenDates(existing.lastSeenDates, entry.lastSeenDates),
          frequency: Math.max(existing.frequency, entry.frequency),
          lastUpdated: newerEntry.lastUpdated, // Use the newer timestamp
          dataSource: existing.dataSource,
        };
        
        entryMap.set(key, mergedEntry);
        console.log(`    Merged duplicate: ${entry.flightNumber} (${entry.airport} → ${entry.destination}) - using newer data`);
      }
    });
    
    return Array.from(entryMap.values());
  }

  // Helper function to merge lastSeenDates from two entries
  private mergeLastSeenDates(
    existing?: WeeklyScheduleData['lastSeenDates'], 
    newDates?: WeeklyScheduleData['lastSeenDates']
  ): WeeklyScheduleData['lastSeenDates'] {
    if (!existing && !newDates) return undefined;
    if (!existing) return newDates;
    if (!newDates) return existing;
    
    const merged: WeeklyScheduleData['lastSeenDates'] = {};
    const days: (keyof NonNullable<WeeklyScheduleData['lastSeenDates']>)[] = 
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      const existingDate = existing[day];
      const newDate = newDates[day];
      
      if (existingDate && newDate) {
        // Keep the more recent date
        merged[day] = existingDate > newDate ? existingDate : newDate;
      } else if (existingDate) {
        merged[day] = existingDate;
      } else if (newDate) {
        merged[day] = newDate;
      }
    });
    
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  // Helper function to extract time (HH:MM) from scheduled time string
  // IMPORTANT: Converts UTC time to local airport time (Europe/Bucharest for Romanian airports)
  private extractTimeFromSchedule(scheduledTime: string, airportCode?: string): string | null {
    if (!scheduledTime) return null
    
    try {
      // Handle various date formats from API
      // Format 1: "2026-01-09T12:30:00.000Z" (ISO UTC)
      // Format 2: "2026-01-09T12:30:00+02:00" (ISO with offset)
      // Format 3: "2026-01-09 12:30+02:00" (with space and timezone)
      // Format 4: "2026-01-09 12:30" (with space, no timezone)
      
      // Check if time already has a non-UTC timezone offset (like +02:00, +03:00)
      // In this case, extract the time directly as it's already local
      const offsetMatch = scheduledTime.match(/T(\d{2}):(\d{2})(?::\d{2})?([+-]\d{2}:\d{2})/)
      if (offsetMatch && offsetMatch[3] !== '+00:00') {
        // Time has a non-UTC offset, use it directly
        return `${offsetMatch[1]}:${offsetMatch[2]}`
      }
      
      // If time ends with Z or has no offset, it's UTC - convert to local time
      const isUTC = scheduledTime.endsWith('Z') || scheduledTime.endsWith('.000Z') || 
                    !scheduledTime.match(/[+-]\d{2}:\d{2}$/)
      
      if (isUTC) {
        const date = new Date(scheduledTime)
        if (isNaN(date.getTime())) return null
        
        // Determine timezone based on airport code
        // Romanian airports: Europe/Bucharest (UTC+2 winter, UTC+3 summer)
        // Moldovan airports: Europe/Chisinau (UTC+2 winter, UTC+3 summer)
        const romanianAirports = ['OTP', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'BBU', 'BAY']
        const moldovanAirports = ['RMO', 'KIV']
        
        let timezone = 'Europe/Bucharest' // Default for Romanian airports
        if (airportCode) {
          const upperCode = airportCode.toUpperCase()
          if (moldovanAirports.includes(upperCode)) {
            timezone = 'Europe/Chisinau'
          } else if (!romanianAirports.includes(upperCode)) {
            // For international airports, try to use their local timezone
            // For now, default to Europe/Bucharest as most flights are to/from Romania
            timezone = 'Europe/Bucharest'
          }
        }
        
        // Convert to local time using Intl.DateTimeFormat
        const localTime = date.toLocaleTimeString('en-GB', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        
        return localTime
      }
      
      // Fallback: extract time directly from string
      const timeMatch = scheduledTime.match(/(\d{2}):(\d{2})/)
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`
      }
      
      return null
    } catch {
      return null
    }
  }

  // Helper function to correct known IATA code/name mismatches
  // DUB = Dublin (Ireland), DWC = Dubai Al Maktoum, DXB = Dubai International
  private correctAirportCodeMismatch(code: string, name?: string): string {
    if (!code) return code
    
    const upperCode = code.toUpperCase()
    
    // If we have a name that doesn't match the code, use the correct mapping
    if (name) {
      const lowerName = name.toLowerCase()
      
      // If name contains "Dubai" but code is DUB (Dublin), this is wrong data
      // Return the correct name based on the IATA code
      if (upperCode === 'DUB' && lowerName.includes('dubai')) {
        // The code DUB is Dublin, not Dubai - return Dublin
        return 'Dublin'
      }
      
      // If code is DWC, it's Dubai Al Maktoum
      if (upperCode === 'DWC') {
        return 'Dubai (Al Maktoum)'
      }
      
      // If code is DXB, it's Dubai International
      if (upperCode === 'DXB') {
        return 'Dubai'
      }
    }
    
    return code
  }

  // Helper function to convert airport codes to display names
  private getAirportDisplayName(code: string): string {
    if (!code) return 'Aeroport necunoscut'
    
    // First check if it's already a display name (contains parentheses or long)
    if (code.includes('(') || code.length > 3) {
      // Apply correction for known mismatches in display names
      if (code.toLowerCase().includes('dubai') && code.toUpperCase().startsWith('DUB')) {
        // This is likely a mismatch - DUB should be Dublin
        return 'Dublin'
      }
      return code
    }
    
    const airport = MAJOR_AIRPORTS.find(a => a.code === code.toUpperCase())
    if (airport) {
      return airport.city
    }
    
    // Mapare pentru aeroporturi internaționale comune
    const internationalAirports: { [key: string]: string } = {
      // France
      'BVA': 'Paris (Beauvais)',
      'CDG': 'Paris (Charles de Gaulle)',
      'ORY': 'Paris (Orly)',
      'LYS': 'Lyon',
      'MRS': 'Marseille',
      'NCE': 'Nisa',
      'TLS': 'Toulouse',
      'BOD': 'Bordeaux',
      'NTE': 'Nantes',
      'SXB': 'Strasbourg',
      
      // UK & Ireland
      'LHR': 'Londra (Heathrow)',
      'LGW': 'Londra (Gatwick)',
      'STN': 'Londra (Stansted)',
      'LTN': 'Londra (Luton)',
      'LBA': 'Leeds',
      'EDI': 'Edinburgh',
      'GLA': 'Glasgow',
      'MAN': 'Manchester',
      'BHX': 'Birmingham',
      'LPL': 'Liverpool',
      'NCL': 'Newcastle',
      'BRS': 'Bristol',
      'CWL': 'Cardiff',
      'BFS': 'Belfast',
      'DUB': 'Dublin',
      'ORK': 'Cork',
      
      // Italy
      'FCO': 'Roma (Fiumicino)',
      'CIA': 'Roma (Ciampino)',
      'MXP': 'Milano (Malpensa)',
      'BGY': 'Milano (Bergamo)',
      'LIN': 'Milano (Linate)',
      'VRN': 'Verona',
      'TSF': 'Treviso',
      'VCE': 'Venetia',
      'BLQ': 'Bologna',
      'FLR': 'Florenta',
      'PSA': 'Pisa',
      'PSR': 'Pescara',
      'TRN': 'Torino',
      'NAP': 'Napoli',
      'CTA': 'Catania',
      'PMO': 'Palermo',
      'CAG': 'Cagliari',
      'BRI': 'Bari',
      'BDS': 'Brindisi',
      'REG': 'Reggio Calabria',
      'LMP': 'Lampedusa',
      'PNL': 'Pantelleria',
      
      // Germany
      'MUC': 'Munchen',
      'FRA': 'Frankfurt',
      'DUS': 'Dusseldorf',
      'CGN': 'Koln',
      'DTM': 'Dortmund',
      'HAM': 'Hamburg',
      'BER': 'Berlin',
      'SXF': 'Berlin (Schonefeld)',
      'TXL': 'Berlin (Tegel)',
      'STR': 'Stuttgart',
      'NUE': 'Nurnberg',
      'HHN': 'Frankfurt (Hahn)',
      'FKB': 'Karlsruhe/Baden-Baden',
      'LEJ': 'Leipzig',
      'DRS': 'Dresden',
      'HAN': 'Hannover',
      'BRE': 'Bremen',
      
      // Netherlands & Belgium
      'AMS': 'Amsterdam',
      'RTM': 'Rotterdam',
      'EIN': 'Eindhoven',
      'MST': 'Maastricht',
      'BRU': 'Bruxelles',
      'CRL': 'Bruxelles (Charleroi)',
      'ANR': 'Antwerp',
      'LGG': 'Liege',
      
      // Spain & Portugal
      'MAD': 'Madrid',
      'BCN': 'Barcelona',
      'AGP': 'Malaga',
      'VLC': 'Valencia',
      'PMI': 'Palma de Mallorca',
      'SVQ': 'Sevilla',
      'BIO': 'Bilbao',
      'SDR': 'Santander',
      'LCG': 'A Coruna',
      'VGO': 'Vigo',
      'LIS': 'Lisabona',
      'OPO': 'Porto',
      'FAO': 'Faro',
      'FNC': 'Funchal',
      'TER': 'Terceira',
      
      // Switzerland & Austria
      'ZUR': 'Zurich',
      'ZRH': 'Zurich',
      'GVA': 'Geneva',
      'BSL': 'Basel',
      'BRN': 'Berna',
      'VIE': 'Viena',
      'SZG': 'Salzburg',
      'GRZ': 'Graz',
      'INN': 'Innsbruck',
      'LNZ': 'Linz',
      'KLU': 'Klagenfurt',
      
      // Scandinavia
      'CPH': 'Copenhaga',
      'BLL': 'Billund',
      'AAL': 'Aalborg',
      'ARN': 'Stockholm (Arlanda)',
      'NYO': 'Stockholm (Skavsta)',
      'GOT': 'Goteborg',
      'MMX': 'Malmo',
      'OSL': 'Oslo',
      'BGO': 'Bergen',
      'TRD': 'Trondheim',
      'SVG': 'Stavanger',
      'HEL': 'Helsinki',
      'TMP': 'Tampere',
      'TKU': 'Turku',
      'OUL': 'Oulu',
      'RVN': 'Rovaniemi',
      
      // Turkey
      'IST': 'Istanbul',
      'SAW': 'Istanbul (Sabiha)',
      'AYT': 'Antalya',
      'ESB': 'Ankara',
      'ADB': 'Izmir',
      'BJV': 'Bodrum',
      'DLM': 'Dalaman',
      'GZT': 'Gaziantep',
      'TZX': 'Trabzon',
      
      // Greece & Cyprus
      'ATH': 'Atena',
      'SKG': 'Thessaloniki',
      'HER': 'Heraklion',
      'CHQ': 'Chania',
      'RHO': 'Rodos',
      'KOS': 'Kos',
      'CFU': 'Corfu',
      'ZTH': 'Zakynthos',
      'JTR': 'Santorini',
      'MYK': 'Mykonos',
      'LCA': 'Larnaca',
      'PFO': 'Paphos',
      
      // Eastern Europe
      'SOF': 'Sofia',
      'VAR': 'Varna',
      'BOJ': 'Burgas',
      'PDV': 'Plovdiv',
      'BEG': 'Belgrad',
      'NIS': 'Nis',
      'ZAG': 'Zagreb',
      'SPU': 'Split',
      'DBV': 'Dubrovnik',
      'ZAD': 'Zadar',
      'PUY': 'Pula',
      'RJK': 'Rijeka',
      'LJU': 'Ljubljana',
      'MBX': 'Maribor',
      'BUD': 'Budapesta',
      'DEB': 'Debrecen',
      'PEV': 'Pecs',
      'SOB': 'Szeged',
      'PRG': 'Praga',
      'BRQ': 'Brno',
      'OSR': 'Ostrava',
      'PED': 'Pardubice',
      'WAW': 'Varsovia',
      'WMI': 'Varsovia (Modlin)',
      'KRK': 'Cracovia',
      'GDN': 'Gdansk',
      'WRO': 'Wroclaw',
      'KTW': 'Katowice',
      'POZ': 'Poznan',
      'SZZ': 'Szczecin',
      'LUZ': 'Lublin',
      'RZE': 'Rzeszow',
      
      // Balkans
      'SKP': 'Skopje',
      'OHD': 'Ohrid',
      'TGD': 'Podgorica',
      'TIV': 'Tivat',
      'SJJ': 'Sarajevo',
      'OMO': 'Mostar',
      'TZL': 'Tuzla',
      'BNX': 'Banja Luka',
      
      // Middle East & North Africa
      'TLV': 'Tel Aviv',
      'VDA': 'Eilat',
      'HFA': 'Haifa',
      'AMM': 'Amman',
      'BEY': 'Beirut',
      'DAM': 'Damasc',
      'DOH': 'Doha',
      'DXB': 'Dubai',
      'DWC': 'Dubai (Al Maktoum)',
      'EVN': 'Erevan',
      'TBS': 'Tbilisi',
      'BTS': 'Bratislava',
      'CAI': 'Cairo',
      'HRG': 'Hurghada',
      'SSH': 'Sharm el-Sheikh',
      'LXR': 'Luxor',
      'ASW': 'Aswan',
      'RMF': 'Marsa Alam',
      'TUN': 'Tunis',
      'MIR': 'Monastir',
      'DJE': 'Djerba',
      'SFA': 'Sfax',
      'CMN': 'Casablanca',
      'RAK': 'Marrakech',
      'AGA': 'Agadir',
      'FEZ': 'Fez',
      'TNG': 'Tanger',
      'NDR': 'Nador',
      'OUD': 'Oujda',
      
      // Luxembourg & Monaco & Malta
      'LUX': 'Luxemburg',
      'MCM': 'Monaco',
      'MLA': 'Malta',
      
      // Iceland
      'KEF': 'Reykjavik',
      'AEY': 'Akureyri',
      
      // Baltic States
      'RIX': 'Riga',
      'VNO': 'Vilnius',
      'KUN': 'Kaunas',
      'TLL': 'Tallinn',
      'TRU': 'Tartu',
      
      // Additional European airports from screenshot
      'ALC': 'Alicante',
      'CDT': 'Castellón',
      'LPA': 'Las Palmas (Gran Canaria)',
      'FMM': 'Memmingen',
      
      // Additional missing airports
      'GRO': 'Girona',
      'GYD': 'Baku',
      
      // USA airports
      'JFK': 'New York (JFK)',
      'EWR': 'New York (Newark)',
      'LGA': 'New York (LaGuardia)',
      'TFS': 'Tenerife',
      'TRF': 'Oslo (Sandefjord)',
      'ZAZ': 'Zaragoza'
    }
    
    const upperCode = code ? code.toUpperCase() : ''
    return internationalAirports[upperCode] || code || 'Necunoscut'
  }

  async exportSchedule(format: 'json' | 'csv'): Promise<string> {
    const scheduleData = await this.tableManager.getScheduleData();
    
    if (format === 'json') {
      return JSON.stringify({
        data: scheduleData,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalEntries: scheduleData.length,
          format: 'json'
        }
      }, null, 2);
    }
    
    if (format === 'csv') {
      const headers = [
        'Airport', 'Destination', 'Airline', 'Flight Number',
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
        'Frequency', 'Last Updated', 'Data Source'
      ];
      
      const rows = scheduleData.map(item => [
        item.airport,
        item.destination,
        item.airline,
        item.flightNumber,
        item.weeklyPattern.monday ? 'Yes' : 'No',
        item.weeklyPattern.tuesday ? 'Yes' : 'No',
        item.weeklyPattern.wednesday ? 'Yes' : 'No',
        item.weeklyPattern.thursday ? 'Yes' : 'No',
        item.weeklyPattern.friday ? 'Yes' : 'No',
        item.weeklyPattern.saturday ? 'Yes' : 'No',
        item.weeklyPattern.sunday ? 'Yes' : 'No',
        item.frequency.toString(),
        item.lastUpdated,
        item.dataSource
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  async getScheduleData(): Promise<WeeklyScheduleData[]> {
    // Get existing schedule data
    const existingData = await this.tableManager.getScheduleData();
    
    // Check if data needs refresh (empty or outdated)
    const needsRefresh = await this.checkIfNeedsRefresh(existingData);
    
    if (needsRefresh) {
      console.log('[Weekly Schedule] Data is outdated or empty, auto-refreshing...');
      try {
        await this.updateScheduleTable();
        const refreshedData = await this.tableManager.getScheduleData();
        return this.filterExpiredFlights(refreshedData);
      } catch (error) {
        console.error('[Weekly Schedule] Auto-refresh failed:', error);
        // Return existing data if refresh fails
        return this.filterExpiredFlights(existingData);
      }
    }
    
    return this.filterExpiredFlights(existingData);
  }

  // Filter out expired flights - flights not seen in the last 7 days for a specific day
  private filterExpiredFlights(data: WeeklyScheduleData[]): WeeklyScheduleData[] {
    const EXPIRATION_DAYS = 7; // Flights not seen for 7 days are considered expired
    const today = new Date();
    const expirationThreshold = new Date(today.getTime() - EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    const expirationDateStr = expirationThreshold.toISOString().split('T')[0];
    
    return data.map(entry => {
      // If no lastSeenDates, keep the entry as-is (legacy data)
      if (!entry.lastSeenDates) {
        return entry;
      }
      
      // Filter weeklyPattern based on lastSeenDates
      const filteredPattern = { ...entry.weeklyPattern };
      const filteredTimes = entry.scheduledTimes ? { ...entry.scheduledTimes } : undefined;
      const days: (keyof typeof filteredPattern)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      let hasActiveDay = false;
      
      days.forEach(day => {
        const lastSeen = entry.lastSeenDates?.[day];
        
        // If the day was marked as active but hasn't been seen recently, mark as inactive
        if (filteredPattern[day] && lastSeen) {
          if (lastSeen < expirationDateStr) {
            // Flight expired for this day
            filteredPattern[day] = false;
            if (filteredTimes) {
              delete filteredTimes[day];
            }
            console.log(`[Expiration] ${entry.flightNumber} ${entry.airport}→${entry.destination}: ${day} expired (last seen: ${lastSeen})`);
          } else {
            hasActiveDay = true;
          }
        } else if (filteredPattern[day]) {
          // Day is active but no lastSeenDate - keep it (legacy data)
          hasActiveDay = true;
        }
      });
      
      // If no active days remain, return null to filter out entirely
      if (!hasActiveDay) {
        return null;
      }
      
      return {
        ...entry,
        weeklyPattern: filteredPattern,
        scheduledTimes: filteredTimes && Object.keys(filteredTimes).length > 0 ? filteredTimes : undefined
      };
    }).filter((entry): entry is WeeklyScheduleData => entry !== null);
  }

  private async checkIfNeedsRefresh(existingData: WeeklyScheduleData[]): Promise<boolean> {
    // If no data, needs refresh
    if (!existingData || existingData.length === 0) {
      console.log('[Weekly Schedule] No existing data, needs refresh');
      return true;
    }
    
    // Check if today's day of week has any flights
    const today = new Date();
    const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = dayNames[today.getDay()];
    
    const todayFlights = existingData.filter(item => item.weeklyPattern[todayDayName]);
    
    // If no flights for today but we have flights in cache, needs refresh
    if (todayFlights.length === 0) {
      // Check if main cache has flights for today
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const mainCachePath = path.join(process.cwd(), 'data', 'cache-data.json');
        const mainCacheContent = await fs.readFile(mainCachePath, 'utf8');
        const mainCacheEntries = JSON.parse(mainCacheContent);
        
        // Check if any flight data exists in main cache
        let hasFlightData = false;
        if (Array.isArray(mainCacheEntries)) {
          hasFlightData = mainCacheEntries.some((entry: any) => 
            entry.category === 'flightData' && 
            entry.data && 
            (Array.isArray(entry.data) ? entry.data.length > 0 : 
              (entry.data.flights && Array.isArray(entry.data.flights) && entry.data.flights.length > 0))
          );
        }
        
        if (hasFlightData) {
          console.log(`[Weekly Schedule] No flights for ${todayDayName} but cache has data, needs refresh`);
          return true;
        }
      } catch (error) {
        console.warn('[Weekly Schedule] Could not check main cache:', error);
      }
    }
    
    // Check if lastUpdated is older than 1 hour
    if (existingData.length > 0 && existingData[0].lastUpdated) {
      const lastUpdated = new Date(existingData[0].lastUpdated);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdated < oneHourAgo) {
        console.log('[Weekly Schedule] Data is older than 1 hour, needs refresh');
        return true;
      }
    }
    
    return false;
  }

  async clearScheduleTable(): Promise<void> {
    await this.tableManager.clearTable();
  }

  private createEmptySchedule(): AggregatedSchedule {
    return {
      routes: [],
      summary: {
        totalRoutes: 0,
        totalFlights: 0,
        airportsAnalyzed: [],
        dataRange: { from: '', to: '' }
      },
      generatedAt: new Date().toISOString()
    };
  }

  private calculateAveragePerWeek(flights: RawFlightData[]): number {
    if (flights.length === 0) return 0;
    
    const dates = flights.map(f => new Date(f.scheduled_time));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const weeksDiff = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return Math.round((flights.length / weeksDiff) * 100) / 100;
  }

  private calculateDateRange(historicalData: CachedFlightData[]): { from: string; to: string } {
    if (historicalData.length === 0) {
      return { from: '', to: '' };
    }
    
    // Extract all flight scheduled times from the data
    const allFlightDates: Date[] = [];
    
    historicalData.forEach(flightDataSet => {
      flightDataSet.data.forEach(flight => {
        const flightDate = new Date(flight.scheduled_time);
        if (!isNaN(flightDate.getTime())) {
          allFlightDates.push(flightDate);
        }
      });
    });
    
    if (allFlightDates.length === 0) {
      console.warn('[Weekly Schedule] No valid flight dates found in historical data');
      return { from: '', to: '' };
    }
    
    const timestamps = allFlightDates.map(date => date.getTime());
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    
    console.log(`[Weekly Schedule] Date range calculated from flight scheduled times: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
    
    return {
      from: minDate.toISOString(),
      to: maxDate.toISOString()
    };
  }
}

// Singleton instance
let weeklyScheduleAnalyzerInstance: WeeklyScheduleAnalyzerImpl | null = null;

export function getWeeklyScheduleAnalyzer(): WeeklyScheduleAnalyzerImpl {
  if (!weeklyScheduleAnalyzerInstance) {
    weeklyScheduleAnalyzerInstance = new WeeklyScheduleAnalyzerImpl();
  }
  return weeklyScheduleAnalyzerInstance;
}