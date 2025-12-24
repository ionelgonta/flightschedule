import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const icao24 = searchParams.get('icao24')
    const registration = searchParams.get('registration')
    const query = searchParams.get('q') // General search query

    // If specific ICAO24 is requested
    if (icao24) {
      const aircraft = await flightAnalyticsService.getAircraftInfo(icao24)
      if (!aircraft) {
        return NextResponse.json(
          { error: 'Aeronava nu a fost găsită' },
          { status: 404 }
        )
      }
      return NextResponse.json({ aircraft })
    }

    // If registration search is requested
    if (registration) {
      const aircraft = await flightAnalyticsService.searchAircraftByRegistration(registration)
      return NextResponse.json({
        query: registration,
        results: aircraft,
        total: aircraft.length
      })
    }

    // General search
    if (query) {
      // Search by registration (most common search)
      const aircraft = await flightAnalyticsService.searchAircraftByRegistration(query)
      return NextResponse.json({
        query,
        results: aircraft,
        total: aircraft.length
      })
    }

    // No search parameters provided
    return NextResponse.json(
      { error: 'Parametrii de căutare lipsesc. Folosește icao24, registration sau q.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in aircraft search API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}