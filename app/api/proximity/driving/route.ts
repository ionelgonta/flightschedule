import { NextRequest, NextResponse } from 'next/server'

// OpenRouteService - 2000 requests/day free
const ORS_ENDPOINT = 'https://api.openrouteservice.org/v2/directions/driving-car'
const ORS_API_KEY = process.env.ORS_API_KEY || ''

// OSRM as fallback (public demo server)
const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fromLat = searchParams.get('fromLat')
  const fromLng = searchParams.get('fromLng')
  const toLat = searchParams.get('toLat')
  const toLng = searchParams.get('toLng')

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  // Try OpenRouteService first (if API key configured)
  if (ORS_API_KEY) {
    try {
      const orsUrl = `${ORS_ENDPOINT}?api_key=${ORS_API_KEY}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(orsUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          const route = data.features[0].properties.summary
          return NextResponse.json({
            success: true,
            data: {
              durationSeconds: Math.round(route.duration),
              distanceMeters: Math.round(route.distance),
            },
            source: 'openrouteservice'
          })
        }
      } else {
        console.warn(`[Driving API] ORS returned ${response.status}`)
      }
    } catch (error: any) {
      console.warn('[Driving API] ORS error:', error.message)
    }
  }

  // Try OSRM as fallback
  try {
    const osrmUrl = `${OSRM_ENDPOINT}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(osrmUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlyFinder-App/1.0 (contact@anyway.ro)',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        return NextResponse.json({
          success: true,
          data: {
            durationSeconds: Math.round(route.duration),
            distanceMeters: Math.round(route.distance),
          },
          source: 'osrm'
        })
      }
    }
  } catch (error: any) {
    // OSRM failed, continue to estimate
  }

  // Fallback: Calculate estimated driving time from Haversine distance
  try {
    const lat1 = parseFloat(fromLat)
    const lng1 = parseFloat(fromLng)
    const lat2 = parseFloat(toLat)
    const lng2 = parseFloat(toLng)
    
    // Haversine formula
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const haversineKm = R * c
    
    // Estimate: road distance ~1.3x straight line, speed ~80 km/h
    const estimatedRoadKm = haversineKm * 1.3
    const estimatedSeconds = (estimatedRoadKm / 80) * 3600
    
    return NextResponse.json({
      success: true,
      data: {
        durationSeconds: Math.round(estimatedSeconds),
        distanceMeters: Math.round(estimatedRoadKm * 1000),
      },
      source: 'estimated'
    })
  } catch (error) {
    return NextResponse.json({ success: true, data: null, message: 'Calculation failed' })
  }
}
