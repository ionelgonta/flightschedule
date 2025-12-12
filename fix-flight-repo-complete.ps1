# Fix Flight Repository with all required methods
$ServerIP = "23.88.113.154"
$Password = "FlightSchedule2024!"

Write-Host "Creating complete flight repository with all methods..." -ForegroundColor Cyan

$completeFlightRepo = @'
/**
 * Flight Repository - Complete version with MCP service and all required methods
 */

import { getMCPFlightService, MCPFlightData } from './mcpFlightService';

export interface FlightFilters {
  airline?: string;
  status?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface FlightApiResponse {
  success: boolean;
  data: any[];
  error?: string;
  cached: boolean;
  last_updated: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
}

class FlightRepository {
  private cache: Map<string, MCPFlightData> = new Map();
  private mcpService = getMCPFlightService();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private getCacheKey(airportCode: string, type: 'arrivals' | 'departures'): string {
    return `${airportCode}_${type}`;
  }

  private isCacheValid(cachedData: MCPFlightData): boolean {
    const now = new Date();
    const updatedAt = new Date(cachedData.last_updated);
    return (now.getTime() - updatedAt.getTime()) < this.CACHE_DURATION;
  }

  async getArrivals(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    const cacheKey = this.getCacheKey(airportCode, 'arrivals');
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && this.isCacheValid(cachedData)) {
      console.log(`Cache HIT for ${airportCode} arrivals`);
      return {
        ...cachedData,
        data: this.applyFilters(cachedData.data, filters),
        cached: true
      };
    }

    console.log(`Cache MISS for ${airportCode} arrivals - fetching via MCP`);
    
    try {
      const result = await this.mcpService.getFlights(airportCode, 'arrivals');
      this.cache.set(cacheKey, result);
      
      return {
        ...result,
        data: this.applyFilters(result.data, filters)
      };
    } catch (error) {
      console.error(`Error fetching arrivals for ${airportCode}:`, error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  async getDepartures(airportCode: string, filters?: FlightFilters): Promise<FlightApiResponse> {
    const cacheKey = this.getCacheKey(airportCode, 'departures');
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && this.isCacheValid(cachedData)) {
      console.log(`Cache HIT for ${airportCode} departures`);
      return {
        ...cachedData,
        data: this.applyFilters(cachedData.data, filters),
        cached: true
      };
    }

    console.log(`Cache MISS for ${airportCode} departures - fetching via MCP`);
    
    try {
      const result = await this.mcpService.getFlights(airportCode, 'departures');
      this.cache.set(cacheKey, result);
      
      return {
        ...result,
        data: this.applyFilters(result.data, filters)
      };
    } catch (error) {
      console.error(`Error fetching departures for ${airportCode}:`, error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }
  }

  private applyFilters(flights: any[], filters?: FlightFilters): any[] {
    if (!filters) return flights;

    let filtered = flights;

    if (filters.airline) {
      const airlineFilter = filters.airline.toLowerCase();
      filtered = filtered.filter(flight => 
        flight.airline?.name?.toLowerCase().includes(airlineFilter) ||
        flight.airline?.code?.toLowerCase().includes(airlineFilter)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(flight => flight.status === filters.status);
    }

    if (filters.timeRange) {
      filtered = filtered.filter(flight => {
        const flightTime = new Date(flight.scheduled_time);
        const startTime = new Date(filters.timeRange!.start);
        const endTime = new Date(filters.timeRange!.end);
        
        return flightTime >= startTime && flightTime <= endTime;
      });
    }

    return filtered;
  }

  /**
   * Preload airports - required by scheduler
   */
  async preloadAirports(airportCodes: string[]): Promise<void> {
    console.log('Preloading flight data for airports:', airportCodes);
    
    const promises = airportCodes.flatMap(code => [
      this.getArrivals(code),
      this.getDepartures(code)
    ]);

    try {
      await Promise.allSettled(promises);
      console.log('Airport data preloading completed');
    } catch (error) {
      console.error('Error during airport preloading:', error);
    }
  }

  /**
   * Clean expired cache - required by scheduler
   */
  cleanExpiredCache(): void {
    const now = new Date();
    let cleanedCount = 0;

    this.cache.forEach((data, key) => {
      if (!this.isCacheValid(data)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get cache stats - required by scheduler
   */
  getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    hitRate: number;
  } {
    const now = new Date();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach((data) => {
      if (this.isCacheValid(data)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(this.cache.size, 1)
    };
  }

  /**
   * Invalidate airport cache - utility method
   */
  invalidateAirport(airportCode: string): void {
    const arrivalsKey = this.getCacheKey(airportCode, 'arrivals');
    const departuresKey = this.getCacheKey(airportCode, 'departures');
    
    this.cache.delete(arrivalsKey);
    this.cache.delete(departuresKey);
    
    console.log(`Cache invalidated for airport ${airportCode}`);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Flight cache cleared completely');
  }
}

let flightRepositoryInstance: FlightRepository | null = null;

export function getFlightRepository(): FlightRepository {
  if (!flightRepositoryInstance) {
    flightRepositoryInstance = new FlightRepository();
  }
  return flightRepositoryInstance;
}

export default FlightRepository;
'@

# Save the complete repository
$completeFlightRepo | Out-File -FilePath "flightRepository-complete.ts" -Encoding UTF8

# Upload to server
Write-Host "Uploading complete flight repository..." -ForegroundColor Yellow
pscp -pw $Password "flightRepository-complete.ts" root@${ServerIP}:/tmp/

# Apply changes on server
Write-Host "Applying complete flight repository..." -ForegroundColor Yellow
$updateCmd = "plink -ssh -pw $Password root@$ServerIP `"cd /opt/anyway-flight-schedule && cp /tmp/flightRepository-complete.ts lib/flightRepository.ts`""
Invoke-Expression $updateCmd

# Clean up
Remove-Item "flightRepository-complete.ts" -ErrorAction SilentlyContinue

Write-Host "Complete flight repository uploaded. Now rebuilding..." -ForegroundColor Green