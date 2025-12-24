/**
 * Flight Data Processor - Handles codeshare filtering, duplicate elimination, and data validation
 * Part of the Persistent Flight System architecture
 */

export interface RawFlightData {
  flight_number?: string
  flightNumber?: string
  airline?: {
    code?: string
    name?: string
  }
  airlineCode?: string
  airlineName?: string
  origin?: {
    code?: string
    name?: string
  }
  destination?: {
    code?: string
    name?: string
  }
  originCode?: string
  originName?: string
  destinationCode?: string
  destinationName?: string
  scheduled_time?: string
  scheduledTime?: string
  actual_time?: string
  actualTime?: string
  estimated_time?: string
  estimatedTime?: string
  status?: string
  delay?: number
  delayMinutes?: number
  aircraft?: {
    icao24?: string
    registration?: string
    model?: string
  }
  gate?: string
  terminal?: string
}

export interface ProcessedFlight {
  flightNumber: string
  airlineCode: string
  airlineName: string
  originAirport: string
  destinationAirport: string
  originName: string
  destinationName: string
  scheduledTime: Date
  estimatedTime?: Date
  actualTime?: Date
  status: string
  delayMinutes: number
  aircraft?: {
    icao24?: string
    registration?: string
    model?: string
  }
  gate?: string
  terminal?: string
  isCodeshare: boolean
  operatingAirline?: string
  route: string
}

/**
 * Flight Data Processor class
 */
class FlightDataProcessor {
  private static instance: FlightDataProcessor

  private constructor() {}

  static getInstance(): FlightDataProcessor {
    if (!FlightDataProcessor.instance) {
      FlightDataProcessor.instance = new FlightDataProcessor()
    }
    return FlightDataProcessor.instance
  }

  /**
   * Process raw flight data through the complete pipeline
   */
  async processFlightData(rawData: RawFlightData[]): Promise<ProcessedFlight[]> {
    console.log(`[Flight Processor] Processing ${rawData.length} raw flights`)

    // Step 1: Validate flight data
    const validFlights = rawData.filter(flight => this.validateFlightData(flight))
    console.log(`[Flight Processor] ${validFlights.length} flights passed validation`)

    // Step 2: Normalize flight data
    const normalizedFlights = validFlights.map(flight => this.normalizeFlightData(flight))

    // Step 3: Filter codeshare flights
    const filteredFlights = this.filterCodeshareFlights(normalizedFlights)
    console.log(`[Flight Processor] ${filteredFlights.length} flights after codeshare filtering`)

    // Step 4: Remove duplicates
    const uniqueFlights = this.removeDuplicates(filteredFlights)
    console.log(`[Flight Processor] ${uniqueFlights.length} unique flights after duplicate removal`)

    return uniqueFlights
  }

  /**
   * Filter codeshare flights - keep only operating airline flights
   */
  filterCodeshareFlights(flights: ProcessedFlight[]): ProcessedFlight[] {
    // Group flights by route and scheduled time to identify codeshares
    const flightGroups = new Map<string, ProcessedFlight[]>()

    flights.forEach(flight => {
      const key = `${flight.route}_${flight.scheduledTime.getTime()}`
      if (!flightGroups.has(key)) {
        flightGroups.set(key, [])
      }
      flightGroups.get(key)!.push(flight)
    })

    const filteredFlights: ProcessedFlight[] = []

    flightGroups.forEach(group => {
      if (group.length === 1) {
        // Single flight - no codeshare
        filteredFlights.push(group[0])
      } else {
        // Multiple flights with same route and time - potential codeshares
        const operatingFlight = this.selectOperatingFlight(group)
        
        // Mark others as codeshare
        group.forEach(flight => {
          if (flight.flightNumber === operatingFlight.flightNumber) {
            flight.isCodeshare = false
            filteredFlights.push(flight)
          } else {
            // This is a codeshare - mark it but don't include in final results
            flight.isCodeshare = true
            flight.operatingAirline = operatingFlight.airlineName
            console.log(`[Flight Processor] Filtered codeshare: ${flight.flightNumber} (operated by ${operatingFlight.airlineName})`)
          }
        })
      }
    })

    return filteredFlights
  }

  /**
   * Select the operating flight from a group of potential codeshares
   */
  private selectOperatingFlight(flights: ProcessedFlight[]): ProcessedFlight {
    // Priority rules for selecting operating flight:
    // 1. Flight with numeric flight number (e.g., "RO 123" over "AF 6789")
    // 2. Flight from known operating airlines
    // 3. Flight with most complete data
    // 4. First flight alphabetically

    const operatingAirlines = ['RO', 'W4', 'W6', 'FR', 'H4', 'A2'] // Romanian/local airlines
    const majorAirlines = ['LH', 'AF', 'KL', 'BA', 'TK', 'LO', 'OS'] // Major European airlines

    // Sort by priority
    const sortedFlights = flights.sort((a, b) => {
      // Priority 1: Operating airlines
      const aIsOperating = operatingAirlines.includes(a.airlineCode)
      const bIsOperating = operatingAirlines.includes(b.airlineCode)
      if (aIsOperating && !bIsOperating) return -1
      if (!aIsOperating && bIsOperating) return 1

      // Priority 2: Numeric flight numbers (lower numbers = more likely to be operating)
      const aFlightNum = this.extractFlightNumber(a.flightNumber)
      const bFlightNum = this.extractFlightNumber(b.flightNumber)
      
      if (aFlightNum !== null && bFlightNum !== null) {
        if (aFlightNum < 5000 && bFlightNum >= 5000) return -1
        if (aFlightNum >= 5000 && bFlightNum < 5000) return 1
      }

      // Priority 3: Major airlines over unknown airlines
      const aIsMajor = majorAirlines.includes(a.airlineCode)
      const bIsMajor = majorAirlines.includes(b.airlineCode)
      if (aIsMajor && !bIsMajor) return -1
      if (!aIsMajor && bIsMajor) return 1

      // Priority 4: More complete data (has actual time, gate, etc.)
      const aCompleteness = this.calculateDataCompleteness(a)
      const bCompleteness = this.calculateDataCompleteness(b)
      if (aCompleteness !== bCompleteness) return bCompleteness - aCompleteness

      // Priority 5: Alphabetical by airline code
      return a.airlineCode.localeCompare(b.airlineCode)
    })

    return sortedFlights[0]
  }

  /**
   * Extract numeric part of flight number
   */
  private extractFlightNumber(flightNumber: string): number | null {
    const match = flightNumber.match(/(\d+)/)
    return match ? parseInt(match[1]) : null
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(flight: ProcessedFlight): number {
    let score = 0
    if (flight.actualTime) score += 2
    if (flight.estimatedTime) score += 1
    if (flight.gate) score += 1
    if (flight.terminal) score += 1
    if (flight.aircraft?.registration) score += 1
    if (flight.status !== 'scheduled') score += 1
    return score
  }

  /**
   * Remove duplicate flights
   */
  removeDuplicates(flights: ProcessedFlight[]): ProcessedFlight[] {
    const uniqueFlights = new Map<string, ProcessedFlight>()

    flights.forEach(flight => {
      // Create unique key based on flight number, route, and scheduled time
      const key = `${flight.flightNumber}_${flight.route}_${flight.scheduledTime.getTime()}`
      
      if (!uniqueFlights.has(key)) {
        uniqueFlights.set(key, flight)
      } else {
        // Duplicate found - keep the one with more complete data
        const existing = uniqueFlights.get(key)!
        const existingCompleteness = this.calculateDataCompleteness(existing)
        const newCompleteness = this.calculateDataCompleteness(flight)
        
        if (newCompleteness > existingCompleteness) {
          uniqueFlights.set(key, flight)
          console.log(`[Flight Processor] Replaced duplicate with more complete data: ${flight.flightNumber}`)
        } else {
          console.log(`[Flight Processor] Filtered duplicate: ${flight.flightNumber}`)
        }
      }
    })

    return Array.from(uniqueFlights.values())
  }

  /**
   * Validate flight data
   */
  validateFlightData(flight: RawFlightData): boolean {
    // Must have flight number
    const flightNumber = flight.flight_number || flight.flightNumber
    if (!flightNumber || flightNumber.trim() === '') {
      return false
    }

    // Must have airline information
    const airlineCode = flight.airline?.code || flight.airlineCode
    if (!airlineCode || airlineCode.trim() === '') {
      return false
    }

    // Must have origin and destination
    const originCode = flight.origin?.code || flight.originCode
    const destinationCode = flight.destination?.code || flight.destinationCode
    if (!originCode || !destinationCode) {
      return false
    }

    // Must have scheduled time
    const scheduledTime = flight.scheduled_time || flight.scheduledTime
    if (!scheduledTime) {
      return false
    }

    // Validate scheduled time is a valid date
    const parsedTime = new Date(scheduledTime)
    if (isNaN(parsedTime.getTime())) {
      return false
    }

    return true
  }

  /**
   * Normalize flight data to consistent format
   */
  normalizeFlightData(flight: RawFlightData): ProcessedFlight {
    const flightNumber = (flight.flight_number || flight.flightNumber || '').trim()
    const airlineCode = (flight.airline?.code || flight.airlineCode || 'XX').trim()
    const airlineName = (flight.airline?.name || flight.airlineName || 'Unknown').trim()
    
    const originCode = (flight.origin?.code || flight.originCode || '').trim()
    const destinationCode = (flight.destination?.code || flight.destinationCode || '').trim()
    const originName = (flight.origin?.name || flight.originName || originCode).trim()
    const destinationName = (flight.destination?.name || flight.destinationName || destinationCode).trim()
    
    const scheduledTime = new Date(flight.scheduled_time || flight.scheduledTime || new Date())
    const estimatedTime = flight.estimated_time || flight.estimatedTime 
      ? new Date(flight.estimated_time || flight.estimatedTime!) 
      : undefined
    const actualTime = flight.actual_time || flight.actualTime 
      ? new Date(flight.actual_time || flight.actualTime!) 
      : undefined
    
    const status = (flight.status || 'scheduled').toLowerCase()
    const delayMinutes = flight.delay || flight.delayMinutes || 0
    
    // Calculate delay if not provided but we have times
    let calculatedDelay = delayMinutes
    if (calculatedDelay === 0 && actualTime && scheduledTime) {
      calculatedDelay = Math.max(0, Math.round((actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60)))
    } else if (calculatedDelay === 0 && estimatedTime && scheduledTime) {
      calculatedDelay = Math.max(0, Math.round((estimatedTime.getTime() - scheduledTime.getTime()) / (1000 * 60)))
    }

    const route = `${originCode}-${destinationCode}`

    return {
      flightNumber,
      airlineCode,
      airlineName,
      originAirport: originCode,
      destinationAirport: destinationCode,
      originName,
      destinationName,
      scheduledTime,
      estimatedTime,
      actualTime,
      status,
      delayMinutes: calculatedDelay,
      aircraft: flight.aircraft,
      gate: flight.gate,
      terminal: flight.terminal,
      isCodeshare: false, // Will be determined during codeshare filtering
      route
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(originalCount: number, processedCount: number): {
    originalCount: number
    processedCount: number
    filteredCount: number
    filteringRate: number
  } {
    const filteredCount = originalCount - processedCount
    const filteringRate = originalCount > 0 ? Math.round((filteredCount / originalCount) * 100) : 0

    return {
      originalCount,
      processedCount,
      filteredCount,
      filteringRate
    }
  }
}

// Export singleton instance
export const flightDataProcessor = FlightDataProcessor.getInstance()