/**
 * API Route: /api/flights/[airport]/departures
 * Returnează plecările pentru un aeroport specific
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFlightRepository } from '@/lib/flightRepository';
import type { FlightFilters } from '@/lib/flightRepository';
import { getIcaoCode, isAirportSupported } from '@/lib/icaoMapping';

export async function GET(
  request: NextRequest,
  { params }: { params: { airport: string } }
) {
  try {
    const airportCode = params.airport.toUpperCase();
    const { searchParams } = new URL(request.url);

    // Validare și conversie cod aeroport
    if (!airportCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Airport code is required' 
        },
        { status: 400 }
      );
    }

    // Verifică dacă aeroportul este suportat
    if (!isAirportSupported(airportCode)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Airport code ${airportCode} is not supported. Please use IATA codes like OTP, CLJ, TSR.` 
        },
        { status: 400 }
      );
    }

    // Convertește IATA la ICAO pentru cache lookup
    const icaoCode = getIcaoCode(airportCode);

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

    // Obține datele din repository folosind codul ICAO
    const flightRepository = getFlightRepository();
    const result = await flightRepository.getDepartures(icaoCode, filters);
    
    // Setează codul IATA în răspuns pentru client
    result.airport_code = airportCode;

    // Adaugă headers pentru cache
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
    headers.set('X-Cache-Status', result.cached ? 'HIT' : 'MISS');
    headers.set('X-Last-Updated', result.last_updated || new Date().toISOString());

    return NextResponse.json(result, { 
      status: 200, // Always return 200, let the client handle success/error based on result.success
      headers 
    });

  } catch (error) {
    console.error('API Error - Departures:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: params.airport.toUpperCase(),
        type: 'departures'
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