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

// Airline logo mapping - IATA/ICAO codes to logo URLs
export const AIRLINE_LOGO_MAPPING: { [key: string]: string } = {
  // Romanian Airlines
  'RO': 'https://logos-world.net/wp-content/uploads/2023/01/Tarom-Logo.png',
  'ROT': 'https://logos-world.net/wp-content/uploads/2023/01/Tarom-Logo.png',
  '0B': 'https://logos-world.net/wp-content/uploads/2020/03/Blue-Air-Logo.png',
  'BMS': 'https://logos-world.net/wp-content/uploads/2020/03/Blue-Air-Logo.png',
  
  // Major European Airlines
  'W4': 'https://logos-world.net/wp-content/uploads/2020/03/Wizz-Air-Logo.png',
  'WZZ': 'https://logos-world.net/wp-content/uploads/2020/03/Wizz-Air-Logo.png',
  'W6': 'https://logos-world.net/wp-content/uploads/2020/03/Wizz-Air-Logo.png',
  'FR': 'https://logos-world.net/wp-content/uploads/2020/03/Ryanair-Logo.png',
  'RYR': 'https://logos-world.net/wp-content/uploads/2020/03/Ryanair-Logo.png',
  'LH': 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png',
  'DLH': 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png',
  'AF': 'https://logos-world.net/wp-content/uploads/2020/03/Air-France-Logo.png',
  'AFR': 'https://logos-world.net/wp-content/uploads/2020/03/Air-France-Logo.png',
  'KL': 'https://logos-world.net/wp-content/uploads/2020/03/KLM-Logo.png',
  'KLM': 'https://logos-world.net/wp-content/uploads/2020/03/KLM-Logo.png',
  'BA': 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png',
  'BAW': 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png',
  'IB': 'https://logos-world.net/wp-content/uploads/2020/03/Iberia-Logo.png',
  'IBE': 'https://logos-world.net/wp-content/uploads/2020/03/Iberia-Logo.png',
  'AZ': 'https://logos-world.net/wp-content/uploads/2021/08/ITA-Airways-Logo.png',
  'ITY': 'https://logos-world.net/wp-content/uploads/2021/08/ITA-Airways-Logo.png',
  'OS': 'https://logos-world.net/wp-content/uploads/2020/03/Austrian-Airlines-Logo.png',
  'AUA': 'https://logos-world.net/wp-content/uploads/2020/03/Austrian-Airlines-Logo.png',
  'SN': 'https://logos-world.net/wp-content/uploads/2020/03/Brussels-Airlines-Logo.png',
  'BEL': 'https://logos-world.net/wp-content/uploads/2020/03/Brussels-Airlines-Logo.png',
  'SK': 'https://logos-world.net/wp-content/uploads/2020/03/SAS-Logo.png',
  'SAS': 'https://logos-world.net/wp-content/uploads/2020/03/SAS-Logo.png',
  'AY': 'https://logos-world.net/wp-content/uploads/2020/03/Finnair-Logo.png',
  'FIN': 'https://logos-world.net/wp-content/uploads/2020/03/Finnair-Logo.png',
  'TP': 'https://logos-world.net/wp-content/uploads/2020/03/TAP-Air-Portugal-Logo.png',
  'TAP': 'https://logos-world.net/wp-content/uploads/2020/03/TAP-Air-Portugal-Logo.png',
  
  // Turkish Airlines
  'TK': 'https://logos-world.net/wp-content/uploads/2020/03/Turkish-Airlines-Logo.png',
  'THY': 'https://logos-world.net/wp-content/uploads/2020/03/Turkish-Airlines-Logo.png',
  
  // Eastern European
  '9U': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Air_Moldova_logo.svg/200px-Air_Moldova_logo.svg.png',
  'MLD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Air_Moldova_logo.svg/200px-Air_Moldova_logo.svg.png',
  'PS': 'https://logos-world.net/wp-content/uploads/2020/03/Ukraine-International-Airlines-Logo.png',
  'AUI': 'https://logos-world.net/wp-content/uploads/2020/03/Ukraine-International-Airlines-Logo.png',
  'BT': 'https://logos-world.net/wp-content/uploads/2020/03/Air-Baltic-Logo.png',
  'BTI': 'https://logos-world.net/wp-content/uploads/2020/03/Air-Baltic-Logo.png',
  'LO': 'https://logos-world.net/wp-content/uploads/2020/03/LOT-Polish-Airlines-Logo.png',
  'LOT': 'https://logos-world.net/wp-content/uploads/2020/03/LOT-Polish-Airlines-Logo.png',
  'OK': 'https://logos-world.net/wp-content/uploads/2020/03/Czech-Airlines-Logo.png',
  'CSA': 'https://logos-world.net/wp-content/uploads/2020/03/Czech-Airlines-Logo.png',
  
  // Low-cost carriers
  'U2': 'https://logos-world.net/wp-content/uploads/2020/03/EasyJet-Logo.png',
  'EZY': 'https://logos-world.net/wp-content/uploads/2020/03/EasyJet-Logo.png',
  'VY': 'https://logos-world.net/wp-content/uploads/2020/03/Vueling-Logo.png',
  'VLG': 'https://logos-world.net/wp-content/uploads/2020/03/Vueling-Logo.png',
  'EW': 'https://logos-world.net/wp-content/uploads/2020/03/Eurowings-Logo.png',
  'EWG': 'https://logos-world.net/wp-content/uploads/2020/03/Eurowings-Logo.png',
  'PC': 'https://logos-world.net/wp-content/uploads/2020/03/Pegasus-Airlines-Logo.png',
  'PGT': 'https://logos-world.net/wp-content/uploads/2020/03/Pegasus-Airlines-Logo.png',
  
  // Middle East & Others
  'QR': 'https://logos-world.net/wp-content/uploads/2020/03/Qatar-Airways-Logo.png',
  'QTR': 'https://logos-world.net/wp-content/uploads/2020/03/Qatar-Airways-Logo.png',
  'EK': 'https://logos-world.net/wp-content/uploads/2020/03/Emirates-Logo.png',
  'UAE': 'https://logos-world.net/wp-content/uploads/2020/03/Emirates-Logo.png',
  
  // Additional Airlines
  '5F': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/FlyOne_logo.svg/200px-FlyOne_logo.svg.png',
  'HV': 'https://logos-world.net/wp-content/uploads/2020/03/Transavia-Logo.png',
  'TRA': 'https://logos-world.net/wp-content/uploads/2020/03/Transavia-Logo.png',
  'EN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Air_Dolomiti_Logo.svg/200px-Air_Dolomiti_Logo.svg.png',
  'DLA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Air_Dolomiti_Logo.svg/200px-Air_Dolomiti_Logo.svg.png',
  'A3': 'https://logos-world.net/wp-content/uploads/2020/03/Aegean-Airlines-Logo.png',
  'AEE': 'https://logos-world.net/wp-content/uploads/2020/03/Aegean-Airlines-Logo.png',
  'JU': 'https://logos-world.net/wp-content/uploads/2020/03/Air-Serbia-Logo.png',
  'ASL': 'https://logos-world.net/wp-content/uploads/2020/03/Air-Serbia-Logo.png',
  'OU': 'https://logos-world.net/wp-content/uploads/2020/03/Croatia-Airlines-Logo.png',
  'CTN': 'https://logos-world.net/wp-content/uploads/2020/03/Croatia-Airlines-Logo.png',
  'JP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Adria_Airways_logo.svg/200px-Adria_Airways_logo.svg.png',
  'ADR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Adria_Airways_logo.svg/200px-Adria_Airways_logo.svg.png',
  'YM': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Montenegro_Airlines_logo.svg/200px-Montenegro_Airlines_logo.svg.png',
  'MGX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Montenegro_Airlines_logo.svg/200px-Montenegro_Airlines_logo.svg.png',
  'FB': 'https://logos-world.net/wp-content/uploads/2020/03/Bulgaria-Air-Logo.png',
  'LZB': 'https://logos-world.net/wp-content/uploads/2020/03/Bulgaria-Air-Logo.png',
  'RJ': 'https://logos-world.net/wp-content/uploads/2020/03/Royal-Jordanian-Logo.png',
  'RJA': 'https://logos-world.net/wp-content/uploads/2020/03/Royal-Jordanian-Logo.png',
  'MS': 'https://logos-world.net/wp-content/uploads/2020/03/EgyptAir-Logo.png',
  'MSR': 'https://logos-world.net/wp-content/uploads/2020/03/EgyptAir-Logo.png',
  'SU': 'https://logos-world.net/wp-content/uploads/2020/03/Aeroflot-Logo.png',
  'AFL': 'https://logos-world.net/wp-content/uploads/2020/03/Aeroflot-Logo.png',
  'S7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/S7_Airlines_logo.svg/200px-S7_Airlines_logo.svg.png',
  'SBI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/S7_Airlines_logo.svg/200px-S7_Airlines_logo.svg.png',
  
  // New Airlines from user request
  'H4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/HiSky_logo.svg/200px-HiSky_logo.svg.png',
  'HI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/HiSky_logo.svg/200px-HiSky_logo.svg.png'
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
 * Get airline logo URL from IATA/ICAO code
 */
export function getAirlineLogo(code: string): string | null {
  if (!code) return null
  
  const upperCode = code.toUpperCase().trim()
  return AIRLINE_LOGO_MAPPING[upperCode] || null
}

/**
 * Get airline info with name and logo
 */
export function getAirlineInfo(code: string): { name: string; logo: string | null; code: string } {
  const name = getAirlineName(code)
  const logo = getAirlineLogo(code)
  
  return {
    name,
    logo,
    code: code.toUpperCase()
  }
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