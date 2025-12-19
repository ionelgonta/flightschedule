/**
 * Enhanced Flight Analytics Service
 * Folosește noul sistem de cache centralizat - NU mai face request-uri API direct
 */

import { RawFlightData } from './flightApiService'
import FlightApiService from './flightApiService'
import AeroDataBoxService from './aerodataboxService'
import { cacheManager } from './cacheManager'
import { getAirlineName, getCityName, formatAirportDisplay, formatAirlineDisplay } from './airlineMapping'

// Cache TTL constants
const ANALYTICS_CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

// Types for analytics
export interface FlightSchedule {
  flightNumber: string
  airline: {
    name: string
    code: string
  }
  origin: {
    airport: string
    code: string
    city: string
  }
  destination: {
    airport: string
    code: string
    city: string
  }
  scheduledTime: string
  actualTime?: string
  estimatedTime?: string
  status: string
  gate?: string
  terminal?: string
  aircraft?: string
  delay?: number
}

export interface AirportStatistics {
  airportCode: string
  period: string
  totalFlights: number
  onTimeFlights: number
  delayedFlights: number
  cancelledFlights: number
  averageDelay: number
  onTimePercentage: number
  delayIndex: number
  peakDelayHours: number[]
  mostFrequentRoutes: RouteAnalysis[]
}

export interface RouteAnalysis {
  origin: string
  destination: string
  flightCount: number
  averageDelay: number
  onTimePercentage: number
  airlines: string[]
}

export interface HistoricalData {
  date: string
  totalFlights: number
  averageDelay: number
  cancelledFlights: number
  onTimePercentage: number
}

export interface AircraftInfo {
  icao24: string
  registration: string
  model: string
  manufacturer: string
  operator: string
  firstFlightDate?: string
  totalFlights: number
  averageDelay: number
}

// Cache configuration management pentru compatibilitate
export interface CacheConfig {
  analyticsInterval: number // days
  realtimeInterval: number // minutes
}

export function updateCacheConfig(config: CacheConfig) {
  // Delegăm la noul cache manager
  cacheManager.updateConfig({
    flightData: {
      cronInterval: config.realtimeInterval
    },
    analytics: {
      cronInterval: config.analyticsInterval,
      cacheMaxAge: 360
    },
    aircraft: {
      cronInterval: 360,
      cacheMaxAge: 360
    }
  }).catch(console.error)
}

export function getCacheConfig(): CacheConfig {
  const stats = cacheManager.getCacheStats()
  return {
    analyticsInterval: stats.config?.analytics.cacheMaxAge || 30,
    realtimeInterval: stats.config?.flightData.cronInterval || 60
  }
}

/**
 * Flight Analytics Service - Folosește DOAR cache-ul centralizat
 */
export class FlightAnalyticsService {
  private flightApiService: FlightApiService
  private aeroDataBoxService: any

  constructor() {
    // NU inițializa cache manager-ul aici - se inițializează automat la primul acces
    // Inițializează flight API service pentru fallback
    this.flightApiService = new FlightApiService({
      provider: 'aerodatabox',
      apiKey: process.env.AERODATABOX_API_KEY || '',
      baseUrl: 'https://prod.api.market/api/v1/aedbx/aerodatabox',
      rateLimit: 100
    })
    
    // Inițializează AeroDataBox service pentru fallback
    this.aeroDataBoxService = new AeroDataBoxService({
      apiKey: process.env.AERODATABOX_API_KEY || '',
      baseUrl: 'https://prod.api.market/api/v1/aedbx/aerodatabox',
      rateLimit: 100
    })
  }
  
  /**
   * Get flight schedules for a specific airport and date range - DOAR din cache
   */
  async getFlightSchedules(
    airportCode: string,
    type: 'arrivals' | 'departures',
    fromDate: string,
    toDate: string
  ): Promise<FlightSchedule[]> {
    try {
      // Folosește IATA direct pentru cache lookup
      const cacheKey = `${airportCode}_${type}`
      
      // Citește datele din cache
      const cachedFlights = cacheManager.getCachedData<any[]>(cacheKey) || []
      
      if (cachedFlights.length > 0) {
        console.log(`Cache hit for flight schedules: ${cacheKey} (${cachedFlights.length} flights)`)
        
        // Convertește datele de zbor la format FlightSchedule
        const schedules: FlightSchedule[] = cachedFlights.map((flight: any) => ({
          flightNumber: flight.flight_number || 'N/A',
          airline: {
            code: flight.airline?.code || 'N/A',
            name: flight.airline?.name || 'Unknown'
          },
          aircraft: flight.aircraft || 'Unknown',
          origin: flight.origin?.code || flight.origin || 'N/A',
          destination: flight.destination?.code || flight.destination || 'N/A',
          scheduledTime: flight.scheduled_time || new Date().toISOString(),
          estimatedTime: flight.estimated_time || null,
          actualTime: flight.actual_time || null,
          status: flight.status || 'scheduled',
          gate: flight.gate || null,
          terminal: flight.terminal || null,
          delay: this.calculateDelay(flight),
          isCargo: flight.isCargo || false
        }))
        
        // Filtrează după perioada solicitată dacă este specificată
        const fromDateTime = new Date(fromDate)
        const toDateTime = new Date(toDate)
        toDateTime.setHours(23, 59, 59, 999) // Include toată ziua
        
        const filteredSchedules = schedules.filter(schedule => {
          const flightDate = new Date(schedule.scheduledTime)
          return flightDate >= fromDateTime && flightDate <= toDateTime
        })
        
        console.log(`Filtered ${schedules.length} flights to ${filteredSchedules.length} for period ${fromDate} to ${toDate}`)
        return filteredSchedules
      }

      // Nu există date în cache
      console.log(`No cached flight data for ${airportCode} ${type}`)
      return []
      
    } catch (error) {
      console.error('Error getting cached flight schedules:', error)
      return []
    }
  }

  /**
   * Calculate delay in minutes from flight data
   */
  private calculateDelay(flight: any): number {
    if (!flight.scheduled_time) return 0
    
    const scheduledTime = new Date(flight.scheduled_time)
    const actualTime = new Date(flight.actual_time || flight.estimated_time || flight.scheduled_time)
    
    return Math.max(0, Math.round((actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60)))
  }

  /**
   * Get airport statistics - DOAR din cache
   */
  async getAirportStatistics(
    airportCode: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<AirportStatistics> {
    const cacheKey = `analytics_${airportCode}`
    
    try {
      // Asigură-te că cache manager-ul este inițializat
      await cacheManager.initialize()
      
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = cacheManager.getCachedData<AirportStatistics>(cacheKey)
      
      if (cachedData) {
        console.log(`Cache hit for statistics: ${cacheKey}`)
        return cachedData
      }

      // Nu există date în cache - aruncă eroare
      console.log(`No cached statistics for ${airportCode}`)
      throw new Error('Nu sunt disponibile statistici pentru acest aeroport. Cache-ul se actualizează automat.')
      
    } catch (error) {
      console.error('Error getting cached airport statistics:', error)
      throw error
    }
  }

  /**
   * Get historical flight data - LIVE DATA
   */
  async getHistoricalData(
    airportCode: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalData[]> {
    const cacheKey = `history:${airportCode}:${fromDate}:${toDate}`
    
    const cached = cacheManager.getCachedData<HistoricalData[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for historical data: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Fetching LIVE historical data for ${airportCode} from ${fromDate} to ${toDate}`)
      const historical = await this.fetchLiveHistoricalData(airportCode, fromDate, toDate)
      cacheManager.setCachedData(cacheKey, historical, 'analytics', ANALYTICS_CACHE_TTL)
      console.log(`Cached historical data for ${airportCode} with TTL: ${ANALYTICS_CACHE_TTL}ms`)
      return historical
    } catch (error) {
      console.error('Error fetching live historical data:', error)
      return []
    }
  }

  /**
   * Get route analysis - LIVE DATA
   */
  async getRouteAnalysis(airportCode: string): Promise<RouteAnalysis[]> {
    const cacheKey = `routes:${airportCode}`
    
    const cached = cacheManager.getCachedData<RouteAnalysis[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for route analysis: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Analyzing LIVE routes for ${airportCode}`)
      const routes = await this.analyzeLiveRoutes(airportCode)
      cacheManager.setCachedData(cacheKey, routes, 'analytics', ANALYTICS_CACHE_TTL)
      console.log(`Cached route analysis for ${airportCode} with TTL: ${ANALYTICS_CACHE_TTL}ms`)
      return routes
    } catch (error) {
      console.error('Error analyzing live routes:', error)
      return []
    }
  }

  /**
   * Get aircraft information - DOAR din cache
   */
  async getAircraftInfo(icao24: string): Promise<AircraftInfo | null> {
    const cacheKey = `aircraft_${icao24}`
    
    try {
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = cacheManager.getCachedData<AircraftInfo>(cacheKey)
      
      if (cachedData) {
        console.log(`Cache hit for aircraft info: ${cacheKey}`)
        return cachedData
      }

      // Nu există date în cache
      console.log(`No cached aircraft info for ${icao24}`)
      return null
      
    } catch (error) {
      console.error('Error getting cached aircraft info:', error)
      return null
    }
  }

  /**
   * Search aircraft by registration - LIVE DATA
   */
  async searchAircraftByRegistration(registration: string): Promise<AircraftInfo[]> {
    const cacheKey = `aircraft:search:${registration}`
    
    const cached = cacheManager.getCachedData<AircraftInfo[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for aircraft search: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Searching LIVE aircraft by registration: ${registration}`)
      const aircraft = await this.searchLiveAircraft(registration)
      cacheManager.setCachedData(cacheKey, aircraft, 'aircraft', ANALYTICS_CACHE_TTL)
      console.log(`Cached aircraft search for ${registration} with TTL: ${ANALYTICS_CACHE_TTL}ms`)
      return aircraft
    } catch (error) {
      console.error('Error searching live aircraft:', error)
      return []
    }
  }

  // Private methods for LIVE data fetching

  private async fetchLiveFlightSchedules(
    airportCode: string,
    type: 'arrivals' | 'departures',
    fromDate: string,
    toDate: string
  ): Promise<FlightSchedule[]> {
    try {
      // NU MAI FACE REQUESTURI API DIRECTE - folosește doar cache-ul
      console.log(`Getting cached flight schedules for ${airportCode} ${type}`)
      
      const cacheKey = `${airportCode}_${type}`
      const cachedFlights = cacheManager.getCachedData<RawFlightData[]>(cacheKey) || []
      
      if (cachedFlights.length > 0) {
        console.log(`Found ${cachedFlights.length} cached flights for ${airportCode} ${type}`)
        return cachedFlights.map(flight => this.convertToFlightSchedule(flight))
      }
      
      // Nu există date în cache
      console.warn(`No cached flight data available for ${airportCode} ${type}`)
      return []
      
    } catch (error) {
      console.error(`Error fetching live flight schedules for ${airportCode}:`, error)
      return []
    }
  }

  private async calculateLiveAirportStatistics(
    airportCode: string,
    period: string
  ): Promise<AirportStatistics> {
    try {
      // NU MAI FACE REQUESTURI API DIRECTE - folosește doar cache-ul
      console.log(`Getting cached flight data for statistics: ${airportCode}`)
      
      const arrivalsKey = `${airportCode}_arrivals`
      const departuresKey = `${airportCode}_departures`
      
      const cachedArrivals = cacheManager.getCachedData<RawFlightData[]>(arrivalsKey) || []
      const cachedDepartures = cacheManager.getCachedData<RawFlightData[]>(departuresKey) || []
      
      const allFlights = [...cachedArrivals, ...cachedDepartures]
      
      if (allFlights.length === 0) {
        console.warn(`No live flight data available for ${airportCode}`)
        // Return null statistics instead of demo data
        throw new Error('Nu sunt suficiente date pentru a afișa această informație')
      }
      
      // Calculate real statistics from live data with proper status mapping
      const totalFlights = allFlights.length
      
      // Map various status formats to standard categories
      const onTimeFlights = allFlights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        return status === 'on-time' || status === 'scheduled' || status === 'landed' || 
               status === 'departed' || status === 'active' || status === 'en-route'
      }).length
      
      const delayedFlights = allFlights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        return status === 'delayed' || (f.delay && f.delay > 15) // Consider 15+ min as delayed
      }).length
      
      const cancelledFlights = allFlights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        return status === 'cancelled' || status === 'canceled'
      }).length
      
      // Calculate average delay from flights with actual delay data
      const flightsWithDelay = allFlights.filter((f: any) => f.delay && f.delay > 0)
      const averageDelay = flightsWithDelay.length > 0 
        ? Math.round(flightsWithDelay.reduce((sum: number, f: any) => sum + (f.delay || 0), 0) / flightsWithDelay.length)
        : 0
      
      // Recalculate on-time percentage based on actual performance
      const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0
      
      // Calculate delay index (0-100, where 0 is best)
      const delayIndex = Math.min(100, Math.round((delayedFlights / totalFlights) * 100 + (averageDelay / 60) * 10))
      
      // Analyze peak delay hours from scheduled times
      const peakDelayHours = this.calculatePeakDelayHours(allFlights)
      
      return {
        airportCode,
        period,
        totalFlights,
        onTimeFlights,
        delayedFlights,
        cancelledFlights,
        averageDelay,
        onTimePercentage,
        delayIndex,
        peakDelayHours,
        mostFrequentRoutes: await this.analyzeLiveRoutes(airportCode)
      }
      
    } catch (error) {
      console.error(`Error calculating live statistics for ${airportCode}:`, error)
      throw error
    }
  }

  private async fetchLiveHistoricalData(
    airportCode: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalData[]> {
    try {
      // NU MAI FACE REQUESTURI API DIRECTE - folosește doar cache-ul
      console.log(`Getting cached historical data for ${airportCode} from ${fromDate} to ${toDate}`)
      
      // Pentru date istorice, returnează array gol dacă nu există în cache
      // Cache-ul se populează automat prin cron jobs
      const arrivalsKey = `${airportCode}_arrivals`
      const departuresKey = `${airportCode}_departures`
      
      const cachedArrivals = cacheManager.getCachedData<RawFlightData[]>(arrivalsKey) || []
      const cachedDepartures = cacheManager.getCachedData<RawFlightData[]>(departuresKey) || []
      
      if (cachedArrivals.length === 0 && cachedDepartures.length === 0) {
        console.warn(`No cached historical data available for ${airportCode}`)
        return []
      }
      
      // Simulează date istorice pe baza datelor curente din cache
      // (în realitate, ar trebui să avem date istorice separate)
      const allFlights = [...cachedArrivals, ...cachedDepartures]
      const totalFlights = allFlights.length
      
      if (totalFlights === 0) return []
      
      // Creează o singură intrare pentru perioada solicitată
      const cancelledFlights = allFlights.filter(f => 
        f.status?.toLowerCase().includes('cancel')
      ).length
      
      const onTimeFlights = allFlights.filter(f => {
        const status = f.status?.toLowerCase() || ''
        const delay = f.delay || 0
        return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                status === 'departed') && delay <= 15
      }).length
      
      const flightsWithDelay = allFlights.filter(f => f.delay && f.delay > 0)
      const averageDelay = flightsWithDelay.length > 0 
        ? Math.round(flightsWithDelay.reduce((sum, f) => sum + (f.delay || 0), 0) / flightsWithDelay.length)
        : 0
      
      return [{
        date: fromDate,
        totalFlights,
        averageDelay,
        cancelledFlights,
        onTimePercentage: Math.round((onTimeFlights / totalFlights) * 100)
      }]
      
    } catch (error) {
      console.error(`Error fetching live historical data for ${airportCode}:`, error)
      return []
    }
  }

  private async analyzeLiveRoutes(airportCode: string): Promise<RouteAnalysis[]> {
    try {
      // NU MAI FACE REQUESTURI API DIRECTE - folosește doar cache-ul
      console.log(`Getting cached flight data for route analysis: ${airportCode}`)
      
      const arrivalsKey = `${airportCode}_arrivals`
      const departuresKey = `${airportCode}_departures`
      
      const cachedArrivals = cacheManager.getCachedData<RawFlightData[]>(arrivalsKey) || []
      const cachedDepartures = cacheManager.getCachedData<RawFlightData[]>(departuresKey) || []
      
      const allFlights = [...cachedArrivals, ...cachedDepartures]
      
      if (allFlights.length === 0) {
        console.warn(`No live flight data available for route analysis of ${airportCode}`)
        // Return empty array instead of demo data
        return []
      }
      
      // Group flights by route
      const routeMap = new Map<string, {
        flights: RawFlightData[]
        origin: string
        destination: string
        airlines: Set<string>
      }>()
      
      allFlights.forEach(flight => {
        const origin = flight.origin.code
        const destination = flight.destination.code
        
        // Skip internal routes (same origin and destination) as they don't make sense
        if (origin === destination) {
          return
        }
        
        // For the current airport, we want to show routes TO other destinations
        // So we need to determine the "other" airport (not the current one)
        let otherAirport: string
        let routeKey: string
        
        if (origin === airportCode) {
          // This is a departure, destination is the other airport
          otherAirport = destination
          routeKey = `${airportCode}-${destination}`
        } else if (destination === airportCode) {
          // This is an arrival, origin is the other airport  
          otherAirport = origin
          routeKey = `${origin}-${airportCode}`
        } else {
          // This flight doesn't involve our airport, skip it
          return
        }
        
        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, {
            flights: [],
            origin: origin === airportCode ? airportCode : origin,
            destination: destination === airportCode ? airportCode : destination,
            airlines: new Set()
          })
        }
        
        const route = routeMap.get(routeKey)!
        route.flights.push(flight)
        route.airlines.add(flight.airline.code)
      })
      
      // Convert to RouteAnalysis format
      const routes: RouteAnalysis[] = []
      
      routeMap.forEach((route, routeKey) => {
        const flightCount = route.flights.length
        
        // Better status mapping for on-time calculation
        const onTimeFlights = route.flights.filter((f: any) => {
          const status = f.status?.toLowerCase() || ''
          const delay = f.delay || 0
          return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                  status === 'departed' || status === 'active' || status === 'en-route') && 
                 delay <= 15 // Consider up to 15 minutes as on-time
        })
        
        const delayedFlights = route.flights.filter((f: any) => {
          const status = f.status?.toLowerCase() || ''
          const delay = f.delay || 0
          return status === 'delayed' || delay > 15
        })
        
        const averageDelay = delayedFlights.length > 0
          ? Math.round(delayedFlights.reduce((sum, f) => sum + (f.delay || 0), 0) / delayedFlights.length)
          : 0
        
        const onTimePercentage = flightCount > 0 ? Math.round((onTimeFlights.length / flightCount) * 100) : 0
        
        // For display purposes, show the "other" airport (not the current one)
        const displayOrigin = route.origin === airportCode ? airportCode : route.origin
        const displayDestination = route.destination === airportCode ? airportCode : route.destination
        
        // Determine which airport to show as the route destination (the "other" one)
        const otherAirport = route.origin === airportCode ? route.destination : route.origin
        
        routes.push({
          origin: airportCode, // Always show current airport as origin for consistency
          destination: otherAirport, // Show the other airport as destination
          flightCount,
          averageDelay,
          onTimePercentage,
          airlines: Array.from(route.airlines)
        })
      })
      
      // Sort by flight count (most frequent routes first) and return top 15
      return routes.sort((a, b) => b.flightCount - a.flightCount).slice(0, 15)
      
    } catch (error) {
      console.error(`Error analyzing live routes for ${airportCode}:`, error)
      return []
    }
  }



  private async fetchLiveAircraftInfo(icao24: string): Promise<AircraftInfo | null> {
    try {
      // NU MAI FACE REQUESTURI API DIRECTE - folosește doar cache-ul
      console.log(`Getting cached aircraft info for ${icao24}`)
      
      const cacheKey = `aircraft_${icao24}`
      const cachedAircraft = cacheManager.getCachedData<AircraftInfo>(cacheKey)
      
      if (cachedAircraft) {
        console.log(`Found cached aircraft info for ${icao24}`)
        return cachedAircraft
      }
      
      console.warn(`No cached aircraft info available for ${icao24}`)
      return null
      
    } catch (error) {
      console.error(`Error fetching live aircraft info for ${icao24}:`, error)
      return null
    }
  }

  private async searchLiveAircraft(registration: string): Promise<AircraftInfo[]> {
    try {
      // NU MAI FACE REQUESTURI API DIRECTE - caută în cache
      console.log(`Searching cached aircraft by registration: ${registration}`)
      
      const aircraftInfo = await this.fetchLiveAircraftInfo(registration)
      return aircraftInfo ? [aircraftInfo] : []
      
    } catch (error) {
      console.error(`Error searching live aircraft by registration ${registration}:`, error)
      return []
    }
  }

  /**
   * Refresh manual pentru analytics
   */
  async refreshAnalytics(airportCode?: string): Promise<void> {
    console.log(`Manual analytics refresh triggered${airportCode ? ` for ${airportCode}` : ''}`)
    await cacheManager.manualRefresh('analytics', airportCode)
  }

  /**
   * Refresh manual pentru aircraft
   */
  async refreshAircraft(aircraftId?: string): Promise<void> {
    console.log(`Manual aircraft refresh triggered${aircraftId ? ` for ${aircraftId}` : ''}`)
    await cacheManager.manualRefresh('aircraft', aircraftId)
  }

  /**
   * Get cache statistics din cache manager
   */
  getCacheStats() {
    return cacheManager.getCacheStats()
  }

  // Helper methods for live data conversion

  private convertToFlightSchedule(flight: RawFlightData): FlightSchedule {
    return {
      flightNumber: flight.flight_number,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      scheduledTime: flight.scheduled_time,
      actualTime: flight.actual_time,
      estimatedTime: flight.estimated_time,
      status: flight.status,
      gate: flight.gate,
      terminal: flight.terminal,
      aircraft: flight.aircraft,
      delay: flight.delay
    }
  }

  private convertAeroDataBoxToSchedule(flight: any, type: 'arrivals' | 'departures', airportCode: string): FlightSchedule {
    const converted = this.aeroDataBoxService.convertToStandardFormat(flight, type, airportCode)
    return this.convertToFlightSchedule(converted)
  }

  private calculatePeakDelayHours(flights: RawFlightData[]): number[] {
    const hourDelayMap = new Map<number, number[]>()
    
    flights.forEach(flight => {
      if (flight.delay && flight.delay > 0) {
        const hour = new Date(flight.scheduled_time).getHours()
        if (!hourDelayMap.has(hour)) {
          hourDelayMap.set(hour, [])
        }
        hourDelayMap.get(hour)!.push(flight.delay)
      }
    })
    
    // Calculate average delay per hour
    const hourAverages: { hour: number; avgDelay: number }[] = []
    hourDelayMap.forEach((delays, hour) => {
      const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length
      hourAverages.push({ hour, avgDelay })
    })
    
    // Return top 5 hours with highest average delays
    return hourAverages
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 5)
      .map(item => item.hour)
  }

  private extractManufacturer(model: string): string {
    if (model.toLowerCase().includes('boeing')) return 'Boeing'
    if (model.toLowerCase().includes('airbus')) return 'Airbus'
    if (model.toLowerCase().includes('atr')) return 'ATR'
    if (model.toLowerCase().includes('embraer')) return 'Embraer'
    if (model.toLowerCase().includes('bombardier')) return 'Bombardier'
    return 'Unknown'
  }

  /**
   * Clear cache by pattern
   */
  clearCachePattern(pattern: string): void {
    cacheManager.clearCacheByPattern(pattern)
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    cacheManager.clearAllCache()
  }

  /**
   * Reset API request counter
   */
  resetApiRequestCount(): void {
    cacheManager.resetRequestCounter()
  }

  /**
   * Get cached data by key
   */
  getCachedData<T>(key: string): T | null {
    return cacheManager.getCachedData<T>(key)
  }

  /**
   * Set cached data
   */
  setCachedData<T>(key: string, data: T, ttlMs?: number): void {
    cacheManager.setCachedData(key, data, 'analytics', ttlMs)
  }

  /**
   * Mark API call
   */
  markApiCall(): void {
    cacheManager.incrementRequestCounter('analytics')
  }
}

// Export singleton instance
export const flightAnalyticsService = new FlightAnalyticsService()