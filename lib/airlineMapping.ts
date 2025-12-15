/**
 * Airline and Airport Code Mapping Service
 * Maps IATA/ICAO codes to full names in Romanian
 */

// Airline mapping - IATA/ICAO codes to full names
export const AIRLINE_MAPPING: { [key: string]: string } = {
  // Romanian Airlines
  'RO': 'TAROM',
  'ROT': 'TAROM',
  '0B': 'Blue Air',
  'BMS': 'Blue Air',
  
  // Major European Airlines
  'W4': 'Wizz Air',
  'WZZ': 'Wizz Air',
  'W6': 'Wizz Air',
  'FR': 'Ryanair',
  'RYR': 'Ryanair',
  'LH': 'Lufthansa',
  'DLH': 'Lufthansa',
  'AF': 'Air France',
  'AFR': 'Air France',
  'KL': 'KLM',
  'KLM': 'KLM Royal Dutch Airlines',
  'BA': 'British Airways',
  'BAW': 'British Airways',
  'IB': 'Iberia',
  'IBE': 'Iberia',
  'AZ': 'ITA Airways',
  'ITY': 'ITA Airways',
  'OS': 'Austrian Airlines',
  'AUA': 'Austrian Airlines',
  'SN': 'Brussels Airlines',
  'BEL': 'Brussels Airlines',
  'SK': 'SAS',
  'SAS': 'Scandinavian Airlines',
  'AY': 'Finnair',
  'FIN': 'Finnair',
  'TP': 'TAP Air Portugal',
  'TAP': 'TAP Air Portugal',
  
  // Turkish Airlines
  'TK': 'Turkish Airlines',
  'THY': 'Turkish Airlines',
  
  // Eastern European
  '9U': 'Air Moldova',
  'MLD': 'Air Moldova',
  'PS': 'Ukraine International',
  'AUI': 'Ukraine International',
  'BT': 'Air Baltic',
  'BTI': 'Air Baltic',
  'LO': 'LOT Polish Airlines',
  'LOT': 'LOT Polish Airlines',
  'OK': 'Czech Airlines',
  'CSA': 'Czech Airlines',
  
  // Low-cost carriers
  'U2': 'easyJet',
  'EZY': 'easyJet',
  'VY': 'Vueling',
  'VLG': 'Vueling',
  'EW': 'Eurowings',
  'EWG': 'Eurowings',
  'PC': 'Pegasus Airlines',
  'PGT': 'Pegasus Airlines',
  
  // Middle East & Others
  'QR': 'Qatar Airways',
  'QTR': 'Qatar Airways',
  'EK': 'Emirates',
  'UAE': 'Emirates',
  
  // Default fallback
  'XX': 'Companie Necunoscută'
}

// Airport mapping with city names in Romanian
export const AIRPORT_CITY_MAPPING: { [key: string]: string } = {
  // Romanian Airports
  'OTP': 'București',
  'BBU': 'București',
  'CLJ': 'Cluj-Napoca',
  'TSR': 'Timișoara',
  'IAS': 'Iași',
  'CND': 'Constanța',
  'SBZ': 'Sibiu',
  'CRA': 'Craiova',
  'BCM': 'Bacău',
  'BAY': 'Baia Mare',
  'OMR': 'Oradea',
  'SCV': 'Suceava',
  'TGM': 'Târgu Mureș',
  'ARW': 'Arad',
  'STU': 'Satu Mare',
  
  // Moldovan Airports
  'RMO': 'Chișinău',
  'KIV': 'Chișinău',
  
  // Major European Airports
  'LHR': 'Londra',
  'CDG': 'Paris',
  'FRA': 'Frankfurt',
  'MUC': 'München',
  'VIE': 'Viena',
  'FCO': 'Roma',
  'IST': 'Istanbul',
  'DXB': 'Dubai',
  'ATH': 'Atena',
  'BRU': 'Bruxelles',
  'AMS': 'Amsterdam',
  'MAD': 'Madrid',
  'BCN': 'Barcelona',
  'ZUR': 'Zurich',
  'GVA': 'Geneva',
  'CPH': 'Copenhaga',
  'ARN': 'Stockholm',
  'HEL': 'Helsinki',
  'OSL': 'Oslo',
  'WAW': 'Varșovia',
  'PRG': 'Praga',
  'BUD': 'Budapesta',
  'SOF': 'Sofia',
  'BEG': 'Belgrad',
  'ZAG': 'Zagreb',
  'LJU': 'Ljubljana',
  'SKG': 'Salonic',
  
  // Default fallback
  'XXX': 'Oraș Necunoscut'
}

/**
 * Get airline full name from IATA/ICAO code
 */
export function getAirlineName(code: string): string {
  if (!code) return 'XX'
  
  const upperCode = code.toUpperCase().trim()
  return AIRLINE_MAPPING[upperCode] || upperCode
}

/**
 * Get city name from airport IATA/ICAO code
 */
export function getCityName(airportCode: string): string {
  if (!airportCode) return 'Oraș Necunoscut'
  
  const upperCode = airportCode.toUpperCase().trim()
  return AIRPORT_CITY_MAPPING[upperCode] || airportCode
}

/**
 * Format airport display as "City (CODE)"
 */
export function formatAirportDisplay(airportCode: string): string {
  const cityName = getCityName(airportCode)
  return `${cityName} (${airportCode.toUpperCase()})`
}

/**
 * Format airline display with full name
 */
export function formatAirlineDisplay(airlineCode: string): string {
  const airlineName = getAirlineName(airlineCode)
  if (airlineName === airlineCode) {
    return airlineCode // Return code if no mapping found
  }
  return `${airlineName} (${airlineCode.toUpperCase()})`
}