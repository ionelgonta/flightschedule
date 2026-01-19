// Main Proximity Service - orchestrates geocoding, distance calculation, and routing

import { 
  Coordinates, 
  GeocodingProvider, 
  AirportWithDistance, 
  ProximityResult,
  PROXIMITY_CONFIG 
} from './types'
import { calculateHaversineDistance, formatDrivingTime, formatDistance } from './haversine'
import { getNominatimProvider } from './nominatim-provider'
import { getOSRMProvider } from './osrm-provider'
import { getAllDestinationAirports, findAirportsByCity, AirportData } from './airports-database'

export class ProximityService {
  private geocodingProvider: GeocodingProvider
  private availableDestinations: Set<string> // IATA codes of destinations with actual flights

  constructor(geocodingProvider?: GeocodingProvider) {
    this.geocodingProvider = geocodingProvider || getNominatimProvider()
    this.availableDestinations = new Set()
  }

  /**
   * Set the list of available destinations (from actual flight data)
   */
  setAvailableDestinations(destinationCodes: string[]): void {
    this.availableDestinations = new Set(destinationCodes.map(c => c.toUpperCase()))
  }

  /**
   * Check if a city has direct flights
   */
  hasDirectFlight(cityOrCode: string): boolean {
    // Check if it's an IATA code
    if (cityOrCode.length === 3 && /^[A-Z]{3}$/i.test(cityOrCode)) {
      return this.availableDestinations.has(cityOrCode.toUpperCase())
    }
    
    // Check by city name
    const airports = findAirportsByCity(cityOrCode)
    return airports.some(a => this.availableDestinations.has(a.code))
  }

  /**
   * Find nearby airports with direct flights
   * Two-step approach: Haversine filter first, then OSRM for top results
   */
  async findNearbyAirports(searchCity: string): Promise<ProximityResult> {
    // Step 1: Check if the city itself has direct flights
    const directAirports = findAirportsByCity(searchCity)
    const directWithFlights = directAirports.filter(a => this.availableDestinations.has(a.code))
    
    if (directWithFlights.length > 0) {
      return {
        searchedCity: searchCity,
        searchedCoordinates: directWithFlights[0].coordinates,
        nearbyAirports: directWithFlights.map(a => ({
          code: a.code,
          city: a.city,
          country: a.country,
          coordinates: a.coordinates,
          distanceKm: 0,
        })),
        hasDirectFlights: true,
        message: `${searchCity} are zboruri directe disponibile!`
      }
    }

    // Step 2: Geocode the searched city
    const geocodeResult = await this.geocodingProvider.geocode(searchCity)
    
    if (!geocodeResult) {
      return {
        searchedCity: searchCity,
        searchedCoordinates: null,
        nearbyAirports: [],
        hasDirectFlights: false,
        message: `Nu am putut g─âsi loca╚¢ia pentru "${searchCity}". Verific─â ortografia.`
      }
    }

    // Step 3: Calculate Haversine distances to all airports with flights
    const allAirports = getAllDestinationAirports()
    const airportsWithFlights = allAirports.filter(a => this.availableDestinations.has(a.code))
    
    const airportsWithDistance: AirportWithDistance[] = airportsWithFlights.map(airport => ({
      code: airport.code,
      city: airport.city,
      country: airport.country,
      coordinates: airport.coordinates,
      distanceKm: calculateHaversineDistance(geocodeResult.coordinates, airport.coordinates)
    }))

    // Sort by distance and take top N for OSRM calculation
    airportsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm)
    const topAirports = airportsWithDistance.slice(0, PROXIMITY_CONFIG.MAX_AIRPORTS_TO_CHECK)

    // Step 4: Get driving times ONLY for airports within 600km Haversine
    // (no point calculating driving to Dubai or Tel Aviv)
    const MAX_DRIVING_CALC_KM = 600
    const osrm = getOSRMProvider()
    
    // Filter airports that are close enough for driving calculation
    const airportsForDriving = topAirports.filter(a => a.distanceKm <= MAX_DRIVING_CALC_KM)
    const airportsTooFar = topAirports.filter(a => a.distanceKm > MAX_DRIVING_CALC_KM)
    
    // Calculate driving times only for nearby airports (limit to 10 to avoid rate limiting)
    const airportsToCalc = airportsForDriving.slice(0, 10)
    const airportsWithDrivingCalc = await Promise.all(
      airportsToCalc.map(async (airport) => {
        const drivingResult = await osrm.getDrivingTime(geocodeResult.coordinates, airport.coordinates)
        return {
          ...airport,
          drivingTimeSeconds: drivingResult?.durationSeconds,
          drivingDistanceKm: drivingResult ? drivingResult.distanceMeters / 1000 : undefined
        }
      })
    )
    
    // For airports too far, just use Haversine distance (no driving calc)
    const airportsWithDriving = [
      ...airportsWithDrivingCalc,
      ...airportsForDriving.slice(10).map(a => ({ ...a })), // remaining nearby without driving calc
      ...airportsTooFar.map(a => ({ ...a })) // far airports without driving calc
    ]

    // Step 5: Filter by DRIVING distance (not haversine) - max 500km rutier
    const nearbyAirports = airportsWithDriving.filter(a => {
      const distance = a.drivingDistanceKm ?? a.distanceKm
      return distance <= PROXIMITY_CONFIG.MAX_DISTANCE_KM
    })

    if (nearbyAirports.length === 0) {
      // Find the closest one even if over limit, for the message
      const closest = airportsWithDriving.sort((a, b) => {
        const distA = a.drivingDistanceKm ?? a.distanceKm
        const distB = b.drivingDistanceKm ?? b.distanceKm
        return distA - distB
      })[0]
      const closestDist = closest.drivingDistanceKm ?? closest.distanceKm
      return {
        searchedCity: searchCity,
        searchedCoordinates: geocodeResult.coordinates,
        nearbyAirports: [],
        hasDirectFlights: false,
        message: `Nu exist─â zboruri directe ├«n aceast─â zon─â. Cel mai apropiat aeroport cu zboruri directe este ${closest.city} (${formatDistance(closestDist)}).`
      }
    }

    // Sort by driving time (if available) or distance
    nearbyAirports.sort((a, b) => {
      if (a.drivingTimeSeconds && b.drivingTimeSeconds) {
        return a.drivingTimeSeconds - b.drivingTimeSeconds
      }
      return a.distanceKm - b.distanceKm
    })

    return {
      searchedCity: searchCity,
      searchedCoordinates: geocodeResult.coordinates,
      nearbyAirports: nearbyAirports,
      hasDirectFlights: false,
      message: `Am g─âsit ${nearbyAirports.length} ${nearbyAirports.length === 1 ? 'aeroport' : 'aeroporturi'} cu zboruri directe ├«n apropiere de ${searchCity}.`
    }
  }

  /**
   * Get driving time with OSRM for a specific airport
   */
  async getDrivingTimeToAirport(from: Coordinates, airportCode: string): Promise<{ durationSeconds: number; distanceMeters: number } | null> {
    const airport = getAllDestinationAirports().find(a => a.code === airportCode.toUpperCase())
    if (!airport) return null

    const osrm = getOSRMProvider()
    return osrm.getDrivingTime(from, airport.coordinates)
  }
}

// Singleton instance
let proximityServiceInstance: ProximityService | null = null

export function getProximityService(): ProximityService {
  if (!proximityServiceInstance) {
    proximityServiceInstance = new ProximityService()
  }
  return proximityServiceInstance
}

// Re-export utilities
export { formatDrivingTime, formatDistance }
