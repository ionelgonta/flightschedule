/**
 * API Route: /api/airports/search
 * Căutare aeroporturi după nume sau cod
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedFlightService } from '@/lib/advancedFlightService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const country = searchParams.get('country');

    if (!query && !country) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Search query or country code is required' 
        },
        { status: 400 }
      );
    }

    const advancedService = getAdvancedFlightService();
    
    let airports;
    if (country) {
      airports = await advancedService.getCountryAirports(country);
    } else {
      airports = await advancedService.searchAirports(query!);
    }

    return NextResponse.json({
      success: true,
      data: airports,
      query: {
        searchTerm: query,
        country
      },
      count: airports.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Airport search error:', error);
    
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