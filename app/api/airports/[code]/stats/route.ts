/**
 * API Route: /api/airports/[code]/stats
 * Statistici detaliate pentru un aeroport
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedFlightService } from '@/lib/advancedFlightService';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const airportCode = params.code.toUpperCase();

    if (!airportCode || airportCode.length !== 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid airport code. Must be 3 characters (e.g., OTP)' 
        },
        { status: 400 }
      );
    }

    const advancedService = getAdvancedFlightService();
    const stats = await advancedService.getDetailedAirportStats(airportCode);

    if (!stats) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Airport statistics not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
      airport_code: airportCode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Airport stats error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: null
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