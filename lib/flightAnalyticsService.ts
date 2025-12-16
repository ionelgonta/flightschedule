/**
 * Enhanced Flight Analytics Service
 * Folosește noul sistem de cache centralizat - NU mai face request-uri API direct
 */

import { RawFlightData } from './flightApiService'
import { cacheManager } from './cacheManager'
import { getAirlineName, getCityName, formatAirportDisplay, formatAirlineDisplay } from './airlineMapping'

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
      cronInterval: config.realtimeInterval,
      cacheUntilNext: true
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
  constructor() {
    // Inițializează cache manager-ul
    cacheManager.initialize().catch(console.error)
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
    const cacheKey = `schedules_${airportCode}_${type}_${fromDate}_${toDate}`
    
    try {
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = await cacheManager.getCachedData<FlightSchedule[]>('analytics', cacheKey)
      
      if (cachedData && cachedData.length > 0) {
        console.log(`Cache hit for schedules: ${cacheKey}`)
        return cachedData
      }

      // Nu există date în cache - returnează array gol
      console.log(`No cached schedules for ${airportCode} ${type}`)
      return []
      
    } catch (error) {
      console.error('Error getting cached flight schedules:', error)
      return []
    }
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
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = await cacheManager.getCachedData<AirportStatistics>('analytics', cacheKey)
      
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
   * Get aircraft information - DOAR din cache
   */
  async getAircraftInfo(icao24: string): Promise<AircraftInfo | null> {
    const cacheKey = `aircraft_${icao24}`
    
    try {
      // Citește DOAR din cache - nu face request-uri API
      const cachedData = await cacheManager.getCachedData<AircraftInfo>('aircraft', cacheKey)
      
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




}

// Export singleton instance
export const flightAnalyticsService = new FlightAnalyticsService()