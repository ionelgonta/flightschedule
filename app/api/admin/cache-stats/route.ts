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