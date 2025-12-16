/**
 * Weekly Flight Schedule Analysis System
 * Analizează datele existente din cache pentru a genera programe săptămânale de zboruri
 * Funcționează complet offline, fără apeluri externe la API-uri
 */

import { MAJOR_AIRPORTS } from './airports';
import { getFlightRepository, CachedFlightData } from './flightRepository';
import { RawFlightData } from './flightApiService';

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
          updated_at: arrivalsResponse.last_updated,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          success: arrivalsResponse.success,
          error: arrivalsResponse.error
        });
      }
      
      if (departuresResponse.data.length > 0) {
        flights.push({
          airport_code: airportCode,
          type: 'departures',
          data: departuresResponse.data,
          updated_at: departuresResponse.last_updated,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          success: departuresResponse.success,
          error: departuresResponse.error
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
  private readonly STORAGE_KEY = 'weekly_schedule_table';

  async createTable(): Promise<void> {
    // Initialize empty table structure
    const emptyTable: WeeklyScheduleData[] = [];
    await this.saveToStorage(emptyTable);
  }

  async updateTable(data: WeeklyScheduleData[]): Promise<void> {
    await this.saveToStorage(data);
  }

  async getScheduleData(): Promise<WeeklyScheduleData[]> {
    return this.loadFromStorage();
  }

  async clearTable(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private async saveToStorage(data: WeeklyScheduleData[]): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving weekly schedule to storage:', error);
      }
    }
  }

  private loadFromStorage(): WeeklyScheduleData[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
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
    console.log('Updating weekly schedule table...');
    
    const analysis = await this.analyzeFlightPatterns();
    const scheduleData: WeeklyScheduleData[] = [];

    analysis.routes.forEach(route => {
      // Group flights by airline and flight number
      const flightGroups = new Map<string, typeof route.schedule>();
      
      route.schedule.forEach(flight => {
        const key = `${flight.airline}-${flight.flightNumber}`;
        if (!flightGroups.has(key)) {
          flightGroups.set(key, []);
        }
        flightGroups.get(key)!.push(flight);
      });

      flightGroups.forEach((flights, key) => {
        const [airline, flightNumber] = key.split('-');
        const pattern = this.patternGenerator.generateWeeklyPattern(
          flights.map(f => ({ scheduled_time: f.scheduledTime } as RawFlightData))
        );

        scheduleData.push({
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
          dataSource: 'cache'
        });
      });
    });

    await this.tableManager.updateTable(scheduleData);
    console.log(`Weekly schedule table updated with ${scheduleData.length} entries`);
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
    
    const dates = historicalData.map(d => new Date(d.updated_at));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
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