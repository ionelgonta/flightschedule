/**
 * Weather utilities for airport-to-city mapping
 * Maps IATA airport codes to weather city names for OpenWeatherMap API
 */

/**
 * Maps airport IATA code to weather city name
 * @param airportCode - IATA airport code (e.g., 'OTP', 'CLJ')
 * @returns Weather city name for OpenWeatherMap API
 */
export function getWeatherCityForAirport(airportCode: string): string {
  const airportToWeatherCityMap: { [key: string]: string } = {
    'OTP': 'Bucharest',
    'BBU': 'Bucharest', 
    'CLJ': 'Cluj-Napoca',
    'TSR': 'Timisoara',
    'IAS': 'Iasi',
    'CND': 'Constanta',
    'CRA': 'Craiova',
    'SBZ': 'Sibiu',
    'BCM': 'Bacau',
    'BAY': 'Baia Mare',
    'OMR': 'Oradea',
    'SCV': 'Suceava',
    'TGM': 'Targu Mures',
    'ARW': 'Arad',
    'SUJ': 'Satu Mare',
    'RMO': 'Chisinau'
  }
  
  return airportToWeatherCityMap[airportCode.toUpperCase()] || 'Bucharest'
}

/**
 * Gets all supported weather cities
 * @returns Array of weather city names
 */
export function getAllWeatherCities(): string[] {
  return [
    'Bucharest',
    'Cluj-Napoca',
    'Timisoara',
    'Iasi',
    'Constanta',
    'Craiova',
    'Sibiu',
    'Bacau',
    'Baia Mare',
    'Oradea',
    'Suceava',
    'Targu Mures',
    'Arad',
    'Satu Mare',
    'Chisinau'
  ]
}