/**
 * Trend Analysis API Endpoint
 * GET /api/stats/trends?airport=OTP&period=7d
 */

import { NextRequest, NextResponse } from 'next/server'
import { flightStatisticsService } from '../../../../lib/flightStatisticsService'
import { AnalysisPeriod } from '../../../../lib/types/historical'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const airport = searchParams.get('airport')
    const period = searchParams.get('period') as AnalysisPeriod

    // Validate required parameters
    if (!airport) {
      return NextResponse.json(
        { error: 'Codul aeroportului este obligatoriu' },
        { status: 400 }
      )
    }

    if (!period) {
      return NextResponse.json(
        { error: 'Perioada este obligatorie (7d, 30d, 90d, sau 365d)' },
        { status: 400 }
      )
    }

    // Validate period format
    const validPeriods: AnalysisPeriod[] = ['7d', '30d', '90d', '365d']
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Perioadă invalidă. Trebuie să fie una dintre: 7d, 30d, 90d, 365d' },
        { status: 400 }
      )
    }

    // Validate airport code format
    const airportRegex = /^[A-Z]{3,4}$/
    if (!airportRegex.test(airport.toUpperCase())) {
      return NextResponse.json(
        { error: 'Format cod aeroport invalid' },
        { status: 400 }
      )
    }

    console.log(`[Trends API] Getting trend analysis for ${airport} over ${period}`)

    // Get trend analysis
    const analysis = await flightStatisticsService.getTrendAnalysis(
      airport.toUpperCase(),
      period
    )

    // Format response for chart libraries
    const response = {
      success: true,
      data: {
        airport: analysis.airport,
        period: analysis.period,
        insights: analysis.insights,
        dataPoints: analysis.dataPoints.map(point => ({
          date: point.date,
          totalFlights: point.totalFlights,
          onTimePercentage: point.onTimePercentage,
          averageDelay: point.averageDelay,
          delayIndex: point.delayIndex
        })),
        chartData: {
          // Data formatted for multi-line charts
          timeSeriesData: analysis.dataPoints.map(point => ({
            date: point.date,
            flights: point.totalFlights,
            onTime: point.onTimePercentage,
            delay: point.averageDelay,
            delayIndex: point.delayIndex
          })),
          // Trend indicators
          trends: {
            traffic: {
              change: analysis.insights.trafficChange,
              direction: analysis.insights.trafficChange > 5 ? 'up' : 
                        analysis.insights.trafficChange < -5 ? 'down' : 'stable'
            },
            delays: {
              change: analysis.insights.delayChange,
              direction: analysis.insights.delayChange > 5 ? 'up' : 
                        analysis.insights.delayChange < -5 ? 'down' : 'stable'
            }
          },
          // Performance highlights
          highlights: {
            bestDay: analysis.insights.bestPerformingDay,
            worstDay: analysis.insights.worstPerformingDay,
            recommendations: analysis.insights.recommendations
          }
        }
      },
      timestamp: new Date().toISOString()
    }

    console.log(`[Trends API] Successfully generated trend analysis for ${airport}`)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('[Trends API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Eroare internă de server',
        message: error instanceof Error ? error.message : 'Eroare necunoscută'
      },
      { status: 500 }
    )
  }
}