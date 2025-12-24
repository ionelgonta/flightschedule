/**
 * Persistent Flight System - Main integration layer
 * Coordinates all components of the persistent flight system
 * Integrates with existing cache manager while maintaining backward compatibility
 */

import { historicalDatabaseManager, FlightRecord } from './historicalDatabaseManager'
import { flightDataProcessor, RawFlightData, ProcessedFlight } from './flightDataProcessor'
import { masterScheduleGenerator } from './masterScheduleGenerator'
import { weatherCacheManager } from './weatherCacheManager'
import { dailyBackupManager } from './dailyBackupManager'
import { persistentFlightCache } from './persistentFlightCache'

export interface SystemStatus {
  isInitialized: boolean
  components: {
    historicalDatabase: boolean
    flightProcessor: boolean
    scheduleGenerator: boolean
    weatherCache: boolean
    backupManager: boolean
    persistentCache: boolean
  }
  statistics: {
    totalFlights: number
    totalRoutes: number
    cacheSize: string
    lastBackup: Date | null
  }
}

export interface FlightDataIngestionResult {
  originalCount: number
  processedCount: number
  duplicatesFiltered: number
  codesharesFiltered: number
  savedToDatabase: number
  errors: string[]
}

/**
 * Persistent Flight System main class
 */
class PersistentFlightSystem {
  private static instance: PersistentFlightSystem
  private isInitialized: boolean = false

  private constructor() {}

  static getInstance(): PersistentFlightSystem {
    if (!PersistentFlightSystem.instance) {
      PersistentFlightSystem.instance = new PersistentFlightSystem()
    }
    return PersistentFlightSystem.instance
  }

  /**
   * Initialize the entire persistent flight system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Persistent Flight System] Already initialized')
      return
    }

    console.log('[Persistent Flight System] Initializing...')

    try {
      // Initialize all components in order
      await historicalDatabaseManager.initializeDatabase()
      await weatherCacheManager.loadCache()
      await persistentFlightCache.loadCache()
      await dailyBackupManager.initialize()

      this.isInitialized = true
      console.log('[Persistent Flight System] Successfully initialized all components')

      // Get system statistics
      const status = await this.getSystemStatus()
      console.log(`[Persistent Flight System] System ready - ${status.statistics.totalFlights} flights in database`)

    } catch (error) {
      console.error('[Persistent Flight System] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Process and ingest flight data from APIs
   * This is the main entry point for new flight data
   */
  async ingestFlightData(
    rawFlightData: RawFlightData[],
    airportCode: string,
    flightType: 'arrivals' | 'departures'
  ): Promise<FlightDataIngestionResult> {
    console.log(`[Persistent Flight System] Ingesting ${rawFlightData.length} flights for ${airportCode} ${flightType}`)

    const result: FlightDataIngestionResult = {
      originalCount: rawFlightData.length,
      processedCount: 0,
      duplicatesFiltered: 0,
      codesharesFiltered: 0,
      savedToDatabase: 0,
      errors: []
    }

    try {
      // Step 1: Process flight data (validation, normalization, filtering)
      const processedFlights = await flightDataProcessor.processFlightData(rawFlightData)
      result.processedCount = processedFlights.length
      result.duplicatesFiltered = rawFlightData.length - processedFlights.length

      console.log(`[Persistent Flight System] Processed ${processedFlights.length} flights after filtering`)

      // Step 2: Save to historical database using UPSERT logic
      let savedCount = 0
      for (const flight of processedFlights) {
        try {
          const flightRecord = this.convertToFlightRecord(flight, airportCode, flightType)
          await historicalDatabaseManager.upsertFlight(flightRecord)
          savedCount++
        } catch (error) {
          result.errors.push(`Failed to save flight ${flight.flightNumber}: ${error}`)
        }
      }
      result.savedToDatabase = savedCount

      // Step 3: Update persistent flight cache for backward compatibility
      try {
        await persistentFlightCache.addFlightData(
          airportCode,
          flightType,
          this.convertToLegacyFormat(processedFlights),
          'persistent_system'
        )
      } catch (error) {
        result.errors.push(`Failed to update persistent cache: ${error}`)
      }

      console.log(`[Persistent Flight System] Saved ${savedCount} flights to historical database`)

      return result

    } catch (error) {
      console.error('[Persistent Flight System] Flight data ingestion failed:', error)
      result.errors.push(`System error: ${error}`)
      return result
    }
  }

  /**
   * Get flight data for display (backward compatible with existing system)
   */
  async getFlightData(
    airportCode: string,
    flightType: 'arrivals' | 'departures',
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<any[]> {
    console.log(`[Persistent Flight System] Getting flight data for ${airportCode} ${flightType}`)

    try {
      // If date range is specified, get from historical database
      if (dateRange) {
        const flights = await historicalDatabaseManager.getFlightsByAirport(airportCode, dateRange)
        return this.convertToLegacyFormat(flights.map(f => this.convertFromFlightRecord(f)))
      }

      // For current data, try persistent cache first
      const cacheData = await persistentFlightCache.getFlightData(airportCode, flightType)
      if (cacheData.length > 0) {
        return this.convertToLegacyFormat(cacheData.map(c => this.convertFromCacheEntry(c)))
      }

      // Fallback to recent historical data (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const flights = await historicalDatabaseManager.getFlightsByAirport(airportCode, {
        startDate: yesterday,
        endDate: new Date()
      })

      return this.convertToLegacyFormat(flights.map(f => this.convertFromFlightRecord(f)))

    } catch (error) {
      console.error(`[Persistent Flight System] Failed to get flight data for ${airportCode} ${flightType}:`, error)
      return []
    }
  }

  /**
   * Generate weekly schedule for an airport
   */
  async generateWeeklySchedule(airportCode: string) {
    console.log(`[Persistent Flight System] Generating weekly schedule for ${airportCode}`)
    
    try {
      return await masterScheduleGenerator.generateWeeklySchedule(airportCode)
    } catch (error) {
      console.error(`[Persistent Flight System] Failed to generate schedule for ${airportCode}:`, error)
      throw error
    }
  }

  /**
   * Get route statistics
   */
  async getRouteStatistics(route: string) {
    console.log(`[Persistent Flight System] Getting route statistics for ${route}`)
    
    try {
      return await masterScheduleGenerator.getRouteStatistics(route)
    } catch (error) {
      console.error(`[Persistent Flight System] Failed to get route statistics for ${route}:`, error)
      throw error
    }
  }

  /**
   * Get weather data for destination
   */
  async getWeatherData(destination: string) {
    console.log(`[Persistent Flight System] Getting weather data for ${destination}`)
    
    try {
      return await weatherCacheManager.getWeatherData(destination)
    } catch (error) {
      console.error(`[Persistent Flight System] Failed to get weather data for ${destination}:`, error)
      throw error
    }
  }

  /**
   * Create manual backup
   */
  async createBackup(description?: string) {
    console.log('[Persistent Flight System] Creating manual backup')
    
    try {
      return await dailyBackupManager.createManualBackup(description)
    } catch (error) {
      console.error('[Persistent Flight System] Failed to create backup:', error)
      throw error
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string) {
    console.log(`[Persistent Flight System] Restoring from backup: ${backupId}`)
    
    try {
      await dailyBackupManager.restoreFromBackup(backupId)
      
      // Reload all components after restore
      await this.initialize()
      
      console.log('[Persistent Flight System] Successfully restored from backup')
    } catch (error) {
      console.error(`[Persistent Flight System] Failed to restore from backup ${backupId}:`, error)
      throw error
    }
  }

  /**
   * Get system status and statistics
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const components = {
      historicalDatabase: false,
      flightProcessor: false,
      scheduleGenerator: false,
      weatherCache: false,
      backupManager: false,
      persistentCache: false
    }

    let totalFlights = 0
    let totalRoutes = 0
    let cacheSize = '0 KB'
    let lastBackup: Date | null = null

    try {
      // Check historical database
      const dbStats = await historicalDatabaseManager.getDatabaseStats()
      components.historicalDatabase = true
      totalFlights = dbStats.totalFlights
      totalRoutes = Object.keys(dbStats.flightsByAirport).length
      cacheSize = dbStats.databaseSize
    } catch (error) {
      console.error('[Persistent Flight System] Historical database not available:', error)
    }

    try {
      // Check backup manager
      const backupStats = await dailyBackupManager.getBackupStats()
      components.backupManager = true
      lastBackup = backupStats.newestBackup
    } catch (error) {
      console.error('[Persistent Flight System] Backup manager not available:', error)
    }

    try {
      // Check weather cache
      await weatherCacheManager.getCacheStats()
      components.weatherCache = true
    } catch (error) {
      console.error('[Persistent Flight System] Weather cache not available:', error)
    }

    try {
      // Check persistent cache
      await persistentFlightCache.getCacheStats()
      components.persistentCache = true
    } catch (error) {
      console.error('[Persistent Flight System] Persistent cache not available:', error)
    }

    // Flight processor and schedule generator are always available (no state)
    components.flightProcessor = true
    components.scheduleGenerator = true

    return {
      isInitialized: this.isInitialized,
      components,
      statistics: {
        totalFlights,
        totalRoutes,
        cacheSize,
        lastBackup
      }
    }
  }

  /**
   * Convert processed flight to flight record for database
   */
  private convertToFlightRecord(
    flight: ProcessedFlight,
    airportCode: string,
    flightType: 'arrivals' | 'departures'
  ): Partial<FlightRecord> {
    return {
      flightNumber: flight.flightNumber,
      airlineCode: flight.airlineCode,
      airlineName: flight.airlineName,
      route: flight.route,
      originAirport: flight.originAirport,
      destinationAirport: flight.destinationAirport,
      scheduledTime: flight.scheduledTime,
      estimatedTime: flight.estimatedTime,
      actualTime: flight.actualTime,
      status: flight.status as any,
      aircraft: flight.aircraft,
      gate: flight.gate,
      terminal: flight.terminal,
      isCodeshare: flight.isCodeshare,
      operatingAirline: flight.operatingAirline
    }
  }

  /**
   * Convert flight record back to processed flight format
   */
  private convertFromFlightRecord(record: FlightRecord): ProcessedFlight {
    return {
      flightNumber: record.flightNumber,
      airlineCode: record.airlineCode,
      airlineName: record.airlineName,
      originAirport: record.originAirport,
      destinationAirport: record.destinationAirport,
      originName: record.originAirport,
      destinationName: record.destinationAirport,
      scheduledTime: record.scheduledTime,
      estimatedTime: record.estimatedTime,
      actualTime: record.actualTime,
      status: record.status,
      delayMinutes: this.calculateDelay(record),
      aircraft: record.aircraft,
      gate: record.gate,
      terminal: record.terminal,
      isCodeshare: record.isCodeshare,
      operatingAirline: record.operatingAirline,
      route: record.route
    }
  }

  /**
   * Convert cache entry to processed flight format
   */
  private convertFromCacheEntry(entry: any): ProcessedFlight {
    return {
      flightNumber: entry.flightNumber,
      airlineCode: entry.airlineCode,
      airlineName: entry.airlineName,
      originAirport: entry.originCode,
      destinationAirport: entry.destinationCode,
      originName: entry.originName,
      destinationName: entry.destinationName,
      scheduledTime: new Date(entry.scheduledTime),
      estimatedTime: entry.estimatedTime ? new Date(entry.estimatedTime) : undefined,
      actualTime: entry.actualTime ? new Date(entry.actualTime) : undefined,
      status: entry.status,
      delayMinutes: entry.delayMinutes || 0,
      isCodeshare: false,
      route: `${entry.originCode}-${entry.destinationCode}`
    }
  }

  /**
   * Convert to legacy format for backward compatibility
   */
  private convertToLegacyFormat(flights: ProcessedFlight[]): any[] {
    return flights.map(flight => ({
      flight_number: flight.flightNumber,
      airline: {
        code: flight.airlineCode,
        name: flight.airlineName
      },
      origin: {
        code: flight.originAirport,
        name: flight.originName
      },
      destination: {
        code: flight.destinationAirport,
        name: flight.destinationName
      },
      scheduled_time: flight.scheduledTime.toISOString(),
      estimated_time: flight.estimatedTime?.toISOString(),
      actual_time: flight.actualTime?.toISOString(),
      status: flight.status,
      delay: flight.delayMinutes,
      aircraft: flight.aircraft,
      gate: flight.gate,
      terminal: flight.terminal
    }))
  }

  /**
   * Calculate delay in minutes
   */
  private calculateDelay(record: FlightRecord): number {
    if (record.actualTime && record.scheduledTime) {
      return Math.max(0, Math.round((record.actualTime.getTime() - record.scheduledTime.getTime()) / (1000 * 60)))
    }
    if (record.estimatedTime && record.scheduledTime) {
      return Math.max(0, Math.round((record.estimatedTime.getTime() - record.scheduledTime.getTime()) / (1000 * 60)))
    }
    return 0
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown(): Promise<void> {
    console.log('[Persistent Flight System] Shutting down...')
    
    try {
      dailyBackupManager.stopScheduledBackups()
      this.isInitialized = false
      console.log('[Persistent Flight System] Shutdown complete')
    } catch (error) {
      console.error('[Persistent Flight System] Error during shutdown:', error)
    }
  }
}

// Export singleton instance
export const persistentFlightSystem = PersistentFlightSystem.getInstance()