import { Airport } from '@/types/flight'

export const MAJOR_AIRPORTS: Airport[] = [
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
    code: 'STU',
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
  },

  // Major International Airports (for comparison and connections)
  {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    coordinates: { lat: 51.4700, lng: -0.4543 }
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    timezone: 'Europe/Paris',
    coordinates: { lat: 49.0097, lng: 2.5479 }
  },
  {
    code: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    coordinates: { lat: 50.0379, lng: 8.5622 }
  },
  {
    code: 'MUC',
    name: 'Munich Airport',
    city: 'Munich',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    coordinates: { lat: 48.3538, lng: 11.7861 }
  },
  {
    code: 'VIE',
    name: 'Vienna International Airport',
    city: 'Vienna',
    country: 'Austria',
    timezone: 'Europe/Vienna',
    coordinates: { lat: 48.1103, lng: 16.5697 }
  },
  {
    code: 'FCO',
    name: 'Leonardo da Vinci International Airport',
    city: 'Rome',
    country: 'Italy',
    timezone: 'Europe/Rome',
    coordinates: { lat: 41.8003, lng: 12.2389 }
  },
  {
    code: 'IST',
    name: 'Istanbul Airport',
    city: 'Istanbul',
    country: 'Turkey',
    timezone: 'Europe/Istanbul',
    coordinates: { lat: 41.2753, lng: 28.7519 }
  },
  {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.2532, lng: 55.3657 }
  }
]

export const getAirportByCode = (code: string): Airport | undefined => {
  return MAJOR_AIRPORTS.find(airport => airport.code === code)
}

export const searchAirports = (query: string): Airport[] => {
  const searchTerm = query.toLowerCase()
  return MAJOR_AIRPORTS.filter(airport => 
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
  return MAJOR_AIRPORTS.find(airport => generateAirportSlug(airport) === slug)
}

// Mapare pentru compatibilitate cu codurile vechi
export const getAirportByCodeOrSlug = (identifier: string): Airport | undefined => {
  // Încearcă mai întâi să găsească după slug
  const bySlug = getAirportBySlug(identifier)
  if (bySlug) return bySlug
  
  // Dacă nu găsește, încearcă după cod (pentru compatibilitate)
  return getAirportByCode(identifier)
}