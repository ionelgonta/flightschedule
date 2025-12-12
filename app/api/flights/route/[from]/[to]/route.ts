/**
 * API Route: /api/flights/route/[from]/[to]
 * Informații despre ruta între două aeroporturi
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedFlightService } from '@/lib/advancedFlightService';

export async function GET(
  request: NextRequest,
  { params }: { params: { from: string; to: string } }
) {
  try {
    const { from, to } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!from || !to) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Both departure and arrival airports are required' 
        },
        { status: 400 }
      );
    }

    if (from.length !== 3 || to.length !== 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Airport codes must be 3 characters (IATA format)' 
        },
        { status: 400 }
      );
    }

    const advancedService = getAdvancedFlightService();
    const routeInfo = await advancedService.getRouteInfo(from, to, date || undefined);

    if (!routeInfo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Route information not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: routeInfo,
      query: {
        from,
        to,
        date: date || 'today'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Route info error:', error);
    
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