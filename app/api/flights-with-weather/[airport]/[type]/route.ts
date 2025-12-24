/**
 * API Route: /api/flights-with-weather/[airport]/[type]
 * Test endpoint for integrated weather + flight data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFlightRepository } from '@/lib/flightRepository'
import { isAirportSupported } from '@/lib/airports'

export async function GET(
  request: NextRequest,
  { params }: { params: { airport: string; type: string } }
) {
  try {
    const airportCode = params.airport.toUpperCase()
    const type = params.type as 'arrivals' | 'departures'

    if (!isAirportSupported(airportCode)) {
      return NextResponse.json({
        success: false,
        error: `Airport ${airportCode} not supported`
      }, { status: 400 })
    }

    if (!['arrivals', 'departures'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Type must be arrivals or departures'
      }, { status: 400 })
    }

    const flightRepository = getFlightRepository()
    const result = type === 'arrivals' 
      ? await flightRepository.getArrivals(airportCode)
      : await flightRepository.getDepartures(airportCode)

    return NextResponse.json(result)

  } catch (error) {
    console.error('API Error - Flights with Weather:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}