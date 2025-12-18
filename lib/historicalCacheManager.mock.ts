/**
 * Mock Historical Cache Manager for Local Development
 * This version works without better-sqlite3 for local testing
 */

import {
  DailySnapshot,
  FlightData,
  CacheStatistics
} from './types/historical'

export class HistoricalCacheManager {
  private static instance: HistoricalCacheManager
  private isInitialized: boolean = false
  private mockData: Map<string, any> = new Map()

  private constructor() {}

  static getInstance(): HistoricalCacheManager {
    if (!HistoricalCacheManager.instance) {
      HistoricalCacheManager.instance = new HistoricalCacheManager()
    }
    return HistoricalCacheManager.instance
  }

  /**
   * Initialize the historical cache manager (mock version)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Historical Cache Mock] Already initialized')
      return
    }

    console.log('[Historical Cache Mock] Initializing mock version...')
    this.isInitialized = true
    console.log('[Historical Cache Mock] Mock initialization complete')
  }

  /**
   * Check if data exists for a specific date (mock)
   */
  async hasDataForDate(
    airportCode: string, 
    date: string, 
    type: 'arrivals' | 'departures'
  ): Promise<boolean> {
    const key = `${airportCode}_${date}_${type}`
    const hasData = this.mockData.has(key)
    console.log(`[Historical Cache Mock] Data check for ${key}: ${hasData ? 'EXISTS' : 'NOT FOUND'}`)
    return hasData
  }

  /**
   * Save daily snapshot to mock storage
   */
  async saveDailySnapshot(snapshot: DailySnapshot): Promise<void> {
    console.log(`[Historical Cache Mock] Saving snapshot: ${snapshot.airportCode} ${snapshot.type} ${snapshot.date} (${snapshot.flights.length} flights)`)
    
    const key = `${snapshot.airportCode}_${snapshot.date}_${snapshot.type}`
    this.mockData.set(key, snapshot.flights)
    
    console.log(`[Historical Cache Mock] Saved ${snapshot.flights.length} flights for ${key}`)
  }

  /**
   * Get data for a specific date (mock)
   */
  async getDataForDate(
    airportCode: string, 
    date: string, 
    type: 'arrivals' | 'departures'
  ): Promise<FlightData[]> {
    const key = `${airportCode}_${date}_${type}`
    const data = this.mockData.get(key) || []
    
    console.log(`[Historical Cache Mock] Retrieved ${data.length} flights for ${key}`)
    return data
  }

  /**
   * Get data for date range (mock)
   */
  async getDataForRange(
    airportCode: string, 
    fromDate: string, 
    toDate: string, 
    type?: 'arrivals' | 'departures'
  ): Promise<FlightData[]> {
    console.log(`[Historical Cache Mock] Getting range data for ${airportCode} from ${fromDate} to ${toDate}`)
    
    // Generate mock data for the range
    const mockFlights: FlightData[] = []
    const startDate = new Date(fromDate)
    const endDate = new Date(toDate)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      
      if (!type || type === 'arrivals') {
        const arrivals = this.mockData.get(`${airportCode}_${dateStr}_arrivals`) || []
        mockFlights.push(...arrivals)
      }
      
      if (!type || type === 'departures') {
        const departures = this.mockData.get(`${airportCode}_${dateStr}_departures`) || []
        mockFlights.push(...departures)
      }
    }
    
    console.log(`[Historical Cache Mock] Retrieved ${mockFlights.length} flights for range`)
    return mockFlights
  }

  /**
   * Get available dates for an airport (mock)
   */
  async getAvailableDates(airportCode: string): Promise<string[]> {
    const dates: string[] = []
    
    for (const key of this.mockData.keys()) {
      if (key.startsWith(airportCode)) {
        const parts = key.split('_')
        if (parts.length >= 2) {
          const date = parts[1]
          if (!dates.includes(date)) {
            dates.push(date)
          }
        }
      }
    }
    
    dates.sort()
    console.log(`[Historical Cache Mock] Found ${dates.length} available dates for ${airportCode}`)
    return dates
  }

  /**
   * Get cache statistics (mock)
   */
  async getCacheStatistics(): Promise<CacheStatistics> {
    const totalRecords = Array.from(this.mockData.values()).reduce((sum, flights) => sum + flights.length, 0)
    const airports = new Set<string>()
    const dates = new Set<string>()
    
    for (const key of this.mockData.keys()) {
      const parts = key.split('_')
      if (parts.length >= 2) {
        airports.add(parts[0])
        dates.add(parts[1])
      }
    }
    
    const sortedDates = Array.from(dates).sort()
    
    return {
      totalRecords,
      oldestRecord: sortedDates[0] || '',
      newestRecord: sortedDates[sortedDates.length - 1] || '',
      airportCoverage: Array.from(airports),
      dateRange: {
        start: sortedDates[0] || '',
        end: sortedDates[sortedDates.length - 1] || '',
        totalDays: sortedDates.length
      },
      dataQuality: {
        recordsWithDelayData: Math.floor(totalRecords * 0.7), // Mock 70% have delay data
        recordsWithActualTimes: Math.floor(totalRecords * 0.8), // Mock 80% have actual times
        completenessPercentage: 80
      }
    }
  }

  /**
   * Clean old data (mock)
   */
  async cleanOldData(olderThanDays: number): Promise<number> {
    console.log(`[Historical Cache Mock] Mock cleaning data older than ${olderThanDays} days`)
    return 0
  }

  /**
   * Close database connection (mock)
   */
  close(): void {
    console.log('[Historical Cache Mock] Mock close called')
    this.isInitialized = false
  }

  /**
   * Get database instance (mock)
   */
  getDatabase(): any {
    return null
  }
}

// Export singleton instance
export const historicalCacheManager = HistoricalCacheManager.getInstance()