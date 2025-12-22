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
    console.log('[Weekly Schedule] Getting all cached flights from historical database...');
    
    // First try to get historical data from the last 30 days
    const historicalFlights = await this.getHistoricalFlights(30);
    
    if (historicalFlights.length > 0) {
      console.log(`[Weekly Schedule] Found ${historicalFlights.length} historical flight datasets`);
      return historicalFlights;
    }
    
    // Fallback to current cache if no historical data
    console.log('[Weekly Schedule] No historical data found, falling back to current cache...');
    const allFlights: CachedFlightData[] = [];
    
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
    
    // Group flights by route (origin-destination pair)
    flightData.forEach(flightDataSet => {
      console.log(`Processing ${flightDataSet.airport_code} ${flightDataSet.type}: ${flightDataSet.data.length} flights`);
      
      flightDataSet.data.forEach(flight => {
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
    
    console.log(`Generated ${routeMap.size} unique routes from flight data`);

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
        const pattern = this.patternGenerator.generateWeeklyPattern(
          flights.map(f => ({ scheduled_time: f.scheduledTime } as RawFlightData))
        );

        const scheduleEntry = {
          airport: route.route.origin,
          destination: route.route.destination,
          airline,
          flightNumber,
          weeklyPattern: {
            monday: pattern.monday,
            tuesday: pattern.tuesday,
            wednesday: pattern.wednesday,
            thursday: pattern.thursday,
            friday: pattern.friday,
            saturday: pattern.saturday,
            sunday: pattern.sunday
          },
          frequency: flights.length,
          lastUpdated: new Date().toISOString(),
          dataSource: 'cache' as const
        };

        scheduleData.push(scheduleEntry);
        console.log(`    Added: ${airline} ${flightNumber} (${flights.length} flights)`);
      });
    });

    console.log(`Generated ${scheduleData.length} schedule entries, saving to storage...`);
    await this.tableManager.updateTable(scheduleData);
    console.log(`=== Weekly schedule table updated successfully with ${scheduleData.length} entries ===`);
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
    return await this.tableManager.getScheduleData();
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
    
    // Filter out invalid dates and convert to timestamps
    const validDates = historicalData
      .map(d => new Date(d.updated_at))
      .filter(date => !isNaN(date.getTime()))
      .map(date => date.getTime());
    
    if (validDates.length === 0) {
      console.warn('[Weekly Schedule] No valid dates found in historical data');
      return { from: '', to: '' };
    }
    
    const minDate = new Date(Math.min(...validDates));
    const maxDate = new Date(Math.max(...validDates));
    
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