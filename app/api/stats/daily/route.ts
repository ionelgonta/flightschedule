/**
 * Daily Statistics API Endpoint
 * GET /api/stats/daily?airport=OTP&date=2025-12-18
 */

import { NextRequest, NextResponse } from 'next/server'
import { flightStatisticsService } from '../../../../lib/flightStatisticsService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const airport = searchParams.get('airport')
    const date = searchParams.get('date')

    // Validate required parameters
    if (!airport) {
      return NextResponse.json(
        { error: 'Airport code is required' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate airport code format
    const airportRegex = /^[A-Z]{3,4}$/
    if (!airportRegex.test(airport.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid airport code format' },
        { status: 400 }
      )
    }

    console.log(`[Daily Stats API] Getting statistics for ${airport} on ${date}`)

    // Get daily statistics
    const statistics = await flightStatisticsService.getDailyStatistics(
      airport.toUpperCase(),
      date
    )

    // Format response for chart libraries
    const response = {
      success: true,
      data: {
        airport: statistics.airport,
        date: statistics.date,
        summary: {
          totalFlights: statistics.totalFlights,
          onTimeFlights: statistics.onTimeFlights,
          delayedFlights: statistics.delayedFlights,
          cancelledFlights: statistics.cancelledFlights,
          onTimePercentage: statistics.onTimePercentage,
          averageDelay: statistics.averageDelay,
          delayIndex: statistics.delayIndex
        },
        peakHours: statistics.peakHours,
        topAirlines: statistics.topAirlines.map(airline => ({
          code: airline.code,
          name: airline.name,
          flights: airline.flights,
          onTimePercentage: airline.onTimePercentage,
          averageDelay: airline.averageDelay
        })),
        hourlyDistribution: statistics.hourlyDistribution.map(hour => ({
          hour: hour.hour,
          label: `${hour.hour.toString().padStart(2, '0')}:00`,
          flights: hour.flights,
          averageDelay: hour.averageDelay,
          onTimePercentage: hour.onTimePercentage
        })),
        chartData: {
          // Data formatted for pie charts
          statusDistribution: [
            { name: 'On Time', value: statistics.onTimeFlights, color: '#10b981' },
            { name: 'Delayed', value: statistics.delayedFlights, color: '#f59e0b' },
            { name: 'Cancelled', value: statistics.cancelledFlights, color: '#ef4444' }
          ],
          // Data formatted for bar charts
          airlinePerformance: statistics.topAirlines.map(airline => ({
            name: airline.name,
            flights: airline.flights,
            onTimePercentage: airline.onTimePercentage,
            averageDelay: airline.averageDelay
          })),
          // Data formatted for line charts
          hourlyTraffic: statistics.hourlyDistribution.map(hour => ({
            hour: hour.hour,
            flights: hour.flights,
            delay: hour.averageDelay
          }))
        }
      },
      timestamp: new Date().toISOString()
    }

    console.log(`[Daily Stats API] Successfully generated statistics for ${airport} on ${date}`)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('[Daily Stats API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}