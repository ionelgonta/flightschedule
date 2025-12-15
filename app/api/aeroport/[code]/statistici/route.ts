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
      console.log(`Airport not found for identifier: ${code}`)
      return NextResponse.json(
        { error: `Aeroportul nu a fost găsit pentru: ${code}` },
        { status: 404 }
      )
    }

    // Get query parameters
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'monthly'

    // Validate parameters
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Perioada trebuie să fie "daily", "weekly" sau "monthly"' },
        { status: 400 }
      )
    }

    // Get airport statistics
    const statistics = await flightAnalyticsService.getAirportStatistics(
      airport.code,
      period
    )

    return NextResponse.json({
      airport: {
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country
      },
      statistics
    })

  } catch (error) {
    console.error('Error in airport statistics API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}