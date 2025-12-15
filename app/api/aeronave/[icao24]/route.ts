import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'

export async function GET(
  request: NextRequest,
  { params }: { params: { icao24: string } }
) {
  try {
    const { icao24 } = params
    
    // Validate ICAO24 format (6 hex characters)
    if (!/^[0-9A-Fa-f]{6}$/.test(icao24)) {
      return NextResponse.json(
        { error: 'Format ICAO24 invalid. Trebuie să conțină 6 caractere hexazecimale.' },
        { status: 400 }
      )
    }

    // Get aircraft information
    const aircraft = await flightAnalyticsService.getAircraftInfo(icao24.toUpperCase())
    
    if (!aircraft) {
      return NextResponse.json(
        { error: 'Aeronava nu a fost găsită' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      aircraft,
      metadata: {
        lastUpdated: new Date().toISOString(),
        source: 'Flight Analytics Service'
      }
    })

  } catch (error) {
    console.error('Error in aircraft details API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}