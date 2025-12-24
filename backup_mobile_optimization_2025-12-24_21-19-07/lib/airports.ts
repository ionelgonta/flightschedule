import { Airport } from '@/types/flight'
import { getStaticAirportInfo, getStaticCityName, STATIC_AIRPORT_DATABASE } from './staticAirportDatabase'

// Cache pentru aeroporturi pentru a evita apelurile repetate
let airportCache: Map<string, Airport> = new Map()
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minute

// Fallback airports pentru când baza de date nu este disponibilă
export const FALLBACK_AIRPORTS: Airport[] = [
  // Romanian Airports
  {
    code: 'OTP',
    name: 'Aeroportul Internațional Henri Coandă',
    city: 'București',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 44.5711, lng: 26.0850 }
  },
  {
    code: 'BBU',
    name: 'Aeroportul Internațional Aurel Vlaicu',
    city: 'București',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 44.5032, lng: 26.1020 }
  },
  {
    code: 'CLJ',
    name: 'Aeroportul Internațional Cluj-Napoca',
    city: 'Cluj-Napoca',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 46.7852, lng: 23.6862 }
  },
  {
    code: 'TSR',
    name: 'Aeroportul Internațional Timișoara Traian Vuia',
    city: 'Timișoara',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 45.8099, lng: 21.3379 }
  },
  {
    code: 'IAS',
    name: 'Aeroportul Internațional Iași',
    city: 'Iași',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 47.1785, lng: 27.6206 }
  },
  {
    code: 'CND',
    name: 'Aeroportul Internațional Mihail Kogălniceanu',
    city: 'Constanța',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 44.3622, lng: 28.4883 }
  },
  {
    code: 'SBZ',
    name: 'Aeroportul Internațional Sibiu',
    city: 'Sibiu',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 45.7856, lng: 24.0913 }
  },
  {
    code: 'CRA',
    name: 'Aeroportul Craiova',
    city: 'Craiova',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 44.3181, lng: 23.8886 }
  },
  {
    code: 'BCM',
    name: 'Aeroportul Bacău',
    city: 'Bacău',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 46.5219, lng: 26.9103 }
  },
  {
    code: 'BAY',
    name: 'Aeroportul Baia Mare',
    city: 'Baia Mare',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 47.6584, lng: 23.4700 }
  },
  {
    code: 'OMR',
    name: 'Aeroportul Internațional Oradea',
    city: 'Oradea',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 47.0253, lng: 21.9025 }
  },
  {
    code: 'SCV',
    name: 'Aeroportul Suceava Ștefan cel Mare',
    city: 'Suceava',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 47.6875, lng: 26.3540 }
  },
  {
    code: 'TGM',
    name: 'Aeroportul Târgu Mureș Transilvania',
    city: 'Târgu Mureș',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 46.4677, lng: 24.4125 }
  },
  {
    code: 'ARW',
    name: 'Aeroportul Arad',
    city: 'Arad',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 46.1766, lng: 21.2619 }
  },
  {
    code: 'SUJ',
    name: 'Aeroportul Satu Mare',
    city: 'Satu Mare',
    country: 'România',
    timezone: 'Europe/Bucharest',
    coordinates: { lat: 47.7033, lng: 22.8857 }
  },
  
  // Moldova Airport
  {
    code: 'RMO',
    name: 'Aeroportul Internațional Chișinău',
    city: 'Chișinău',
    country: 'Moldova',
    timezone: 'Europe/Chisinau',
    coordinates: { lat: 46.9277, lng: 28.9310 }
  }
]

/**
 * Obține informații despre aeroport din static database, API enhanced sau fallback
 * Prioritate: Static DB > API Enhanced > Fallback
 */
export const getAirportByCode = async (code: string): Promise<Airport | undefined> => {
  if (!code || code.length !== 3) return undefined
  
  const upperCode = code.toUpperCase()
  
  // Verifică cache-ul
  const now = Date.now()
  if (now < cacheExpiry && airportCache.has(upperCode)) {
    return airportCache.get(upperCode)
  }
  
  // Prioritate 1: Static database (instant, no API calls)
  const staticAirport = getStaticAirportInfo(upperCode)
  if (staticAirport) {
    const airport: Airport = {
      code: staticAirport.iata,
      name: staticAirport.name,
      city: staticAirport.city,
      country: staticAirport.country,
      timezone: staticAirport.timezone || 'UTC'
    }
    
    // Actualizează cache-ul
    airportCache.set(upperCode, airport)
    cacheExpiry = now + CACHE_DURATION
    
    return airport
  }
  
  try {
    // Prioritate 2: API enhanced (care accesează baza de date pe server)
    const response = await fetch(`/api/airports/enhanced?iata=${upperCode}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.airport) {
        const airport: Airport = {
          code: data.airport.iata_code,
          name: data.airport.name,
          city: data.airport.city || data.airport.municipality_name || upperCode,
          country: data.airport.country_name || 'Unknown',
          timezone: data.airport.timezone || 'UTC',
          coordinates: data.airport.latitude && data.airport.longitude ? {
            lat: data.airport.latitude,
            lng: data.airport.longitude
          } : undefined
        }
        
        // Actualizează cache-ul
        airportCache.set(upperCode, airport)
        cacheExpiry = now + CACHE_DURATION
        
        return airport
      }
    }
  } catch (error) {
    console.error(`[Airport Service] Error fetching airport ${upperCode} from API:`, error)
  }
  
  // Prioritate 3: Fallback la lista statică (pentru aeroporturile românești)
  const fallbackAirport = FALLBACK_AIRPORTS.find(airport => airport.code === upperCode)
  if (fallbackAirport) {
    airportCache.set(upperCode, fallbackAirport)
    cacheExpiry = now + CACHE_DURATION
  }
  
  return fallbackAirport
}

/**
 * Versiune sincronă pentru compatibilitate cu codul existent
 * Prioritate: Cache > Static DB > Fallback
 */
export const getAirportByCodeSync = (code: string): Airport | undefined => {
  const upperCode = code.toUpperCase()
  
  // Verifică cache-ul mai întâi
  if (airportCache.has(upperCode) && Date.now() < cacheExpiry) {
    return airportCache.get(upperCode)
  }
  
  // Prioritate 1: Static database
  const staticAirport = getStaticAirportInfo(upperCode)
  if (staticAirport) {
    const airport: Airport = {
      code: staticAirport.iata,
      name: staticAirport.name,
      city: staticAirport.city,
      country: staticAirport.country,
      timezone: staticAirport.timezone || 'UTC'
    }
    
    // Actualizează cache-ul
    airportCache.set(upperCode, airport)
    cacheExpiry = Date.now() + CACHE_DURATION
    
    return airport
  }
  
  // Prioritate 2: Fallback la lista statică (aeroporturi românești)
  return FALLBACK_AIRPORTS.find(airport => airport.code === upperCode)
}

// Pentru compatibilitate - folosește fallback-ul static
export const MAJOR_AIRPORTS = FALLBACK_AIRPORTS

export const searchAirports = (query: string): Airport[] => {
  const searchTerm = query.toLowerCase()
  
  // Combină static database cu fallback airports
  const allAirports: Airport[] = [
    // Convert static database to Airport format
    ...Object.values(STATIC_AIRPORT_DATABASE).map(staticAirport => ({
      code: staticAirport.iata,
      name: staticAirport.name,
      city: staticAirport.city,
      country: staticAirport.country,
      timezone: staticAirport.timezone || 'UTC'
    })),
    // Add fallback airports (Romanian airports)
    ...FALLBACK_AIRPORTS
  ]
  
  // Remove duplicates by IATA code (static database takes priority)
  const uniqueAirports = allAirports.reduce((acc, airport) => {
    if (!acc.some(existing => existing.code === airport.code)) {
      acc.push(airport)
    }
    return acc
  }, [] as Airport[])
  
  return uniqueAirports.filter(airport => 
    airport.code.toLowerCase().includes(searchTerm) ||
    airport.name.toLowerCase().includes(searchTerm) ||
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.country.toLowerCase().includes(searchTerm)
  )
}

// Generează slug din oraș și numele aeroportului
export const generateAirportSlug = (airport: Airport): string => {
  const citySlug = airport.city
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  const airportSlug = airport.name
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/international|airport|aeroportul/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `${citySlug}-${airportSlug}`
}

// Găsește aeroport după slug
export const getAirportBySlug = (slug: string): Airport | undefined => {
  return FALLBACK_AIRPORTS.find(airport => generateAirportSlug(airport) === slug)
}

// Mapare pentru compatibilitate cu codurile vechi
export const getAirportByCodeOrSlug = (identifier: string): Airport | undefined => {
  // Încearcă mai întâi să găsească după slug
  const bySlug = getAirportBySlug(identifier)
  if (bySlug) return bySlug
  
  // Dacă nu găsește, încearcă după cod (pentru compatibilitate) - versiune sincronă
  return getAirportByCodeSync(identifier)
}

/**
 * Verifică dacă un cod de aeroport este suportat (IATA codes only)
 */
export const isAirportSupported = (code: string): boolean => {
  return FALLBACK_AIRPORTS.some(airport => airport.code === code.toUpperCase())
}

/**
 * Obține informațiile complete pentru un aeroport (versiune async)
 */
export const getAirportInfo = async (code: string): Promise<Airport | undefined> => {
  return await getAirportByCode(code.toUpperCase())
}

/**
 * Versiune sincronă pentru compatibilitate
 */
export const getAirportInfoSync = (code: string): Airport | undefined => {
  return getAirportByCodeSync(code.toUpperCase())
}

/**
 * Obține numele orașului pentru un cod IATA (versiune sincronă pentru UI)
 * Prioritate: Cache > Static DB > Fallback > IATA code
 */
export const getCityName = (code: string): string => {
  if (!code || code.length !== 3) return code
  
  const upperCode = code.toUpperCase()
  
  // Verifică cache-ul
  if (airportCache.has(upperCode) && Date.now() < cacheExpiry) {
    const airport = airportCache.get(upperCode)
    return airport?.city || upperCode
  }
  
  // Prioritate 1: Static database (instant lookup)
  const staticCityName = getStaticCityName(upperCode)
  if (staticCityName !== upperCode) {
    // Found in static database, cache it
    const staticAirport = getStaticAirportInfo(upperCode)
    if (staticAirport) {
      const airport: Airport = {
        code: staticAirport.iata,
        name: staticAirport.name,
        city: staticAirport.city,
        country: staticAirport.country,
        timezone: staticAirport.timezone || 'UTC'
      }
      airportCache.set(upperCode, airport)
      cacheExpiry = Date.now() + CACHE_DURATION
    }
    return staticCityName
  }
  
  // Prioritate 2: Verifică fallback-ul (aeroporturi românești)
  const fallbackAirport = FALLBACK_AIRPORTS.find(airport => airport.code === upperCode)
  if (fallbackAirport) {
    // Actualizează cache-ul cu fallback-ul
    airportCache.set(upperCode, fallbackAirport)
    cacheExpiry = Date.now() + CACHE_DURATION
    return fallbackAirport.city
  }
  
  // Prioritate 3: Returnează codul IATA dacă nu găsește nimic
  return upperCode
}

/**
 * Preîncarcă informațiile pentru o listă de coduri IATA
 * Util pentru a popula cache-ul în avans
 */
export const preloadAirports = async (codes: string[]): Promise<void> => {
  const promises = codes.map(code => getAirportByCode(code))
  await Promise.all(promises)
}