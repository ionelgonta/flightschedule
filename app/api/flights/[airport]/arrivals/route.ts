/**
 * API Route: /api/flights/[airport]/arrivals
 * Returnează sosirile pentru un aeroport specific
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFlightRepository } from '@/lib/flightRepository';
import type { FlightFilters } from '@/lib/flightRepository';
import { isAirportSupported } from '@/lib/airports';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { airport: string } }
) {
  try {
    const airportCode = params.airport?.toUpperCase();
    const { searchParams } = new URL(request.url);

    // Validare și conversie cod aeroport
    if (!airportCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Airport code is required',
          data: [],
          cached: false,
          last_updated: new Date().toISOString(),
          airport_code: '',
          type: 'arrivals'
        },
        { status: 400 }
      );
    }

    // Verifică dacă aeroportul este suportat
    if (!isAirportSupported(airportCode)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Airport code ${airportCode} is not supported. Please use IATA codes like OTP, CLJ, TSR.`,
          data: [],
          cached: false,
          last_updated: new Date().toISOString(),
          airport_code: airportCode,
          type: 'arrivals'
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

    // Obține datele din repository folosind codul IATA
    const flightRepository = getFlightRepository();
    const result = await flightRepository.getArrivals(airportCode, filters);
    
    // Setează codul IATA în răspuns pentru client
    result.airport_code = airportCode;

    // Adaugă headers pentru cache și SEO
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
    headers.set('X-Cache-Status', result.cached ? 'HIT' : 'MISS');
    headers.set('X-Last-Updated', result.last_updated || new Date().toISOString());
    headers.set('X-Robots-Tag', 'noindex'); // API endpoints should not be indexed

    return NextResponse.json(result, { 
      status: 200,
      headers 
    });

  } catch (error) {
    console.error('API Error - Arrivals:', error);
    
    // Return structured error response instead of 500
    return NextResponse.json(
      {
        success: false,
        error: 'Service temporarily unavailable. Please try again later.',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: params.airport?.toUpperCase() || '',
        type: 'arrivals'
      },
      { 
        status: 200, // Return 200 to avoid 5xx errors affecting SEO
        headers: {
          'X-Robots-Tag': 'noindex',
          'Cache-Control': 'no-cache'
        }
      }
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
      'X-Robots-Tag': 'noindex'
    },
  });
}