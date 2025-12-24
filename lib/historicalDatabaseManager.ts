/**
 * Historical Database Manager - SQLite-based persistent storage for flight data
 * Implements UPSERT operations and never deletes historical data
 * Part of the Persistent Flight System architecture
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// Types for the historical database
export interface FlightRecord {
  id: string // Generated unique ID
  flightNumber: string // e.g., "W6 2345"
  airlineCode: string // IATA code
  airlineName: string
  route: string // "OTP-CDG" format
  originAirport: string
  destinationAirport: string
  scheduledTime: Date
  estimatedTime?: Date
  actualTime?: Date
  status: FlightStatus
  aircraft?: AircraftInfo
  gate?: string
  terminal?: string
  isCodeshare: boolean
  operatingAirline?: string // For codeshare flights
  createdAt: Date
  updatedAt: Date
}

export interface AircraftInfo {
  icao24?: string
  registration?: string
  model?: string
  airline?: string
}

export type FlightStatus = 'scheduled' | 'delayed' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'estimated'

export interface WeeklySchedule {
  airport: string
  weekStartDate: Date
  routes: RouteSchedule[]
  statistics: ScheduleStatistics
  lastUpdated: Date
}

export interface RouteSchedule {
  route: string // "Paris - București"
  flights: ScheduledFlight[]
}

export interface ScheduledFlight {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  airline: string
  flightNumber: string
  scheduledTime: string // "12:00"
  frequency: number // How many times per week
  punctualityScore: number // 0-100
}

export interface ScheduleStatistics {
  totalRoutes: number
  totalFlights: number
  averagePunctuality: number
  mostFrequentRoute: string
  busiestDay: number
}

export interface BackupInfo {
  id: string
  filename: string
  createdAt: Date
  size: number
  flightCount: number
  isValid: boolean
}

export interface DateRange {
  startDate: Date
  endDate: Date
}

/**
 * Historical Database Manager using JSON-based storage
 * Implements SQLite-like operations with JSON for simplicity and compatibility
 */
class HistoricalDatabaseManager {
  private static instance: HistoricalDatabaseManager
  private dbPath: string
  private backupDir: string
  private database: Map<string, FlightRecord> = new Map()
  private isInitialized: boolean = false

  private constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'historical_flights.json')
    this.backupDir = path.join(process.cwd(), 'data', 'backups')
  }

  static getInstance(): HistoricalDatabaseManager {
    if (!HistoricalDatabaseManager.instance) {
      HistoricalDatabaseManager.instance = new HistoricalDatabaseManager()
    }
    return HistoricalDatabaseManager.instance
  }

  /**
   * Initialize the database - create schema and load existing data
   */
  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Historical DB] Already initialized')
      return
    }

    console.log('[Historical DB] Initializing database...')

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath)
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }

      // Ensure backup directory exists
      try {
        await fs.access(this.backupDir)
      } catch {
        await fs.mkdir(this.backupDir, { recursive: true })
      }

      // Load existing database
      await this.loadDatabase()

      this.isInitialized = true
      console.log(`[Historical DB] Initialized with ${this.database.size} flight records`)

    } catch (error) {
      console.error('[Historical DB] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Load database from disk
   */
  private async loadDatabase(): Promise<void> {
    try {
      await fs.access(this.dbPath)
      const data = await fs.readFile(this.dbPath, 'utf-8')
      const records: FlightRecord[] = JSON.parse(data)
      
      this.database.clear()
      records.forEach(record => {
        // Convert date strings back to Date objects
        record.scheduledTime = new Date(record.scheduledTime)
        record.createdAt = new Date(record.createdAt)
        record.updatedAt = new Date(record.updatedAt)
        if (record.estimatedTime) record.estimatedTime = new Date(record.estimatedTime)
        if (record.actualTime) record.actualTime = new Date(record.actualTime)
        
        this.database.set(record.id, record)
      })

      console.log(`[Historical DB] Loaded ${this.database.size} records from disk`)
    } catch (error) {
      // Database doesn't exist yet - start fresh
      console.log('[Historical DB] No existing database found, starting fresh')
      this.database.clear()
    }
  }

  /**
   * Save database to disk
   */
  private async saveDatabase(): Promise<void> {
    try {
      const records = Array.from(this.database.values())
      await fs.writeFile(this.dbPath, JSON.stringify(records, null, 2), 'utf-8')
      console.log(`[Historical DB] Saved ${records.length} records to disk`)
    } catch (error) {
      console.error('[Historical DB] Failed to save database:', error)
      throw error
    }
  }

  /**
   * UPSERT flight record - update if exists, insert if new
   * Key logic: never overwrite, only update with newer information
   */
  async upsertFlight(flight: Partial<FlightRecord>): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeDatabase()
    }

    // Generate unique ID based on flight number, route, and scheduled time
    const scheduledTime = flight.scheduledTime || new Date()
    const flightNumber = flight.flightNumber || 'UNKNOWN'
    const route = flight.route || `${flight.originAirport}-${flight.destinationAirport}`
    const id = `${flightNumber}_${route}_${scheduledTime.getTime()}`

    const now = new Date()
    const existingRecord = this.database.get(id)

    if (existingRecord) {
      // Update existing record - preserve creation time, update modification time
      const updatedRecord: FlightRecord = {
        ...existingRecord,
        ...flight,
        id, // Preserve ID
        createdAt: existingRecord.createdAt, // Preserve original creation time
        updatedAt: now, // Update modification time
        scheduledTime: flight.scheduledTime || existingRecord.scheduledTime
      }

      this.database.set(id, updatedRecord)
      console.log(`[Historical DB] Updated flight record: ${flightNumber}`)
    } else {
      // Insert new record
      const newRecord: FlightRecord = {
        id,
        flightNumber: flightNumber,
        airlineCode: flight.airlineCode || 'XX',
        airlineName: flight.airlineName || 'Unknown',
        route: route,
        originAirport: flight.originAirport || '',
        destinationAirport: flight.destinationAirport || '',
        scheduledTime: scheduledTime,
        estimatedTime: flight.estimatedTime,
        actualTime: flight.actualTime,
        status: flight.status || 'scheduled',
        aircraft: flight.aircraft,
        gate: flight.gate,
        terminal: flight.terminal,
        isCodeshare: flight.isCodeshare || false,
        operatingAirline: flight.operatingAirline,
        createdAt: now,
        updatedAt: now
      }

      this.database.set(id, newRecord)
      console.log(`[Historical DB] Inserted new flight record: ${flightNumber}`)
    }

    // Save to disk after each operation to ensure persistence
    await this.saveDatabase()
  }

  /**
   * Get flights by route
   */
  async getFlightsByRoute(route: string): Promise<FlightRecord[]> {
    if (!this.isInitialized) {
      await this.initializeDatabase()
    }

    const flights = Array.from(this.database.values()).filter(
      flight => flight.route === route
    )

    return flights.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())
  }

  /**
   * Get flights by airport within date range
   */
  async getFlightsByAirport(airport: string, dateRange: DateRange): Promise<FlightRecord[]> {
    if (!this.isInitialized) {
      await this.initializeDatabase()
    }

    const flights = Array.from(this.database.values()).filter(flight => {
      const isAirportMatch = flight.originAirport === airport || flight.destinationAirport === airport
      const isInDateRange = flight.scheduledTime >= dateRange.startDate && 
                           flight.scheduledTime <= dateRange.endDate
      return isAirportMatch && isInDateRange
    })

    return flights.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())
  }

  /**
   * Generate master schedule from historical data
   */
  async generateMasterSchedule(airport: string): Promise<WeeklySchedule> {
    if (!this.isInitialized) {
      await this.initializeDatabase()
    }

    // Get flights for the last 30 days to generate schedule
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const flights = await this.getFlightsByAirport(airport, {
      startDate: thirtyDaysAgo,
      endDate: new Date()
    })

    // Group flights by route
    const routeMap = new Map<string, FlightRecord[]>()
    flights.forEach(flight => {
      const route = flight.route
      if (!routeMap.has(route)) {
        routeMap.set(route, [])
      }
      routeMap.get(route)!.push(flight)
    })

    // Generate route schedules
    const routes: RouteSchedule[] = []
    let totalPunctuality = 0
    let punctualityCount = 0

    routeMap.forEach((routeFlights, routeKey) => {
      // Group by day of week and time
      const scheduleMap = new Map<string, {
        flights: FlightRecord[]
        airline: string
        flightNumber: string
      }>()

      routeFlights.forEach(flight => {
        const dayOfWeek = flight.scheduledTime.getDay()
        const timeStr = flight.scheduledTime.toTimeString().substring(0, 5) // HH:MM
        const key = `${dayOfWeek}_${timeStr}_${flight.airlineCode}`

        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, {
            flights: [],
            airline: flight.airlineName,
            flightNumber: flight.flightNumber
          })
        }
        scheduleMap.get(key)!.flights.push(flight)
      })

      // Convert to scheduled flights
      const scheduledFlights: ScheduledFlight[] = []
      scheduleMap.forEach((scheduleData, key) => {
        const [dayOfWeek, timeStr] = key.split('_')
        
        // Calculate punctuality score
        let onTimeCount = 0
        scheduleData.flights.forEach(flight => {
          if (flight.actualTime && flight.scheduledTime) {
            const delayMinutes = (flight.actualTime.getTime() - flight.scheduledTime.getTime()) / (1000 * 60)
            if (delayMinutes <= 15) onTimeCount++
          } else if (flight.status === 'arrived' || flight.status === 'departed') {
            onTimeCount++ // Assume on time if no delay data
          }
        })

        const punctualityScore = scheduleData.flights.length > 0 
          ? Math.round((onTimeCount / scheduleData.flights.length) * 100)
          : 0

        totalPunctuality += punctualityScore
        punctualityCount++

        scheduledFlights.push({
          dayOfWeek: parseInt(dayOfWeek),
          airline: scheduleData.airline,
          flightNumber: scheduleData.flightNumber,
          scheduledTime: timeStr,
          frequency: scheduleData.flights.length,
          punctualityScore
        })
      })

      // Generate route name from airport codes
      const [origin, destination] = routeKey.split('-')
      const routeName = `${this.getAirportName(origin)} - ${this.getAirportName(destination)}`

      routes.push({
        route: routeName,
        flights: scheduledFlights.sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
          return a.scheduledTime.localeCompare(b.scheduledTime)
        })
      })
    })

    // Calculate statistics
    const averagePunctuality = punctualityCount > 0 ? Math.round(totalPunctuality / punctualityCount) : 0
    const mostFrequentRoute = routes.length > 0 
      ? routes.reduce((max, route) => 
          route.flights.reduce((sum, f) => sum + f.frequency, 0) > 
          max.flights.reduce((sum, f) => sum + f.frequency, 0) ? route : max
        ).route
      : ''

    // Find busiest day
    const dayFrequency = new Array(7).fill(0)
    routes.forEach(route => {
      route.flights.forEach(flight => {
        dayFrequency[flight.dayOfWeek] += flight.frequency
      })
    })
    const busiestDay = dayFrequency.indexOf(Math.max(...dayFrequency))

    const statistics: ScheduleStatistics = {
      totalRoutes: routes.length,
      totalFlights: flights.length,
      averagePunctuality,
      mostFrequentRoute,
      busiestDay
    }

    return {
      airport,
      weekStartDate: new Date(),
      routes: routes.sort((a, b) => a.route.localeCompare(b.route)),
      statistics,
      lastUpdated: new Date()
    }
  }

  /**
   * Create backup of current database
   */
  async createBackup(): Promise<string> {
    if (!this.isInitialized) {
      await this.initializeDatabase()
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFilename = `historical_flights_backup_${timestamp}.json`
    const backupPath = path.join(this.backupDir, backupFilename)

    try {
      // Copy current database to backup location
      const data = await fs.readFile(this.dbPath, 'utf-8')
      await fs.writeFile(backupPath, data, 'utf-8')

      console.log(`[Historical DB] Created backup: ${backupFilename}`)
      
      // Clean old backups (keep only 7 most recent)
      await this.cleanOldBackups()

      return backupFilename
    } catch (error) {
      console.error('[Historical DB] Failed to create backup:', error)
      throw error
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId)

    try {
      // Validate backup exists and is readable
      await fs.access(backupPath)
      const backupData = await fs.readFile(backupPath, 'utf-8')
      
      // Validate backup data
      const records: FlightRecord[] = JSON.parse(backupData)
      if (!Array.isArray(records)) {
        throw new Error('Invalid backup format')
      }

      // Create backup of current state before restore
      await this.createBackup()

      // Restore from backup
      await fs.writeFile(this.dbPath, backupData, 'utf-8')
      
      // Reload database
      await this.loadDatabase()

      console.log(`[Historical DB] Restored from backup: ${backupId}`)
    } catch (error) {
      console.error(`[Historical DB] Failed to restore from backup ${backupId}:`, error)
      throw error
    }
  }

  /**
   * Clean old backups - keep only 7 most recent
   */
  private async cleanOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir)
      const backupFiles = files
        .filter(file => file.startsWith('historical_flights_backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file)
        }))

      if (backupFiles.length <= 7) return

      // Sort by creation time (newest first)
      const fileStats = await Promise.all(
        backupFiles.map(async file => ({
          ...file,
          stats: await fs.stat(file.path)
        }))
      )

      fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())

      // Delete old backups (keep only 7 newest)
      const filesToDelete = fileStats.slice(7)
      for (const file of filesToDelete) {
        await fs.unlink(file.path)
        console.log(`[Historical DB] Deleted old backup: ${file.name}`)
      }
    } catch (error) {
      console.error('[Historical DB] Failed to clean old backups:', error)
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalFlights: number
    flightsByAirport: { [airport: string]: number }
    dateRange: { oldest: Date | null; newest: Date | null }
    databaseSize: string
  }> {
    if (!this.isInitialized) {
      await this.initializeDatabase()
    }

    const flights = Array.from(this.database.values())
    const flightsByAirport: { [airport: string]: number } = {}
    let oldestDate: Date | null = null
    let newestDate: Date | null = null

    flights.forEach(flight => {
      // Count by origin airport
      flightsByAirport[flight.originAirport] = (flightsByAirport[flight.originAirport] || 0) + 1
      
      // Track date range
      if (!oldestDate || flight.scheduledTime < oldestDate) {
        oldestDate = flight.scheduledTime
      }
      if (!newestDate || flight.scheduledTime > newestDate) {
        newestDate = flight.scheduledTime
      }
    })

    // Calculate database file size
    let databaseSize = '0 KB'
    try {
      const stats = await fs.stat(this.dbPath)
      const sizeInKB = Math.round(stats.size / 1024)
      databaseSize = `${sizeInKB} KB`
    } catch {
      // File doesn't exist yet
    }

    return {
      totalFlights: flights.length,
      flightsByAirport,
      dateRange: { oldest: oldestDate, newest: newestDate },
      databaseSize
    }
  }

  /**
   * Helper method to get airport name from code
   */
  private getAirportName(code: string): string {
    const airportNames: { [key: string]: string } = {
      'OTP': 'București',
      'BBU': 'București Băneasa',
      'CLJ': 'Cluj-Napoca',
      'TSR': 'Timișoara',
      'IAS': 'Iași',
      'CND': 'Constanța',
      'SBZ': 'Sibiu',
      'CRA': 'Craiova',
      'BCM': 'Bacău',
      'BAY': 'Baia Mare',
      'OMR': 'Oradea',
      'SCV': 'Suceava',
      'TGM': 'Târgu Mureș',
      'ARW': 'Arad',
      'SUJ': 'Satu Mare',
      'RMO': 'Chișinău'
    }
    return airportNames[code] || code
  }
}

// Export singleton instance
export const historicalDatabaseManager = HistoricalDatabaseManager.getInstance()