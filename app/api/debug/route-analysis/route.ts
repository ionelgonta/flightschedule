import { NextRequest, NextResponse } from 'next/server'
import { analyzeRoutes } from '@/lib/routeAnalysisHelper'

export async function GET(request: NextRequest) {
  try {
    const airportCode = 'OTP'
    
    console.log(`[Debug] Testing route analysis for ${airportCode}`)
    
    const routes = await analyzeRoutes(airportCode)
    
    return NextResponse.json({
      airportCode,
      routesFound: routes.length,
      routes: routes.slice(0, 5), // First 5 routes
      success: true
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 })
  }
}