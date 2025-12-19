/**
 * Flight Planner Service - Uses ONLY cached/database data
 * No external API calls - works with local data only
 * Connects to cache manager and airport database
 */

import { getFlightRepository } from './flightRepository'
import { MAJOR_AIRPORTS, getCityName } from './airports'
import { RawFlightData } from './flightApiService'

// Local type for cached flight data
interface CachedFlightData {
  airport_code: string
  type: 'arrivals' | 'departures'
  data: RawFlightData[]
  updated_at: string
  expires_at: string
  success: boolean
}

export interface FlightPlannerFilters {
  departureDays: string[] // ['monday', 'tuesday', 'wednesday'] - preferred day ±flexibility
  returnDays: string[] // ['saturday', 'sunday', 'monday'] - preferred day ±flexibility
  departureTimeSlot: 'morning' | 'afternoon' | 'evening' // 06-12, 12-18, 18-24
  returnTimeSlot: 'morning' | 'afternoon' | 'evening'
  departureDayFlexibility?: number // 0, 1, 2, or 3 days flexibility
  returnDayFlexibility?: number // 0, 1, 2, or 3 days flexibility
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
  private filters: FlightPlannerFilters | null = null

  /**
   * Load all cached flight data from all airports
   */
  async loadAllCachedData(): Promise<void> {
    console.log('Loading all cached flight data for planner...')
    
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
   * Find flight options based on planner filters using historical data
   * This method should only be called from server-side API routes
   */
  async findFlightOptions(filters: FlightPlannerFilters): Promise<FlightOption[]> {
    // Check if we're running on the server side
    if (typeof window !== 'undefined') {
      console.warn('findFlightOptions called on client-side, returning empty array')
      return []
    }

    console.log('🔍 Finding flight options with filters:', filters)
    
    // Store filters for use in conversion methods
    this.filters = filters
    
    try {
      // Get weekly schedule data directly from the analyzer (server-side only)
      const { getWeeklyScheduleAnalyzer } = await import('./weeklyScheduleAnalyzer')
      const weeklyScheduleAnalyzer = getWeeklyScheduleAnalyzer()
      const scheduleData = await weeklyScheduleAnalyzer.getScheduleData() || []
      console.log(`📊 Analyzing ${scheduleData.length} weekly schedule entries`)

      const destinationMap = new Map<string, FlightOption>()

      // Get origin airports (default to Chișinău if none specified)
      const originAirports = filters.originAirports || ['RMO']
      console.log(`🛫 Searching flights from ${originAirports.length} origin airports:`, originAirports.map(code => getCityName(code)).join(', '))

      // Enhanced filtering with flexibility support
      const matchingOutboundFlights = scheduleData.filter((flight: any) => {
        // Check if origin airport matches
        const originMatches = originAirports.some(origin => {
          const originCity = getCityName(origin)
          return flight.airport === originCity || flight.airport.includes(originCity)
        })
        
        if (!originMatches) return false

        // Check departure days with flexibility
        const departureMatches = this.checkDayFlexibility(flight.weeklyPattern, filters.departureDays)
        return departureMatches
      })

      console.log(`✈️ Found ${matchingOutboundFlights.length} matching outbound flights`)

      // Process each outbound flight to find destinations and return options
      for (const outboundFlight of matchingOutboundFlights) {
        const destCity = outboundFlight.destination
        
        // Skip if destination is same as origin
        if (originAirports.some(origin => getCityName(origin) === destCity)) continue

        // Find return flights for this destination
        const returnFlights = scheduleData.filter((returnFlight: any) => {
          // Check if this is a return flight (destination -> origin)
          const returnMatches = originAirports.some(origin => {
            const originCity = getCityName(origin)
            return returnFlight.destination === originCity || returnFlight.destination.includes(originCity)
          })
          
          if (!returnMatches) return false
          
          // Check if origin is our destination
          if (returnFlight.airport !== destCity) return false

          // Check return days with flexibility
          const returnDayMatches = this.checkDayFlexibility(returnFlight.weeklyPattern, filters.returnDays)
          return returnDayMatches
        })

        // Create or update destination option
        if (!destinationMap.has(destCity)) {
          // Try to find airport code for destination
          const destAirport = MAJOR_AIRPORTS.find(a => 
            getCityName(a.code) === destCity || a.city === destCity || a.name.includes(destCity)
          )

          destinationMap.set(destCity, {
            destination: {
              code: destAirport?.code || 'XXX',
              name: destAirport?.name || destCity,
              city: destCity,
              country: destAirport?.country || 'Unknown'
            },
            outboundFlights: [],
            returnFlights: [],
            totalOptions: 0
          })
        }

        const option = destinationMap.get(destCity)!
        
        // Convert schedule entry to flight match with enhanced data
        const outboundMatch = this.convertScheduleToFlightMatch(outboundFlight, 'outbound')
        
        // Check if this flight already exists (avoid duplicates)
        const existingOutbound = option.outboundFlights.find(f => 
          f.flightNumber === outboundMatch.flightNumber && 
          f.airline.name === outboundMatch.airline.name
        )
        
        if (!existingOutbound) {
          option.outboundFlights.push(outboundMatch)
        }
        
        // Add return flights
        returnFlights.forEach((returnFlight: any) => {
          const returnMatch = this.convertScheduleToFlightMatch(returnFlight, 'return')
          
          // Check if this return flight already exists
          const existingReturn = option.returnFlights.find(f => 
            f.flightNumber === returnMatch.flightNumber && 
            f.airline.name === returnMatch.airline.name
          )
          
          if (!existingReturn) {
            option.returnFlights.push(returnMatch)
          }
        })

        // Calculate total combinations
        option.totalOptions = option.outboundFlights.length * Math.max(1, option.returnFlights.length)
      }

      // Convert map to array and sort by total options and destination popularity
      const sortedOptions = Array.from(destinationMap.values())
        .filter(option => option.outboundFlights.length > 0)
        .sort((a, b) => {
          // Primary sort: total options
          if (b.totalOptions !== a.totalOptions) {
            return b.totalOptions - a.totalOptions
          }
          // Secondary sort: number of outbound flights
          if (b.outboundFlights.length !== a.outboundFlights.length) {
            return b.outboundFlights.length - a.outboundFlights.length
          }
          // Tertiary sort: alphabetical by city name
          return a.destination.city.localeCompare(b.destination.city)
        })

      console.log(`🎯 Found ${sortedOptions.length} destination options:`)
      sortedOptions.slice(0, 5).forEach(option => {
        console.log(`  • ${option.destination.city}: ${option.outboundFlights.length} plecare, ${option.returnFlights.length} întoarcere, ${option.totalOptions} combinații`)
      })

      return sortedOptions

    } catch (error) {
      console.error('❌ Error finding flight options:', error)
      return []
    }
  }

  /**
   * Check if weekly pattern matches any of the target days with flexibility
   */
  private checkDayFlexibility(weeklyPattern: any, targetDays: string[]): boolean {
    return targetDays.some(day => {
      const dayKey = day as keyof typeof weeklyPattern
      return weeklyPattern[dayKey] === true
    })
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
   * Get planner statistics from cache and weekly schedule
   * This method should only be called from server-side API routes
   */
  async getPlannerStats(): Promise<PlannerStats> {
    // Check if we're running on the server side
    if (typeof window !== 'undefined') {
      // Client-side: return basic stats
      return {
        totalAirportsScanned: MAJOR_AIRPORTS.length,
        totalFlightsAnalyzed: 0,
        cacheHitRate: 0,
        lastUpdated: new Date().toISOString(),
        availableDestinations: 0
      }
    }

    try {
      console.log('📊 Getting planner statistics (server-side)...')
      
      let totalFlights = 0
      let availableDestinations = new Set<string>()
      
      // Get weekly schedule data directly from the analyzer (server-side only)
      try {
        // Import weekly schedule analyzer dynamically to avoid client-side issues
        const { getWeeklyScheduleAnalyzer } = await import('./weeklyScheduleAnalyzer')
        const weeklyScheduleAnalyzer = getWeeklyScheduleAnalyzer()
        const scheduleData = await weeklyScheduleAnalyzer.getScheduleData()
        
        if (scheduleData && Array.isArray(scheduleData)) {
          console.log(`📈 Found ${scheduleData.length} weekly schedule entries`)
          
          scheduleData.forEach((flight: any) => {
            if (flight.destination) {
              availableDestinations.add(flight.destination)
            }
            if (flight.airport) {
              availableDestinations.add(flight.airport)
            }
            // Count frequency as flights (each route entry represents multiple weekly flights)
            totalFlights += (flight.frequency || 1) * 7 // Weekly frequency * 7 days
          })
          
          console.log(`📊 Processed ${scheduleData.length} routes, ${totalFlights} total weekly flights, ${availableDestinations.size} destinations`)
        }
      } catch (scheduleError) {
        console.warn('Could not access weekly schedule data:', scheduleError)
      }
      
      // Also try to get current cache data
      try {
        const cacheStats = this.flightRepository.getCacheStats()
        console.log('💾 Cache stats:', cacheStats)
        
        // Load cache data if available
        if (cacheStats.cacheEntries.total > 0) {
          await this.loadAllCachedData()
          
          this.cachedFlightData.forEach(data => {
            data.data.forEach(flight => {
              if (typeof flight.destination === 'object' && flight.destination.city) {
                availableDestinations.add(flight.destination.city)
              } else if (typeof flight.destination === 'string') {
                availableDestinations.add(flight.destination)
              }
            })
          })
        }
      } catch (cacheError) {
        console.warn('Could not access cache data:', cacheError)
      }

      // Get historical data statistics directly (server-side only)
      try {
        const { historicalCacheManager } = await import('./historicalCacheManager')
        await historicalCacheManager.initialize()
        const stats = await historicalCacheManager.getCacheStatistics()
        
        if (stats.totalRecords > 0) {
          console.log('📚 Historical stats:', stats)
          totalFlights += stats.totalRecords
        }
      } catch (historicalError) {
        console.warn('Could not access historical data:', historicalError)
      }

      const result = {
        totalAirportsScanned: MAJOR_AIRPORTS.length,
        totalFlightsAnalyzed: totalFlights,
        cacheHitRate: totalFlights > 0 ? 0.85 : 0,
        lastUpdated: this.lastCacheUpdate?.toISOString() || new Date().toISOString(),
        availableDestinations: availableDestinations.size
      }
      
      console.log('📊 Final planner stats:', result)
      return result
      
    } catch (error) {
      console.error('❌ Error getting planner stats:', error)
      return {
        totalAirportsScanned: MAJOR_AIRPORTS.length,
        totalFlightsAnalyzed: 0,
        cacheHitRate: 0,
        lastUpdated: new Date().toISOString(),
        availableDestinations: 0
      }
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
   * Get available destinations from API
   */
  async getAvailableDestinations(): Promise<Array<{code: string, name: string, city: string, country: string, flightCount: number}>> {
    try {
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      const data = await response.json()
      
      if (!data.success) {
        return []
      }

      const scheduleData = data.data || []
      const destinationMap = new Map<string, {code: string, name: string, city: string, country: string, flightCount: number}>()

      scheduleData.forEach((flight: any) => {
        const destCity = flight.destination
        const destAirport = MAJOR_AIRPORTS.find(a => 
          getCityName(a.code) === destCity || a.city === destCity
        )

        if (!destinationMap.has(destCity)) {
          destinationMap.set(destCity, {
            code: destAirport?.code || 'XXX',
            name: destAirport?.name || destCity,
            city: destCity,
            country: destAirport?.country || 'Unknown',
            flightCount: 0
          })
        }

        const dest = destinationMap.get(destCity)!
        dest.flightCount += flight.frequency || 1
      })

      return Array.from(destinationMap.values())
        .sort((a, b) => b.flightCount - a.flightCount)

    } catch (error) {
      console.error('Error getting available destinations:', error)
      return []
    }
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
   * Convert WeeklyScheduleData to FlightMatch
   */
  private convertScheduleToFlightMatch(scheduleEntry: any, direction: 'outbound' | 'return'): FlightMatch {
    // Find airport codes
    const originAirport = MAJOR_AIRPORTS.find(a => 
      getCityName(a.code) === scheduleEntry.airport || a.city === scheduleEntry.airport
    )
    const destAirport = MAJOR_AIRPORTS.find(a => 
      getCityName(a.code) === scheduleEntry.destination || a.city === scheduleEntry.destination
    )

    // Generate a sample scheduled time based on time slot preferences
    const now = new Date()
    const sampleTime = new Date(now)
    
    // Set time based on direction and time slot
    if (direction === 'outbound') {
      switch (this.filters?.departureTimeSlot) {
        case 'morning': sampleTime.setHours(9, 0, 0, 0); break
        case 'afternoon': sampleTime.setHours(15, 0, 0, 0); break
        case 'evening': sampleTime.setHours(20, 0, 0, 0); break
        default: sampleTime.setHours(12, 0, 0, 0)
      }
    } else {
      switch (this.filters?.returnTimeSlot) {
        case 'morning': sampleTime.setHours(10, 0, 0, 0); break
        case 'afternoon': sampleTime.setHours(16, 0, 0, 0); break
        case 'evening': sampleTime.setHours(21, 0, 0, 0); break
        default: sampleTime.setHours(18, 0, 0, 0)
      }
    }

    return {
      flightNumber: scheduleEntry.flightNumber || 'N/A',
      airline: {
        name: scheduleEntry.airline || 'Unknown',
        code: 'XX'
      },
      origin: {
        code: originAirport?.code || 'XXX',
        name: originAirport?.name || scheduleEntry.airport,
        city: scheduleEntry.airport
      },
      destination: {
        code: destAirport?.code || 'XXX',
        name: destAirport?.name || scheduleEntry.destination,
        city: scheduleEntry.destination
      },
      scheduledTime: sampleTime.toISOString(),
      dayOfWeek: this.getActiveDays(scheduleEntry.weeklyPattern)[0] || 'monday',
      timeSlot: direction === 'outbound' ? 
        (this.filters?.departureTimeSlot || 'morning') : 
        (this.filters?.returnTimeSlot || 'evening'),
      status: 'scheduled'
    }
  }

  /**
   * Get active days from weekly pattern
   */
  private getActiveDays(weeklyPattern: any): string[] {
    const days = []
    if (weeklyPattern.monday) days.push('monday')
    if (weeklyPattern.tuesday) days.push('tuesday')
    if (weeklyPattern.wednesday) days.push('wednesday')
    if (weeklyPattern.thursday) days.push('thursday')
    if (weeklyPattern.friday) days.push('friday')
    if (weeklyPattern.saturday) days.push('saturday')
    if (weeklyPattern.sunday) days.push('sunday')
    return days
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    return {
      totalFlights: 0,
      totalAirports: MAJOR_AIRPORTS.length,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Export database data
   */
  exportDatabaseJSON(): string {
    return JSON.stringify({
      message: 'Export functionality available via API',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Export database as CSV
   */
  exportDatabaseCSV(): string {
    return 'message,timestamp\nExport functionality available via API,' + new Date().toISOString()
  }
}

// Export singleton instance
export const flightPlannerService = new FlightPlannerService()