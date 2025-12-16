import { NextRequest, NextResponse } from 'next/server'
import { updateCacheConfig, getCacheConfig } from '@/lib/flightAnalyticsService'
import { getFlightRepository } from '@/lib/flightRepository'
import fs from 'fs'
import path from 'path'

const CACHE_CONFIG_FILE = path.join(process.cwd(), '.cache-config.json')

interface CacheConfigData {
  analyticsInterval: number // days
  realtimeInterval: number // minutes
  lastUpdated: string
}

// Load cache config from file
function loadCacheConfig(): CacheConfigData {
  try {
    if (fs.existsSync(CACHE_CONFIG_FILE)) {
      const data = fs.readFileSync(CACHE_CONFIG_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading cache config:', error)
  }
  
  // Default configuration
  return {
    analyticsInterval: 30,
    realtimeInterval: 60,
    lastUpdated: new Date().toISOString()
  }
}

// Save cache config to file
function saveCacheConfig(config: CacheConfigData): void {
  try {
    fs.writeFileSync(CACHE_CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Error saving cache config:', error)
    throw error
  }
}

export async function GET() {
  try {
    const config = loadCacheConfig()
    
    return NextResponse.json({
      success: true,
      config: {
        analyticsInterval: config.analyticsInterval,
        realtimeInterval: config.realtimeInterval
      }
    })
  } catch (error) {
    console.error('Error getting cache config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load cache configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { analyticsInterval, realtimeInterval } = await request.json()
    
    // Validate input
    if (!analyticsInterval || !realtimeInterval) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    if (analyticsInterval < 1 || analyticsInterval > 90) {
      return NextResponse.json(
        { success: false, error: 'Analytics interval must be between 1 and 90 days' },
        { status: 400 }
      )
    }
    
    if (realtimeInterval < 5 || realtimeInterval > 1440) {
      return NextResponse.json(
        { success: false, error: 'Realtime interval must be between 5 and 1440 minutes' },
        { status: 400 }
      )
    }
    
    // Save configuration
    const config: CacheConfigData = {
      analyticsInterval,
      realtimeInterval,
      lastUpdated: new Date().toISOString()
    }
    
    saveCacheConfig(config)
    
    // Update the analytics service cache configuration
    updateCacheConfig({
      analyticsInterval,
      realtimeInterval
    })
    
    // Update the flight repository cache configuration
    try {
      const flightRepository = getFlightRepository()
      await flightRepository.updateCacheConfig(realtimeInterval)
    } catch (error) {
      console.warn('Could not update flight repository cache config:', error)
    }
    
    console.log(`Cache configuration updated: Analytics ${analyticsInterval} days, Realtime ${realtimeInterval} minutes`)
    
    return NextResponse.json({
      success: true,
      message: 'Cache configuration saved successfully',
      config: {
        analyticsInterval,
        realtimeInterval
      }
    })
    
  } catch (error) {
    console.error('Error saving cache config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save cache configuration' },
      { status: 500 }
    )
  }
}