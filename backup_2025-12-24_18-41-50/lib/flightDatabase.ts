/**
 * Flight Database Service - Local storage and management of flight data
 * Collects and stores cached flight data for the flight planner
 */

import { RawFlightData } from './flightApiService'
import { MAJOR_AIRPORTS } from './airports'

export interface StoredFlightData {
  id: string
  airportCode: string
  type: 'arrivals' | 'departures'
  flightData: RawFlightData
  timestamp: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  hour: number // 0-23
  date: string // YYYY-MM-DD
}

export interface FlightDatabaseStats {
  totalFlights: number
  airportsWithData: number
  dateRange: {
    earliest: string
    latest: string
  }
  flightsByAirport: Record<string, number>
  flightsByDay: Record<string, number>
  lastUpdated: string
}

class FlightDatabase {
  private readonly STORAGE_KEY = 'flight_planner_database'
  private readonly MAX_AGE_DAYS = 90 // Keep data for 90 days
  private database: StoredFlightData[] = []
  private lastLoaded: Date | null = null

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Load database from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.database = data.flights || []
        this.lastLoaded = new Date()
        
        // Clean old data on load
        this.cleanOldData()
        
        console.log(`Loaded ${this.database.length} flights from database`)
      }
    } catch (error) {
      console.error('Error loading flight database:', error)
      this.database = []
    }
  }

  /**
   * Save database to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        flights: this.database,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving flight database:', error)
    }
  }

  /**
   * Clean old data (older than MAX_AGE_DAYS)
   */
  private cleanOldData(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_AGE_DAYS)
    
    const initialCount = this.database.length
    this.database = this.database.filter(flight => 
      new Date(flight.timestamp) > cutoffDate
    )
    
    const cleanedCount = initialCount - this.database.length
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} old flights from database`)
      this.saveToStorage()
    }
  }

  /**
   * Add flight data from cache to database
   */
  addFlightData(airportCode: string, type: 'arrivals' | 'departures', flights: RawFlightData[]): void {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    flights.forEach(flight => {
      const flightDate = new Date(flight.scheduled_time)
      const id = `${airportCode}_${type}_${flight.flight_number}_${flight.scheduled_time}`
      
      // Check if flight already exists
      const existingIndex = this.database.findIndex(f => f.id === id)
      
      const storedFlight: StoredFlightData = {
        id,
        airportCode,
        type,
        flightData: flight,
        timestamp: now.toISOString(),
        dayOfWeek: flightDate.getDay(),
        hour: flightDate.getHours(),
        date: flightDate.toISOString().split('T')[0]
      }

      if (existingIndex >= 0) {
        // Update existing flight
        this.database[existingIndex] = storedFlight
      } else {
        // Add new flight
        this.database.push(storedFlight)
      }
    })

    this.saveToStorage()
    console.log(`Added/updated ${flights.length} flights for ${airportCode} ${type}`)
  }

  /**
   * Collect all cached data from flight repository
   */
  async collectCachedData(): Promise<void> {
    console.log('Collecting cached flight data for database...')
    
    // Import flight repository dynamically to avoid circular dependencies
    const { getFlightRepository } = await import('./flightRepository')
    const flightRepository = getFlightRepository()

    let totalCollected = 0

    for (const airport of MAJOR_AIRPORTS) {
      try {
        // Get arrivals
        const arrivalsResponse = await flightRepository.getArrivals(airport.code)
        if (arrivalsResponse.success && arrivalsResponse.data.length > 0) {
          this.addFlightData(airport.code, 'arrivals', arrivalsResponse.data)
          totalCollected += arrivalsResponse.data.length
        }

        // Get departures
        const departuresResponse = await flightRepository.getDepartures(airport.code)
        if (departuresResponse.success && departuresResponse.data.length > 0) {
          this.addFlightData(airport.code, 'departures', departuresResponse.data)
          totalCollected += departuresResponse.data.length
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.warn(`Error collecting data for ${airport.code}:`, error)
      }
    }

    console.log(`Collected ${totalCollected} total flights into database`)
  }

  /**
   * Get flights by criteria
   */
  getFlights(criteria: {
    airportCodes?: string[]
    type?: 'arrivals' | 'departures'
    daysOfWeek?: number[]
    hours?: number[]
    dateRange?: { start: string, end: string }
  }): StoredFlightData[] {
    let results = this.database

    if (criteria.airportCodes) {
      results = results.filter(f => criteria.airportCodes!.includes(f.airportCode))
    }

    if (criteria.type) {
      results = results.filter(f => f.type === criteria.type)
    }

    if (criteria.daysOfWeek) {
      results = results.filter(f => criteria.daysOfWeek!.includes(f.dayOfWeek))
    }

    if (criteria.hours) {
      results = results.filter(f => criteria.hours!.includes(f.hour))
    }

    if (criteria.dateRange) {
      results = results.filter(f => 
        f.date >= criteria.dateRange!.start && f.date <= criteria.dateRange!.end
      )
    }

    return results
  }

  /**
   * Get all unique destinations from departures
   */
  getDestinations(originAirports?: string[]): Array<{
    code: string
    name: string
    city: string
    country: string
    flightCount: number
  }> {
    const departures = this.database.filter(f => 
      f.type === 'departures' && 
      (!originAirports || originAirports.includes(f.airportCode))
    )

    const destinationCounts = new Map<string, number>()
    
    departures.forEach(flight => {
      const destCode = flight.flightData.destination.code
      destinationCounts.set(destCode, (destinationCounts.get(destCode) || 0) + 1)
    })

    const destinations = Array.from(destinationCounts.entries())
      .map(([code, count]) => {
        const airport = MAJOR_AIRPORTS.find(a => a.code === code)
        return airport ? {
          code,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          flightCount: count
        } : null
      })
      .filter(Boolean)
      .sort((a, b) => b!.flightCount - a!.flightCount)

    return destinations as Array<{
      code: string
      name: string
      city: string
      country: string
      flightCount: number
    }>
  }

  /**
   * Get database statistics
   */
  getStats(): FlightDatabaseStats {
    const airportsWithData = new Set(this.database.map(f => f.airportCode)).size
    const flightsByAirport: Record<string, number> = {}
    const flightsByDay: Record<string, number> = {}

    let earliest = ''
    let latest = ''

    this.database.forEach(flight => {
      // Count by airport
      flightsByAirport[flight.airportCode] = (flightsByAirport[flight.airportCode] || 0) + 1
      
      // Count by day of week
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][flight.dayOfWeek]
      flightsByDay[dayName] = (flightsByDay[dayName] || 0) + 1
      
      // Track date range
      if (!earliest || flight.date < earliest) earliest = flight.date
      if (!latest || flight.date > latest) latest = flight.date
    })

    return {
      totalFlights: this.database.length,
      airportsWithData,
      dateRange: { earliest, latest },
      flightsByAirport,
      flightsByDay,
      lastUpdated: this.lastLoaded?.toISOString() || new Date().toISOString()
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.database = []
    this.saveToStorage()
    console.log('Flight database cleared')
  }

  /**
   * Export data as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      flights: this.database,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Export data as CSV
   */
  exportCSV(): string {
    const headers = [
      'ID', 'Airport Code', 'Type', 'Flight Number', 'Airline Code', 'Airline Name',
      'Origin Code', 'Origin City', 'Destination Code', 'Destination City',
      'Scheduled Time', 'Status', 'Day of Week', 'Hour', 'Date', 'Timestamp'
    ]

    const rows = this.database.map(flight => [
      flight.id,
      flight.airportCode,
      flight.type,
      flight.flightData.flight_number,
      flight.flightData.airline.code,
      flight.flightData.airline.name,
      flight.flightData.origin.code,
      flight.flightData.origin.city,
      flight.flightData.destination.code,
      flight.flightData.destination.city,
      flight.flightData.scheduled_time,
      flight.flightData.status,
      flight.dayOfWeek,
      flight.hour,
      flight.date,
      flight.timestamp
    ])

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  /**
   * Get size of database in MB
   */
  getSize(): number {
    const jsonString = JSON.stringify(this.database)
    return new Blob([jsonString]).size / (1024 * 1024)
  }
}

// Export singleton instance
export const flightDatabase = new FlightDatabase()