import { NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'

export async function GET() {
  try {
    // Get cache statistics from the analytics service
    const stats = flightAnalyticsService.getCacheStats()
    
    return NextResponse.json({
      success: true,
      stats: {
        size: stats.size,
        keys: stats.keys,
        lastApiCall: stats.lastApiCall,
        apiRequestCount: stats.apiRequestCount,
        cacheEntries: stats.cacheEntries,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Reset API request counter
    flightAnalyticsService.resetApiRequestCount()
    
    return NextResponse.json({
      success: true,
      message: 'API request counter reset successfully'
    })
    
  } catch (error) {
    console.error('Error resetting API request counter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset API request counter' },
      { status: 500 }
    )
  }
}