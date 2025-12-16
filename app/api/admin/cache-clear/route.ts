import { NextRequest, NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { pattern } = body
    
    if (pattern) {
      // Clear specific cache pattern
      flightAnalyticsService.clearCachePattern(pattern)
      console.log(`Cache pattern '${pattern}' cleared by admin`)
      
      return NextResponse.json({
        success: true,
        message: `Cache pattern '${pattern}' cleared successfully`,
        timestamp: new Date().toISOString()
      })
    } else {
      // Clear all cache from the analytics service
      flightAnalyticsService.clearCache()
      console.log('All analytics cache cleared by admin')
      
      return NextResponse.json({
        success: true,
        message: 'All cache cleared successfully',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}