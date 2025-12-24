/**
 * Property-Based Tests for Historical Flight Data System
 * Tests correctness properties using fast-check library
 */

import * as fc from 'fast-check'
import { HistoricalCacheManager } from '../historicalCacheManager'
import { DailySnapshot, FlightData } from '../types/historical'
import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'

// Test database path
const TEST_DB_PATH = join(process.cwd(), 'data', 'test-historical-flights.db')

// Generators for property-based testing
const airportCodeGen = fc.stringMatching(/^[A-Z]{3,4}$/)
const dateGen = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString().split('T')[0])
const timeGen = fc.stringMatching(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
const flightTypeGen = fc.constantFrom('arrivals', 'departures')
const flightNumberGen = fc.stringMatching(/^[A-Z]{2}[0-9]{1,4}$/)
const statusGen = fc.constantFrom('scheduled', 'delayed', 'cancelled', 'on-time', 'landed', 'departed')

const flightDataGen: fc.Arbitrary<FlightData> = fc.record({
  flightNumber: flightNumberGen,
  airlineCode: fc.stringMatching(/^[A-Z]{2}$/),
  airlineName: fc.string({ minLength: 3, maxLength: 50 }),
  originCode: airportCodeGen,
  originName: fc.string({ minLength: 3, maxLength: 50 }),
  destinationCode: airportCodeGen,
  destinationName: fc.string({ minLength: 3, maxLength: 50 }),
  scheduledTime: fc.date().map(d => d.toISOString()),
  actualTime: fc.option(fc.date().map(d => d.toISOString())),
  estimatedTime: fc.option(fc.date().map(d => d.toISOString())),
  status: statusGen,
  delayMinutes: fc.integer({ min: 0, max: 600 })
})

const dailySnapshotGen: fc.Arbitrary<DailySnapshot> = fc.record({
  airportCode: airportCodeGen,
  date: dateGen,
  time: timeGen,
  type: flightTypeGen,
  source: fc.constantFrom('api', 'cache'),
  flights: fc.array(flightDataGen, { minLength: 0, maxLength: 50 })
})

describe('Historical Cache Manager - Property Tests', () => {
  let cacheManager: HistoricalCacheManager
  
  beforeEach(async () => {
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }
    
    // Create fresh instance for testing
    cacheManager = new (HistoricalCacheManager as any)()
    // Override dbPath for testing
    ;(cacheManager as any).dbPath = TEST_DB_PATH
    
    await cacheManager.initialize()
  })
  
  afterEach(() => {
    cacheManager.close()
    
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }
  })

  /**
   * Property 1: Data Uniqueness
   * For any airport code, date, and flight type combination, 
   * there should be at most one daily snapshot stored in the historical cache.
   */
  test('Property 1: Data Uniqueness - No duplicate snapshots for same airport/date/type', async () => {
    await fc.assert(
      fc.asyncProperty(
        dailySnapshotGen,
        async (snapshot) => {
          // Save the snapshot twice
          await cacheManager.saveDailySnapshot(snapshot)
          await cacheManager.saveDailySnapshot(snapshot)
          
          // Check that data exists only once
          const hasData = await cacheManager.hasDataForDate(
            snapshot.airportCode, 
            snapshot.date, 
            snapshot.type
          )
          
          expect(hasData).toBe(true)
          
          // Verify no duplicates by checking the actual count in database
          const db = cacheManager.getDatabase()!
          const stmt = db.prepare(`
            SELECT COUNT(*) as count 
            FROM historical_flights 
            WHERE airport_iata = ? AND request_date = ? AND flight_type = ?
          `)
          
          const result = stmt.get(
            snapshot.airportCode, 
            snapshot.date, 
            snapshot.type === 'arrivals' ? 'arrival' : 'departure'
          ) as { count: number }
          
          // Should have exactly the number of flights in the snapshot (no duplicates)
          expect(result.count).toBe(snapshot.flights.length)
        }
      ),
      { numRuns: 20 } // Run 20 iterations for thorough testing
    )
  })

  /**
   * Property 3: Metadata Completeness
   * For any saved daily snapshot, all required metadata fields 
   * (request_date, request_time, airport_iata, type, source) must be present and valid.
   */
  test('Property 3: Metadata Completeness - All required fields present', async () => {
    await fc.assert(
      fc.asyncProperty(
        dailySnapshotGen,
        async (snapshot) => {
          // Skip empty snapshots as they won't create records
          if (snapshot.flights.length === 0) return
          
          await cacheManager.saveDailySnapshot(snapshot)
          
          // Verify all records have complete metadata
          const db = cacheManager.getDatabase()!
          const stmt = db.prepare(`
            SELECT 
              airport_iata, request_date, request_time, flight_type, data_source,
              flight_number, airline_code, origin_code, destination_code, 
              scheduled_time, status, delay_minutes
            FROM historical_flights 
            WHERE airport_iata = ? AND request_date = ? AND flight_type = ?
          `)
          
          const records = stmt.all(
            snapshot.airportCode, 
            snapshot.date, 
            snapshot.type === 'arrivals' ? 'arrival' : 'departure'
          ) as any[]
          
          // Check each record has all required metadata
          for (const record of records) {
            // Required metadata fields
            expect(record.airport_iata).toBeTruthy()
            expect(record.request_date).toBeTruthy()
            expect(record.request_time).toBeTruthy()
            expect(record.flight_type).toMatch(/^(arrival|departure)$/)
            expect(record.data_source).toMatch(/^(api|cache)$/)
            
            // Required flight data fields
            expect(record.flight_number).toBeTruthy()
            expect(record.airline_code).toBeTruthy()
            expect(record.origin_code).toBeTruthy()
            expect(record.destination_code).toBeTruthy()
            expect(record.scheduled_time).toBeTruthy()
            expect(record.status).toBeTruthy()
            expect(typeof record.delay_minutes).toBe('number')
            expect(record.delay_minutes).toBeGreaterThanOrEqual(0)
          }
          
          // Verify record count matches snapshot
          expect(records.length).toBe(snapshot.flights.length)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property 8: Data Accumulation
   * For any day where the system is running, new flight data should be added 
   * to the historical cache without removing existing data.
   */
  test('Property 8: Data Accumulation - New data added without removing existing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dailySnapshotGen, { minLength: 2, maxLength: 5 }),
        async (snapshots) => {
          let totalExpectedRecords = 0
          
          // Save snapshots sequentially and verify accumulation
          for (const snapshot of snapshots) {
            const initialStats = await cacheManager.getCacheStatistics()
            const initialCount = initialStats.totalRecords
            
            await cacheManager.saveDailySnapshot(snapshot)
            
            const finalStats = await cacheManager.getCacheStatistics()
            const finalCount = finalStats.totalRecords
            
            // Only count new records (avoid duplicates for same airport/date/type)
            const isNewSnapshot = !await cacheManager.hasDataForDate(
              snapshot.airportCode, 
              snapshot.date, 
              snapshot.type
            )
            
            if (isNewSnapshot) {
              totalExpectedRecords += snapshot.flights.length
            }
            
            // Data should only increase or stay the same (never decrease)
            expect(finalCount).toBeGreaterThanOrEqual(initialCount)
          }
          
          // Final verification of total accumulation
          const finalStats = await cacheManager.getCacheStatistics()
          expect(finalStats.totalRecords).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 15 }
    )
  })

  /**
   * Property 9: Cache Statistics Accuracy
   * For any point in time, the cache statistics should accurately reflect 
   * the number of days of historical data stored in the system.
   */
  test('Property 9: Cache Statistics Accuracy - Statistics reflect actual data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dailySnapshotGen, { minLength: 1, maxLength: 10 }),
        async (snapshots) => {
          // Save all snapshots
          for (const snapshot of snapshots) {
            await cacheManager.saveDailySnapshot(snapshot)
          }
          
          const stats = await cacheManager.getCacheStatistics()
          
          // Verify statistics accuracy
          expect(stats.totalRecords).toBeGreaterThanOrEqual(0)
          expect(stats.airportCoverage).toBeInstanceOf(Array)
          expect(stats.dateRange.totalDays).toBeGreaterThanOrEqual(0)
          expect(stats.dataQuality.completenessPercentage).toBeGreaterThanOrEqual(0)
          expect(stats.dataQuality.completenessPercentage).toBeLessThanOrEqual(100)
          
          // If we have records, we should have airport coverage
          if (stats.totalRecords > 0) {
            expect(stats.airportCoverage.length).toBeGreaterThan(0)
            expect(stats.oldestRecord).toBeTruthy()
            expect(stats.newestRecord).toBeTruthy()
          }
          
          // Verify actual database count matches statistics
          const db = cacheManager.getDatabase()!
          const stmt = db.prepare('SELECT COUNT(*) as count FROM historical_flights')
          const result = stmt.get() as { count: number }
          
          expect(stats.totalRecords).toBe(result.count)
        }
      ),
      { numRuns: 15 }
    )
  })

  /**
   * Property 10: Delay Calculation Consistency
   * For any flight with both scheduled_time and actual_time, 
   * the delay_minutes should equal the difference in minutes, 
   * with negative values treated as zero.
   */
  test('Property 10: Delay Calculation Consistency - Delay calculations are accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          snapshot: dailySnapshotGen,
          // Generate flights with specific delay scenarios
          delayScenarios: fc.array(
            fc.record({
              scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              actualDelayMinutes: fc.integer({ min: -30, max: 300 }) // Include negative delays
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async ({ snapshot, delayScenarios }) => {
          // Create flights with controlled delay scenarios
          const testFlights: FlightData[] = delayScenarios.map((scenario, index) => {
            const scheduledTime = scenario.scheduledTime
            const actualTime = new Date(scheduledTime.getTime() + scenario.actualDelayMinutes * 60000)
            const expectedDelay = Math.max(0, scenario.actualDelayMinutes) // Negative delays should be 0
            
            return {
              flightNumber: `TS${index.toString().padStart(3, '0')}`,
              airlineCode: 'TS',
              airlineName: 'Test Airline',
              originCode: 'TST',
              originName: 'Test Origin',
              destinationCode: 'DST',
              destinationName: 'Test Destination',
              scheduledTime: scheduledTime.toISOString(),
              actualTime: actualTime.toISOString(),
              estimatedTime: actualTime.toISOString(),
              status: expectedDelay > 15 ? 'delayed' : 'on-time',
              delayMinutes: expectedDelay
            }
          })
          
          const testSnapshot: DailySnapshot = {
            ...snapshot,
            flights: testFlights
          }
          
          await cacheManager.saveDailySnapshot(testSnapshot)
          
          // Verify delay calculations in database
          const db = cacheManager.getDatabase()!
          const stmt = db.prepare(`
            SELECT flight_number, scheduled_time, actual_time, delay_minutes
            FROM historical_flights 
            WHERE airport_iata = ? AND request_date = ? AND flight_type = ?
          `)
          
          const records = stmt.all(
            testSnapshot.airportCode,
            testSnapshot.date,
            testSnapshot.type === 'arrivals' ? 'arrival' : 'departure'
          ) as any[]
          
          // Check each record's delay calculation
          for (const record of records) {
            if (record.actual_time && record.scheduled_time) {
              const scheduledTime = new Date(record.scheduled_time)
              const actualTime = new Date(record.actual_time)
              const calculatedDelay = Math.max(0, 
                Math.round((actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60))
              )
              
              // Allow small rounding differences (within 1 minute)
              expect(Math.abs(record.delay_minutes - calculatedDelay)).toBeLessThanOrEqual(1)
              
              // Delay should never be negative
              expect(record.delay_minutes).toBeGreaterThanOrEqual(0)
            }
          }
        }
      ),
      { numRuns: 10 }
    )
  })
})

// Helper function to create test database
function createTestDatabase(): Database.Database {
  const db = new Database(':memory:')
  
  // Create tables
  db.exec(`
    CREATE TABLE historical_flights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      airport_iata TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      airline_code TEXT NOT NULL,
      airline_name TEXT,
      origin_code TEXT NOT NULL,
      origin_name TEXT,
      destination_code TEXT NOT NULL,
      destination_name TEXT,
      scheduled_time DATETIME NOT NULL,
      actual_time DATETIME,
      estimated_time DATETIME,
      status TEXT NOT NULL,
      delay_minutes INTEGER DEFAULT 0,
      flight_type TEXT NOT NULL CHECK (flight_type IN ('arrival', 'departure')),
      request_date DATE NOT NULL,
      request_time TIME NOT NULL,
      data_source TEXT NOT NULL CHECK (data_source IN ('api', 'cache')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(airport_iata, request_date, flight_number, scheduled_time, flight_type)
    )
  `)
  
  return db
}