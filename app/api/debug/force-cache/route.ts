/**
 * API Route: /api/debug/force-cache
 * Forțează popularea cache-ului pentru debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFlightRepository } from '@/lib/flightRepository';

export async function POST(request: NextRequest) {
  try {
    const { airportCode } = await request.json();
    
    if (!airportCode) {
      return NextResponse.json({
        success: false,
        error: 'Airport code is required'
      }, { status: 400 });
    }

    console.log(`[Debug API] Force populating cache for ${airportCode}`);
    
    const flightRepository = getFlightRepository();
    await flightRepository.forcePopulateCache(airportCode);
    
    // Verifică dacă datele au fost salvate
    const stats = flightRepository.getCacheStats();
    
    return NextResponse.json({
      success: true,
      message: `Cache populated for ${airportCode}`,
      cacheStats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug API] Error forcing cache population:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST with {"airportCode": "LROP"} to force cache population'
  });
}