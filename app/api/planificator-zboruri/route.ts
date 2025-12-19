import { NextRequest, NextResponse } from 'next/server'
import { flightPlannerService, FlightPlannerFilters } from '@/lib/flightPlannerService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, filters } = body

    switch (action) {
      case 'search':
        if (!filters) {
          return NextResponse.json({
            success: false,
            error: 'Filters are required for search'
          }, { status: 400 })
        }

        const options = await flightPlannerService.findFlightOptions(filters as FlightPlannerFilters)
        
        return NextResponse.json({
          success: true,
          data: options,
          count: options.length,
          totalCombinations: options.reduce((sum, opt) => sum + opt.totalOptions, 0)
        })

      case 'stats':
        const stats = await flightPlannerService.getPlannerStats()
        
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'destinations':
        const destinations = await flightPlannerService.getAvailableDestinations()
        
        return NextResponse.json({
          success: true,
          data: destinations
        })

      case 'refresh':
        await flightPlannerService.refreshCachedData()
        
        return NextResponse.json({
          success: true,
          message: 'Cache data refreshed successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Flight planner API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'

    switch (action) {
      case 'stats':
        const stats = await flightPlannerService.getPlannerStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'destinations':
        const destinations = await flightPlannerService.getAvailableDestinations()
        return NextResponse.json({
          success: true,
          data: destinations
        })

      case 'database-stats':
        const dbStats = flightPlannerService.getDatabaseStats()
        return NextResponse.json({
          success: true,
          data: dbStats
        })

      case 'export-json':
        const jsonData = flightPlannerService.exportDatabaseJSON()
        return new NextResponse(jsonData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="flight-planner-data.json"'
          }
        })

      case 'export-csv':
        const csvData = flightPlannerService.exportDatabaseCSV()
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="flight-planner-data.csv"'
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Flight planner GET API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}