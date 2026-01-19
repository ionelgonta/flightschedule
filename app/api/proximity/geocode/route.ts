import { NextRequest, NextResponse } from 'next/server'

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'FlyFinder-App (ionel.gonta@gmail.com)'

// Simple in-memory cache for server-side
const geocodeCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function normalizeKey(city: string): string {
  return city.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const city = searchParams.get('city')

  if (!city || city.trim().length < 2) {
    return NextResponse.json({ error: 'City parameter required (min 2 chars)' }, { status: 400 })
  }

  const cacheKey = normalizeKey(city)
  
  // Check cache
  const cached = geocodeCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cached.result, cached: true })
  }

  try {
    const params = new URLSearchParams({
      q: city.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '5',
      viewbox: '-10,35,45,70', // Europe bias
      bounded: '0',
    })

    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Accept-Language': 'en,ro,it,de,fr,es',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Nominatim error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: null, message: 'No results found' })
    }

    // Find best result - prefer cities/towns
    let bestResult = data[0]
    for (const result of data) {
      const type = result.type || ''
      const classType = result.class || ''
      if (classType === 'place' || classType === 'boundary' || 
          type === 'city' || type === 'town' || type === 'administrative') {
        bestResult = result
        break
      }
    }

    const address = bestResult.address || {}
    const geocodingResult = {
      city: address.city || address.town || address.village || address.municipality || address.county || city,
      country: address.country || '',
      countryCode: address.country_code?.toUpperCase() || '',
      coordinates: {
        lat: parseFloat(bestResult.lat),
        lng: parseFloat(bestResult.lon),
      },
      displayName: bestResult.display_name || city,
    }

    // Save to cache
    geocodeCache.set(cacheKey, { result: geocodingResult, timestamp: Date.now() })

    return NextResponse.json({ success: true, data: geocodingResult })
  } catch (error) {
    console.error('[Geocode API] Error:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
