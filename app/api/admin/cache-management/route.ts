import { NextRequest, NextResponse } from 'next/server'
import { cacheManager, CacheConfig } from '@/lib/cacheManager'

export async function GET() {
  try {
    await cacheManager.initialize()
    const stats = cacheManager.getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, category, identifier, config } = body

    await cacheManager.initialize()

    switch (action) {
      case 'updateConfig':
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Config is required for updateConfig action' },
            { status: 400 }
          )
        }
        
        // Validare configurație
        if (config.flightData?.cronInterval < 1 || config.flightData?.cronInterval > 1440) {
          return NextResponse.json(
            { success: false, error: 'Flight data cron interval must be between 1 and 1440 minutes' },
            { status: 400 }
          )
        }
        
        if (config.analytics?.cronInterval < 1 || config.analytics?.cronInterval > 365) {
          return NextResponse.json(
            { success: false, error: 'Analytics cron interval must be between 1 and 365 days' },
            { status: 400 }
          )
        }
        
        if (config.analytics?.cacheMaxAge < 1 || config.analytics?.cacheMaxAge > 365) {
          return NextResponse.json(
            { success: false, error: 'Analytics cache max age must be between 1 and 365 days' },
            { status: 400 }
          )
        }
        
        if (config.aircraft?.cronInterval < 1 || config.aircraft?.cronInterval > 365) {
          return NextResponse.json(
            { success: false, error: 'Aircraft cron interval must be between 1 and 365 days' },
            { status: 400 }
          )
        }
        
        if (config.aircraft?.cacheMaxAge < 1 || config.aircraft?.cacheMaxAge > 365) {
          return NextResponse.json(
            { success: false, error: 'Aircraft cache max age must be between 1 and 365 days' },
            { status: 400 }
          )
        }

        await cacheManager.updateConfig(config as CacheConfig)
        
        return NextResponse.json({
          success: true,
          message: 'Cache configuration updated successfully'
        })

      case 'manualRefresh':
        if (!category) {
          return NextResponse.json(
            { success: false, error: 'Category is required for manualRefresh action' },
            { status: 400 }
          )
        }
        
        if (!['flightData', 'analytics', 'aircraft'].includes(category)) {
          return NextResponse.json(
            { success: false, error: 'Invalid category. Must be flightData, analytics, or aircraft' },
            { status: 400 }
          )
        }

        await cacheManager.manualRefresh(category as 'flightData' | 'analytics' | 'aircraft', identifier)
        
        return NextResponse.json({
          success: true,
          message: `Manual refresh completed for ${category}${identifier ? ` (${identifier})` : ''}`
        })

      case 'resetCounter':
        await cacheManager.resetRequestCounter()
        
        return NextResponse.json({
          success: true,
          message: 'Request counter reset successfully'
        })

      case 'cleanExpired':
        const cleanedCount = await cacheManager.cleanExpiredCache()
        
        return NextResponse.json({
          success: true,
          message: `Cleaned ${cleanedCount} expired cache entries`
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in cache management:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}