// Google Maps Geocoding Provider (Placeholder for future use)

import { GeocodingProvider, GeocodingResult } from './types'
import { getCachedGeocode, setCachedGeocode } from './geocoding-cache'

// Placeholder API Key - replace with actual key when switching to Google Maps
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
const GOOGLE_GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json'

export class GoogleMapsProvider implements GeocodingProvider {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GOOGLE_MAPS_API_KEY
  }

  getName(): string {
    return 'Google Maps Geocoding'
  }

  async geocode(city: string): Promise<GeocodingResult | null> {
    // Check cache first
    const cached = getCachedGeocode(city)
    if (cached) {
      console.log(`[GoogleMaps] Cache hit for: ${city}`)
      return cached
    }

    // Check if API key is configured
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.warn('[GoogleMaps] API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
      return null
    }

    try {
      const params = new URLSearchParams({
        address: city,
        key: this.apiKey,
        // Bias results to Europe
        region: 'eu',
      })

      const response = await fetch(`${GOOGLE_GEOCODING_ENDPOINT}?${params}`)

      if (!response.ok) {
        console.error(`[GoogleMaps] HTTP error: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.log(`[GoogleMaps] No results for: ${city} (status: ${data.status})`)
        return null
      }

      const result = data.results[0]
      const location = result.geometry?.location

      if (!location) {
        return null
      }

      // Extract country from address components
      let country = ''
      let countryCode = ''
      let cityName = city

      for (const component of result.address_components || []) {
        if (component.types.includes('country')) {
          country = component.long_name
          countryCode = component.short_name
        }
        if (component.types.includes('locality')) {
          cityName = component.long_name
        }
      }

      const geocodingResult: GeocodingResult = {
        city: cityName,
        country,
        countryCode,
        coordinates: {
          lat: location.lat,
          lng: location.lng,
        },
        displayName: result.formatted_address || city,
      }

      // Save to cache
      setCachedGeocode(city, geocodingResult)
      console.log(`[GoogleMaps] Geocoded: ${city} -> ${geocodingResult.coordinates.lat}, ${geocodingResult.coordinates.lng}`)

      return geocodingResult
    } catch (error) {
      console.error(`[GoogleMaps] Error geocoding ${city}:`, error)
      return null
    }
  }
}

// Factory function
export function getGoogleMapsProvider(apiKey?: string): GoogleMapsProvider {
  return new GoogleMapsProvider(apiKey)
}
