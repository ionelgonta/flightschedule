/**
 * ICAO Mapping - Mapare coduri IATA către ICAO pentru aeroporturile românești și Moldova
 * Necesară pentru AeroDataBox API care folosește coduri ICAO
 */

export interface AirportMapping {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
}

/**
 * Maparea completă IATA → ICAO pentru aeroporturile din România și Moldova
 */
export const AIRPORT_MAPPINGS: Record<string, AirportMapping> = {
  // România - Aeroporturi principale
  'OTP': {
    iata: 'OTP',
    icao: 'LROP',
    name: 'Henri Coandă International Airport',
    city: 'București',
    country: 'România'
  },
  'CLJ': {
    iata: 'CLJ',
    icao: 'LRCL',
    name: 'Cluj-Napoca International Airport',
    city: 'Cluj-Napoca',
    country: 'România'
  },
  'TSR': {
    iata: 'TSR',
    icao: 'LRTR',
    name: 'Traian Vuia International Airport',
    city: 'Timișoara',
    country: 'România'
  },
  'IAS': {
    iata: 'IAS',
    icao: 'LRIA',
    name: 'Iași International Airport',
    city: 'Iași',
    country: 'România'
  },
  'CND': {
    iata: 'CND',
    icao: 'LRCK',
    name: 'Mihail Kogălniceanu International Airport',
    city: 'Constanța',
    country: 'România'
  },
  'SBZ': {
    iata: 'SBZ',
    icao: 'LRSB',
    name: 'Sibiu International Airport',
    city: 'Sibiu',
    country: 'România'
  },
  'CRA': {
    iata: 'CRA',
    icao: 'LRCV',
    name: 'Craiova Airport',
    city: 'Craiova',
    country: 'România'
  },
  'BCM': {
    iata: 'BCM',
    icao: 'LRBC',
    name: 'Bacău Airport',
    city: 'Bacău',
    country: 'România'
  },
  'BAY': {
    iata: 'BAY',
    icao: 'LRBM',
    name: 'Băile Felix International Airport',
    city: 'Oradea',
    country: 'România'
  },
  'OMR': {
    iata: 'OMR',
    icao: 'LROD',
    name: 'Oradea Airport',
    city: 'Oradea',
    country: 'România'
  },
  'SCV': {
    iata: 'SCV',
    icao: 'LRSV',
    name: 'Suceava Airport',
    city: 'Suceava',
    country: 'România'
  },
  'TGM': {
    iata: 'TGM',
    icao: 'LRTG',
    name: 'Târgu Mureș Airport',
    city: 'Târgu Mureș',
    country: 'România'
  },
  'ARW': {
    iata: 'ARW',
    icao: 'LRAR',
    name: 'Arad Airport',
    city: 'Arad',
    country: 'România'
  },
  'STU': {
    iata: 'STU',
    icao: 'LRST',
    name: 'Satu Mare Airport',
    city: 'Satu Mare',
    country: 'România'
  },
  'BBU': {
    iata: 'BBU',
    icao: 'LRBS',
    name: 'Baia Mare Airport',
    city: 'Baia Mare',
    country: 'România'
  },

  // Moldova
  'KIV': {
    iata: 'KIV',
    icao: 'LUKK',
    name: 'Chișinău International Airport',
    city: 'Chișinău',
    country: 'Moldova'
  },
  'RMO': {
    iata: 'RMO',
    icao: 'LUKK', // Același cu KIV - sunt același aeroport
    name: 'Chișinău International Airport',
    city: 'Chișinău',
    country: 'Moldova'
  }
};

/**
 * Obține codul ICAO pentru un cod IATA
 */
export function getIcaoCode(iataCode: string): string {
  const mapping = AIRPORT_MAPPINGS[iataCode.toUpperCase()];
  if (!mapping) {
    console.warn(`ICAO mapping not found for IATA code: ${iataCode}`);
    return iataCode; // Fallback la codul IATA
  }
  return mapping.icao;
}

/**
 * Obține codul IATA pentru un cod ICAO
 */
export function getIataCode(icaoCode: string): string {
  const mapping = Object.values(AIRPORT_MAPPINGS).find(m => m.icao === icaoCode.toUpperCase());
  if (!mapping) {
    console.warn(`IATA mapping not found for ICAO code: ${icaoCode}`);
    return icaoCode; // Fallback la codul ICAO
  }
  return mapping.iata;
}

/**
 * Verifică dacă un cod de aeroport este suportat
 */
export function isAirportSupported(code: string): boolean {
  const upperCode = code.toUpperCase();
  return upperCode in AIRPORT_MAPPINGS || 
         Object.values(AIRPORT_MAPPINGS).some(m => m.icao === upperCode);
}

/**
 * Obține informațiile complete pentru un aeroport
 */
export function getAirportInfo(code: string): AirportMapping | null {
  const upperCode = code.toUpperCase();
  
  // Caută după IATA
  if (upperCode in AIRPORT_MAPPINGS) {
    return AIRPORT_MAPPINGS[upperCode];
  }
  
  // Caută după ICAO
  const mapping = Object.values(AIRPORT_MAPPINGS).find(m => m.icao === upperCode);
  return mapping || null;
}

/**
 * Obține lista tuturor aeroporturilor suportate
 */
export function getSupportedAirports(): AirportMapping[] {
  return Object.values(AIRPORT_MAPPINGS);
}

/**
 * Obține aeroporturile după țară
 */
export function getAirportsByCountry(country: string): AirportMapping[] {
  return Object.values(AIRPORT_MAPPINGS).filter(m => 
    m.country.toLowerCase() === country.toLowerCase()
  );
}

/**
 * Validează și normalizează un cod de aeroport
 */
export function normalizeAirportCode(code: string, preferIcao: boolean = false): string {
  const info = getAirportInfo(code);
  if (!info) {
    return code.toUpperCase();
  }
  return preferIcao ? info.icao : info.iata;
}

export default {
  AIRPORT_MAPPINGS,
  getIcaoCode,
  getIataCode,
  isAirportSupported,
  getAirportInfo,
  getSupportedAirports,
  getAirportsByCountry,
  normalizeAirportCode
};