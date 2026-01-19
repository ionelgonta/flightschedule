// Database of airports with direct flights from RO/MD with their coordinates

import { Coordinates } from './types'

export interface AirportData {
  code: string
  city: string
  country: string
  coordinates: Coordinates
}

// Airports with direct flights from Romania and Moldova
// Coordinates are approximate city center locations
export const DESTINATION_AIRPORTS: AirportData[] = [
  // Greece
  { code: 'ATH', city: 'Atena', country: 'Grecia', coordinates: { lat: 37.9838, lng: 23.7275 } },
  { code: 'SKG', city: 'Salonic', country: 'Grecia', coordinates: { lat: 40.6401, lng: 22.9444 } },
  { code: 'HER', city: 'Heraklion', country: 'Grecia', coordinates: { lat: 35.3387, lng: 25.1442 } },
  { code: 'RHO', city: 'Rhodos', country: 'Grecia', coordinates: { lat: 36.4341, lng: 28.2176 } },
  { code: 'CFU', city: 'Corfu', country: 'Grecia', coordinates: { lat: 39.6243, lng: 19.9217 } },
  { code: 'ZTH', city: 'Zakynthos', country: 'Grecia', coordinates: { lat: 37.7879, lng: 20.8979 } },
  
  // Italy
  { code: 'FCO', city: 'Roma', country: 'Italia', coordinates: { lat: 41.9028, lng: 12.4964 } },
  { code: 'MXP', city: 'Milano', country: 'Italia', coordinates: { lat: 45.4642, lng: 9.1900 } },
  { code: 'BGY', city: 'Milano (Bergamo)', country: 'Italia', coordinates: { lat: 45.6983, lng: 9.6773 } },
  { code: 'VCE', city: 'Veneția', country: 'Italia', coordinates: { lat: 45.4408, lng: 12.3155 } },
  { code: 'TSF', city: 'Treviso', country: 'Italia', coordinates: { lat: 45.6669, lng: 12.2430 } },
  { code: 'BLQ', city: 'Bologna', country: 'Italia', coordinates: { lat: 44.4949, lng: 11.3426 } },
  { code: 'NAP', city: 'Napoli', country: 'Italia', coordinates: { lat: 40.8518, lng: 14.2681 } },
  { code: 'PSA', city: 'Pisa', country: 'Italia', coordinates: { lat: 43.7228, lng: 10.4017 } },
  { code: 'FLR', city: 'Florența', country: 'Italia', coordinates: { lat: 43.7696, lng: 11.2558 } },
  { code: 'TRN', city: 'Torino', country: 'Italia', coordinates: { lat: 45.0703, lng: 7.6869 } },
  { code: 'VRN', city: 'Verona', country: 'Italia', coordinates: { lat: 45.4384, lng: 10.9916 } },
  { code: 'BRI', city: 'Bari', country: 'Italia', coordinates: { lat: 41.1171, lng: 16.8719 } },
  { code: 'CTA', city: 'Catania', country: 'Italia', coordinates: { lat: 37.5079, lng: 15.0830 } },
  { code: 'PMO', city: 'Palermo', country: 'Italia', coordinates: { lat: 38.1157, lng: 13.3615 } },
  { code: 'SUF', city: 'Lamezia Terme', country: 'Italia', coordinates: { lat: 38.9684, lng: 16.3106 } },
  
  // Spain
  { code: 'MAD', city: 'Madrid', country: 'Spania', coordinates: { lat: 40.4168, lng: -3.7038 } },
  { code: 'BCN', city: 'Barcelona', country: 'Spania', coordinates: { lat: 41.3851, lng: 2.1734 } },
  { code: 'AGP', city: 'Malaga', country: 'Spania', coordinates: { lat: 36.7213, lng: -4.4214 } },
  { code: 'ALC', city: 'Alicante', country: 'Spania', coordinates: { lat: 38.3452, lng: -0.4810 } },
  { code: 'VLC', city: 'Valencia', country: 'Spania', coordinates: { lat: 39.4699, lng: -0.3763 } },
  { code: 'PMI', city: 'Palma de Mallorca', country: 'Spania', coordinates: { lat: 39.5696, lng: 2.6502 } },
  { code: 'TFS', city: 'Tenerife', country: 'Spania', coordinates: { lat: 28.4682, lng: -16.2546 } },
  { code: 'IBZ', city: 'Ibiza', country: 'Spania', coordinates: { lat: 38.9067, lng: 1.4206 } },
  
  // Germany
  { code: 'FRA', city: 'Frankfurt', country: 'Germania', coordinates: { lat: 50.1109, lng: 8.6821 } },
  { code: 'MUC', city: 'Munchen', country: 'Germania', coordinates: { lat: 48.1351, lng: 11.5820 } },
  { code: 'BER', city: 'Berlin', country: 'Germania', coordinates: { lat: 52.5200, lng: 13.4050 } },
  { code: 'DUS', city: 'Dusseldorf', country: 'Germania', coordinates: { lat: 51.2277, lng: 6.7735 } },
  { code: 'HAM', city: 'Hamburg', country: 'Germania', coordinates: { lat: 53.5511, lng: 9.9937 } },
  { code: 'CGN', city: 'Koln', country: 'Germania', coordinates: { lat: 50.9375, lng: 6.9603 } },
  { code: 'STR', city: 'Stuttgart', country: 'Germania', coordinates: { lat: 48.7758, lng: 9.1829 } },
  { code: 'NUE', city: 'Nurnberg', country: 'Germania', coordinates: { lat: 49.4521, lng: 11.0767 } },
  { code: 'DTM', city: 'Dortmund', country: 'Germania', coordinates: { lat: 51.5136, lng: 7.4653 } },
  { code: 'FMM', city: 'Memmingen', country: 'Germania', coordinates: { lat: 47.9838, lng: 10.1811 } },
  
  // UK
  { code: 'LHR', city: 'Londra', country: 'Marea Britanie', coordinates: { lat: 51.5074, lng: -0.1278 } },
  { code: 'LTN', city: 'Londra (Luton)', country: 'Marea Britanie', coordinates: { lat: 51.8747, lng: -0.3683 } },
  { code: 'STN', city: 'Londra (Stansted)', country: 'Marea Britanie', coordinates: { lat: 51.8860, lng: 0.2389 } },
  { code: 'LGW', city: 'Londra (Gatwick)', country: 'Marea Britanie', coordinates: { lat: 51.1537, lng: -0.1821 } },
  { code: 'MAN', city: 'Manchester', country: 'Marea Britanie', coordinates: { lat: 53.4808, lng: -2.2426 } },
  { code: 'BHX', city: 'Birmingham', country: 'Marea Britanie', coordinates: { lat: 52.4862, lng: -1.8904 } },
  { code: 'EDI', city: 'Edinburgh', country: 'Marea Britanie', coordinates: { lat: 55.9533, lng: -3.1883 } },
  { code: 'GLA', city: 'Glasgow', country: 'Marea Britanie', coordinates: { lat: 55.8642, lng: -4.2518 } },
  { code: 'BRS', city: 'Bristol', country: 'Marea Britanie', coordinates: { lat: 51.4545, lng: -2.5879 } },
  { code: 'LPL', city: 'Liverpool', country: 'Marea Britanie', coordinates: { lat: 53.4084, lng: -2.9916 } },
  
  // France
  { code: 'CDG', city: 'Paris', country: 'Franța', coordinates: { lat: 48.8566, lng: 2.3522 } },
  { code: 'ORY', city: 'Paris (Orly)', country: 'Franța', coordinates: { lat: 48.7262, lng: 2.3652 } },
  { code: 'BVA', city: 'Paris (Beauvais)', country: 'Franța', coordinates: { lat: 49.4544, lng: 2.1128 } },
  { code: 'NCE', city: 'Nisa', country: 'Franța', coordinates: { lat: 43.7102, lng: 7.2620 } },
  { code: 'LYS', city: 'Lyon', country: 'Franța', coordinates: { lat: 45.7640, lng: 4.8357 } },
  { code: 'MRS', city: 'Marsilia', country: 'Franța', coordinates: { lat: 43.2965, lng: 5.3698 } },
  
  // Netherlands
  { code: 'AMS', city: 'Amsterdam', country: 'Olanda', coordinates: { lat: 52.3676, lng: 4.9041 } },
  { code: 'EIN', city: 'Eindhoven', country: 'Olanda', coordinates: { lat: 51.4416, lng: 5.4697 } },
  
  // Belgium
  { code: 'BRU', city: 'Bruxelles', country: 'Belgia', coordinates: { lat: 50.8503, lng: 4.3517 } },
  { code: 'CRL', city: 'Charleroi', country: 'Belgia', coordinates: { lat: 50.4108, lng: 4.4446 } },
  
  // Austria
  { code: 'VIE', city: 'Viena', country: 'Austria', coordinates: { lat: 48.2082, lng: 16.3738 } },
  { code: 'SZG', city: 'Salzburg', country: 'Austria', coordinates: { lat: 47.8095, lng: 13.0550 } },
  
  // Switzerland
  { code: 'ZRH', city: 'Zurich', country: 'Elveția', coordinates: { lat: 47.3769, lng: 8.5417 } },
  { code: 'GVA', city: 'Geneva', country: 'Elveția', coordinates: { lat: 46.2044, lng: 6.1432 } },
  { code: 'BSL', city: 'Basel', country: 'Elveția', coordinates: { lat: 47.5596, lng: 7.5886 } },
  
  // Turkey
  { code: 'IST', city: 'Istanbul', country: 'Turcia', coordinates: { lat: 41.0082, lng: 28.9784 } },
  { code: 'SAW', city: 'Istanbul (Sabiha)', country: 'Turcia', coordinates: { lat: 40.8986, lng: 29.3092 } },
  { code: 'AYT', city: 'Antalya', country: 'Turcia', coordinates: { lat: 36.8969, lng: 30.7133 } },
  { code: 'ADB', city: 'Izmir', country: 'Turcia', coordinates: { lat: 38.4192, lng: 27.1287 } },
  { code: 'BJV', city: 'Bodrum', country: 'Turcia', coordinates: { lat: 37.0343, lng: 27.4305 } },
  { code: 'DLM', city: 'Dalaman', country: 'Turcia', coordinates: { lat: 36.7650, lng: 28.7925 } },
  
  // UAE
  { code: 'DXB', city: 'Dubai', country: 'Emiratele Arabe', coordinates: { lat: 25.2048, lng: 55.2708 } },
  { code: 'AUH', city: 'Abu Dhabi', country: 'Emiratele Arabe', coordinates: { lat: 24.4539, lng: 54.3773 } },
  
  // Egypt
  { code: 'HRG', city: 'Hurghada', country: 'Egipt', coordinates: { lat: 27.2579, lng: 33.8116 } },
  { code: 'SSH', city: 'Sharm El Sheikh', country: 'Egipt', coordinates: { lat: 27.9158, lng: 34.3300 } },
  
  // Israel
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel', coordinates: { lat: 32.0853, lng: 34.7818 } },
  
  // Poland
  { code: 'WAW', city: 'Varșovia', country: 'Polonia', coordinates: { lat: 52.2297, lng: 21.0122 } },
  { code: 'KRK', city: 'Cracovia', country: 'Polonia', coordinates: { lat: 50.0647, lng: 19.9450 } },
  { code: 'GDN', city: 'Gdansk', country: 'Polonia', coordinates: { lat: 54.3520, lng: 18.6466 } },
  { code: 'WRO', city: 'Wroclaw', country: 'Polonia', coordinates: { lat: 51.1079, lng: 17.0385 } },
  { code: 'KTW', city: 'Katowice', country: 'Polonia', coordinates: { lat: 50.2649, lng: 19.0238 } },
  
  // Czech Republic
  { code: 'PRG', city: 'Praga', country: 'Cehia', coordinates: { lat: 50.0755, lng: 14.4378 } },
  
  // Hungary
  { code: 'BUD', city: 'Budapesta', country: 'Ungaria', coordinates: { lat: 47.4979, lng: 19.0402 } },
  
  // Bulgaria
  { code: 'SOF', city: 'Sofia', country: 'Bulgaria', coordinates: { lat: 42.6977, lng: 23.3219 } },
  { code: 'VAR', city: 'Varna', country: 'Bulgaria', coordinates: { lat: 43.2141, lng: 27.9147 } },
  
  // Serbia
  { code: 'BEG', city: 'Belgrad', country: 'Serbia', coordinates: { lat: 44.7866, lng: 20.4489 } },
  
  // Croatia
  { code: 'ZAG', city: 'Zagreb', country: 'Croația', coordinates: { lat: 45.8150, lng: 15.9819 } },
  
  // Slovenia
  { code: 'LJU', city: 'Ljubljana', country: 'Slovenia', coordinates: { lat: 46.0569, lng: 14.5058 } },
  
  // Slovakia
  { code: 'BTS', city: 'Bratislava', country: 'Slovacia', coordinates: { lat: 48.1486, lng: 17.1077 } },
  
  // Albania
  { code: 'TIA', city: 'Tirana', country: 'Albania', coordinates: { lat: 41.3275, lng: 19.8187 } },
  
  // North Macedonia
  { code: 'SKP', city: 'Skopje', country: 'Macedonia de Nord', coordinates: { lat: 41.9981, lng: 21.4254 } },
  
  // Montenegro
  { code: 'TGD', city: 'Podgorica', country: 'Muntenegru', coordinates: { lat: 42.4304, lng: 19.2594 } },
  
  // Bosnia
  { code: 'SJJ', city: 'Sarajevo', country: 'Bosnia', coordinates: { lat: 43.8563, lng: 18.4131 } },
  
  // Cyprus
  { code: 'LCA', city: 'Larnaca', country: 'Cipru', coordinates: { lat: 34.9229, lng: 33.6232 } },
  { code: 'PFO', city: 'Paphos', country: 'Cipru', coordinates: { lat: 34.7720, lng: 32.4246 } },
  
  // Malta
  { code: 'MLA', city: 'Malta', country: 'Malta', coordinates: { lat: 35.8989, lng: 14.5146 } },
  
  // Portugal
  { code: 'LIS', city: 'Lisabona', country: 'Portugalia', coordinates: { lat: 38.7223, lng: -9.1393 } },
  { code: 'OPO', city: 'Porto', country: 'Portugalia', coordinates: { lat: 41.1579, lng: -8.6291 } },
  
  // Ireland
  { code: 'DUB', city: 'Dublin', country: 'Irlanda', coordinates: { lat: 53.3498, lng: -6.2603 } },
  
  // Denmark
  { code: 'CPH', city: 'Copenhaga', country: 'Danemarca', coordinates: { lat: 55.6761, lng: 12.5683 } },
  { code: 'BLL', city: 'Billund', country: 'Danemarca', coordinates: { lat: 55.7403, lng: 9.1518 } },
  
  // Sweden
  { code: 'ARN', city: 'Stockholm', country: 'Suedia', coordinates: { lat: 59.3293, lng: 18.0686 } },
  
  // Norway
  { code: 'OSL', city: 'Oslo', country: 'Norvegia', coordinates: { lat: 59.9139, lng: 10.7522 } },
  
  // Finland
  { code: 'HEL', city: 'Helsinki', country: 'Finlanda', coordinates: { lat: 60.1699, lng: 24.9384 } },
  { code: 'TKU', city: 'Turku', country: 'Finlanda', coordinates: { lat: 60.4518, lng: 22.2666 } },
  
  // Latvia
  { code: 'RIX', city: 'Riga', country: 'Letonia', coordinates: { lat: 56.9496, lng: 24.1052 } },
  
  // Lithuania
  { code: 'VNO', city: 'Vilnius', country: 'Lituania', coordinates: { lat: 54.6872, lng: 25.2797 } },
  
  // Estonia
  { code: 'TLL', city: 'Tallinn', country: 'Estonia', coordinates: { lat: 59.4370, lng: 24.7536 } },
  
  // Luxembourg
  { code: 'LUX', city: 'Luxemburg', country: 'Luxemburg', coordinates: { lat: 49.6116, lng: 6.1319 } },
  
  // Qatar
  { code: 'DOH', city: 'Doha', country: 'Qatar', coordinates: { lat: 25.2854, lng: 51.5310 } },
  
  // Jordan
  { code: 'AMM', city: 'Amman', country: 'Iordania', coordinates: { lat: 31.9454, lng: 35.9284 } },
  
  // Georgia
  { code: 'TBS', city: 'Tbilisi', country: 'Georgia', coordinates: { lat: 41.7151, lng: 44.8271 } },
  
  // Armenia
  { code: 'EVN', city: 'Erevan', country: 'Armenia', coordinates: { lat: 40.1792, lng: 44.4991 } },
  
  // Azerbaijan
  { code: 'GYD', city: 'Baku', country: 'Azerbaidjan', coordinates: { lat: 40.4093, lng: 49.8671 } },
  
  // Maldives
  { code: 'MLE', city: 'Maldive', country: 'Maldive', coordinates: { lat: 4.1755, lng: 73.5093 } },
  
  // Oman
  { code: 'MCT', city: 'Muscat', country: 'Oman', coordinates: { lat: 23.5880, lng: 58.3829 } },
  { code: 'SLL', city: 'Salalah', country: 'Oman', coordinates: { lat: 17.0151, lng: 54.0924 } },
  
  // Morocco
  { code: 'RAK', city: 'Marrakech', country: 'Maroc', coordinates: { lat: 31.6295, lng: -7.9811 } },
  
  // Romania (for internal flights)
  { code: 'OTP', city: 'București', country: 'România', coordinates: { lat: 44.4268, lng: 26.1025 } },
  { code: 'CLJ', city: 'Cluj-Napoca', country: 'România', coordinates: { lat: 46.7712, lng: 23.6236 } },
  { code: 'TSR', city: 'Timișoara', country: 'România', coordinates: { lat: 45.7489, lng: 21.2087 } },
  { code: 'IAS', city: 'Iași', country: 'România', coordinates: { lat: 47.1585, lng: 27.6014 } },
  { code: 'SBZ', city: 'Sibiu', country: 'România', coordinates: { lat: 45.7983, lng: 24.1256 } },
  { code: 'CRA', city: 'Craiova', country: 'România', coordinates: { lat: 44.3302, lng: 23.7949 } },
  { code: 'BCM', city: 'Bacău', country: 'România', coordinates: { lat: 46.5670, lng: 26.9146 } },
  { code: 'OMR', city: 'Oradea', country: 'România', coordinates: { lat: 47.0465, lng: 21.9189 } },
  { code: 'SCV', city: 'Suceava', country: 'România', coordinates: { lat: 47.6514, lng: 26.2551 } },
  { code: 'TGM', city: 'Târgu Mureș', country: 'România', coordinates: { lat: 46.5386, lng: 24.5575 } },
  
  // Moldova
  { code: 'RMO', city: 'Chișinău', country: 'Moldova', coordinates: { lat: 47.0105, lng: 28.8638 } },
]

/**
 * Get all destination airports
 */
export function getAllDestinationAirports(): AirportData[] {
  return DESTINATION_AIRPORTS
}

/**
 * Find airport by IATA code
 */
export function getAirportByCode(code: string): AirportData | undefined {
  return DESTINATION_AIRPORTS.find(a => a.code === code.toUpperCase())
}

/**
 * Find airports by city name (fuzzy match)
 */
export function findAirportsByCity(cityName: string): AirportData[] {
  const normalized = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return DESTINATION_AIRPORTS.filter(airport => {
    const airportCity = airport.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return airportCity.includes(normalized) || normalized.includes(airportCity)
  })
}
