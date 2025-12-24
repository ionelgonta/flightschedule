/**
 * API pentru obținerea aeroporturilor din baza de date îmbunătățită
 * Returnează informații complete despre aeroporturi din baza de date proprie
 */

import { NextRequest, NextResponse } from 'next/server';
import AirportDatabaseService from '@/lib/airportDatabase';
import AirportAutoLoader from '@/lib/airportAutoLoader';
import { FALLBACK_AIRPORTS } from '@/lib/airports';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const code = searchParams.get('code') || searchParams.get('iata');

    const airportDb = new AirportDatabaseService();

    try {
      if (code) {
        // Obține un aeroport specific
        const upperCode = code.toUpperCase();
        let airport = airportDb.getAirport(upperCode);
        
        // Dacă nu există în baza de date, încearcă să îl obțină automat
        if (!airport) {
          console.log(`[Enhanced API] Airport ${upperCode} not found, trying to fetch from AeroDataBox...`);
          
          const autoLoader = AirportAutoLoader.getInstance();
          const success = await autoLoader.forceProcessCode(upperCode);
          
          if (success) {
            // Încearcă din nou să îl obțină din baza de date
            airport = airportDb.getAirport(upperCode);
          }
        }
        
        airportDb.close();
        
        if (airport) {
          // Returnează datele complete din baza de date
          return NextResponse.json({ 
            success: true, 
            airport: {
              iata_code: airport.iata_code,
              icao_code: airport.icao_code,
              name: airport.name,
              city: airport.city,
              municipality_name: airport.municipality_name,
              country_name: airport.country_name,
              timezone: airport.timezone,
              latitude: airport.latitude,
              longitude: airport.longitude
            }
          });
        } else {
          // Fallback la lista statică
          const fallbackAirport = FALLBACK_AIRPORTS.find(a => a.code === code.toUpperCase());
          return NextResponse.json({ 
            success: true, 
            airport: fallbackAirport || null,
            source: 'fallback'
          });
        }
      } else if (query) {
        // Caută aeroporturi
        const results = airportDb.searchAirports(query);
        airportDb.close();
        
        // Convertește în formatul standard
        const standardResults = results.map(airport => ({
          code: airport.iata_code,
          name: airport.name,
          city: airport.city || airport.municipality_name || 'Unknown',
          country: airport.country_name || 'Unknown',
          timezone: airport.timezone || 'UTC',
          coordinates: {
            lat: airport.latitude || 0,
            lng: airport.longitude || 0
          }
        }));
        
        return NextResponse.json({ 
          success: true, 
          airports: standardResults,
          count: standardResults.length,
          source: 'database'
        });
      } else {
        // Obține toate aeroporturile
        const allAirports = airportDb.getAllAirports();
        airportDb.close();
        
        if (allAirports.length > 0) {
          // Convertește în formatul standard
          const standardAirports = allAirports.map(airport => ({
            code: airport.iata_code,
            name: airport.name,
            city: airport.city || airport.municipality_name || 'Unknown',
            country: airport.country_name || 'Unknown',
            timezone: airport.timezone || 'UTC',
            coordinates: {
              lat: airport.latitude || 0,
              lng: airport.longitude || 0
            }
          }));
          
          return NextResponse.json({ 
            success: true, 
            airports: standardAirports,
            count: standardAirports.length,
            source: 'database'
          });
        } else {
          // Fallback la lista statică
          return NextResponse.json({ 
            success: true, 
            airports: FALLBACK_AIRPORTS,
            count: FALLBACK_AIRPORTS.length,
            source: 'fallback'
          });
        }
      }
    } catch (dbError) {
      console.error('[Enhanced Airports API] Database error:', dbError);
      airportDb.close();
      
      // Fallback la lista statică în caz de eroare
      if (code) {
        const fallbackAirport = FALLBACK_AIRPORTS.find(a => a.code === code.toUpperCase());
        return NextResponse.json({ 
          success: true, 
          airport: fallbackAirport || null,
          source: 'fallback',
          warning: 'Database unavailable, using fallback data'
        });
      } else if (query) {
        const searchTerm = query.toLowerCase();
        const results = FALLBACK_AIRPORTS.filter(airport => 
          airport.code.toLowerCase().includes(searchTerm) ||
          airport.name.toLowerCase().includes(searchTerm) ||
          airport.city.toLowerCase().includes(searchTerm) ||
          airport.country.toLowerCase().includes(searchTerm)
        );
        
        return NextResponse.json({ 
          success: true, 
          airports: results,
          count: results.length,
          source: 'fallback',
          warning: 'Database unavailable, using fallback data'
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          airports: FALLBACK_AIRPORTS,
          count: FALLBACK_AIRPORTS.length,
          source: 'fallback',
          warning: 'Database unavailable, using fallback data'
        });
      }
    }
  } catch (error) {
    console.error('[Enhanced Airports API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}