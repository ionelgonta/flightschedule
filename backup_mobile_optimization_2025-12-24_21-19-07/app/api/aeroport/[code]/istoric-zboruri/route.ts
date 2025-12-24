import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'
import { getAirportByCodeOrSlug } from '@/lib/airports'

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
      return NextResponse.json(
        { error: 'Aeroportul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Get query parameters with defaults (last 30 days)
    const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const defaultToDate = new Date().toISOString().split('T')[0]
    
    const fromDate = searchParams.get('from') || defaultFromDate
    const toDate = searchParams.get('to') || defaultToDate

    // Validate date range
    const from = new Date(fromDate)
    const to = new Date(toDate)
    
    if (from > to) {
      return NextResponse.json(
        { error: 'Data de început trebuie să fie înainte de data de sfârșit' },
        { status: 400 }
      )
    }

    // Limit to maximum 365 days
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      return NextResponse.json(
        { error: 'Intervalul de timp nu poate depăși 365 de zile' },
        { status: 400 }
      )
    }

    // Get historical data
    const historicalData = await flightAnalyticsService.getHistoricalData(
      airport.code,
      fromDate,
      toDate
    )

    // Calculate summary statistics
    const totalFlights = historicalData.reduce((sum, day) => sum + day.totalFlights, 0)
    const totalCancelled = historicalData.reduce((sum, day) => sum + day.cancelledFlights, 0)
    const avgDelay = historicalData.length > 0 
      ? Math.round(historicalData.reduce((sum, day) => sum + day.averageDelay, 0) / historicalData.length)
      : 0
    const avgOnTime = historicalData.length > 0
      ? Math.round(historicalData.reduce((sum, day) => sum + day.onTimePercentage, 0) / historicalData.length)
      : 0

    return NextResponse.json({
      airport: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country
      },
      period: { from: fromDate, to: toDate },
      summary: {
        totalFlights,
        totalCancelled,
        averageDelay: avgDelay,
        onTimePercentage: avgOnTime,
        totalDays: historicalData.length
      },
      data: historicalData
    })

  } catch (error) {
    console.error('Error in historical data API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}