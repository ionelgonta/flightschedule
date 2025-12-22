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
  
  // Additional Airlines
  '5F': 'FlyOne',
  'HV': 'Transavia',
  'TRA': 'Transavia',
  'EN': 'Air Dolomiti',
  'DLA': 'Air Dolomiti',
  'A3': 'Aegean Airlines',
  'AEE': 'Aegean Airlines',
  'JU': 'Air Serbia',
  'ASL': 'Air Serbia',
  'OU': 'Croatia Airlines',
  'CTN': 'Croatia Airlines',
  'JP': 'Adria Airways',
  'ADR': 'Adria Airways',
  'YM': 'Montenegro Airlines',
  'MGX': 'Montenegro Airlines',
  'FB': 'Bulgaria Air',
  'LZB': 'Bulgaria Air',
  'RJ': 'Royal Jordanian',
  'RJA': 'Royal Jordanian',
  'MS': 'EgyptAir',
  'MSR': 'EgyptAir',
  'SU': 'Aeroflot',
  'AFL': 'Aeroflot',
  'S7': 'S7 Airlines',
  'SBI': 'S7 Airlines',
  
  // New Airlines from user request
  'H4': 'Hisky',
  'HI': 'Hisky',
  
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
  'SUJ': 'Satu Mare',
  
  // Moldovan Airports
  'RMO': 'Chișinău',
  
  // Major European Airports
  'LHR': 'Londra',
  'LGW': 'Londra',
  'STN': 'Londra',
  'LTN': 'Londra',
  'CDG': 'Paris',
  'ORY': 'Paris',
  'FRA': 'Frankfurt',
  'MUC': 'München',
  'VIE': 'Viena',
  'FCO': 'Roma',
  'CIA': 'Roma',
  'IST': 'Istanbul',
  'SAW': 'Istanbul',
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
  
  // Polish Airports
  'KTW': 'Katowice',
  'KRK': 'Cracovia',
  'GDN': 'Gdansk',
  'WRO': 'Wrocław',
  'POZ': 'Poznań',
  'SZZ': 'Szczecin',
  
  // German Airports
  'DUS': 'Düsseldorf',
  'CGN': 'Köln',
  'HAM': 'Hamburg',
  'STR': 'Stuttgart',
  'NUE': 'Nürnberg',
  'HAJ': 'Hannover',
  'BER': 'Berlin',
  'TXL': 'Berlin',
  'SXF': 'Berlin',
  
  // Italian Airports
  'MXP': 'Milano',
  'LIN': 'Milano',
  'BGY': 'Milano',
  'VCE': 'Veneția',
  'TSF': 'Veneția',
  'NAP': 'Napoli',
  'CTA': 'Catania',
  'PMO': 'Palermo',
  'BLQ': 'Bologna',
  'FLR': 'Florența',
  
  // Spanish Airports
  'VLC': 'Valencia',
  'SVQ': 'Sevilla',
  'BIO': 'Bilbao',
  'LPA': 'Las Palmas',
  'TFS': 'Tenerife',
  'PMI': 'Palma de Mallorca',
  
  // French Airports
  'LYS': 'Lyon',
  'MRS': 'Marseille',
  'NCE': 'Nice',
  'TLS': 'Toulouse',
  'BOD': 'Bordeaux',
  'NTE': 'Nantes',
  
  // Other European
  'DUB': 'Dublin',
  'EDI': 'Edinburgh',
  'MAN': 'Manchester',
  'BHX': 'Birmingham',
  'LIS': 'Lisabona',
  'OPO': 'Porto',
  'ZAZ': 'Zaragoza',
  'VGO': 'Vigo',
  
  // New airports from user request
  'VRN': 'Verona',
  'SSH': 'Sharm el Sheikh',
  'CDT': 'Castellon',
  'EIN': 'Eindhoven',
  'HHN': 'Frankfurt Hahn',
  'BRI': 'Bari',
  'LCA': 'Larnaca',
  
  // Additional airports - December 2024
  'AYT': 'Antalya',
  'FMM': 'Memmingen',
  'GYD': 'Baku',
  'BEY': 'Beirut',
  'CAI': 'Cairo',
  'PSA': 'Pisa',
  'BSL': 'Basel',
  
  // No fallback codes - only real IATA codes allowed
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
  if (!airportCode) return 'Necunoscut'
  
  const upperCode = airportCode.toUpperCase().trim()
  return AIRPORT_CITY_MAPPING[upperCode] || upperCode
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