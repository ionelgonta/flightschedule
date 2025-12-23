import { NextRequest, NextResponse } from 'next/server'
import { cacheManager } from '@/lib/cacheManager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = await cacheManager.getPersistentCacheStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'clean':
        const deletedCount = await cacheManager.cleanPersistentCache()
        return NextResponse.json({
          success: true,
          message: `Cleaned ${deletedCount} old entries from persistent cache`,
          deletedCount
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, clean'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Persistent cache API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process persistent cache request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, airportCode } = body

    switch (action) {
      case 'clearAll':
        await cacheManager.clearPersistentCache()
        return NextResponse.json({
          success: true,
          message: 'Cleared all persistent cache data'
        })

      case 'clearAirport':
        if (!airportCode) {
          return NextResponse.json({
            success: false,
            error: 'Airport code is required for clearAirport action'
          }, { status: 400 })
        }

        const deletedCount = await cacheManager.clearAirportPersistentCache(airportCode)
        return NextResponse.json({
          success: true,
          message: `Cleared ${deletedCount} entries for ${airportCode} from persistent cache`,
          deletedCount
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: clearAll, clearAirport'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Persistent cache API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process persistent cache request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}