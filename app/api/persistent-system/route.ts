/**
 * API endpoints for Persistent Flight System management
 * Provides access to system status, statistics, and administrative functions
 */

import { NextRequest, NextResponse } from 'next/server'
import { persistentFlightSystem } from '../../../lib/persistentFlightSystem'
import { dailyBackupManager } from '../../../lib/dailyBackupManager'
import { masterScheduleGenerator } from '../../../lib/masterScheduleGenerator'
import { weatherCacheManager } from '../../../lib/weatherCacheManager'

// GET /api/persistent-system - Get system status and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        const status = await persistentFlightSystem.getSystemStatus()
        return NextResponse.json({
          success: true,
          data: status
        })

      case 'backups':
        const backups = await dailyBackupManager.listAvailableBackups()
        return NextResponse.json({
          success: true,
          data: backups
        })

      case 'backup-stats':
        const backupStats = await dailyBackupManager.getBackupStats()
        return NextResponse.json({
          success: true,
          data: backupStats
        })

      case 'weather-stats':
        const weatherStats = await weatherCacheManager.getCacheStats()
        return NextResponse.json({
          success: true,
          data: weatherStats
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('[Persistent System API] GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/persistent-system - Execute system operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'initialize':
        await persistentFlightSystem.initialize()
        return NextResponse.json({
          success: true,
          message: 'Persistent flight system initialized successfully'
        })

      case 'create-backup':
        const backup = await persistentFlightSystem.createBackup(params.description)
        return NextResponse.json({
          success: true,
          data: backup,
          message: 'Backup created successfully'
        })

      case 'restore-backup':
        if (!params.backupId) {
          return NextResponse.json({
            success: false,
            error: 'Backup ID is required'
          }, { status: 400 })
        }
        
        await persistentFlightSystem.restoreFromBackup(params.backupId)
        return NextResponse.json({
          success: true,
          message: 'System restored from backup successfully'
        })

      case 'generate-schedule':
        if (!params.airportCode) {
          return NextResponse.json({
            success: false,
            error: 'Airport code is required'
          }, { status: 400 })
        }

        const schedule = await persistentFlightSystem.generateWeeklySchedule(params.airportCode)
        return NextResponse.json({
          success: true,
          data: schedule
        })

      case 'route-statistics':
        if (!params.route) {
          return NextResponse.json({
            success: false,
            error: 'Route is required'
          }, { status: 400 })
        }

        const routeStats = await persistentFlightSystem.getRouteStatistics(params.route)
        return NextResponse.json({
          success: true,
          data: routeStats
        })

      case 'weather-data':
        if (!params.destination) {
          return NextResponse.json({
            success: false,
            error: 'Destination is required'
          }, { status: 400 })
        }

        const weatherData = await persistentFlightSystem.getWeatherData(params.destination)
        return NextResponse.json({
          success: true,
          data: weatherData
        })

      case 'update-weather':
        await weatherCacheManager.updateAllDestinations()
        return NextResponse.json({
          success: true,
          message: 'Weather data updated for all destinations'
        })

      case 'ingest-flight-data':
        if (!params.rawFlightData || !params.airportCode || !params.flightType) {
          return NextResponse.json({
            success: false,
            error: 'Raw flight data, airport code, and flight type are required'
          }, { status: 400 })
        }

        const ingestionResult = await persistentFlightSystem.ingestFlightData(
          params.rawFlightData,
          params.airportCode,
          params.flightType
        )
        
        return NextResponse.json({
          success: true,
          data: ingestionResult,
          message: `Ingested ${ingestionResult.savedToDatabase} flights successfully`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('[Persistent System API] POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}