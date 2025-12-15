import { NextResponse } from 'next/server'
import { flightAnalyticsService } from '@/lib/flightAnalyticsService'

export async function POST() {
  try {
    // Clear all cache from the analytics service
    flightAnalyticsService.clearCache()
    
    console.log('All analytics cache cleared by admin')
    
    return NextResponse.json({
      success: true,
      message: 'All cache cleared successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}