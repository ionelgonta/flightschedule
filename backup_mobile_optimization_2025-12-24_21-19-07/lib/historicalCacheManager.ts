/**
 * Historical Cache Manager
 * Manages persistent storage of historical flight data using SQLite
 * Integrates with existing cache system while providing long-term data storage
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { DatabaseMigrator } from './database/migrations'
import {
  DailySnapshot,
  FlightData,
  HistoricalFlightRecord,
  DailyStatisticsRecord,
  CacheStatistics
} from './types/historical'

export class HistoricalCacheManager {
  private static instance: HistoricalCacheManager
  private db: Database.Database | null = null
  private isInitialized: boolean = false
  private dbPath: string

  private constructor() {
    // Database path in the data directory
    this.dbPath = join(process.cwd(), 'data', 'historical-flights.db')
  }

  static getInstance(): HistoricalCacheManager {
    if (!HistoricalCacheManager.instance) {
      HistoricalCacheManager.instance = new HistoricalCacheManager()
    }
    return HistoricalCacheManager.instance
  }

  /**
   * Initialize the historical cache manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Historical Cache] Already initialized')
      return
    }

    console.log('[Historical Cache] Initializing...')

    try {
      // Ensure data directory exists
      const dataDir = join(process.cwd(), 'data')
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true })
        console.log('[Historical Cache] Created data directory')
      }

      // Initialize SQLite database
      this.db = new Database(this.dbPath)
      
      // Enable WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 1000')
      this.db.pragma('temp_store = memory')

      console.log(`[Historical Cache] Database opened: ${this.dbPath}`)

      // Run migrations
      const migrator = new DatabaseMigrator(this.db)
      await migrator.runMigrations()

      this.isInitialized = true
      console.log('[Historical Cache] Initialization complete')

      // Log current statistics
      const stats = await this.getCacheStatistics()
      console.log(`[Historical Cache] Current stats: ${stats.totalRecords} records, ${stats.airportCoverage.length} airports`)

    } catch (error) {
      console.error('[Historical Cache] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Check if data exists for a specific date
   */
  async hasDataForDate(
    airportCode: string, 
    date: string, 
    type: 'arrivals' | 'departures'
  ): Promise<boolean> {
    await this.ensureInitialized()

    try {
      const stmt = this.db!.prepare(`
        SELECT COUNT(*) as count 
        FROM historical_flights 
        WHERE airport_iata = ? 
          AND request_date = ? 
          AND flight_type = ?
      `)
      
      const result = stmt.get(airportCode, date, type === 'arrivals' ? 'arrival' : 'departure') as { count: number }
      
      const hasData = result.count > 0
      console.log(`[Historical Cache] Data check for ${airportCode} ${type} on ${date}: ${hasData ? 'EXISTS' : 'NOT FOUND'}`)
      
      return hasData
    } catch (error) {
      console.error('[Historical Cache] Error checking data existence:', error)
      return false
    }
  }

  /**
   * Save daily snapshot to historical cache
   */
  async saveDailySnapshot(snapshot: DailySnapshot): Promise<void> {
    await this.ensureInitialized()

    console.log(`[Historical Cache] Saving snapshot: ${snapshot.airportCode} ${snapshot.type} ${snapshot.date} (${snapshot.flights.length} flights)`)

    try {
      // Check if data already exists for this date
      const exists = await this.hasDataForDate(snapshot.airportCode, snapshot.date, snapshot.type)
      
      if (exists) {
        console.log(`[Historical Cache] Data already exists for ${snapshot.airportCode} ${snapshot.type} on ${snapshot.date}, skipping save`)
        return
      }

      // Prepare insert statement
      const stmt = this.db!.prepare(`
        INSERT OR IGNORE INTO historical_flights (
          airport_iata, flight_number, airline_code, airline_name,
          origin_code, origin_name, destination_code, destination_name,
          scheduled_time, actual_time, estimated_time, status, delay_minutes,
          flight_type, request_date, request_time, data_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      // Insert all flights in a transaction
      const transaction = this.db!.transaction((flights: FlightData[]) => {
        let insertedCount = 0
        
        for (const flight of flights) {
          try {
            const result = stmt.run(
              snapshot.airportCode,
              flight.flightNumber,
              flight.airlineCode,
              flight.airlineName,
              flight.originCode,
              flight.originName,
              flight.destinationCode,
              flight.destinationName,
              flight.scheduledTime,
              flight.actualTime || null,
              flight.estimatedTime || null,
              flight.status,
              flight.delayMinutes,
              snapshot.type === 'arrivals' ? 'arrival' : 'departure',
              snapshot.date,
              snapshot.time,
              snapshot.source === 'cache' ? 'cache' : 'api'
            )
            
            if (result.changes > 0) {
              insertedCount++
            }
          } catch (error) {
            // Log individual flight errors but continue with others
            console.warn(`[Historical Cache] Failed to insert flight ${flight.flightNumber}:`, error)
          }
        }
        
        return insertedCount
      })

      const insertedCount = transaction(snapshot.flights)
      console.log(`[Historical Cache] Saved ${insertedCount}/${snapshot.flights.length} flights for ${snapshot.airportCode} ${snapshot.type} on ${snapshot.date}`)

    } catch (error) {
      console.error('[Historical Cache] Error saving daily snapshot:', error)
      throw error
    }
  }

  /**
   * Get data for a specific date
   */
  async getDataForDate(
    airportCode: string, 
    date: string, 
    type: 'arrivals' | 'departures'
  ): Promise<FlightData[]> {
    await this.ensureInitialized()

    try {
      const stmt = this.db!.prepare(`
        SELECT * FROM historical_flights 
        WHERE airport_iata = ? 
          AND request_date = ? 
          AND flight_type = ?
        ORDER BY scheduled_time
      `)
      
      const records = stmt.all(
        airportCode, 
        date, 
        type === 'arrivals' ? 'arrival' : 'departure'
      ) as HistoricalFlightRecord[]

      const flights: FlightData[] = records.map(record => ({
        flightNumber: record.flight_number,
        airlineCode: record.airline_code,
        airlineName: record.airline_name || 'Unknown',
        originCode: record.origin_code,
        originName: record.origin_name || record.origin_code,
        destinationCode: record.destination_code,
        destinationName: record.destination_name || record.destination_code,
        scheduledTime: record.scheduled_time,
        actualTime: record.actual_time || undefined,
        estimatedTime: record.estimated_time || undefined,
        status: record.status,
        delayMinutes: record.delay_minutes
      }))

      console.log(`[Historical Cache] Retrieved ${flights.length} flights for ${airportCode} ${type} on ${date}`)
      return flights

    } catch (error) {
      console.error('[Historical Cache] Error getting data for date:', error)
      return []
    }
  }

  /**
   * Get data for date range
   */
  async getDataForRange(
    airportCode: string, 
    fromDate: string, 
    toDate: string, 
    type?: 'arrivals' | 'departures'
  ): Promise<FlightData[]> {
    await this.ensureInitialized()

    try {
      let query = `
        SELECT * FROM historical_flights 
        WHERE airport_iata = ? 
          AND request_date >= ? 
          AND request_date <= ?
      `
      const params: any[] = [airportCode, fromDate, toDate]

      if (type) {
        query += ' AND flight_type = ?'
        params.push(type === 'arrivals' ? 'arrival' : 'departure')
      }

      query += ' ORDER BY request_date, scheduled_time'

      const stmt = this.db!.prepare(query)
      const records = stmt.all(...params) as HistoricalFlightRecord[]

      const flights: FlightData[] = records.map(record => ({
        flightNumber: record.flight_number,
        airlineCode: record.airline_code,
        airlineName: record.airline_name || 'Unknown',
        originCode: record.origin_code,
        originName: record.origin_name || record.origin_code,
        destinationCode: record.destination_code,
        destinationName: record.destination_name || record.destination_code,
        scheduledTime: record.scheduled_time,
        actualTime: record.actual_time || undefined,
        estimatedTime: record.estimated_time || undefined,
        status: record.status,
        delayMinutes: record.delay_minutes
      }))

      console.log(`[Historical Cache] Retrieved ${flights.length} flights for ${airportCode} from ${fromDate} to ${toDate}`)
      return flights

    } catch (error) {
      console.error('[Historical Cache] Error getting data for range:', error)
      return []
    }
  }

  /**
   * Get available dates for an airport
   */
  async getAvailableDates(airportCode: string): Promise<string[]> {
    await this.ensureInitialized()

    try {
      const stmt = this.db!.prepare(`
        SELECT DISTINCT request_date 
        FROM historical_flights 
        WHERE airport_iata = ? 
        ORDER BY request_date DESC
      `)
      
      const records = stmt.all(airportCode) as { request_date: string }[]
      const dates = records.map(record => record.request_date)

      console.log(`[Historical Cache] Found ${dates.length} available dates for ${airportCode}`)
      return dates

    } catch (error) {
      console.error('[Historical Cache] Error getting available dates:', error)
      return []
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(): Promise<CacheStatistics> {
    await this.ensureInitialized()

    try {
      // Total records
      const totalStmt = this.db!.prepare('SELECT COUNT(*) as count FROM historical_flights')
      const totalResult = totalStmt.get() as { count: number }

      // Date range
      const dateRangeStmt = this.db!.prepare(`
        SELECT 
          MIN(request_date) as oldest,
          MAX(request_date) as newest
        FROM historical_flights
      `)
      const dateRange = dateRangeStmt.get() as { oldest: string; newest: string }

      // Airport coverage
      const airportsStmt = this.db!.prepare(`
        SELECT DISTINCT airport_iata 
        FROM historical_flights 
        ORDER BY airport_iata
      `)
      const airports = airportsStmt.all() as { airport_iata: string }[]

      // Data quality metrics
      const qualityStmt = this.db!.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN delay_minutes > 0 THEN 1 ELSE 0 END) as with_delay,
          SUM(CASE WHEN actual_time IS NOT NULL THEN 1 ELSE 0 END) as with_actual_time
        FROM historical_flights
      `)
      const quality = qualityStmt.get() as { 
        total: number; 
        with_delay: number; 
        with_actual_time: number 
      }

      // Calculate total days
      let totalDays = 0
      if (dateRange.oldest && dateRange.newest) {
        const start = new Date(dateRange.oldest)
        const end = new Date(dateRange.newest)
        totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }

      const statistics: CacheStatistics = {
        totalRecords: totalResult.count,
        oldestRecord: dateRange.oldest || '',
        newestRecord: dateRange.newest || '',
        airportCoverage: airports.map(a => a.airport_iata),
        dateRange: {
          start: dateRange.oldest || '',
          end: dateRange.newest || '',
          totalDays
        },
        dataQuality: {
          recordsWithDelayData: quality.with_delay,
          recordsWithActualTimes: quality.with_actual_time,
          completenessPercentage: quality.total > 0 
            ? Math.round((quality.with_actual_time / quality.total) * 100)
            : 0
        }
      }

      return statistics

    } catch (error) {
      console.error('[Historical Cache] Error getting cache statistics:', error)
      return {
        totalRecords: 0,
        oldestRecord: '',
        newestRecord: '',
        airportCoverage: [],
        dateRange: { start: '', end: '', totalDays: 0 },
        dataQuality: { recordsWithDelayData: 0, recordsWithActualTimes: 0, completenessPercentage: 0 }
      }
    }
  }

  /**
   * Clean old data (older than specified days)
   */
  async cleanOldData(olderThanDays: number): Promise<number> {
    await this.ensureInitialized()

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const stmt = this.db!.prepare(`
        DELETE FROM historical_flights 
        WHERE request_date < ?
      `)
      
      const result = stmt.run(cutoffDateStr)
      console.log(`[Historical Cache] Cleaned ${result.changes} records older than ${olderThanDays} days`)
      
      return result.changes

    } catch (error) {
      console.error('[Historical Cache] Error cleaning old data:', error)
      return 0
    }
  }

  /**
   * Ensure the manager is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      console.log('[Historical Cache] Database connection closed')
    }
  }

  /**
   * Get database instance (for advanced operations)
   */
  getDatabase(): Database.Database | null {
    return this.db
  }
}

// Export singleton instance
export const historicalCacheManager = HistoricalCacheManager.getInstance()