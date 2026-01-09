/**
 * Admin API - Cache Cleanup
 * Fixes corrupted nested flight data structures without deleting persistent cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { fixedCacheManager as cacheManager } from '@/lib/cacheManagerFixed'

export async function POST(request: NextRequest) {
  try {
    // Initialize cache manager if needed
    await cacheManager.initialize()
    
    // Clean up corrupted flight data structures
    const cleanedEntries = await cacheManager.cleanupCorruptedFlightData()
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${cleanedEntries} corrupted cache entries`,
      cleanedEntries,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Admin API] Cache cleanup error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during cache cleanup',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cache cleanup endpoint - use POST to trigger cleanup',
    description: 'Fixes corrupted nested flight data structures without deleting persistent cache'
  })
}