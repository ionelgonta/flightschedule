/**
 * Flight Planner Service - Uses ONLY cached/database data
 * No external API calls - works with local data only
 */

import { getFlightRepository, CachedFlightData } from './flightRepository'
import { MAJOR_AIRPORTS } from './airports'
import { RawFlightData } from './flightApiService'
import { flightDatabase, StoredFlightData } from './flightDatabase'

export interface FlightPlannerFilters {
  departureDays: string[] // ['monday', 'tuesday', 'wednesday'] - preferred day ±1
  returnDays: string[] // ['saturday', 'sunday', 'monday'] - preferred day ±1
  departureTimeSlot: 'morning' | 'afternoon' | 'evening' // 06-12, 12-18, 18-24
  returnTimeSlot: 'morning' | 'afternoon' | 'evening'
  originAirports?: string[] // Optional: limit origin airports
}

export interface FlightOption {
  destination: {
    code: string
    name: string
    city: string
    country: string
  }
  outboundFlights: FlightMatch[]
  returnFlights: FlightMatch[]
  totalOptions: number
}

export interface FlightMatch {
  flightNumber: string
  airline: {
    name: string
    code: string
  }
  origin: {
    code: string
    name: string
    city: string
  }
  destination: {
    code: string
    name: string
    city: string
  }
  scheduledTime: string
  dayOfWeek: string
  timeSlot: 'morning' | 'afternoon' | 'evening'
  status: string
  gate?: string
  terminal?: string
}

export interface PlannerStats {
  totalAirportsScanned: number
  totalFlightsAnalyzed: number
  cacheHitRate: number
  lastUpdated: string
  availableDestinations: number
}

class FlightPlannerService {
  private flightRepository = getFlightRepository()
  private cachedFlightData: Map<string, CachedFlightData> = new Map()
  private lastCacheUpdate: Date | null = null

  /**
   * Load all cached flight data from all airports and store in database
   */
  async loadAllCachedData(): Promise<void> {
    console.log('Loading all cached flight data for planner...')
    
    // First collect data into our database
    await flightDatabase.collectCachedData()
    
    const promises = MAJOR_AIRPORTS.flatMap(airport => [
      this.loadAirportData(airport.code, 'arrivals'),
      this.loadAirportData(airport.code, 'departures')
    ])

    await Promise.allSettled(promises)
    this.lastCacheUpdate = new Date()
    
    console.log(`Loaded cached data for ${this.cachedFlightData.size} airport/type combinations`)
  }

  /**
   * Load cached data for a specific airport and type
   */
  private async loadAirportData(airportCode: string, type: 'arrivals' | 'departures'): Promise<void> {
    try {
      const response = await this.flightRepository.getArrivals(airportCode)
      if (response.success && response.data.length > 0) {
        const cacheKey = `${airportCode}_${type}`
        const cachedData: CachedFlightData = {
          airport_code: airportCode,
          type,
          data: response.data,
          updated_at: response.last_updated || new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
          success: true
        }
        this.cachedFlightData.set(cacheKey, cachedData)
      }
    } catch (error) {
      console.warn(`Could not load ${type} data for ${airportCode}:`, error)
    }
  }

  /**
   * Find flight options based on planner filters using database
   */
  async findFlightOptions(filters: FlightPlannerFilters): Promise<FlightOption[]> {
    // Ensure we have fresh cached data
    if (!this.lastCacheUpdate || Date.now() - this.lastCacheUpdate.getTime() > 30 * 60 * 1000) {
      await this.loadAllCachedData()
    }

    const options: FlightOption[] = []
    const destinationMap = new Map<string, FlightOption>()

    // Get origin airports (default to all Romanian airports)
    const originAirports = filters.originAirports || 
      MAJOR_AIRPORTS.filter(a => a.country === 'România').map(a => a.code)

    console.log(`Searching flights from ${originAirports.length} origin airports using database`)

    // Convert day names to numbers
    const departureDayNumbers = filters.departureDays.map(day => this.dayNameToNumber(day))
    const returnDayNumbers = filters.returnDays.map(day => this.dayNameToNumber(day))

    // Convert time slots to hour ranges
    const departureHours = this.timeSlotToHours(filters.departureTimeSlot)
    const returnHours = this.timeSlotToHours(filters.returnTimeSlot)

    // Get departures from database
    const departures = flightDatabase.getFlights({
      airportCodes: originAirports,
      type: 'departures',
      daysOfWeek: departureDayNumbers,
      hours: departureHours
    })

    console.log(`Found ${departures.length} matching departure flights in database`)

    // Group by destination
    for (const departure of departures) {
      const destCode = departure.flightData.destination.code
      
      // Skip if destination is same as origin
      if (destCode === departure.airportCode) continue

      // Find return flights for this destination
      const returnFlights = flightDatabase.getFlights({
        airportCodes: [destCode],
        type: 'arrivals',
        daysOfWeek: returnDayNumbers,
        hours: returnHours
      }).filter(f => f.flightData.destination.code === departure.airportCode) // Only flights back to our origin

      // Create or update destination option
      if (!destinationMap.has(destCode)) {
        const destAirport = MAJOR_AIRPORTS.find(a => a.code === destCode)
        if (!destAirport) continue

        destinationMap.set(destCode, {
          destination: {
            code: destCode,
            name: destAirport.name,
            city: destAirport.city,
            country: destAirport.country
          },
          outboundFlights: [],
          returnFlights: [],
          totalOptions: 0
        })
      }

      const option = destinationMap.get(destCode)!
      option.outboundFlights.push(this.convertStoredToFlightMatch(departure))
      option.returnFlights.push(...returnFlights.map(f => this.convertStoredToFlightMatch(f)))
      option.totalOptions = option.outboundFlights.length * Math.max(1, option.returnFlights.length)
    }

    // Convert map to array and sort by total options
    const sortedOptions = Array.from(destinationMap.values())
      .filter(option => option.outboundFlights.length > 0)
      .sort((a, b) => b.totalOptions - a.totalOptions)

    console.log(`Found ${sortedOptions.length} destination options from database`)
    return sortedOptions
  }

  /**
   * Filter flights by day and time preferences
   */
  private filterFlightsByPreferences(
    flights: RawFlightData[],
    preferredDays: string[],
    timeSlot: 'morning' | 'afternoon' | 'evening'
  ): RawFlightData[] {
    return flights.filter(flight => {
      const flightDate = new Date(flight.scheduled_time)
      const dayOfWeek = this.getDayOfWeek(flightDate)
      const flightTimeSlot = this.getTimeSlot(flightDate)

      // Check if flight day matches preferred days
      const dayMatches = preferredDays.some(day => 
        day.toLowerCase() === dayOfWeek.toLowerCase()
      )

      // Check if flight time slot matches preference
      const timeMatches = flightTimeSlot === timeSlot

      return dayMatches && timeMatches
    })
  }

  /**
   * Convert RawFlightData to FlightMatch
   */
  private convertToFlightMatch(flight: RawFlightData): FlightMatch {
    const flightDate = new Date(flight.scheduled_time)
    
    return {
      flightNumber: flight.flight_number,
      airline: flight.airline,
      origin: {
        code: flight.origin.code,
        name: flight.origin.airport,
        city: flight.origin.city
      },
      destination: {
        code: flight.destination.code,
        name: flight.destination.airport,
        city: flight.destination.city
      },
      scheduledTime: flight.scheduled_time,
      dayOfWeek: this.getDayOfWeek(flightDate),
      timeSlot: this.getTimeSlot(flightDate),
      status: flight.status,
      gate: flight.gate,
      terminal: flight.terminal
    }
  }

  /**
   * Get day of week from date
   */
  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  /**
   * Get time slot from date
   */
  private getTimeSlot(date: Date): 'morning' | 'afternoon' | 'evening' {
    const hour = date.getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    return 'evening'
  }

  /**
   * Get expanded day list (preferred day ±1)
   */
  static getExpandedDays(preferredDay: string): string[] {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayIndex = days.indexOf(preferredDay.toLowerCase())
    
    if (dayIndex === -1) return [preferredDay]

    const prevDay = days[(dayIndex - 1 + 7) % 7]
    const nextDay = days[(dayIndex + 1) % 7]

    return [prevDay, preferredDay, nextDay]
  }

  /**
   * Get planner statistics
   */
  async getPlannerStats(): Promise<PlannerStats> {
    const cacheStats = this.flightRepository.getCacheStats()
    
    let totalFlights = 0
    let availableDestinations = new Set<string>()

    this.cachedFlightData.forEach(data => {
      totalFlights += data.data.length
      data.data.forEach(flight => {
        availableDestinations.add(flight.destination.code)
      })
    })

    return {
      totalAirportsScanned: MAJOR_AIRPORTS.length,
      totalFlightsAnalyzed: totalFlights,
      cacheHitRate: cacheStats.hitRate,
      lastUpdated: this.lastCacheUpdate?.toISOString() || new Date().toISOString(),
      availableDestinations: availableDestinations.size
    }
  }



  /**
   * Force refresh cached data
   */
  async refreshCachedData(): Promise<void> {
    this.cachedFlightData.clear()
    await this.loadAllCachedData()
  }

  /**
   * Get available destinations from database
   */
  async getAvailableDestinations(): Promise<Array<{code: string, name: string, city: string, country: string, flightCount: number}>> {
    if (!this.lastCacheUpdate) {
      await this.loadAllCachedData()
    }

    return flightDatabase.getDestinations()
  }

  /**
   * Convert day name to number
   */
  private dayNameToNumber(dayName: string): number {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days.indexOf(dayName.toLowerCase())
  }

  /**
   * Convert time slot to hour array
   */
  private timeSlotToHours(timeSlot: 'morning' | 'afternoon' | 'evening'): number[] {
    switch (timeSlot) {
      case 'morning': return [6, 7, 8, 9, 10, 11]
      case 'afternoon': return [12, 13, 14, 15, 16, 17]
      case 'evening': return [18, 19, 20, 21, 22, 23]
      default: return []
    }
  }

  /**
   * Convert StoredFlightData to FlightMatch
   */
  private convertStoredToFlightMatch(storedFlight: StoredFlightData): FlightMatch {
    const flight = storedFlight.flightData
    const flightDate = new Date(flight.scheduled_time)
    
    return {
      flightNumber: flight.flight_number,
      airline: flight.airline,
      origin: {
        code: flight.origin.code,
        name: flight.origin.airport,
        city: flight.origin.city
      },
      destination: {
        code: flight.destination.code,
        name: flight.destination.airport,
        city: flight.destination.city
      },
      scheduledTime: flight.scheduled_time,
      dayOfWeek: this.getDayOfWeek(flightDate),
      timeSlot: this.getTimeSlot(flightDate),
      status: flight.status,
      gate: flight.gate,
      terminal: flight.terminal
    }
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    return flightDatabase.getStats()
  }

  /**
   * Export database data
   */
  exportDatabaseJSON(): string {
    return flightDatabase.exportJSON()
  }

  /**
   * Export database as CSV
   */
  exportDatabaseCSV(): string {
    return flightDatabase.exportCSV()
  }
}

// Export singleton instance
export const flightPlannerService = new FlightPlannerService()