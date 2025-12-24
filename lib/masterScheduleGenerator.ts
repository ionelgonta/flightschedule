/**
 * Master Schedule Generator - Generates weekly schedules from historical flight data
 * Part of the Persistent Flight System architecture
 * Uses ONLY IATA codes as per airport mapping rules
 */

import { historicalDatabaseManager, FlightRecord, WeeklySchedule, RouteSchedule, ScheduledFlight, ScheduleStatistics } from './historicalDatabaseManager'

export interface RouteStats {
  route: string
  totalFlights: number
  averageDelay: number
  punctualityScore: number
  mostFrequentAirline: string
  weeklyFrequency: number
  peakDays: number[]
  peakHours: number[]
}

export interface FrequencyData {
  airline: string
  route: string
  weeklyFlights: number
  averageDelay: number
  punctualityScore: number
  operatingDays: number[]
  typicalTimes: string[]
}

export interface PunctualityStats {
  onTimeFlights: number
  delayedFlights: number
  cancelledFlights: number
  averageDelay: number
  punctualityPercentage: number
  worstDelayHour: number
  bestPunctualityDay: number
}

/**
 * Master Schedule Generator class
 */
class MasterScheduleGenerator {
  private static instance: MasterScheduleGenerator

  // IATA airport codes mapping (following airport mapping rules)
  private readonly AIRPORT_NAMES: { [key: string]: string } = {
    'OTP': 'București (Henri Coandă)',
    'BBU': 'București (Aurel Vlaicu)', 
    'CLJ': 'Cluj-Napoca',
    'TSR': 'Timișoara',
    'IAS': 'Iași',
    'CND': 'Constanța',
    'SBZ': 'Sibiu',
    'CRA': 'Craiova',
    'BCM': 'Bacău',
    'BAY': 'Oradea',
    'OMR': 'Oradea',
    'SCV': 'Suceava',
    'TGM': 'Târgu Mureș',
    'ARW': 'Arad',
    'SUJ': 'Satu Mare',
    'RMO': 'Chișinău'
  }

  private constructor() {}

  static getInstance(): MasterScheduleGenerator {
    if (!MasterScheduleGenerator.instance) {
      MasterScheduleGenerator.instance = new MasterScheduleGenerator()
    }
    return MasterScheduleGenerator.instance
  }

  /**
   * Generate weekly schedule for an airport using IATA code
   */
  async generateWeeklySchedule(airportCode: string): Promise<WeeklySchedule> {
    console.log(`[Schedule Generator] Generating weekly schedule for ${airportCode}`)

    // Validate IATA code
    if (!this.isValidIATACode(airportCode)) {
      throw new Error(`Invalid IATA airport code: ${airportCode}`)
    }

    // Get historical data for the last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const historicalFlights = await historicalDatabaseManager.getFlightsByAirport(airportCode, {
      startDate,
      endDate
    })

    console.log(`[Schedule Generator] Found ${historicalFlights.length} historical flights for ${airportCode}`)

    if (historicalFlights.length === 0) {
      // Return empty schedule if no historical data
      return {
        airport: airportCode,
        weekStartDate: this.getWeekStart(new Date()),
        routes: [],
        statistics: {
          totalRoutes: 0,
          totalFlights: 0,
          averagePunctuality: 0,
          mostFrequentRoute: '',
          busiestDay: 0
        },
        lastUpdated: new Date()
      }
    }

    // Group flights by route
    const routeGroups = this.groupFlightsByRoute(historicalFlights, airportCode)
    
    // Generate route schedules
    const routes: RouteSchedule[] = []
    let totalPunctuality = 0
    let punctualityCount = 0
    let maxRouteFlights = 0
    let mostFrequentRoute = ''

    for (const [routeKey, flights] of routeGroups.entries()) {
      const routeSchedule = this.generateRouteSchedule(routeKey, flights, airportCode)
      routes.push(routeSchedule)

      // Track statistics
      const routeFlightCount = flights.length
      if (routeFlightCount > maxRouteFlights) {
        maxRouteFlights = routeFlightCount
        mostFrequentRoute = routeSchedule.route
      }

      // Calculate punctuality for this route
      const routePunctuality = this.calculateRoutePunctuality(flights)
      totalPunctuality += routePunctuality
      punctualityCount++
    }

    // Calculate overall statistics
    const statistics = this.calculateScheduleStatistics(
      routes,
      historicalFlights,
      totalPunctuality,
      punctualityCount,
      mostFrequentRoute
    )

    return {
      airport: airportCode,
      weekStartDate: this.getWeekStart(new Date()),
      routes: routes.sort((a, b) => a.route.localeCompare(b.route)),
      statistics,
      lastUpdated: new Date()
    }
  }

  /**
   * Get route statistics for a specific route
   */
  async getRouteStatistics(route: string): Promise<RouteStats> {
    console.log(`[Schedule Generator] Getting statistics for route: ${route}`)

    // Parse route (format: "OTP-CDG" or "CDG-OTP")
    const [origin, destination] = route.split('-')
    if (!origin || !destination) {
      throw new Error(`Invalid route format: ${route}`)
    }

    // Get historical data for the last 60 days for better statistics
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 60)

    // Get flights for both directions of the route
    const originFlights = await historicalDatabaseManager.getFlightsByAirport(origin, { startDate, endDate })
    const destinationFlights = await historicalDatabaseManager.getFlightsByAirport(destination, { startDate, endDate })

    // Filter flights for this specific route
    const routeFlights = [
      ...originFlights.filter(f => f.route === route),
      ...destinationFlights.filter(f => f.route === `${destination}-${origin}`)
    ]

    if (routeFlights.length === 0) {
      return {
        route: this.formatRouteName(route),
        totalFlights: 0,
        averageDelay: 0,
        punctualityScore: 0,
        mostFrequentAirline: '',
        weeklyFrequency: 0,
        peakDays: [],
        peakHours: []
      }
    }

    // Calculate statistics
    const totalFlights = routeFlights.length
    const punctualityStats = this.calculatePunctualityStats(routeFlights)
    const airlineFrequency = this.calculateAirlineFrequency(routeFlights)
    const mostFrequentAirline = airlineFrequency.length > 0 ? airlineFrequency[0].airline : ''
    const weeklyFrequency = Math.round((totalFlights / 60) * 7) // Estimate weekly frequency
    const peakDays = this.calculatePeakDays(routeFlights)
    const peakHours = this.calculatePeakHours(routeFlights)

    return {
      route: this.formatRouteName(route),
      totalFlights,
      averageDelay: punctualityStats.averageDelay,
      punctualityScore: punctualityStats.punctualityPercentage,
      mostFrequentAirline,
      weeklyFrequency,
      peakDays,
      peakHours
    }
  }

  /**
   * Get airline frequency data for a specific airline and route
   */
  async getAirlineFrequency(airline: string, route: string): Promise<FrequencyData> {
    console.log(`[Schedule Generator] Getting frequency data for ${airline} on route ${route}`)

    const routeStats = await this.getRouteStatistics(route)
    
    // Get historical data for the specific airline
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const [origin, destination] = route.split('-')
    const originFlights = await historicalDatabaseManager.getFlightsByAirport(origin, { startDate, endDate })
    const destinationFlights = await historicalDatabaseManager.getFlightsByAirport(destination, { startDate, endDate })

    // Filter for specific airline and route
    const airlineFlights = [
      ...originFlights.filter(f => f.route === route && f.airlineCode === airline),
      ...destinationFlights.filter(f => f.route === `${destination}-${origin}` && f.airlineCode === airline)
    ]

    if (airlineFlights.length === 0) {
      return {
        airline,
        route: this.formatRouteName(route),
        weeklyFlights: 0,
        averageDelay: 0,
        punctualityScore: 0,
        operatingDays: [],
        typicalTimes: []
      }
    }

    const punctualityStats = this.calculatePunctualityStats(airlineFlights)
    const weeklyFlights = Math.round((airlineFlights.length / 30) * 7)
    const operatingDays = this.getOperatingDays(airlineFlights)
    const typicalTimes = this.getTypicalTimes(airlineFlights)

    return {
      airline,
      route: this.formatRouteName(route),
      weeklyFlights,
      averageDelay: punctualityStats.averageDelay,
      punctualityScore: punctualityStats.punctualityPercentage,
      operatingDays,
      typicalTimes
    }
  }

  /**
   * Calculate punctuality statistics for a set of flights
   */
  calculatePunctualityStats(flights: FlightRecord[]): PunctualityStats {
    let onTimeFlights = 0
    let delayedFlights = 0
    let cancelledFlights = 0
    const delays: number[] = []
    const hourlyDelays = new Map<number, number[]>()
    const dailyOnTime = new Array(7).fill(0)
    const dailyTotal = new Array(7).fill(0)

    flights.forEach(flight => {
      const dayOfWeek = flight.scheduledTime.getDay()
      const hour = flight.scheduledTime.getHours()
      dailyTotal[dayOfWeek]++

      if (flight.status === 'cancelled') {
        cancelledFlights++
        return
      }

      let delayMinutes = 0

      // Calculate delay using scheduled time field as per requirements
      if (flight.actualTime && flight.scheduledTime) {
        delayMinutes = Math.max(0, (flight.actualTime.getTime() - flight.scheduledTime.getTime()) / (1000 * 60))
      } else if (flight.estimatedTime && flight.scheduledTime) {
        delayMinutes = Math.max(0, (flight.estimatedTime.getTime() - flight.scheduledTime.getTime()) / (1000 * 60))
      } else if (flight.status === 'delayed') {
        delayMinutes = 30 // Assume 30 minutes for status-only delayed flights
      }

      if (delayMinutes <= 15) {
        onTimeFlights++
        dailyOnTime[dayOfWeek]++
      } else {
        delayedFlights++
        delays.push(delayMinutes)

        // Track hourly delays
        if (!hourlyDelays.has(hour)) {
          hourlyDelays.set(hour, [])
        }
        hourlyDelays.get(hour)!.push(delayMinutes)
      }
    })

    const averageDelay = delays.length > 0 
      ? Math.round(delays.reduce((sum, delay) => sum + delay, 0) / delays.length)
      : 0

    const punctualityPercentage = flights.length > 0 
      ? Math.round((onTimeFlights / flights.length) * 100)
      : 0

    // Find worst delay hour
    let worstDelayHour = 0
    let maxAverageDelay = 0
    hourlyDelays.forEach((delayList, hour) => {
      const avgDelay = delayList.reduce((sum, delay) => sum + delay, 0) / delayList.length
      if (avgDelay > maxAverageDelay) {
        maxAverageDelay = avgDelay
        worstDelayHour = hour
      }
    })

    // Find best punctuality day
    let bestPunctualityDay = 0
    let bestPunctualityRate = 0
    dailyOnTime.forEach((onTime, day) => {
      const total = dailyTotal[day]
      if (total > 0) {
        const rate = onTime / total
        if (rate > bestPunctualityRate) {
          bestPunctualityRate = rate
          bestPunctualityDay = day
        }
      }
    })

    return {
      onTimeFlights,
      delayedFlights,
      cancelledFlights,
      averageDelay,
      punctualityPercentage,
      worstDelayHour,
      bestPunctualityDay
    }
  }

  /**
   * Group flights by route
   */
  private groupFlightsByRoute(flights: FlightRecord[], airportCode: string): Map<string, FlightRecord[]> {
    const routeGroups = new Map<string, FlightRecord[]>()

    flights.forEach(flight => {
      // Use the route field directly as it's already in IATA format (e.g., "OTP-CDG")
      const route = flight.route
      
      if (!routeGroups.has(route)) {
        routeGroups.set(route, [])
      }
      routeGroups.get(route)!.push(flight)
    })

    return routeGroups
  }

  /**
   * Generate route schedule from historical flights
   */
  private generateRouteSchedule(routeKey: string, flights: FlightRecord[], airportCode: string): RouteSchedule {
    // Group flights by day of week, time, and airline
    const scheduleMap = new Map<string, {
      flights: FlightRecord[]
      airline: string
      flightNumber: string
    }>()

    flights.forEach(flight => {
      const dayOfWeek = flight.scheduledTime.getDay()
      const timeStr = flight.scheduledTime.toTimeString().substring(0, 5) // HH:MM format
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
      
      const punctualityScore = this.calculateRoutePunctuality(scheduleData.flights)
      const frequency = scheduleData.flights.length

      scheduledFlights.push({
        dayOfWeek: parseInt(dayOfWeek),
        airline: scheduleData.airline,
        flightNumber: scheduleData.flightNumber,
        scheduledTime: timeStr,
        frequency,
        punctualityScore
      })
    })

    return {
      route: this.formatRouteName(routeKey),
      flights: scheduledFlights.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.scheduledTime.localeCompare(b.scheduledTime)
      })
    }
  }

  /**
   * Calculate punctuality for a route
   */
  private calculateRoutePunctuality(flights: FlightRecord[]): number {
    if (flights.length === 0) return 0

    let onTimeCount = 0
    flights.forEach(flight => {
      if (flight.status === 'cancelled') return

      let delayMinutes = 0
      if (flight.actualTime && flight.scheduledTime) {
        delayMinutes = (flight.actualTime.getTime() - flight.scheduledTime.getTime()) / (1000 * 60)
      } else if (flight.estimatedTime && flight.scheduledTime) {
        delayMinutes = (flight.estimatedTime.getTime() - flight.scheduledTime.getTime()) / (1000 * 60)
      }

      if (delayMinutes <= 15) onTimeCount++
    })

    return Math.round((onTimeCount / flights.length) * 100)
  }

  /**
   * Calculate schedule statistics
   */
  private calculateScheduleStatistics(
    routes: RouteSchedule[],
    allFlights: FlightRecord[],
    totalPunctuality: number,
    punctualityCount: number,
    mostFrequentRoute: string
  ): ScheduleStatistics {
    // Calculate busiest day
    const dayFrequency = new Array(7).fill(0)
    routes.forEach(route => {
      route.flights.forEach(flight => {
        dayFrequency[flight.dayOfWeek] += flight.frequency
      })
    })
    const busiestDay = dayFrequency.indexOf(Math.max(...dayFrequency))

    const averagePunctuality = punctualityCount > 0 ? Math.round(totalPunctuality / punctualityCount) : 0

    return {
      totalRoutes: routes.length,
      totalFlights: allFlights.length,
      averagePunctuality,
      mostFrequentRoute,
      busiestDay
    }
  }

  /**
   * Helper methods
   */
  private isValidIATACode(code: string): boolean {
    return Object.keys(this.AIRPORT_NAMES).includes(code)
  }

  private formatRouteName(route: string): string {
    const [origin, destination] = route.split('-')
    const originName = this.AIRPORT_NAMES[origin] || origin
    const destinationName = this.AIRPORT_NAMES[destination] || destination
    return `${originName} - ${destinationName}`
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  private calculateAirlineFrequency(flights: FlightRecord[]): { airline: string; count: number }[] {
    const airlineCount = new Map<string, number>()
    
    flights.forEach(flight => {
      const airline = flight.airlineName
      airlineCount.set(airline, (airlineCount.get(airline) || 0) + 1)
    })

    return Array.from(airlineCount.entries())
      .map(([airline, count]) => ({ airline, count }))
      .sort((a, b) => b.count - a.count)
  }

  private calculatePeakDays(flights: FlightRecord[]): number[] {
    const dayCount = new Array(7).fill(0)
    flights.forEach(flight => {
      dayCount[flight.scheduledTime.getDay()]++
    })

    return dayCount
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day)
  }

  private calculatePeakHours(flights: FlightRecord[]): number[] {
    const hourCount = new Array(24).fill(0)
    flights.forEach(flight => {
      hourCount[flight.scheduledTime.getHours()]++
    })

    return hourCount
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map(item => item.hour)
  }

  private getOperatingDays(flights: FlightRecord[]): number[] {
    const operatingDays = new Set<number>()
    flights.forEach(flight => {
      operatingDays.add(flight.scheduledTime.getDay())
    })
    return Array.from(operatingDays).sort()
  }

  private getTypicalTimes(flights: FlightRecord[]): string[] {
    const timeCount = new Map<string, number>()
    
    flights.forEach(flight => {
      const timeStr = flight.scheduledTime.toTimeString().substring(0, 5)
      timeCount.set(timeStr, (timeCount.get(timeStr) || 0) + 1)
    })

    return Array.from(timeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([time]) => time)
  }
}

// Export singleton instance
export const masterScheduleGenerator = MasterScheduleGenerator.getInstance()