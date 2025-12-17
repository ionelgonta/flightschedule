import { NextRequest, NextResponse } from 'next/server'
import AeroDataBoxService from '@/lib/aerodataboxService'
import { API_CONFIGS } from '@/lib/flightApiService'
import { MAJOR_AIRPORTS } from '@/lib/airports'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'

// Cache pentru 30 de zile (30 * 24 * 60 * 60 = 2592000 secunde)
const CACHE_DURATION = 30 * 24 * 60 * 60

interface AirportStatistics {
  code: string
  name: string
  city: string
  country: string
  statistics: {
    totalFlights: number
    onTimePercentage: number
    averageDelay: number
    dailyFlights: number
    cancelledFlights: number
    delayedFlights: number
    lastUpdated: string
  } | null
  message?: string
}

// Cache în memorie pentru statistici
const statisticsCache = new Map<string, { data: AirportStatistics[], timestamp: number }>()

async function calculateAirportStatistics(airport: any): Promise<AirportStatistics> {
  try {
    // NU MAI FACE REQUESTURI API DIRECTE - folosește doar cache-ul centralizat
    console.log(`Getting cached statistics for ${airport.code} from cache manager`)
    
    // Încearcă să obții statistici din cache-ul centralizat
    const cachedStats = flightAnalyticsService.getCachedData<any>(`analytics_${airport.code}`)
    
    if (cachedStats) {
      console.log(`Using cached statistics for ${airport.code}`)
      return {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        statistics: {
          totalFlights: cachedStats.totalFlights || 0,
          onTimePercentage: cachedStats.onTimePercentage || 0,
          averageDelay: cachedStats.averageDelay || 0,
          dailyFlights: Math.round((cachedStats.totalFlights || 0) / 7),
          cancelledFlights: cachedStats.cancelledFlights || 0,
          delayedFlights: cachedStats.delayedFlights || 0,
          lastUpdated: cachedStats.lastUpdated || new Date().toISOString()
        }
      }
    }
    
    // Dacă nu există în cache, încearcă să obții date din flight repository (cache flight data)
    const arrivalsKey = `${airport.code}_arrivals`
    const departuresKey = `${airport.code}_departures`
    
    const cachedArrivals = flightAnalyticsService.getCachedData<any[]>(arrivalsKey) || []
    const cachedDepartures = flightAnalyticsService.getCachedData<any[]>(departuresKey) || []
    
    const allFlights = [...cachedArrivals, ...cachedDepartures]
    
    if (allFlights.length === 0) {
      console.log(`No cached flight data for ${airport.code}, returning placeholder`)
      // Returnează null pentru aeroporturi fără date suficiente
      return {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        statistics: null,
        message: 'Nu sunt suficiente date pentru a afișa această informație'
      }
    }
    
    console.log(`Calculating statistics from ${allFlights.length} cached flights for ${airport.code}`)
    
    // Calculează statistici din datele cache-uite (format RawFlightData)
    const totalFlights = allFlights.length
    
    // Adaptează pentru formatul RawFlightData
    const onTimeFlights = allFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      const delay = flight.delay || 0
      return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
              status === 'departed' || status === 'active') && delay <= 15
    }).length
    
    const delayedFlights = allFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      const delay = flight.delay || 0
      return status === 'delayed' || delay > 15
    }).length
    
    const cancelledFlights = allFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || ''
      return status.includes('cancel')
    }).length
    
    // Calculează întârzierea medie din câmpul delay
    const flightsWithDelay = allFlights.filter(flight => flight.delay && flight.delay > 0)
    const averageDelay = flightsWithDelay.length > 0 
      ? Math.round(flightsWithDelay.reduce((sum, flight) => sum + (flight.delay || 0), 0) / flightsWithDelay.length)
      : 0
    
    const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0
    const dailyFlights = Math.round(totalFlights / 7) // Media pe 7 zile
    
    return {
      code: airport.code,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      statistics: {
        totalFlights,
        onTimePercentage,
        averageDelay,
        dailyFlights,
        cancelledFlights,
        delayedFlights,
        lastUpdated: new Date().toISOString()
      }
    }
    
  } catch (error) {
    console.error(`Error calculating statistics for ${airport.code}:`, error)
    
    // Returnează null în caz de eroare
    return {
      code: airport.code,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      statistics: null,
      message: 'Nu sunt suficiente date pentru a afișa această informație'
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    
    const cacheKey = 'airport-statistics'
    const now = Date.now()
    
    // Verifică cache-ul doar dacă nu e forțat refresh-ul
    if (!force) {
      const cached = flightAnalyticsService.getCachedData<AirportStatistics[]>(cacheKey)
      if (cached) {
        console.log('Returning cached airport statistics from analytics service')
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true,
          cacheAge: 'from-cache'
        }, {
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATION}`,
            'Content-Type': 'application/json'
          }
        })
      }
    }
    
    if (force) {
      console.log('Force refreshing airport statistics...')
    } else {
      console.log('Calculating fresh airport statistics...')
    }
    
    // Calculează statistici pentru toate aeroporturile în paralel
    const statisticsPromises = MAJOR_AIRPORTS.map(airport => 
      calculateAirportStatistics(airport)
    )
    
    const statistics = await Promise.all(statisticsPromises)
    
    // Salvează în cache prin serviciul centralizat
    flightAnalyticsService.setCachedData(cacheKey, statistics, CACHE_DURATION * 1000)
    
    // Marchează că s-a făcut un API call
    flightAnalyticsService.markApiCall()
    
    return NextResponse.json({
      success: true,
      data: statistics,
      cached: false,
      generatedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_DURATION}`,
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('Error in airport statistics API:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch airport statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    })
  }
}