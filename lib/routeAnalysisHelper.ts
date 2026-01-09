/**
 * Helper pentru analiza rutelor - accesează direct datele de zboruri
 */

import { getFlightRepository } from './flightRepository'

export interface RouteAnalysisResult {
  origin: string
  destination: string
  flightCount: number
  averageDelay: number
  onTimePercentage: number
  airlines: string[]
}

export async function analyzeRoutes(airportCode: string): Promise<RouteAnalysisResult[]> {
  try {
    console.log(`[Route Helper] Analyzing routes for ${airportCode}`)
    
    // Get flight repository
    const flightRepository = getFlightRepository()
    
    // Get flight data
    const arrivalsResult = await flightRepository.getArrivals(airportCode, {})
    const departuresResult = await flightRepository.getDepartures(airportCode, {})
    
    const arrivals = arrivalsResult.data || []
    const departures = departuresResult.data || []
    const allFlights = [...arrivals, ...departures]
    
    console.log(`[Route Helper] Found ${arrivals.length} arrivals, ${departures.length} departures, total: ${allFlights.length}`)
    
    if (allFlights.length === 0) {
      console.log(`[Route Helper] No flight data available`)
      return []
    }
    
    // Group flights by route
    const routeMap = new Map<string, {
      flights: any[]
      airlines: Set<string>
    }>()
    
    allFlights.forEach((flight, index) => {
      const origin = flight.origin?.code || flight.origin
      const destination = flight.destination?.code || flight.destination
      
      if (index < 3) {
        console.log(`[Route Helper] Flight ${index + 1}: ${flight.flight_number} from ${origin} to ${destination}`)
      }
      
      // Skip invalid routes
      if (!origin || !destination || origin === destination) {
        return
      }
      
      // Determine route key
      let routeKey: string
      let otherAirport: string
      
      if (origin === airportCode) {
        // Departure - show destination
        otherAirport = typeof destination === 'string' ? destination : destination.code || destination.airport
        routeKey = `${airportCode}-${typeof destination === 'string' ? destination : destination.code || destination.airport}`
      } else if (destination === airportCode) {
        // Arrival - show origin
        otherAirport = typeof origin === 'string' ? origin : origin.code || origin.airport
        routeKey = `${typeof origin === 'string' ? origin : origin.code || origin.airport}-${airportCode}`
      } else {
        // Flight doesn't involve our airport
        return
      }
      
      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          flights: [],
          airlines: new Set()
        })
      }
      
      const route = routeMap.get(routeKey)!
      route.flights.push(flight)
      route.airlines.add(flight.airline?.code || 'Unknown')
    })
    
    console.log(`[Route Helper] Found ${routeMap.size} unique routes`)
    
    // Convert to result format
    const routes: RouteAnalysisResult[] = []
    
    routeMap.forEach((route, routeKey) => {
      const flightCount = route.flights.length
      
      // Calculate on-time performance
      const onTimeFlights = route.flights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        const delay = f.delay || 0
        return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                status === 'departed' || status === 'active' || status === 'en-route') && 
               delay <= 15
      })
      
      const delayedFlights = route.flights.filter((f: any) => {
        const delay = f.delay || 0
        return delay > 15
      })
      
      const averageDelay = delayedFlights.length > 0
        ? Math.round(delayedFlights.reduce((sum, f) => sum + (f.delay || 0), 0) / delayedFlights.length)
        : 0
      
      const onTimePercentage = flightCount > 0 ? Math.round((onTimeFlights.length / flightCount) * 100) : 0
      
      // Determine other airport (destination for display)
      const otherAirport = routeKey.split('-').find(code => code !== airportCode) || 'Unknown'
      
      routes.push({
        origin: airportCode,
        destination: otherAirport,
        flightCount,
        averageDelay,
        onTimePercentage,
        airlines: Array.from(route.airlines)
      })
    })
    
    // Sort by flight count and return top 15
    const sortedRoutes = routes.sort((a, b) => b.flightCount - a.flightCount).slice(0, 15)
    
    console.log(`[Route Helper] Returning ${sortedRoutes.length} routes`)
    
    return sortedRoutes
    
  } catch (error) {
    console.error(`[Route Helper] Error analyzing routes for ${airportCode}:`, error)
    return []
  }
}