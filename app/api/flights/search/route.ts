/**
 * API Route: /api/flights/search
 * Căutare zboruri după numărul de zbor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedFlightService } from '@/lib/advancedFlightService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flightNumber = searchParams.get('flight');
    const date = searchParams.get('date');

    if (!flightNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Flight number is required' 
        },
        { status: 400 }
      );
    }

    const advancedService = getAdvancedFlightService();
    const results = await advancedService.searchFlightByNumber(flightNumber, date || undefined);

    return NextResponse.json({
      success: true,
      data: results,
      query: {
        flightNumber,
        date: date || 'today'
      },
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Flight search error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: []
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}