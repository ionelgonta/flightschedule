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

// Helper function to detect codeshare flights
function isCodeshareFlightNumber(flightNumber: string, airline: string): boolean {
  if (!flightNumber || !airline) return false
  
  // Codeshare patterns
  const codesharePatterns = [
    /\*/, // Asterisk indicates codeshare
    /operated by/i,
    /op by/i,
  ]
  
  // Check if flight number contains codeshare indicators
  if (codesharePatterns.some(pattern => pattern.test(flightNumber))) {
    return true
  }
  
  // Extract flight prefix (airline code from flight number)
  const flightPrefix = flightNumber.replace(/[^A-Z]/g, '').substring(0, 2)
  const airlineUpper = airline.toUpperCase()
  
  // Common codeshare mismatches - flight code doesn't match airline
  const codeShareMismatches = [
    { flight: 'JL', airline: 'BRITISH' }, // Japan Airlines code on British Airways
    { flight: 'AA', airline: 'BRITISH' }, // American Airlines code on British Airways
    { flight: 'KL', airline: 'BRITISH' }, // KLM code on British Airways
    { flight: 'LH', airline: 'BRITISH' }, // Lufthansa code on British Airways
    { flight: 'AF', airline: 'BRITISH' }, // Air France code on British Airways
    { flight: 'BA', airline: 'LUFTHANSA' }, // British Airways code on Lufthansa
    { flight: 'LH', airline: 'UNITED' }, // Lufthansa code on United
    { flight: 'UA', airline: 'LUFTHANSA' }, // United code on Lufthansa
    { flight: 'DL', airline: 'KLM' }, // Delta code on KLM
    { flight: 'KL', airline: 'DELTA' }, // KLM code on Delta
  ]
  
  return codeShareMismatches.some(mismatch => 
    flightPrefix === mismatch.flight && airlineUpper.includes(mismatch.airline)
  )
}

// Helper function to calculate most frequent routes (excluding codeshare flights)
function calculateMostFrequentRoutes(flights: any[], airportCode: string): any[] {
  console.log(`[ROUTE CALC] Starting calculation for ${airportCode} with ${flights.length} flights`)
  
  const routeMap = new Map<string, {
    flights: any[]
    origin: string
    destination: string
    airlines: Set<string>
  }>()
  
  flights.forEach(flight => {
    const origin = flight.origin?.code || flight.originCode
    const destination = flight.destination?.code || flight.destinationCode
    const flightNumber = flight.flight_number || flight.flightNumber || ''
    const airlineName = flight.airline?.name || flight.airlineName || ''
    
    if (!origin || !destination || origin === destination) return
    
    // Skip codeshare flights
    if (isCodeshareFlightNumber(flightNumber, airlineName)) {
      return
    }
    
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
    
    // Count flights per airline to show most frequent operators
    const airlineFlightCount = new Map<string, number>()
    route.flights.forEach(flight => {
      const airlineCode = flight.airline?.code || flight.airlineCode || 'XX'
      airlineFlightCount.set(airlineCode, (airlineFlightCount.get(airlineCode) || 0) + 1)
    })
    
    // Sort airlines by flight count and take top 2 most frequent
    const topAirlines = Array.from(airlineFlightCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([code]) => code)
    
    console.log(`Route ${route.destination}: ${airlineFlightCount.size} total airlines, showing top 2: ${topAirlines.join(', ')}`)
    
    routes.push({
      origin: route.origin,
      destination: route.destination,
      flightCount,
      averageDelay,
      onTimePercentage,
      airlines: topAirlines // Show only top 2 airlines by flight count
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
  console.log(`[STATISTICS API] Request for airport: ${params.code}`)
  
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
    
    const cachedArrivals = await cacheManager.getCachedDataWithPersistent<any>(arrivalsKey) || []
    const cachedDepartures = await cacheManager.getCachedDataWithPersistent<any>(departuresKey) || []
    
    // Handle both old format (array) and new format (object with flights + weather_info)
    const arrivalsFlights = Array.isArray(cachedArrivals) ? cachedArrivals : (cachedArrivals?.flights || [])
    const departuresFlights = Array.isArray(cachedDepartures) ? cachedDepartures : (cachedDepartures?.flights || [])
    
    let allFlights = [...arrivalsFlights, ...departuresFlights]
    
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
    
    // Filter out codeshare flights from all statistics calculations
    const nonCodeshareFlights = allFlights.filter(flight => {
      const flightNumber = flight.flight_number || flight.flightNumber || ''
      const airlineName = flight.airline?.name || flight.airlineName || ''
      return !isCodeshareFlightNumber(flightNumber, airlineName)
    })
    
    console.log(`Filtered out codeshare flights: ${allFlights.length} → ${nonCodeshareFlights.length} flights (removed ${allFlights.length - nonCodeshareFlights.length} codeshare flights)`)
    
    if (nonCodeshareFlights.length === 0) {
      console.log(`No non-codeshare flight data available for ${airport.code} in period ${period}`)
      
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

    // Calculate statistics from non-codeshare flight data only
    const totalFlights = nonCodeshareFlights.length
    
    // Calculate on-time flights - include estimated and scheduled as on-time
    const onTimeFlights = nonCodeshareFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status === 'on-time' || status === 'landed' || status === 'departed' || 
             status === 'arrived' || status === 'completed' || status === 'estimated' ||
             status === 'scheduled' || status === 'active' || status === 'boarding'
    }).length
    
    // Calculate delayed flights
    const delayedFlights = nonCodeshareFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status === 'delayed' || status.includes('delay')
    }).length
    
    // Calculate cancelled flights
    const cancelledFlights = nonCodeshareFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status.includes('cancel') || status === 'cancelled'
    }).length
    
    // Calculate average delay realistă
    let averageDelay = 0
    if (delayedFlights > 0) {
      // Calculate actual average delay from flight data if available
      const delayedFlightsList = nonCodeshareFlights.filter(flight => {
        const status = flight.status?.toLowerCase() || ''
        return status === 'delayed' || status.includes('delay')
      })
      
      if (delayedFlightsList.length > 0) {
        const delayValues: number[] = []
        
        delayedFlightsList.forEach(flight => {
          let delayMinutes = 0
          
          // Try to get delay from various fields
          if (flight.delayMinutes && typeof flight.delayMinutes === 'number') {
            delayMinutes = flight.delayMinutes
          } else if (flight.delay && typeof flight.delay === 'number') {
            delayMinutes = flight.delay
          } else if (flight.scheduled_time && (flight.actual_time || flight.estimated_time)) {
            // Calculate delay from time difference
            const scheduledTime = new Date(flight.scheduled_time)
            const actualTime = new Date(flight.actual_time || flight.estimated_time)
            delayMinutes = Math.max(0, (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60))
          } else {
            // Default delay for flights marked as delayed but no specific time
            delayMinutes = 25
          }
          
          // Cap extreme delays to avoid distortion (max 4 hours = 240 minutes)
          delayMinutes = Math.min(delayMinutes, 240)
          
          if (delayMinutes > 0) {
            delayValues.push(delayMinutes)
          }
        })
        
        if (delayValues.length > 0) {
          // Use median instead of mean for more realistic delay representation
          // This avoids distortion from extreme delays
          const sortedDelays = delayValues.sort((a, b) => a - b)
          const medianIndex = Math.floor(sortedDelays.length / 2)
          
          if (sortedDelays.length % 2 === 0) {
            // Even number of values - average of two middle values
            averageDelay = Math.round((sortedDelays[medianIndex - 1] + sortedDelays[medianIndex]) / 2)
          } else {
            // Odd number of values - middle value
            averageDelay = sortedDelays[medianIndex]
          }
          
          // Ensure minimum realistic delay for delayed flights
          averageDelay = Math.max(averageDelay, 15)
        }
      }
    }
    
    // Calculate on-time percentage - doar din zborurile finalizate
    const completedFlights = onTimeFlights + delayedFlights + cancelledFlights
    const onTimePercentage = completedFlights > 0 ? Math.round((onTimeFlights / completedFlights) * 100) : 
                            (totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0) // Use actual onTimeFlights
    
    // Calculate delay index (higher is worse)
    const delayIndex = totalFlights > 0 ? Math.round((delayedFlights / totalFlights) * 100) : 0
    
    // Calculate peak delay hours from non-codeshare flight data
    const peakDelayHours = calculatePeakDelayHours(nonCodeshareFlights)
    
    // Calculate most frequent routes (already excludes codeshare)
    const mostFrequentRoutes = calculateMostFrequentRoutes(nonCodeshareFlights, airport.code)
    
    // Calculate busy hours from non-codeshare flights
    const busyHours = calculateBusyHours(nonCodeshareFlights)
    
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