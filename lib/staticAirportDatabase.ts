/**
 * Static Airport Database - Comprehensive IATA to City mapping
 * Contains all major international airports found in flight data
 * This ensures city names display correctly without external API dependencies
 */

export interface StaticAirportInfo {
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone?: string;
}

export const STATIC_AIRPORT_DATABASE: Record<string, StaticAirportInfo> = {
  // Romanian Airports (already in fallback)
  'OTP': { iata: 'OTP', name: 'Henri Coandă International Airport', city: 'București', country: 'România' },
  'BBU': { iata: 'BBU', name: 'Aurel Vlaicu International Airport', city: 'București', country: 'România' },
  'CLJ': { iata: 'CLJ', name: 'Cluj-Napoca International Airport', city: 'Cluj-Napoca', country: 'România' },
  'TSR': { iata: 'TSR', name: 'Timișoara Traian Vuia International Airport', city: 'Timișoara', country: 'România' },
  'IAS': { iata: 'IAS', name: 'Iași International Airport', city: 'Iași', country: 'România' },
  'CND': { iata: 'CND', name: 'Mihail Kogălniceanu International Airport', city: 'Constanța', country: 'România' },
  'SBZ': { iata: 'SBZ', name: 'Sibiu International Airport', city: 'Sibiu', country: 'România' },
  'CRA': { iata: 'CRA', name: 'Craiova Airport', city: 'Craiova', country: 'România' },
  'BCM': { iata: 'BCM', name: 'Bacău Airport', city: 'Bacău', country: 'România' },
  'BAY': { iata: 'BAY', name: 'Baia Mare Airport', city: 'Baia Mare', country: 'România' },
  'OMR': { iata: 'OMR', name: 'Oradea International Airport', city: 'Oradea', country: 'România' },
  'SCV': { iata: 'SCV', name: 'Suceava Ștefan cel Mare Airport', city: 'Suceava', country: 'România' },
  'TGM': { iata: 'TGM', name: 'Târgu Mureș Transilvania Airport', city: 'Târgu Mureș', country: 'România' },
  'ARW': { iata: 'ARW', name: 'Arad Airport', city: 'Arad', country: 'România' },
  'SUJ': { iata: 'SUJ', name: 'Satu Mare Airport', city: 'Satu Mare', country: 'România' },
  'RMO': { iata: 'RMO', name: 'Chișinău International Airport', city: 'Chișinău', country: 'Moldova' },

  // Major European Airports (found in flight data)
  'FRA': { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  'AMS': { iata: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  'VIE': { iata: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria' },
  'CDG': { iata: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  'LHR': { iata: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  'MAD': { iata: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain' },
  'MUC': { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
  'ZRH': { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
  'BSL': { iata: 'BSL', name: 'EuroAirport Basel Mulhouse Freiburg', city: 'Basel', country: 'Switzerland' },
  'FCO': { iata: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy' },
  'BCN': { iata: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain' },
  'BER': { iata: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany' },
  'MXP': { iata: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy' },
  'LTN': { iata: 'LTN', name: 'London Luton Airport', city: 'London', country: 'United Kingdom' },
  'STN': { iata: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom' },
  'BUD': { iata: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary' },
  'WAW': { iata: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland' },
  'WRO': { iata: 'WRO', name: 'Wrocław Airport', city: 'Wrocław', country: 'Poland' },
  'WMI': { iata: 'WMI', name: 'Warsaw Modlin Airport', city: 'Warsaw', country: 'Poland' },
  'PRG': { iata: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic' },
  'BEG': { iata: 'BEG', name: 'Belgrade Nikola Tesla Airport', city: 'Belgrade', country: 'Serbia' },
  'SOF': { iata: 'SOF', name: 'Sofia Airport', city: 'Sofia', country: 'Bulgaria' },
  'SKG': { iata: 'SKG', name: 'Thessaloniki Airport', city: 'Skopje', country: 'North Macedonia' },
  'ATH': { iata: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece' },
  'BTS': { iata: 'BTS', name: 'M. R. Štefánik Airport', city: 'Bratislava', country: 'Slovakia' },
  'LIS': { iata: 'LIS', name: 'Lisbon Airport', city: 'Lisbon', country: 'Portugal' },
  'DUB': { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland' },
  'ARN': { iata: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden' },
  'CPH': { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
  'OSL': { iata: 'OSL', name: 'Oslo Airport', city: 'Oslo', country: 'Norway' },
  'HEL': { iata: 'HEL', name: 'Helsinki Airport', city: 'Helsinki', country: 'Finland' },

  // UK Airports
  'LBA': { iata: 'LBA', name: 'Leeds Bradford Airport', city: 'Leeds', country: 'United Kingdom' },
  'MAN': { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom' },
  'BHX': { iata: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom' },
  'BRS': { iata: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'United Kingdom' },
  'EDI': { iata: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom' },

  // Belgian Airports
  'CRL': { iata: 'CRL', name: 'Brussels South Charleroi Airport', city: 'Brussels', country: 'Belgium' },
  'BRU': { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },

  // Italian Airports
  'BLQ': { iata: 'BLQ', name: 'Bologna Guglielmo Marconi Airport', city: 'Bologna', country: 'Italy' },
  'CTA': { iata: 'CTA', name: 'Catania–Fontanarossa Airport', city: 'Catania', country: 'Italy' },
  'BRI': { iata: 'BRI', name: 'Bari Karol Wojtyła Airport', city: 'Bari', country: 'Italy' },
  'VRN': { iata: 'VRN', name: 'Verona Villafranca Airport', city: 'Verona', country: 'Italy' },
  'CIA': { iata: 'CIA', name: 'Rome Ciampino Airport', city: 'Rome', country: 'Italy' },
  'BGY': { iata: 'BGY', name: 'Milan Bergamo Airport', city: 'Milan', country: 'Italy' },
  'VCE': { iata: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy' },
  'TRN': { iata: 'TRN', name: 'Turin Airport', city: 'Turin', country: 'Italy' },
  'NAP': { iata: 'NAP', name: 'Naples International Airport', city: 'Napoli', country: 'Italy' },
  'PSA': { iata: 'PSA', name: 'Pisa International Airport', city: 'Pisa', country: 'Italy' },
  'MLA': { iata: 'MLA', name: 'Malta International Airport', city: 'Valletta', country: 'Malta' },

  // Spanish Airports
  'VLC': { iata: 'VLC', name: 'Valencia Airport', city: 'Valencia', country: 'Spain' },
  'SVQ': { iata: 'SVQ', name: 'Seville Airport', city: 'Seville', country: 'Spain' },
  'AGP': { iata: 'AGP', name: 'Málaga Airport', city: 'Málaga', country: 'Spain' },

  // French Airports
  'NCE': { iata: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France' },
  'LYS': { iata: 'LYS', name: 'Lyon–Saint-Exupéry Airport', city: 'Lyon', country: 'France' },
  'MRS': { iata: 'MRS', name: 'Marseille Provence Airport', city: 'Marseille', country: 'France' },
  'BVA': { iata: 'BVA', name: 'Paris Beauvais Airport', city: 'Paris', country: 'France' },

  // German Airports
  'DTM': { iata: 'DTM', name: 'Dortmund Airport', city: 'Dortmund', country: 'Germany' },
  'HAM': { iata: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany' },
  'DUS': { iata: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany' },
  'STR': { iata: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany' },
  'FKB': { iata: 'FKB', name: 'Karlsruhe/Baden-Baden Airport', city: 'Baden-Baden', country: 'Germany' },
  'HHN': { iata: 'HHN', name: 'Frankfurt-Hahn Airport', city: 'Frankfurt Hahn', country: 'Germany' },
  'FMM': { iata: 'FMM', name: 'Memmingen Airport', city: 'Memmingen', country: 'Germany' },

  // Netherlands Airports
  'EIN': { iata: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Netherlands' },

  // Scandinavian Airports
  'BLL': { iata: 'BLL', name: 'Billund Airport', city: 'Billund', country: 'Denmark' },
  'TRF': { iata: 'TRF', name: 'Sandefjord Airport Torp', city: 'Sandefjord', country: 'Norway' },

  // Middle East & International
  'IST': { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  'SAW': { iata: 'SAW', name: 'Istanbul Sabiha Gökçen Airport', city: 'Istanbul', country: 'Turkey' },
  'AYT': { iata: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey' },
  'TLV': { iata: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel' },
  'DXB': { iata: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  'DOH': { iata: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
  'LCA': { iata: 'LCA', name: 'Larnaca International Airport', city: 'Larnaca', country: 'Cyprus' },
  'GYD': { iata: 'GYD', name: 'Heydar Aliyev International Airport', city: 'Baku', country: 'Azerbaijan' },
  'BEY': { iata: 'BEY', name: 'Rafic Hariri International Airport', city: 'Beirut', country: 'Lebanon' },
  'CAI': { iata: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt' },

  // Other European destinations
  'TSF': { iata: 'TSF', name: 'Treviso Airport', city: 'Treviso', country: 'Italy' },
  'PSR': { iata: 'PSR', name: 'Pescara Airport', city: 'Pescara', country: 'Italy' },
  'KTT': { iata: 'KTT', name: 'Kittilä Airport', city: 'Kittilä', country: 'Finland' },
  'SXB': { iata: 'SXB', name: 'Strasbourg Airport', city: 'Strasbourg', country: 'France' },
  'EVN': { iata: 'EVN', name: 'Zvartnots International Airport', city: 'Yerevan', country: 'Armenia' },

  // Add more as needed based on flight data
};

/**
 * Get airport information from static database
 */
export function getStaticAirportInfo(iataCode: string): StaticAirportInfo | undefined {
  return STATIC_AIRPORT_DATABASE[iataCode.toUpperCase()];
}

/**
 * Get city name from IATA code using static database
 */
export function getStaticCityName(iataCode: string): string {
  const airport = getStaticAirportInfo(iataCode);
  return airport?.city || iataCode;
}

/**
 * Check if airport exists in static database
 */
export function hasStaticAirportInfo(iataCode: string): boolean {
  return iataCode.toUpperCase() in STATIC_AIRPORT_DATABASE;
}

/**
 * Get all available IATA codes from static database
 */
export function getAllStaticIataCodes(): string[] {
  return Object.keys(STATIC_AIRPORT_DATABASE);
}

/**
 * Search airports by city or airport name
 */
export function searchStaticAirports(query: string): StaticAirportInfo[] {
  const searchTerm = query.toLowerCase();
  return Object.values(STATIC_AIRPORT_DATABASE).filter(airport =>
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.name.toLowerCase().includes(searchTerm) ||
    airport.iata.toLowerCase().includes(searchTerm)
  );
}