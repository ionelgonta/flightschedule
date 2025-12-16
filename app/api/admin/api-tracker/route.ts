import { NextRequest, NextResponse } from 'next/server'
// Server-side only import
const { persistentApiRequestTracker } = require('@/lib/persistentApiTracker')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'
    
    switch (action) {
      case 'stats':
        const stats = await persistentApiRequestTracker.getStats()
        return NextResponse.json({
          success: true,
          stats
        })
        
      case 'detailed':
        const detailedStats = await persistentApiRequestTracker.getDetailedStats()
        return NextResponse.json({
          success: true,
          ...detailedStats
        })
        
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '50')
        const recentRequests = await persistentApiRequestTracker.getRecentRequests(limit)
        return NextResponse.json({
          success: true,
          requests: recentRequests
        })
        
      case 'airport':
        const airportCode = searchParams.get('airport')
        if (!airportCode) {
          return NextResponse.json(
            { success: false, error: 'Airport code required' },
            { status: 400 }
          )
        }
        const airportRequests = await persistentApiRequestTracker.getRequestsByAirport(airportCode)
        return NextResponse.json({
          success: true,
          requests: airportRequests
        })
        
      case 'type':
        const requestType = searchParams.get('type') as any
        if (!requestType) {
          return NextResponse.json(
            { success: false, error: 'Request type required' },
            { status: 400 }
          )
        }
        const typeRequests = await persistentApiRequestTracker.getRequestsByType(requestType)
        return NextResponse.json({
          success: true,
          requests: typeRequests
        })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Error in API tracker endpoint:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get API tracker data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'reset') {
      await persistentApiRequestTracker.resetCounter()
      return NextResponse.json({
        success: true,
        message: 'API request counter reset successfully'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error resetting API tracker:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset API tracker' },
      { status: 500 }
    )
  }
}