/**
 * Enhanced Flight Analytics Service
 * Provides comprehensive flight data analysis with caching
 * Uses LIVE AeroDataBox API data - NO DEMO DATA
 */

import { RawFlightData } from './flightApiService'
import FlightApiService, { API_CONFIGS } from './flightApiService'
import AeroDataBoxService from './aerodataboxService'
import { getAirlineName, getCityName, formatAirportDisplay, formatAirlineDisplay } from './airlineMapping'

// Cache configuration - configurable via admin
let ANALYTICS_CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
let REALTIME_CACHE_TTL = 60 * 60 * 1000 // 1 hour for real-time data

// Cache configuration management
export interface CacheConfig {
  analyticsInterval: number // days
  realtimeInterval: number // minutes
}

export function updateCacheConfig(config: CacheConfig) {
  ANALYTICS_CACHE_TTL = config.analyticsInterval * 24 * 60 * 60 * 1000
  REALTIME_CACHE_TTL = config.realtimeInterval * 60 * 1000
}

export function getCacheConfig(): CacheConfig {
  return {
    analyticsInterval: ANALYTICS_CACHE_TTL / (24 * 60 * 60 * 1000),
    realtimeInterval: REALTIME_CACHE_TTL / (60 * 1000)
  }
}

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

// Cache management
class FlightAnalyticsCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private lastApiCall: number | null = null
  private apiRequestCount: number = 0

  set(key: string, data: any, ttl: number = ANALYTICS_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  clear(): void {
    this.cache.clear()
  }

  clearPattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern))
    keysToDelete.forEach(key => this.cache.delete(key))
    console.log(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`)
  }

  setLastApiCall(): void {
    this.lastApiCall = Date.now()
    this.apiRequestCount++
  }

  resetApiRequestCount(): void {
    this.apiRequestCount = 0
  }

  getStats(): { 
    size: number; 
    keys: string[]; 
    lastApiCall: string | null;
    apiRequestCount: number;
    cacheEntries: Array<{key: string, timestamp: string, ttl: number, expired: boolean}>
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      timestamp: new Date(value.timestamp).toISOString(),
      ttl: value.ttl,
      expired: Date.now() - value.timestamp > value.ttl
    }))

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      lastApiCall: this.lastApiCall ? new Date(this.lastApiCall).toISOString() : null,
      apiRequestCount: this.apiRequestCount,
      cacheEntries: entries
    }
  }
}

const analyticsCache = new FlightAnalyticsCache()

/**
 * Flight Analytics Service - LIVE DATA ONLY
 */
export class FlightAnalyticsService {
  private flightApiService: FlightApiService
  private aeroDataBoxService: AeroDataBoxService

  constructor() {
    // Initialize with live API services
    this.flightApiService = new FlightApiService(API_CONFIGS.aerodatabox)
    this.aeroDataBoxService = new AeroDataBoxService(API_CONFIGS.aerodatabox)
  }
  
  /**
   * Get flight schedules for a specific airport and date range - LIVE DATA
   */
  async getFlightSchedules(
    airportCode: string,
    type: 'arrivals' | 'departures',
    fromDate: string,
    toDate: string
  ): Promise<FlightSchedule[]> {
    const cacheKey = `schedules:${airportCode}:${type}:${fromDate}:${toDate}`
    
    // Check cache first
    const cached = analyticsCache.get<FlightSchedule[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for schedules: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Fetching LIVE flight schedules for ${airportCode} ${type} from ${fromDate} to ${toDate}`)
      
      // Mark API call timestamp
      analyticsCache.setLastApiCall()
      
      // Get live data from AeroDataBox API
      const schedules = await this.fetchLiveFlightSchedules(airportCode, type, fromDate, toDate)
      
      // Cache with appropriate TTL based on date range
      const isRecent = new Date(toDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const ttl = isRecent ? REALTIME_CACHE_TTL : ANALYTICS_CACHE_TTL
      
      analyticsCache.set(cacheKey, schedules, ttl)
      console.log(`Cached ${schedules.length} schedules for ${airportCode} with TTL: ${ttl}ms`)
      
      return schedules
    } catch (error) {
      console.error('Error fetching live flight schedules:', error)
      // Return empty array instead of demo data
      return []
    }
  }

  /**
   * Get airport statistics - LIVE DATA
   */
  async getAirportStatistics(
    airportCode: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<AirportStatistics> {
    const cacheKey = `stats:${airportCode}:${period}`
    
    const cached = analyticsCache.get<AirportStatistics>(cacheKey)
    if (cached) {
      console.log(`Cache hit for statistics: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Calculating LIVE airport statistics for ${airportCode} (${period})`)
      
      // Mark API call timestamp
      analyticsCache.setLastApiCall()
      
      const stats = await this.calculateLiveAirportStatistics(airportCode, period)
      analyticsCache.set(cacheKey, stats, ANALYTICS_CACHE_TTL)
      console.log(`Cached statistics for ${airportCode} with TTL: ${ANALYTICS_CACHE_TTL}ms`)
      return stats
    } catch (error) {
      console.error('Error calculating live airport statistics:', error)
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
    
    const cached = analyticsCache.get<HistoricalData[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for historical data: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Fetching LIVE historical data for ${airportCode} from ${fromDate} to ${toDate}`)
      const historical = await this.fetchLiveHistoricalData(airportCode, fromDate, toDate)
      analyticsCache.set(cacheKey, historical, ANALYTICS_CACHE_TTL)
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
    
    const cached = analyticsCache.get<RouteAnalysis[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for route analysis: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Analyzing LIVE routes for ${airportCode}`)
      const routes = await this.analyzeLiveRoutes(airportCode)
      analyticsCache.set(cacheKey, routes, ANALYTICS_CACHE_TTL)
      console.log(`Cached route analysis for ${airportCode} with TTL: ${ANALYTICS_CACHE_TTL}ms`)
      return routes
    } catch (error) {
      console.error('Error analyzing live routes:', error)
      return []
    }
  }

  /**
   * Get aircraft information - LIVE DATA
   */
  async getAircraftInfo(icao24: string): Promise<AircraftInfo | null> {
    const cacheKey = `aircraft:${icao24}`
    
    const cached = analyticsCache.get<AircraftInfo>(cacheKey)
    if (cached) {
      console.log(`Cache hit for aircraft info: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Fetching LIVE aircraft info for ${icao24}`)
      const aircraft = await this.fetchLiveAircraftInfo(icao24)
      if (aircraft) {
        analyticsCache.set(cacheKey, aircraft, ANALYTICS_CACHE_TTL)
        console.log(`Cached aircraft info for ${icao24} with TTL: ${ANALYTICS_CACHE_TTL}ms`)
      }
      return aircraft
    } catch (error) {
      console.error('Error fetching live aircraft info:', error)
      return null
    }
  }

  /**
   * Search aircraft by registration - LIVE DATA
   */
  async searchAircraftByRegistration(registration: string): Promise<AircraftInfo[]> {
    const cacheKey = `aircraft:search:${registration}`
    
    const cached = analyticsCache.get<AircraftInfo[]>(cacheKey)
    if (cached) {
      console.log(`Cache hit for aircraft search: ${cacheKey}`)
      return cached
    }

    try {
      console.log(`Searching LIVE aircraft by registration: ${registration}`)
      const aircraft = await this.searchLiveAircraft(registration)
      analyticsCache.set(cacheKey, aircraft, ANALYTICS_CACHE_TTL)
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
      // For current/recent dates, use real-time API
      const today = new Date()
      const requestDate = new Date(fromDate)
      
      if (Math.abs(today.getTime() - requestDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) {
        // Within 7 days - use real-time API
        try {
          const response = type === 'arrivals' 
            ? await this.flightApiService.getArrivals(airportCode)
            : await this.flightApiService.getDepartures(airportCode)
          
          if (response.success && response.data.length > 0) {
            return response.data.map(flight => this.convertToFlightSchedule(flight))
          }
        } catch (apiError) {
          console.warn(`Real-time API failed for ${airportCode} ${type}:`, apiError)
          // Continue to try historical data or return empty
        }
      }
      
      // For historical dates or if real-time failed, try to get historical data from AeroDataBox
      try {
        const flights = await this.aeroDataBoxService.getFlights(airportCode, type, fromDate, toDate)
        if (flights.length > 0) {
          return flights.map(flight => this.convertAeroDataBoxToSchedule(flight, type, airportCode))
        }
      } catch (historicalError) {
        console.warn(`Historical data failed for ${airportCode} ${type}:`, historicalError)
      }
      
      // If both real-time and historical fail, return empty array
      console.warn(`No flight data available for ${airportCode} ${type} from ${fromDate} to ${toDate}`)
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
      // Get live flight data for analysis
      const arrivalsResponse = await this.flightApiService.getArrivals(airportCode)
      const departuresResponse = await this.flightApiService.getDepartures(airportCode)
      
      const allFlights = [
        ...(arrivalsResponse.success ? arrivalsResponse.data : []),
        ...(departuresResponse.success ? departuresResponse.data : [])
      ]
      
      if (allFlights.length === 0) {
        console.warn(`No live flight data available for ${airportCode}`)
        // Return null statistics instead of demo data
        throw new Error('Nu sunt suficiente date pentru a afișa această informație')
      }
      
      // Calculate real statistics from live data with proper status mapping
      const totalFlights = allFlights.length
      
      // Map various status formats to standard categories
      const onTimeFlights = allFlights.filter(f => {
        const status = f.status?.toLowerCase() || ''
        return status === 'on-time' || status === 'scheduled' || status === 'landed' || 
               status === 'departed' || status === 'active' || status === 'en-route'
      }).length
      
      const delayedFlights = allFlights.filter(f => {
        const status = f.status?.toLowerCase() || ''
        return status === 'delayed' || (f.delay && f.delay > 15) // Consider 15+ min as delayed
      }).length
      
      const cancelledFlights = allFlights.filter(f => {
        const status = f.status?.toLowerCase() || ''
        return status === 'cancelled' || status === 'canceled'
      }).length
      
      // Calculate average delay from flights with actual delay data
      const flightsWithDelay = allFlights.filter(f => f.delay && f.delay > 0)
      const averageDelay = flightsWithDelay.length > 0 
        ? Math.round(flightsWithDelay.reduce((sum, f) => sum + (f.delay || 0), 0) / flightsWithDelay.length)
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
      const data: HistoricalData[] = []
      const start = new Date(fromDate)
      const end = new Date(toDate)
      
      // For each day in the range, try to get historical data
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        
        try {
          // Try to get historical flights for this specific date
          const flights = await this.aeroDataBoxService.getFlights(
            airportCode, 
            'arrivals', 
            dateStr, 
            dateStr
          )
          
          const departureFlights = await this.aeroDataBoxService.getFlights(
            airportCode, 
            'departures', 
            dateStr, 
            dateStr
          )
          
          const allFlights = [...flights, ...departureFlights]
          
          if (allFlights.length > 0) {
            const totalFlights = allFlights.length
            const cancelledFlights = allFlights.filter(f => 
              f.status?.text?.toLowerCase().includes('cancelled')
            ).length
            
            const onTimeFlights = allFlights.filter(f => {
              const status = f.status?.text?.toLowerCase() || ''
              return !status.includes('delayed') && !status.includes('cancelled')
            }).length
            
            // Calculate average delay
            const delayedFlights = allFlights.filter(f => {
              const scheduled = f.departure?.scheduledTime || f.arrival?.scheduledTime
              const actual = f.departure?.actualTime || f.arrival?.actualTime
              return scheduled && actual
            })
            
            let averageDelay = 0
            if (delayedFlights.length > 0) {
              const totalDelay = delayedFlights.reduce((sum, f) => {
                const scheduled = new Date(f.departure?.scheduledTime?.utc || f.arrival?.scheduledTime?.utc || '')
                const actual = new Date(f.departure?.actualTime?.utc || f.arrival?.actualTime?.utc || '')
                const delay = Math.max(0, (actual.getTime() - scheduled.getTime()) / (1000 * 60))
                return sum + delay
              }, 0)
              averageDelay = Math.round(totalDelay / delayedFlights.length)
            }
            
            data.push({
              date: dateStr,
              totalFlights,
              averageDelay,
              cancelledFlights,
              onTimePercentage: Math.round((onTimeFlights / totalFlights) * 100)
            })
          }
        } catch (dayError) {
          console.warn(`No data available for ${airportCode} on ${dateStr}:`, dayError)
          // Skip this day if no data available
        }
      }
      
      return data
      
    } catch (error) {
      console.error(`Error fetching live historical data for ${airportCode}:`, error)
      return []
    }
  }

  private async analyzeLiveRoutes(airportCode: string): Promise<RouteAnalysis[]> {
    try {
      // Get live flight data for route analysis
      const arrivalsResponse = await this.flightApiService.getArrivals(airportCode)
      const departuresResponse = await this.flightApiService.getDepartures(airportCode)
      
      const allFlights = [
        ...(arrivalsResponse.success ? arrivalsResponse.data : []),
        ...(departuresResponse.success ? departuresResponse.data : [])
      ]
      
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
        const onTimeFlights = route.flights.filter(f => {
          const status = f.status?.toLowerCase() || ''
          const delay = f.delay || 0
          return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                  status === 'departed' || status === 'active' || status === 'en-route') && 
                 delay <= 15 // Consider up to 15 minutes as on-time
        })
        
        const delayedFlights = route.flights.filter(f => {
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
      // Try to get aircraft info from AeroDataBox
      const aircraft = await this.aeroDataBoxService.getAircraftInfo(icao24)
      
      if (aircraft) {
        // Get flight history for statistics
        const flights = await this.aeroDataBoxService.getAircraftFlights(icao24)
        
        const totalFlights = flights.length
        const delayedFlights = flights.filter(f => {
          const departure = f.departure
          const arrival = f.arrival
          return (departure?.actualTime && departure?.scheduledTime) ||
                 (arrival?.actualTime && arrival?.scheduledTime)
        })
        
        let averageDelay = 0
        if (delayedFlights.length > 0) {
          const totalDelay = delayedFlights.reduce((sum, f) => {
            let delay = 0
            
            if (f.departure?.actualTime && f.departure?.scheduledTime) {
              const scheduled = new Date(f.departure.scheduledTime.utc)
              const actual = new Date(f.departure.actualTime.utc)
              delay = Math.max(0, (actual.getTime() - scheduled.getTime()) / (1000 * 60))
            }
            
            return sum + delay
          }, 0)
          
          averageDelay = Math.round(totalDelay / delayedFlights.length)
        }
        
        return {
          icao24,
          registration: aircraft.reg || icao24,
          model: aircraft.model || 'Unknown',
          manufacturer: this.extractManufacturer(aircraft.model || ''),
          operator: 'Unknown', // AeroDataBox doesn't provide operator in aircraft endpoint
          firstFlightDate: undefined, // Not available in AeroDataBox
          totalFlights,
          averageDelay
        }
      }
      
      return null
      
    } catch (error) {
      console.error(`Error fetching live aircraft info for ${icao24}:`, error)
      return null
    }
  }

  private async searchLiveAircraft(registration: string): Promise<AircraftInfo[]> {
    try {
      // Search for aircraft by registration
      const aircraft = await this.aeroDataBoxService.getAircraftInfo(registration)
      
      if (aircraft) {
        const aircraftInfo = await this.fetchLiveAircraftInfo(registration)
        return aircraftInfo ? [aircraftInfo] : []
      }
      
      return []
      
    } catch (error) {
      console.error(`Error searching live aircraft by registration ${registration}:`, error)
      return []
    }
  }

  /**
   * Clear all cached data (for admin use)
   */
  clearCache(): void {
    analyticsCache.clear()
  }

  /**
   * Clear cache entries matching a pattern (for admin use)
   */
  clearCachePattern(pattern: string): void {
    analyticsCache.clearPattern(pattern)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { 
    size: number; 
    keys: string[]; 
    lastApiCall: string | null;
    apiRequestCount: number;
    cacheEntries: Array<{key: string, timestamp: string, ttl: number, expired: boolean}>
  } {
    return analyticsCache.getStats()
  }

  /**
   * Reset API request counter
   */
  resetApiRequestCount(): void {
    analyticsCache.resetApiRequestCount()
  }

  /**
   * Get cached data by key
   */
  getCachedData<T>(key: string): T | null {
    return analyticsCache.get<T>(key)
  }

  /**
   * Set cached data with TTL
   */
  setCachedData(key: string, data: any, ttl?: number): void {
    analyticsCache.set(key, data, ttl)
  }

  /**
   * Mark that an API call was made
   */
  markApiCall(): void {
    analyticsCache.setLastApiCall()
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




}

// Export singleton instance
export const flightAnalyticsService = new FlightAnalyticsService()