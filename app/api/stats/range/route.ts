/**
 * Range Statistics API Endpoint
 * GET /api/stats/range?airport=OTP&from=2025-12-01&to=2025-12-18
 */

import { NextRequest, NextResponse } from 'next/server'
import { flightStatisticsService } from '../../../../lib/flightStatisticsService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const airport = searchParams.get('airport')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // Validate required parameters
    if (!airport) {
      return NextResponse.json(
        { error: 'Airport code is required' },
        { status: 400 }
      )
    }

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Both from and to dates are required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
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

    // Validate date range
    const startDate = new Date(fromDate)
    const endDate = new Date(toDate)
    
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'From date must be before or equal to to date' },
        { status: 400 }
      )
    }

    // Limit range to prevent excessive queries
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 90 days' },
        { status: 400 }
      )
    }

    console.log(`[Range Stats API] Getting statistics for ${airport} from ${fromDate} to ${toDate}`)

    // Get range statistics
    const statistics = await flightStatisticsService.getRangeStatistics(
      airport.toUpperCase(),
      fromDate,
      toDate
    )

    // Format response for chart libraries
    const response = {
      success: true,
      data: {
        airport: statistics.airport,
        fromDate: statistics.fromDate,
        toDate: statistics.toDate,
        totalDays: statistics.totalDays,
        summary: statistics.aggregated,
        trends: statistics.trends,
        dailyData: statistics.dailyStats.map(day => ({
          date: day.date,
          totalFlights: day.totalFlights,
          onTimePercentage: day.onTimePercentage,
          averageDelay: day.averageDelay,
          delayIndex: day.delayIndex
        })),
        chartData: {
          // Data formatted for line charts (time series)
          timeSeriesData: statistics.dailyStats.map(day => ({
            date: day.date,
            flights: day.totalFlights,
            onTime: day.onTimePercentage,
            delay: day.averageDelay
          })),
          // Data formatted for trend analysis
          trendData: {
            traffic: {
              trend: statistics.trends.trafficTrend,
              percentage: statistics.trends.trendPercentage
            },
            delays: {
              trend: statistics.trends.delayTrend,
              percentage: Math.round(
                ((statistics.aggregated.overallAverageDelay || 0) / 60) * 100
              )
            }
          },
          // Summary metrics for dashboard cards
          metrics: {
            totalFlights: statistics.aggregated.totalFlights,
            averageFlightsPerDay: statistics.aggregated.averageFlightsPerDay,
            onTimePercentage: statistics.aggregated.overallOnTimePercentage,
            averageDelay: statistics.aggregated.overallAverageDelay,
            bestDay: statistics.aggregated.bestDay,
            worstDay: statistics.aggregated.worstDay
          }
        }
      },
      timestamp: new Date().toISOString()
    }

    console.log(`[Range Stats API] Successfully generated range statistics for ${airport}`)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('[Range Stats API] Error:', error)
    
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