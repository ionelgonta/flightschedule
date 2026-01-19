// Proximity Module Types

export interface Coordinates {
  lat: number
  lng: number
}

export interface GeocodingResult {
  city: string
  country: string
  countryCode: string
  coordinates: Coordinates
  displayName: string
}

export interface AirportWithDistance {
  code: string
  city: string
  country: string
  coordinates: Coordinates
  distanceKm: number
  drivingTimeSeconds?: number
  drivingDistanceKm?: number
  // Flight info for proximity display
  flightInfo?: {
    originCities: string[]      // Cities from which flights depart (e.g., "București", "Cluj")
    originCodes: string[]       // Airport codes (e.g., "OTP", "CLJ")
    airlines: string[]          // Airlines operating the route
    days: string[]              // Days of week (e.g., "Luni", "Marți")
    flightCount: number         // Total number of flights
  }
}

export interface ProximityResult {
  searchedCity: string
  searchedCoordinates: Coordinates | null
  nearbyAirports: AirportWithDistance[]
  hasDirectFlights: boolean
  message?: string
}

export interface GeocodingProvider {
  geocode(city: string): Promise<GeocodingResult | null>
  getName(): string
}

export interface DrivingProvider {
  getDrivingTime(from: Coordinates, to: Coordinates): Promise<{ durationSeconds: number; distanceMeters: number } | null>
  getName(): string
}

// Cache structure for geocoding results
export interface GeocodingCache {
  [cityKey: string]: {
    result: GeocodingResult
    timestamp: number
  }
}

// Configuration
export const PROXIMITY_CONFIG = {
  MAX_DISTANCE_KM: 500,
  MAX_AIRPORTS_TO_CHECK: 50, // Show all airports within distance
  CACHE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  // Country codes for European bias
  COUNTRY_CODES: 'ro,md,it,de,fr,es,gb,at,ch,be,nl,pl,cz,hu,bg,gr,hr,si,sk,pt,ie,dk,se,no,fi,ee,lv,lt,ua,rs,ba,me,mk,al,cy,mt,lu',
}
