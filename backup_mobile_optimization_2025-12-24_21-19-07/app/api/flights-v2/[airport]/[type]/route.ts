/**
 * Enhanced Flight Data API v2 - Uses Persistent Flight System
 * Provides backward compatibility while leveraging the new persistent architecture
 * Follows IATA airport mapping rules strictly
 */

import { NextRequest, NextResponse } from 'next/server'
import { persistentFlightSystem } from '../../../../../lib/persistentFlightSystem'

// Supported IATA airport codes (following airport mapping rules)
const SUPPORTED_AIRPORTS = [
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 
  'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'
]

// Validate IATA airport code
function isValidAirportCode(code: string): boolean {
  return SUPPORTED_AIRPORTS.includes(code.toUpperCase())
}

// Validate flight type
function isValidFlightType(type: string): boolean {
  return ['arrivals', 'departures'].includes(type.toLowerCase())
}

// GET /api/flights-v2/[airport]/[type] - Get flight data using persistent system
export async function GET(
  request: NextRequest,
  { params }: { params: { airport: string; type: string } }
) {
  try {
    const { airport, type } = params
    const { searchParams } = new URL(request.url)
    
    // Validate IATA airport code (critical rule)
    if (!isValidAirportCode(airport)) {
      return NextResponse.json({
        success: false,
        error: `Invalid IATA airport code: ${airport}. Supported codes: ${SUPPORTED_AIRPORTS.join(', ')}`
      }, { status: 400 })
    }

    // Validate flight type
    if (!isValidFlightType(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid flight type: ${type}. Supported types: arrivals, departures`
      }, { status: 400 })
    }

    // Parse optional date range parameters
    let dateRange: { startDate: Date; endDate: Date } | undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam)
      const endDate = new Date(endDateParam)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
        }, { status: 400 })
      }
      
      dateRange = { startDate, endDate }
    }

    // Initialize persistent system if needed
    await persistentFlightSystem.initialize()

    // Get flight data from persistent system
    const flightData = await persistentFlightSystem.getFlightData(
      airport.toUpperCase(),
      type.toLowerCase() as 'arrivals' | 'departures',
      dateRange
    )

    // Get weather data for the airport
    let weatherData = null
    try {
      weatherData = await persistentFlightSystem.getWeatherData(airport.toUpperCase())
    } catch (error) {
      console.warn(`[Flights API v2] Could not get weather data for ${airport}:`, error)
    }

    // Prepare response following the expected format
    const response = {
      success: true,
      data: flightData,
      metadata: {
        airport: airport.toUpperCase(),
        type: type.toLowerCase(),
        count: flightData.length,
        dateRange: dateRange ? {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        } : null,
        weather: weatherData,
        source: 'persistent_system',
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Flights API v2] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      metadata: {
        airport: params.airport?.toUpperCase(),
        type: params.type?.toLowerCase(),
        source: 'persistent_system',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// POST /api/flights-v2/[airport]/[type] - Ingest new flight data
export async function POST(
  request: NextRequest,
  { params }: { params: { airport: string; type: string } }
) {
  try {
    const { airport, type } = params
    const body = await request.json()

    // Validate IATA airport code
    if (!isValidAirportCode(airport)) {
      return NextResponse.json({
        success: false,
        error: `Invalid IATA airport code: ${airport}`
      }, { status: 400 })
    }

    // Validate flight type
    if (!isValidFlightType(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid flight type: ${type}`
      }, { status: 400 })
    }

    // Validate request body
    if (!body.flightData || !Array.isArray(body.flightData)) {
      return NextResponse.json({
        success: false,
        error: 'Flight data array is required in request body'
      }, { status: 400 })
    }

    // Initialize persistent system if needed
    await persistentFlightSystem.initialize()

    // Ingest flight data
    const ingestionResult = await persistentFlightSystem.ingestFlightData(
      body.flightData,
      airport.toUpperCase(),
      type.toLowerCase() as 'arrivals' | 'departures'
    )

    return NextResponse.json({
      success: true,
      data: ingestionResult,
      message: `Successfully ingested ${ingestionResult.savedToDatabase} flights`,
      metadata: {
        airport: airport.toUpperCase(),
        type: type.toLowerCase(),
        source: 'persistent_system',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[Flights API v2] POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      metadata: {
        airport: params.airport?.toUpperCase(),
        type: params.type?.toLowerCase(),
        source: 'persistent_system',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}