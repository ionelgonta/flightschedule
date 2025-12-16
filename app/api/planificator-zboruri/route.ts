import { NextRequest, NextResponse } from 'next/server'
import { flightPlannerService, FlightPlannerFilters } from '@/lib/flightPlannerService'

export async function POST(request: NextRequest) {
  try {
    const filters: FlightPlannerFilters = await request.json()
    
    // Validate filters
    if (!filters.departureDays || !filters.returnDays || !filters.departureTimeSlot || !filters.returnTimeSlot) {
      return NextResponse.json(
        { success: false, error: 'Missing required filters' },
        { status: 400 }
      )
    }

    // Find flight options using only cached data
    const options = await flightPlannerService.findFlightOptions(filters)
    
    return NextResponse.json({
      success: true,
      data: options,
      count: options.length,
      totalCombinations: options.reduce((sum, opt) => sum + opt.totalOptions, 0)
    })

  } catch (error) {
    console.error('Error in flight planner API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get planner statistics and available destinations
    const [stats, destinations] = await Promise.all([
      flightPlannerService.getPlannerStats(),
      flightPlannerService.getAvailableDestinations()
    ])

    return NextResponse.json({
      success: true,
      stats,
      destinations: destinations.slice(0, 20) // Top 20 destinations
    })

  } catch (error) {
    console.error('Error getting planner data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}