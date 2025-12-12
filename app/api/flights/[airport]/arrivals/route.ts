/**
 * API Route: /api/flights/[airport]/arrivals
 * Returnează sosirile pentru un aeroport specific
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFlightRepository } from '@/lib/flightRepository';
import type { FlightFilters } from '@/lib/flightRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: { airport: string } }
) {
  try {
    const airportCode = params.airport.toUpperCase();
    const { searchParams } = new URL(request.url);

    // Validare cod aeroport
    if (!airportCode || airportCode.length !== 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid airport code. Must be 3 characters (e.g., OTP)' 
        },
        { status: 400 }
      );
    }

    // Construiește filtrele din query parameters
    const filters: FlightFilters = {};
    
    if (searchParams.get('airline')) {
      filters.airline = searchParams.get('airline')!;
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!;
    }
    
    if (searchParams.get('start_time') && searchParams.get('end_time')) {
      filters.timeRange = {
        start: searchParams.get('start_time')!,
        end: searchParams.get('end_time')!
      };
    }

    // Obține datele din repository
    const flightRepository = getFlightRepository();
    const result = await flightRepository.getArrivals(airportCode, filters);

    // Adaugă headers pentru cache
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
    headers.set('X-Cache-Status', result.cached ? 'HIT' : 'MISS');
    headers.set('X-Last-Updated', result.last_updated);

    return NextResponse.json(result, { 
      status: 200, // Always return 200, let the client handle success/error based on result.success
      headers 
    });

  } catch (error) {
    console.error('API Error - Arrivals:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: params.airport.toUpperCase(),
        type: 'arrivals'
      },
      { status: 500 }
    );
  }
}

// Suport pentru OPTIONS (CORS)
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