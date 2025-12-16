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
  const aeroDataBox = new AeroDataBoxService(API_CONFIGS.aerodatabox)
  
  try {
    // Obține zboruri pentru ultimele 7 zile pentru a calcula statistici
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    const [arrivals, departures] = await Promise.allSettled([
      aeroDataBox.getFlights(airport.code, 'arrivals', startDate.toISOString(), endDate.toISOString()),
      aeroDataBox.getFlights(airport.code, 'departures', startDate.toISOString(), endDate.toISOString())
    ])
    
    const allFlights = [
      ...(arrivals.status === 'fulfilled' ? arrivals.value : []),
      ...(departures.status === 'fulfilled' ? departures.value : [])
    ]
    
    if (allFlights.length === 0) {
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
    
    // Calculează statistici reale
    const totalFlights = allFlights.length
    const onTimeFlights = allFlights.filter(flight => {
      const scheduled = new Date(flight.departure?.scheduledTime?.utc || flight.arrival?.scheduledTime?.utc)
      const actual = new Date(
        flight.departure?.actualTime?.utc || 
        flight.arrival?.actualTime?.utc || 
        flight.departure?.estimatedTime?.utc || 
        flight.arrival?.estimatedTime?.utc ||
        flight.departure?.scheduledTime?.utc ||
        flight.arrival?.scheduledTime?.utc
      )
      const delay = (actual.getTime() - scheduled.getTime()) / (1000 * 60) // în minute
      return delay <= 15 // Considerat la timp dacă întârzierea <= 15 min
    }).length
    
    const delayedFlights = allFlights.filter(flight => {
      const scheduled = new Date(flight.departure?.scheduledTime?.utc || flight.arrival?.scheduledTime?.utc)
      const actual = new Date(
        flight.departure?.actualTime?.utc || 
        flight.arrival?.actualTime?.utc || 
        flight.departure?.estimatedTime?.utc || 
        flight.arrival?.estimatedTime?.utc ||
        flight.departure?.scheduledTime?.utc ||
        flight.arrival?.scheduledTime?.utc
      )
      const delay = (actual.getTime() - scheduled.getTime()) / (1000 * 60)
      return delay > 15
    }).length
    
    const cancelledFlights = allFlights.filter(flight => 
      flight.status?.text?.toLowerCase().includes('cancel') || 
      flight.status?.type?.toLowerCase().includes('cancel')
    ).length
    
    const totalDelayMinutes = allFlights.reduce((sum, flight) => {
      const scheduled = new Date(flight.departure?.scheduledTime?.utc || flight.arrival?.scheduledTime?.utc)
      const actual = new Date(
        flight.departure?.actualTime?.utc || 
        flight.arrival?.actualTime?.utc || 
        flight.departure?.estimatedTime?.utc || 
        flight.arrival?.estimatedTime?.utc ||
        flight.departure?.scheduledTime?.utc ||
        flight.arrival?.scheduledTime?.utc
      )
      const delay = Math.max(0, (actual.getTime() - scheduled.getTime()) / (1000 * 60))
      return sum + delay
    }, 0)
    
    const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0
    const averageDelay = totalFlights > 0 ? Math.round(totalDelayMinutes / totalFlights) : 0
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