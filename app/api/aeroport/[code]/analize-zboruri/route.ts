import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'
import { getAirportByCodeOrSlug } from '@/lib/airports'
import { getIcaoCode } from '@/lib/icaoMapping'

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

    // Convert IATA to ICAO for cache lookup
    const icaoCode = getIcaoCode(airport.code)
    console.log(`Getting route analysis for ${airport.code} (ICAO: ${icaoCode})`)

    // Get route analysis using ICAO code
    const routeAnalysis = await flightAnalyticsService.getRouteAnalysis(
      icaoCode
    )

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
      route.airlines.forEach(airline => allAirlines.add(airline))
    })

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

  } catch (error) {
    console.error('Error in flight analysis API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}