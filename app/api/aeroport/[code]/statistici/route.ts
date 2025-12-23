import { NextRequest, NextResponse } from 'next/server'
import { getAirportByCodeOrSlug } from '@/lib/airports'
import { cacheManager } from '@/lib/cacheManager'

// Helper function to calculate peak delay hours
function calculatePeakDelayHours(flights: any[]): number[] {
  const hourDelayMap = new Map<number, number[]>()
  
  flights.forEach(flight => {
    const scheduledTime = flight.scheduled_time || flight.scheduledTime
    if (!scheduledTime) return
    
    const flightDate = new Date(scheduledTime)
    const hour = flightDate.getHours()
    
    // Check if flight is delayed
    const status = flight.status?.toLowerCase() || ''
    const isDelayed = status === 'delayed' || status.includes('delay')
    
    if (isDelayed) {
      if (!hourDelayMap.has(hour)) {
        hourDelayMap.set(hour, [])
      }
      const delayMinutes = flight.delayMinutes || flight.delay || 30
      hourDelayMap.get(hour)!.push(delayMinutes)
    }
  })
  
  // Calculate average delay per hour and return top 4
  const hourAverages: { hour: number; avgDelay: number }[] = []
  hourDelayMap.forEach((delays, hour) => {
    const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length
    hourAverages.push({ hour, avgDelay })
  })
  
  return hourAverages
    .sort((a, b) => b.avgDelay - a.avgDelay)
    .slice(0, 4)
    .map(item => item.hour)
}

// Helper function to calculate most frequent routes
function calculateMostFrequentRoutes(flights: any[], airportCode: string): any[] {
  const routeMap = new Map<string, {
    flights: any[]
    origin: string
    destination: string
    airlines: Set<string>
  }>()
  
  flights.forEach(flight => {
    const origin = flight.origin?.code || flight.originCode
    const destination = flight.destination?.code || flight.destinationCode
    
    if (!origin || !destination || origin === destination) return
    
    // Determine the other airport (not the current one)
    let otherAirport: string
    let routeKey: string
    
    if (origin === airportCode) {
      otherAirport = destination
      routeKey = `${airportCode}-${destination}`
    } else if (destination === airportCode) {
      otherAirport = origin
      routeKey = `${origin}-${airportCode}`
    } else {
      return // Flight doesn't involve our airport
    }
    
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, {
        flights: [],
        origin: airportCode,
        destination: otherAirport,
        airlines: new Set()
      })
    }
    
    const route = routeMap.get(routeKey)!
    route.flights.push(flight)
    
    // Get airline code and add to set
    const airlineCode = flight.airline?.code || flight.airlineCode || 'XX'
    route.airlines.add(airlineCode)
  })
  
  // Convert to route analysis format
  const routes: any[] = []
  
  routeMap.forEach((route) => {
    const flightCount = route.flights.length
    
    // Calculate delay statistics for routes
    let onTimeCount = 0
    let delayedCount = 0
    const delayCalculations: number[] = []
    
    route.flights.forEach((f: any) => {
      const status = f.status?.toLowerCase() || ''
      const isDelayed = status === 'delayed' || status.includes('delay')
      
      if (isDelayed) {
        delayedCount++
        const delayMinutes = f.delayMinutes || f.delay || 30
        delayCalculations.push(delayMinutes)
      } else {
        onTimeCount++
      }
    })
    
    const averageDelay = delayCalculations.length > 0
      ? Math.round(delayCalculations.reduce((sum, delay) => sum + delay, 0) / delayCalculations.length)
      : 0
    
    const onTimePercentage = flightCount > 0 ? Math.round((onTimeCount / flightCount) * 100) : 0
    
    routes.push({
      origin: route.origin,
      destination: route.destination,
      flightCount,
      averageDelay,
      onTimePercentage,
      airlines: Array.from(route.airlines)
    })
  })
  
  // Return top 15 routes by flight count
  return routes.sort((a, b) => b.flightCount - a.flightCount).slice(0, 15)
}

// Helper function to calculate busy hours
function calculateBusyHours(flights: any[]): number[] {
  const hourFlightMap = new Map<number, number>()
  
  flights.forEach(flight => {
    const scheduledTime = flight.scheduled_time || flight.scheduledTime
    if (!scheduledTime) return
    
    const flightDate = new Date(scheduledTime)
    const hour = flightDate.getHours()
    
    hourFlightMap.set(hour, (hourFlightMap.get(hour) || 0) + 1)
  })
  
  // Return top 4 busiest hours
  return Array.from(hourFlightMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([hour]) => hour)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { searchParams } = new URL(request.url)
    
    // Validate airport exists (supports both codes and slugs)
    const airport = getAirportByCodeOrSlug(code)
    if (!airport) {
      console.log(`Airport not found for identifier: ${code}`)
      return NextResponse.json(
        { error: `Aeroportul nu a fost găsit pentru: ${code}` },
        { status: 404 }
      )
    }

    // Get query parameters
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'monthly'

    // Validate parameters
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Perioada trebuie să fie "daily", "weekly" sau "monthly"' },
        { status: 400 }
      )
    }

    // Convert IATA to ICAO for cache lookup
    console.log(`Getting statistics for ${airport.code}`)

    // Initialize cache manager first
    await cacheManager.initialize()
    
    // Check if we have flight data in cache
    const arrivalsKey = `${airport.code}_arrivals`
    const departuresKey = `${airport.code}_departures`
    
    const cachedArrivals = await cacheManager.getCachedDataWithPersistent<any[]>(arrivalsKey) || []
    const cachedDepartures = await cacheManager.getCachedDataWithPersistent<any[]>(departuresKey) || []
    
    let allFlights = [...cachedArrivals, ...cachedDepartures]
    
    // Filter flights based on period
    const now = new Date()
    let startDate: Date
    let endDate: Date = now
    
    switch (period) {
      case 'daily':
        // Last 24 hours (or closest available data)
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        // Last 7 days (or closest available data)
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        // Last 30 days (or closest available data)
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    
    // Get all flight dates to understand available data range
    const flightDates = allFlights
      .map(flight => {
        const dateStr = flight.scheduled_time || flight.scheduledTime
        return dateStr ? new Date(dateStr) : null
      })
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime())
    
    // If we have historical data, adjust the filtering logic
    if (flightDates.length > 0) {
      const oldestFlight = flightDates[0]!
      const newestFlight = flightDates[flightDates.length - 1]!
      
      // If all data is historical (older than our start date), use the most recent available data
      if (newestFlight < startDate) {
        // Use the most recent period of available data
        switch (period) {
          case 'daily':
            startDate = new Date(newestFlight.getTime() - 24 * 60 * 60 * 1000)
            endDate = newestFlight
            break
          case 'weekly':
            startDate = new Date(newestFlight.getTime() - 7 * 24 * 60 * 60 * 1000)
            endDate = newestFlight
            break
          case 'monthly':
            startDate = new Date(newestFlight.getTime() - 30 * 24 * 60 * 60 * 1000)
            endDate = newestFlight
            break
        }
      }
      // If data spans across our desired period, use intersection
      else if (oldestFlight < startDate && newestFlight > startDate) {
        // Keep original startDate, but adjust endDate if needed
        endDate = newestFlight > now ? now : newestFlight
      }
    }
    
    // Filter flights by date range
    allFlights = allFlights.filter(flight => {
      if (!flight.scheduled_time && !flight.scheduledTime) return true // Include if no date info
      
      const flightDate = new Date(flight.scheduled_time || flight.scheduledTime)
      return flightDate >= startDate && flightDate <= endDate
    })
    
    console.log(`Filtered ${allFlights.length} flights for period ${period} (from ${startDate.toISOString()} to ${endDate.toISOString()})`)
    
    if (allFlights.length === 0) {
      console.log(`No flight data available for ${airport.code} in period ${period}`)
      
      // Return message instead of zeros
      return NextResponse.json({
        airport: {
          code: airport.code,
          name: airport.name,
          city: airport.city,
          country: airport.country
        },
        statistics: null,
        message: `Nu sunt suficiente date pentru perioada ${period === 'daily' ? 'zilnică' : period === 'weekly' ? 'săptămânală' : 'lunară'}. Datele se actualizează automat.`,
        hasData: false,
        period: period
      })
    }

    // Calculate statistics from cached flight data
    const totalFlights = allFlights.length
    
    // Calculate on-time flights - include estimated and scheduled as on-time
    const onTimeFlights = allFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status === 'on-time' || status === 'landed' || status === 'departed' || 
             status === 'arrived' || status === 'completed' || status === 'estimated' ||
             status === 'scheduled' || status === 'active' || status === 'boarding'
    }).length
    
    // Calculate delayed flights
    const delayedFlights = allFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status === 'delayed' || status.includes('delay')
    }).length
    
    // Calculate cancelled flights
    const cancelledFlights = allFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status.includes('cancel') || status === 'cancelled'
    }).length
    
    // Calculate average delay realistă
    let averageDelay = 0
    if (delayedFlights > 0) {
      // Calculate actual average delay from flight data if available
      const delayedFlightsList = allFlights.filter(flight => {
        const status = flight.status?.toLowerCase() || ''
        return status === 'delayed' || status.includes('delay')
      })
      
      if (delayedFlightsList.length > 0) {
        const totalDelay = delayedFlightsList.reduce((sum, flight) => {
          return sum + (flight.delayMinutes || flight.delay || 30) // Default 30 min if no delay info
        }, 0)
        averageDelay = Math.round(totalDelay / delayedFlightsList.length)
      }
    }
    
    // Calculate on-time percentage - doar din zborurile finalizate
    const completedFlights = onTimeFlights + delayedFlights + cancelledFlights
    const onTimePercentage = completedFlights > 0 ? Math.round((onTimeFlights / completedFlights) * 100) : 
                            (totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0) // Use actual onTimeFlights
    
    // Calculate delay index (higher is worse)
    const delayIndex = totalFlights > 0 ? Math.round((delayedFlights / totalFlights) * 100) : 0
    
    // Calculate peak delay hours from flight data
    const peakDelayHours = calculatePeakDelayHours(allFlights)
    
    // Calculate most frequent routes
    const mostFrequentRoutes = calculateMostFrequentRoutes(allFlights, airport.code)
    
    // Calculate busy hours
    const busyHours = calculateBusyHours(allFlights)
    
    // Basic statistics structure
    const statistics = {
      totalFlights,
      onTimePercentage,
      averageDelay,
      cancelledFlights,
      delayedFlights,
      onTimeFlights,
      delayIndex,
      busyHours,
      peakDelayHours,
      popularDestinations: [], // Could be calculated from flight destinations
      mostFrequentRoutes,
      aircraftTypes: [], // Could be calculated from aircraft data
      airlines: [], // Could be calculated from airline data
      period: period,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      airport: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country
      },
      statistics,
      hasData: true
    })

  } catch (error) {
    console.error('Error in airport statistics API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}