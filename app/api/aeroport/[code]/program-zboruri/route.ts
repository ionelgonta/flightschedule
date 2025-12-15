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

    // Get query parameters
    const type = searchParams.get('type') as 'arrivals' | 'departures' || 'departures'
    const fromDate = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const toDate = searchParams.get('to') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Validate parameters
    if (!['arrivals', 'departures'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipul trebuie să fie "arrivals" sau "departures"' },
        { status: 400 }
      )
    }

    // Get flight schedules
    const schedules = await flightAnalyticsService.getFlightSchedules(
      airport.code,
      type,
      fromDate,
      toDate
    )

    return NextResponse.json({
      airport: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country
      },
      type,
      period: { from: fromDate, to: toDate },
      schedules,
      total: schedules.length
    })

  } catch (error) {
    console.error('Error in flight schedules API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}