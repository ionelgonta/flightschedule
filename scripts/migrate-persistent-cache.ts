/**
 * Migration Script - Migrate Existing Persistent Cache Data
 * Imports existing flights_cache.json data into the new Historical Database
 * Preserves all historical flight information without data loss
 * CRITICAL: Follows IATA airport mapping rules strictly
 */

const { historicalDatabaseManager } = require('../lib/historicalDatabaseManager')
const { persistentFlightCache } = require('../lib/persistentFlightCache')

interface LegacyCacheEntry {
  flightNumber: string
  airlineCode: string
  airlineName: string
  originCode: string
  originName: string
  destinationCode: string
  destinationName: string
  scheduledTime: string
  actualTime?: string
  estimatedTime?: string
  status: string
  delayMinutes: number
  airportCode: string
  type: 'arrivals' | 'departures'
  cachedAt: string
  source: string
}

interface MigrationStats {
  totalEntries: number
  migratedEntries: number
  skippedEntries: number
  errors: string[]
  airportBreakdown: { [airport: string]: number }
  dateRange: { oldest: Date | null; newest: Date | null }
}

// IATA airport codes - following airport mapping rules strictly
const SUPPORTED_AIRPORTS = [
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA',
  'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'
]

/**
 * Migration class for persistent cache data
 */
class PersistentCacheMigration {
  private stats: MigrationStats = {
    totalEntries: 0,
    migratedEntries: 0,
    skippedEntries: 0,
    errors: [],
    airportBreakdown: {},
    dateRange: { oldest: null, newest: null }
  }

  /**
   * Main migration function
   */
  async migrate(): Promise<MigrationStats> {
    console.log('[Migration] Starting persistent cache migration...')

    try {
      // Initialize the historical database
      await historicalDatabaseManager.initializeDatabase()
      console.log('[Migration] Historical database initialized')

      // Load existing persistent cache
      await persistentFlightCache.loadCache()
      console.log('[Migration] Persistent cache loaded')

      // Get cache statistics
      const cacheStats = await persistentFlightCache.getCacheStats()
      console.log(`[Migration] Found ${cacheStats.totalFlights} flights in persistent cache`)

      if (cacheStats.totalFlights === 0) {
        console.log('[Migration] No data to migrate')
        return this.stats
      }

      // Migrate data for each airport
      const airports = Object.keys(cacheStats.flightsByAirport)
      
      for (const airport of airports) {
        await this.migrateAirportData(airport)
      }

      // Create backup after successful migration
      console.log('[Migration] Creating post-migration backup...')
      const backupId = await historicalDatabaseManager.createBackup()
      console.log(`[Migration] Backup created: ${backupId}`)

      console.log('[Migration] Migration completed successfully')
      this.printMigrationSummary()

      return this.stats

    } catch (error) {
      console.error('[Migration] Migration failed:', error)
      this.stats.errors.push(`Migration failed: ${error}`)
      throw error
    }
  }

  /**
   * Migrate data for a specific airport
   */
  private async migrateAirportData(airportCode: string): Promise<void> {
    console.log(`[Migration] Migrating data for airport: ${airportCode}`)

    try {
      // Get all flight data for this airport
      const allFlights = await persistentFlightCache.getAllFlightData(airportCode)
      this.stats.totalEntries += allFlights.length

      for (const flight of allFlights) {
        try {
          await this.migrateSingleFlight(flight)
          this.stats.migratedEntries++
          
          // Update airport breakdown
          this.stats.airportBreakdown[airportCode] = 
            (this.stats.airportBreakdown[airportCode] || 0) + 1

          // Update date range
          const flightDate = new Date(flight.scheduledTime)
          if (!this.stats.dateRange.oldest || flightDate < this.stats.dateRange.oldest) {
            this.stats.dateRange.oldest = flightDate
          }
          if (!this.stats.dateRange.newest || flightDate > this.stats.dateRange.newest) {
            this.stats.dateRange.newest = flightDate
          }

        } catch (error) {
          console.error(`[Migration] Failed to migrate flight ${flight.flightNumber}:`, error)
          this.stats.errors.push(`Failed to migrate ${flight.flightNumber}: ${error}`)
          this.stats.skippedEntries++
        }
      }

      console.log(`[Migration] Completed migration for ${airportCode}: ${this.stats.airportBreakdown[airportCode] || 0} flights`)

    } catch (error) {
      console.error(`[Migration] Failed to migrate airport ${airportCode}:`, error)
      this.stats.errors.push(`Failed to migrate airport ${airportCode}: ${error}`)
    }
  }

  /**
   * Migrate a single flight entry - ONLY REAL FLIGHT DATA
   */
  private async migrateSingleFlight(flight: LegacyCacheEntry): Promise<void> {
    // Validate that this is real flight data (not mock/demo/test data)
    if (!this.isValidRealFlightData(flight)) {
      throw new Error(`Invalid or mock flight data detected: ${flight.flightNumber}`)
    }

    // Convert legacy cache entry to historical database format
    const flightRecord = {
      flightNumber: flight.flightNumber,
      airlineCode: flight.airlineCode,
      airlineName: flight.airlineName,
      route: `${flight.originCode}-${flight.destinationCode}`,
      originAirport: flight.originCode,
      destinationAirport: flight.destinationCode,
      scheduledTime: new Date(flight.scheduledTime),
      estimatedTime: flight.estimatedTime ? new Date(flight.estimatedTime) : undefined,
      actualTime: flight.actualTime ? new Date(flight.actualTime) : undefined,
      status: this.normalizeStatus(flight.status),
      isCodeshare: false, // Legacy cache doesn't track codeshare
      // Preserve original creation time from legacy cache
      createdAt: new Date(flight.cachedAt),
      updatedAt: new Date(flight.cachedAt)
    }

    // Use UPSERT to avoid duplicates
    await historicalDatabaseManager.upsertFlight(flightRecord)
  }

  /**
   * Validate that flight data is real (not mock/demo/test data)
   * Following cache management rules strictly
   */
  private isValidRealFlightData(flight: LegacyCacheEntry): boolean {
    // Check for mock/demo/test indicators
    if (flight.source && ['mock', 'demo', 'test', 'fake'].includes(flight.source.toLowerCase())) {
      console.log(`[Migration] Rejecting mock/demo flight: ${flight.flightNumber} (source: ${flight.source})`)
      return false
    }

    // Validate IATA airport codes (must be 3 letters)
    if (!flight.originCode || !flight.destinationCode || 
        flight.originCode.length !== 3 || flight.destinationCode.length !== 3) {
      console.log(`[Migration] Rejecting flight with invalid airport codes: ${flight.flightNumber}`)
      return false
    }

    // Validate IATA airport codes are in supported list
    if (!SUPPORTED_AIRPORTS.includes(flight.originCode) && !SUPPORTED_AIRPORTS.includes(flight.destinationCode)) {
      console.log(`[Migration] Rejecting flight with unsupported airports: ${flight.flightNumber} (${flight.originCode}-${flight.destinationCode})`)
      return false
    }

    // Validate flight number format (airline code + number)
    if (!flight.flightNumber || flight.flightNumber === 'N/A' || 
        !flight.flightNumber.match(/^[A-Z0-9]{2,3}\s*\d+$/)) {
      console.log(`[Migration] Rejecting flight with invalid flight number: ${flight.flightNumber}`)
      return false
    }

    // Validate airline code (must be 2-3 letters)
    if (!flight.airlineCode || flight.airlineCode.length < 2 || flight.airlineCode.length > 3) {
      console.log(`[Migration] Rejecting flight with invalid airline code: ${flight.flightNumber} (${flight.airlineCode})`)
      return false
    }

    // Validate scheduled time is reasonable (not too far in past/future)
    const scheduledTime = new Date(flight.scheduledTime)
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    if (scheduledTime < oneYearAgo || scheduledTime > oneYearFromNow) {
      console.log(`[Migration] Rejecting flight with unrealistic date: ${flight.flightNumber} (${flight.scheduledTime})`)
      return false
    }

    return true
  }

  /**
   * Normalize flight status to match new system
   */
  private normalizeStatus(status: string): any {
    const normalizedStatus = status.toLowerCase()
    const validStatuses = ['scheduled', 'delayed', 'boarding', 'departed', 'arrived', 'cancelled']
    
    if (validStatuses.includes(normalizedStatus)) {
      return normalizedStatus as any
    }
    
    // Map common variations
    const statusMap: { [key: string]: string } = {
      'canceled': 'cancelled',
      'on-time': 'scheduled',
      'ontime': 'scheduled',
      'estimated': 'scheduled'
    }
    
    return (statusMap[normalizedStatus] || 'scheduled') as any
  }

  /**
   * Print migration summary
   */
  private printMigrationSummary(): void {
    console.log('\n=== MIGRATION SUMMARY ===')
    console.log(`Total entries processed: ${this.stats.totalEntries}`)
    console.log(`Successfully migrated: ${this.stats.migratedEntries}`)
    console.log(`Skipped entries: ${this.stats.skippedEntries}`)
    console.log(`Errors: ${this.stats.errors.length}`)
    
    if (this.stats.dateRange.oldest && this.stats.dateRange.newest) {
      console.log(`Date range: ${this.stats.dateRange.oldest.toISOString()} to ${this.stats.dateRange.newest.toISOString()}`)
    }
    
    console.log('\nAirport breakdown:')
    Object.entries(this.stats.airportBreakdown).forEach(([airport, count]) => {
      console.log(`  ${airport}: ${count} flights`)
    })
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors encountered:')
      this.stats.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error}`)
      })
      if (this.stats.errors.length > 10) {
        console.log(`  ... and ${this.stats.errors.length - 10} more errors`)
      }
    }
    
    console.log('=========================\n')
  }

  /**
   * Validate migration results
   */
  async validateMigration(): Promise<boolean> {
    console.log('[Migration] Validating migration results...')

    try {
      // Get statistics from both systems
      const legacyStats = await persistentFlightCache.getCacheStats()
      const newStats = await historicalDatabaseManager.getDatabaseStats()

      console.log(`Legacy cache: ${legacyStats.totalFlights} flights`)
      console.log(`New database: ${newStats.totalFlights} flights`)

      // Check if migration was successful
      const migrationSuccess = newStats.totalFlights >= this.stats.migratedEntries

      if (migrationSuccess) {
        console.log('[Migration] ✅ Migration validation successful')
      } else {
        console.log('[Migration] ❌ Migration validation failed')
      }

      return migrationSuccess

    } catch (error) {
      console.error('[Migration] Validation failed:', error)
      return false
    }
  }
}

/**
 * Main migration execution function
 */
async function runMigration(): Promise<void> {
  const migration = new PersistentCacheMigration()
  
  try {
    console.log('🚀 Starting Persistent Cache Migration')
    console.log('=====================================')
    
    const stats = await migration.migrate()
    const isValid = await migration.validateMigration()
    
    if (isValid && stats.errors.length === 0) {
      console.log('✅ Migration completed successfully!')
      process.exit(0)
    } else {
      console.log('⚠️  Migration completed with warnings')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Export for use as module
module.exports = { PersistentCacheMigration, runMigration }

// Run migration if called directly
if (require.main === module) {
  runMigration()
}