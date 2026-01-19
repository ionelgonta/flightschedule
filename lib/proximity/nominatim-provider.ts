// Nominatim (OpenStreetMap) Geocoding Provider - via server-side API

import { GeocodingProvider, GeocodingResult } from './types'
import { getCachedGeocode, setCachedGeocode } from './geocoding-cache'

export class NominatimProvider implements GeocodingProvider {
  getName(): string {
    return 'Nominatim (OpenStreetMap)'
  }

  async geocode(city: string): Promise<GeocodingResult | null> {
    // Check local cache first
    const cached = getCachedGeocode(city)
    if (cached) {
      console.log(`[Nominatim] Cache hit for: ${city}`)
      return cached
    }

    try {
      // Use our server-side API to avoid CSP issues
      const response = await fetch(`/api/proximity/geocode?city=${encodeURIComponent(city)}`)

      if (!response.ok) {
        console.error(`[Nominatim] API error: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        console.log(`[Nominatim] No results for: ${city}`)
        return null
      }

      const geocodingResult: GeocodingResult = data.data

      // Save to local cache
      setCachedGeocode(city, geocodingResult)
      console.log(`[Nominatim] Geocoded: ${city} -> ${geocodingResult.city}, ${geocodingResult.country}`)

      return geocodingResult
    } catch (error) {
      console.error(`[Nominatim] Error geocoding ${city}:`, error)
      return null
    }
  }
}

// Singleton instance
let nominatimInstance: NominatimProvider | null = null

export function getNominatimProvider(): NominatimProvider {
  if (!nominatimInstance) {
    nominatimInstance = new NominatimProvider()
  }
  return nominatimInstance
}
