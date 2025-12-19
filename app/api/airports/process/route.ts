/**
 * API pentru procesarea manuală a codurilor IATA
 * Permite forțarea încărcării unui aeroport specific din AeroDataBox
 */

import { NextRequest, NextResponse } from 'next/server'
import AirportAutoLoader from '@/lib/airportAutoLoader'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { iataCode } = body

    if (!iataCode || typeof iataCode !== 'string' || iataCode.length !== 3) {
      return NextResponse.json({ 
        error: 'Invalid IATA code. Must be 3 characters.' 
      }, { status: 400 })
    }

    const upperCode = iataCode.toUpperCase()
    
    // Verifică dacă este un cod IATA valid
    if (!/^[A-Z]{3}$/.test(upperCode)) {
      return NextResponse.json({ 
        error: 'Invalid IATA code format. Must contain only letters.' 
      }, { status: 400 })
    }

    console.log(`[Airport Process API] Processing IATA code: ${upperCode}`)

    const autoLoader = AirportAutoLoader.getInstance()
    const success = await autoLoader.forceProcessCode(upperCode)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Airport ${upperCode} processed successfully`,
        iataCode: upperCode
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to process airport ${upperCode}. It may not exist or already be in database.`,
        iataCode: upperCode
      })
    }

  } catch (error) {
    console.error('[Airport Process API] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const iataCode = searchParams.get('iata')

    if (!iataCode) {
      // Returnează statistici despre auto-loader
      const autoLoader = AirportAutoLoader.getInstance()
      const stats = autoLoader.getStats()
      
      return NextResponse.json({
        success: true,
        stats: {
          queueSize: stats.queueSize,
          lastProcessTime: stats.lastProcessTime,
          lastProcessTimeFormatted: stats.lastProcessTime > 0 
            ? new Date(stats.lastProcessTime).toISOString()
            : 'Never'
        }
      })
    }

    // Procesează un cod specific
    const upperCode = iataCode.toUpperCase()
    
    if (!/^[A-Z]{3}$/.test(upperCode)) {
      return NextResponse.json({ 
        error: 'Invalid IATA code format' 
      }, { status: 400 })
    }

    const autoLoader = AirportAutoLoader.getInstance()
    const success = await autoLoader.forceProcessCode(upperCode)

    return NextResponse.json({
      success,
      message: success 
        ? `Airport ${upperCode} processed successfully`
        : `Failed to process airport ${upperCode}`,
      iataCode: upperCode
    })

  } catch (error) {
    console.error('[Airport Process API] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}