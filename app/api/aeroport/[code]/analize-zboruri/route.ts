import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'
import { getAirportByCodeOrSlug } from '@/lib/airports'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    
    // Validate airport exists (supports both codes and slugs)
    const airport = getAirportByCodeOrSlug(code)
    if (!airport) {
      return NextResponse.json(
        { error: 'Aeroportul nu a fost găsit' },
        { status: 404 }
      )
    }

    console.log(`[Route Analysis API] Starting analysis for ${airport.code}`)

    // SOLUTION: Use internal API calls instead of direct repository access
    const baseUrl = 'https://anyway.ro' // Use full URL for internal calls
    
    try {
      // Make internal API calls to the working endpoints
      const [arrivalsResponse, departuresResponse] = await Promise.all([
        fetch(`${baseUrl}/api/flights/${airport.code}/arrivals`, {
          headers: { 'User-Agent': 'Internal-Route-Analysis' }
        }),
        fetch(`${baseUrl}/api/flights/${airport.code}/departures`, {
          headers: { 'User-Agent': 'Internal-Route-Analysis' }
        })
      ])
      
      let arrivals = []
      let departures = []
      
      if (arrivalsResponse.ok) {
        const arrivalsData = await arrivalsResponse.json()
        arrivals = arrivalsData.success ? (arrivalsData.data || []) : []
        console.log(`[Route Analysis API] Arrivals API success: ${arrivalsData.success}, count: ${arrivals.length}`)
      } else {
        console.log(`[Route Analysis API] Arrivals API failed: ${arrivalsResponse.status}`)
      }
      
      if (departuresResponse.ok) {
        const departuresData = await departuresResponse.json()
        departures = departuresData.success ? (departuresData.data || []) : []
        console.log(`[Route Analysis API] Departures API success: ${departuresData.success}, count: ${departures.length}`)
      } else {
        console.log(`[Route Analysis API] Departures API failed: ${departuresResponse.status}`)
      }
      
      const allFlights = [...arrivals, ...departures]
      
      console.log(`[Route Analysis API] Total flights for analysis: ${allFlights.length}`)
      
      if (allFlights.length === 0) {
        console.log(`[Route Analysis API] No flights found, returning empty analysis`)
        return NextResponse.json({
          airport: {
            code: airport.code,
            name: airport.name,
            city: airport.city,
            country: airport.country
          },
          summary: {
            totalRoutes: 0,
            totalFlights: 0,
            averageDelay: 0,
            onTimePercentage: 0,
            uniqueAirlines: 0
          },
          analysis: {
            topDestinations: [],
            mostPunctual: [],
            mostDelayed: [],
            allRoutes: []
          }
        })
      }
      
      // Route analysis logic
      const routeMap = new Map()
      
      allFlights.forEach((flight, index) => {
        const origin = flight.origin?.code
        const destination = flight.destination?.code
        
        if (index < 3) {
          console.log(`[Route Analysis API] Processing flight ${index + 1}: ${flight.flight_number} from ${origin} to ${destination}`)
        }
        
        if (!origin || !destination || origin === destination) {
          return
        }
        
        let otherAirport
        if (origin === airport.code) {
          otherAirport = destination
        } else if (destination === airport.code) {
          otherAirport = origin
        } else {
          return
        }
        
        if (!routeMap.has(otherAirport)) {
          routeMap.set(otherAirport, {
            destination: otherAirport,
            flightCount: 0,
            airlines: new Set(),
            delays: []
          })
        }
        
        const route = routeMap.get(otherAirport)
        route.flightCount++
        route.airlines.add(flight.airline?.code || 'Unknown')
        if (flight.delay && flight.delay > 0) route.delays.push(flight.delay)
      })
      
      console.log(`[Route Analysis API] Found ${routeMap.size} unique routes`)
      
      // Convert to analysis format
      const routes = Array.from(routeMap.values()).map(route => {
        const avgDelay = route.delays.length > 0 
          ? Math.round(route.delays.reduce((sum: number, delay: number) => sum + delay, 0) / route.delays.length)
          : 0
        
        return {
          origin: airport.code,
          destination: route.destination,
          flightCount: route.flightCount,
          averageDelay: avgDelay,
          onTimePercentage: Math.max(60, 100 - Math.min(40, Math.round(avgDelay / 3))),
          airlines: Array.from(route.airlines)
        }
      }).sort((a, b) => b.flightCount - a.flightCount)

      const routeAnalysis = routes
      
      // Sort routes by frequency
      const sortedRoutes = routeAnalysis.sort((a, b) => b.flightCount - a.flightCount)

      // Get top destinations (most frequent routes)
      const topDestinations = sortedRoutes.slice(0, 10)

      // Get most punctual routes (highest on-time percentage)
      const mostPunctual = [...routeAnalysis]
        .sort((a, b) => b.onTimePercentage - a.onTimePercentage)
        .slice(0, 5)

      // Get most delayed routes (highest average delay)
      const mostDelayed = [...routeAnalysis]
        .sort((a, b) => b.averageDelay - a.averageDelay)
        .slice(0, 5)

      // Calculate summary statistics
      const totalRoutes = routeAnalysis.length
      const totalFlights = routeAnalysis.reduce((sum, route) => sum + route.flightCount, 0)
      const avgDelay = routeAnalysis.length > 0
        ? Math.round(routeAnalysis.reduce((sum, route) => sum + route.averageDelay, 0) / routeAnalysis.length)
        : 0
      const avgOnTime = routeAnalysis.length > 0
        ? Math.round(routeAnalysis.reduce((sum, route) => sum + route.onTimePercentage, 0) / routeAnalysis.length)
        : 0

      // Get unique airlines
      const allAirlines = new Set<string>()
      routeAnalysis.forEach(route => {
        route.airlines.forEach((airline: unknown) => {
          if (typeof airline === 'string') {
            allAirlines.add(airline)
          }
        })
      })

      console.log(`[Route Analysis API] Returning analysis with ${totalRoutes} routes, ${totalFlights} total flights`)

      return NextResponse.json({
        airport: {
          code: airport.code,
          name: airport.name,
          city: airport.city,
          country: airport.country
        },
        summary: {
          totalRoutes,
          totalFlights,
          averageDelay: avgDelay,
          onTimePercentage: avgOnTime,
          uniqueAirlines: Array.from(allAirlines).length
        },
        analysis: {
          topDestinations,
          mostPunctual,
          mostDelayed,
          allRoutes: sortedRoutes
        }
      })
      
    } catch (analysisError) {
      console.error(`[Route Analysis API] Error during analysis:`, analysisError)
      return NextResponse.json({
        airport: {
          code: airport.code,
          name: airport.name,
          city: airport.city,
          country: airport.country
        },
        summary: {
          totalRoutes: 0,
          totalFlights: 0,
          averageDelay: 0,
          onTimePercentage: 0,
          uniqueAirlines: 0
        },
        analysis: {
          topDestinations: [],
          mostPunctual: [],
          mostDelayed: [],
          allRoutes: []
        },
        error: `Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`
      })
    }

  } catch (error) {
    console.error('API Error - Route Analysis:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}