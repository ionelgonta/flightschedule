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
  'W9': 'Wizz Air',
  'FR': 'Ryanair',
  'RYR': 'Ryanair',
  'LH': 'Lufthansa',
  'DLH': 'Lufthansa',
  'LX': 'Swiss International Air Lines',
  'SWR': 'Swiss International Air Lines',
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
  'VL': 'Volotea',
  'VOE': 'Volotea',
  'LG': 'Luxair',
  'LGL': 'Luxair',
  
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
  'DY': 'Norwegian Air',
  'NAX': 'Norwegian Air',
  'D8': 'Norwegian Air International',
  'DKT': 'Norwegian Air International',
  
  // Middle East & Premium Airlines
  'QR': 'Qatar Airways',
  'QTR': 'Qatar Airways',
  'EK': 'Emirates',
  'UAE': 'Emirates',
  'EY': 'Etihad Airways',
  'ETD': 'Etihad Airways',
  'FZ': 'flydubai',
  'FDB': 'flydubai',
  
  // Additional European Airlines
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
  
  // Middle East & Africa
  'RJ': 'Royal Jordanian',
  'RJA': 'Royal Jordanian',
  'MS': 'EgyptAir',
  'MSR': 'EgyptAir',
  'AT': 'Royal Air Maroc',
  'RAM': 'Royal Air Maroc',
  
  // Russian & CIS Airlines
  'SU': 'Aeroflot',
  'AFL': 'Aeroflot',
  'S7': 'S7 Airlines',
  'SBI': 'S7 Airlines',
  'UT': 'UTair',
  'UTA': 'UTair',
  
  // Asian Airlines
  'CZ': 'China Southern',
  'CSN': 'China Southern',
  'CA': 'Air China',
  'CCA': 'Air China',
  'MU': 'China Eastern',
  'CES': 'China Eastern',
  
  // Additional Low-Cost Carriers
  'G9': 'Air Arabia',
  'AGY': 'Air Arabia',
  'XQ': 'SunExpress',
  'SXS': 'SunExpress',
  'W8': 'Carpatair',
  'CRL': 'Carpatair',
  
  // Charter Airlines
  'CFG': 'Condor',
  'TUI': 'TUI Airways',
  'X3': 'TUI Airways',
  
  // Regional Airlines
  'WF': 'Widerøe',
  'WIF': 'Widerøe',
  'YW': 'Air Nostrum',
  'ANE': 'Air Nostrum',
  
  // New Airlines from user request
  'H4': 'HiSky',
  'HI': 'HiSky',
  
  // Default fallback
  'XX': 'Companie Necunoscută'
}

// Airline logo mapping - Using GitHub repositories with comprehensive IATA logo collections
export const AIRLINE_LOGO_MAPPING: { [key: string]: string } = {
  // Romanian Airlines
  'RO': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/RO.svg',
  'ROT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/RO.svg',
  '0B': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/0B.svg',
  'BMS': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/0B.svg',
  
  // Major European Airlines
  'W4': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/W4.svg',
  'WZZ': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/W4.svg',
  'W6': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/W6.svg',
  'FR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/FR.svg',
  'RYR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/FR.svg',
  'LH': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/LH.svg',
  'DLH': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/LH.svg',
  'AF': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AF.svg',
  'AFR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AF.svg',
  'KL': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/KL.svg',
  'KLM': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/KL.svg',
  'BA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/BA.svg',
  'BAW': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/BA.svg',
  'IB': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/IB.svg',
  'IBE': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/IB.svg',
  'AZ': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AZ.svg',
  'ITY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AZ.svg',
  'OS': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/OS.svg',
  'AUA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/OS.svg',
  'SN': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/SN.svg',
  'BEL': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/SN.svg',
  'SK': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/SK.svg',
  'SAS': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/SK.svg',
  'AY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AY.svg',
  'FIN': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AY.svg',
  'TP': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/TP.svg',
  'TAP': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/TP.svg',
  
  // Turkish Airlines
  'TK': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/TK.svg',
  'THY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/TK.svg',
  
  // Eastern European
  '9U': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/9U.svg',
  'MLD': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/9U.svg',
  'PS': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/PS.svg',
  'AUI': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/PS.svg',
  'BT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/BT.svg',
  'BTI': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/BT.svg',
  'LO': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/LO.svg',
  'LOT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/LO.svg',
  'OK': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/OK.svg',
  'CSA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/OK.svg',
  
  // Low-cost carriers
  'U2': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/U2.svg',
  'EZY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/U2.svg',
  'VY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/VY.svg',
  'VLG': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/VY.svg',
  'EW': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EW.svg',
  'EWG': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EW.svg',
  'PC': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/PC.svg',
  'PGT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/PC.svg',
  
  // Middle East & Premium Airlines
  'QR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/QR.svg',
  'QTR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/QR.svg',
  'EK': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EK.svg',
  'UAE': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EK.svg',
  'EY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EY.svg',
  'ETD': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EY.svg',
  
  // Additional European Airlines
  '5F': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/5F.svg',
  'HV': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/HV.svg',
  'TRA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/HV.svg',
  'EN': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EN.svg',
  'DLA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/EN.svg',
  'A3': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/A3.svg',
  'AEE': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/A3.svg',
  'JU': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/JU.svg',
  'ASL': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/JU.svg',
  'OU': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/OU.svg',
  'CTN': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/OU.svg',
  'JP': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/JP.svg',
  'ADR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/JP.svg',
  'YM': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/YM.svg',
  'MGX': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/YM.svg',
  'FB': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/FB.svg',
  'LZB': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/FB.svg',
  
  // Middle East & Africa
  'RJ': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/RJ.svg',
  'RJA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/RJ.svg',
  'MS': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/MS.svg',
  'MSR': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/MS.svg',
  'AT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AT.svg',
  'RAM': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/AT.svg',
  
  // Russian & CIS Airlines
  'SU': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/SU.svg',
  'AFL': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/SU.svg',
  'S7': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/S7.svg',
  'SBI': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/S7.svg',
  'UT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/UT.svg',
  'UTA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/UT.svg',
  
  // Asian Airlines
  'CZ': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/CZ.svg',
  'CSN': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/CZ.svg',
  'CA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/CA.svg',
  'CCA': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/CA.svg',
  'MU': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/MU.svg',
  'CES': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/MU.svg',
  
  // Additional Low-Cost Carriers
  'W9': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/W9.svg',
  'G9': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/G9.svg',
  'AGY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/G9.svg',
  'XQ': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/XQ.svg',
  'SXS': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/XQ.svg',
  
  // Charter Airlines
  'CFG': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/CFG.svg',
  'X3': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/X3.svg',
  
  // Regional Airlines
  'WF': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/WF.svg',
  'WIF': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/WF.svg',
  'YW': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/YW.svg',
  'ANE': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/YW.svg',
  
  // New Airlines from user request
  'H4': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/H4.svg',
  'HI': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/H4.svg',
  
  // Additional Airlines commonly seen in Romanian airports
  'DY': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/DY.svg',
  'NAX': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/DY.svg',
  'D8': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/D8.svg',
  'DKT': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/D8.svg',
  'FZ': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/FZ.svg',
  'FDB': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/FZ.svg',
  'W8': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/W8.svg',
  'CRL': 'https://raw.githubusercontent.com/airline-logos/airline-logos/main/logos/W8.svg',
  
  // Fallback to Wikimedia Commons for airlines not in GitHub repo
  'XX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Generic_airline_logo.svg/200px-Generic_airline_logo.svg.png'
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
  
  // Missing airports from flight data - December 2024
  'TLV': 'Tel Aviv',
  'AGP': 'Málaga',
  'ALC': 'Alicante',
  'BTS': 'Bratislava',
  'CRL': 'Charleroi',
  'DOH': 'Doha',
  'LBA': 'Leeds',
  'LUX': 'Luxembourg',
  'MLA': 'Malta',
  'PSR': 'Pescara',
  'TRF': 'Oslo Torp',
  'ZRH': 'Zurich',
  'BRS': 'Bristol',
  'XXX': 'Necunoscut',
  
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