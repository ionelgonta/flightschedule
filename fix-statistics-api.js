// Script pentru a corecta API-ul de statistici
const fs = require('fs');
const path = require('path');

const filePath = '/opt/anyway-flight-schedule/app/api/aeroport/[code]/statistici/route.ts';

const newContent = `import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'
import { getAirportByCodeOrSlug } from '@/lib/airports'
import { getIcaoCode } from '@/lib/icaoMapping'

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
      console.log(\`Airport not found for identifier: \${code}\`)
      return NextResponse.json(
        { error: \`Aeroportul nu a fost găsit pentru: \${code}\` },
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

    // Convert IATA to ICAO for cache lookup
    const icaoCode = getIcaoCode(airport.code)
    console.log(\`Getting statistics for \${airport.code} (ICAO: \${icaoCode})\`)

    // Get airport statistics using ICAO code
    try {
      const statistics = await flightAnalyticsService.getAirportStatistics(
        icaoCode,
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
    } catch (statisticsError) {
      console.log(\`No statistics available for \${icaoCode}:\`, statisticsError)
      
      // Return empty statistics instead of error
      const emptyStatistics = {
        totalFlights: 0,
        onTimePercentage: 0,
        averageDelay: 0,
        cancelledFlights: 0,
        delayedFlights: 0,
        onTimeFlights: 0,
        delayIndex: 0,
        busyHours: [],
        peakDelayHours: [],
        popularDestinations: [],
        mostFrequentRoutes: [],
        aircraftTypes: [],
        airlines: [],
        period: period,
        lastUpdated: null
      }

      return NextResponse.json({
        airport: {
          code: airport.code,
          name: airport.name,
          city: airport.city,
          country: airport.country
        },
        statistics: emptyStatistics,
        message: 'Statisticile se actualizează automat. Vă rugăm să reveniți mai târziu.'
      })
    }

  } catch (error) {
    console.error('Error in airport statistics API:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}`;

try {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Statistics API fixed successfully');
} catch (error) {
  console.error('Error fixing statistics API:', error);
}