import { NextRequest, NextResponse } from 'next/server'
import { getWeeklyScheduleAnalyzer } from '@/lib/weeklyScheduleAnalyzer'

export async function GET(request: NextRequest) {
  try {
    const analyzer = getWeeklyScheduleAnalyzer()
    const cacheExtractor = analyzer['cacheExtractor']
    
    // Get all cached flights
    const allFlights = await cacheExtractor.getAllCachedFlights()
    
    // Get historical data (3 months)
    const historicalData = await cacheExtractor.getHistoricalData(3)
    
    // Get data for each airport
    const airportData = []
    const airports = ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO']
    
    for (const airport of airports) {
      const flights = await cacheExtractor.getFlightsByAirport(airport)
      airportData.push({
        airport,
        flightDatasets: flights.length,
        totalFlights: flights.reduce((sum, dataset) => sum + dataset.data.length, 0)
      })
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        allFlights: {
          datasets: allFlights.length,
          totalFlights: allFlights.reduce((sum, dataset) => sum + dataset.data.length, 0)
        },
        historicalData: {
          datasets: historicalData.length,
          totalFlights: historicalData.reduce((sum, dataset) => sum + dataset.data.length, 0)
        },
        airportBreakdown: airportData,
        sampleData: allFlights.slice(0, 2).map(dataset => ({
          airport: dataset.airport_code,
          type: dataset.type,
          flightCount: dataset.data.length,
          updated: dataset.updated_at,
          sampleFlight: dataset.data[0] ? {
            flight_number: dataset.data[0].flight_number,
            airline: dataset.data[0].airline.name,
            scheduled_time: dataset.data[0].scheduled_time,
            origin: dataset.data[0].origin,
            destination: dataset.data[0].destination
          } : null
        }))
      }
    })
  } catch (error) {
    console.error('Debug cache data error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: null
    }, { status: 500 })
  }
}