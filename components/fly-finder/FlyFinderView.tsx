'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Search, Plane, Calendar, Clock, MapPin, ChevronDown, ChevronUp,
  Star, ArrowRight, X, Info, Sparkles, 
  Sun, Moon, Sunrise, TrendingUp, Globe, Users, ExternalLink, Check,
  ChevronLeft, ChevronRight, Plus, Minus, Baby, User, LayoutGrid, List
} from 'lucide-react'
import { MAJOR_AIRPORTS, getCityName } from '@/lib/airports'
import { AirlineLogo } from '@/components/ui/AirlineLogo'
import { useProximitySearch } from '@/lib/proximity'
import { ProximitySearchResults } from './ProximitySearchResults'
import { normalizeFlightNumber, getAirlineName } from '@/lib/airlineMapping'

// Helper function to extract airline code from flight number (handles ICAO codes)
const extractAirlineCode = (flightNumber: string | undefined): string => {
  if (!flightNumber) return 'XX'
  const normalized = normalizeFlightNumber(flightNumber)
  // Extract first 2 characters (IATA code) from normalized flight number
  const match = normalized.match(/^([A-Z0-9]{2})\s*\d+$/i)
  return match ? match[1].toUpperCase() : flightNumber.substring(0, 2).toUpperCase()
}

// Types
interface WeeklyScheduleData {
  airport: string
  destination: string
  airline: string
  flightNumber: string
  weeklyPattern: {
    monday: boolean; tuesday: boolean; wednesday: boolean
    thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean
  }
  scheduledTimes?: {
    monday?: string[]; tuesday?: string[]; wednesday?: string[]
    thursday?: string[]; friday?: string[]; saturday?: string[]; sunday?: string[]
  }
  lastSeenDates?: {
    monday?: string; tuesday?: string; wednesday?: string
    thursday?: string; friday?: string; saturday?: string; sunday?: string
  }
  frequency: number
  lastUpdated: string
  dataSource: 'cache' | 'historical'
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
type TimeSlot = 'morning' | 'afternoon' | 'evening'

interface FlightResult {
  destination: string
  destinationCode: string
  outboundFlights: ProcessedFlight[]
  returnFlights: ProcessedFlight[]
  outboundCount: number
  returnCount: number
  airlines: string[]
  isStableRoute: boolean
  matchScore: number
}

interface ProcessedFlight {
  flightNumber: string
  airline: string
  time: string
  day: DayOfWeek
  timeSlot: TimeSlot
  originCity?: string
  originCode?: string
  destinationCode?: string
}

interface SelectedFlight {
  flight: ProcessedFlight
  type: 'outbound' | 'return'
  destination: string
  destinationCode: string
}

interface PassengerCount {
  adults: number
  children: number
  infants: number
}

interface BookingModalState {
  isOpen: boolean
  step: 'departure' | 'return' | 'passengers'
  departureDate: Date | null
  returnDate: Date | null
  passengers: PassengerCount
}

// Constants
const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'monday', label: 'Luni', short: 'L' },
  { value: 'tuesday', label: 'Marți', short: 'Ma' },
  { value: 'wednesday', label: 'Miercuri', short: 'Mi' },
  { value: 'thursday', label: 'Joi', short: 'J' },
  { value: 'friday', label: 'Vineri', short: 'V' },
  { value: 'saturday', label: 'Sâmbătă', short: 'S' },
  { value: 'sunday', label: 'Duminică', short: 'D' }
]

const TIME_SLOTS: { value: TimeSlot; label: string; range: string; icon: React.ReactNode }[] = [
  { value: 'morning', label: 'Dimineața', range: '06:00-12:00', icon: <Sunrise className="h-4 w-4" /> },
  { value: 'afternoon', label: 'Amiaza', range: '12:00-18:00', icon: <Sun className="h-4 w-4" /> },
  { value: 'evening', label: 'Seara', range: '18:00-24:00', icon: <Moon className="h-4 w-4" /> }
]

// Helper functions
const getTimeSlot = (time: string): TimeSlot => {
  if (!time || time === '--:--') return 'morning'
  const hour = parseInt(time.split(':')[0], 10)
  // 06:00-12:00 = morning (dimineața)
  if (hour >= 6 && hour < 12) return 'morning'
  // 12:00-18:00 = afternoon (amiaza)
  if (hour >= 12 && hour < 18) return 'afternoon'
  // 18:00-24:00 = evening (seara)
  if (hour >= 18 && hour <= 23) return 'evening'
  // 00:00-06:00 = morning (dimineața devreme / noaptea târziu - le punem la dimineață)
  return 'morning'
}

const normalizeString = (str: string): string => {
  if (!str) return ''
  // First, fix common encoding issues (UTF-8 interpreted as Latin-1)
  // Note: ├ê (charCode 200) can represent both ╚Ö and ╚¢ in corrupted data
  let fixed = str
    // Romanian characters with broken encoding - normalize all to base letters
    .replace(/├ê|╚ÿ|┼ƒ|╚¢|╚Ü|┼ú/gi, 's')  // Both ╚Ö and ╚¢ variants become 's' for matching
    .replace(/├ä|├ä╞Æ|─â/gi, 'a')        // ─â variants (├ä = charCode 196)
    .replace(/├â┬ó|├ó/gi, 'a')          // ├ó variants
    .replace(/├â┬«|├«/gi, 'i')          // ├« variants
  // Then apply standard normalization
  return fixed.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// International city to IATA code mapping
const CITY_IATA_CODES: Record<string, string> = {
  // Greece
  'atena': 'ATH', 'athens': 'ATH', 'athina': 'ATH',
  'salonic': 'SKG', 'thessaloniki': 'SKG',
  'heraklion': 'HER', 'iraklion': 'HER', 'creta': 'HER',
  'rhodos': 'RHO', 'rhodes': 'RHO', 'rodos': 'RHO',
  'corfu': 'CFU', 'kerkyra': 'CFU',
  'zakynthos': 'ZTH', 'zante': 'ZTH',
  // Israel
  'tel aviv': 'TLV', 'telaviv': 'TLV',
  // Poland
  'varsovia': 'WAW', 'warsaw': 'WAW', 'warszawa': 'WAW',
  'cracovia': 'KRK', 'krakow': 'KRK', 'krakau': 'KRK',
  'gdansk': 'GDN',
  'wroclaw': 'WRO', 'breslau': 'WRO',
  'poznan': 'POZ',
  'katowice': 'KTW',
  // Germany
  'frankfurt': 'FRA',
  'munchen': 'MUC', 'munich': 'MUC', 'muenchen': 'MUC',
  'berlin': 'BER',
  'dusseldorf': 'DUS', 'duesseldorf': 'DUS',
  'hamburg': 'HAM',
  'koln': 'CGN', 'cologne': 'CGN', 'koeln': 'CGN',
  'stuttgart': 'STR',
  'nurnberg': 'NUE', 'nuremberg': 'NUE', 'nuernberg': 'NUE',
  'dortmund': 'DTM',
  'hannover': 'HAJ', 'hanover': 'HAJ',
  'karlsruhe': 'FKB', 'baden-baden': 'FKB',
  'memmingen': 'FMM',
  // UK
  'londra': 'LHR', 'london': 'LHR',
  'londra (luton)': 'LTN', 'luton': 'LTN',
  'londra (stansted)': 'STN', 'stansted': 'STN',
  'londra (gatwick)': 'LGW', 'gatwick': 'LGW',
  'manchester': 'MAN',
  'birmingham': 'BHX',
  'edinburgh': 'EDI',
  'glasgow': 'GLA',
  'bristol': 'BRS',
  'liverpool': 'LPL',
  'leeds': 'LBA',
  'newcastle': 'NCL',
  'east midlands': 'EMA',
  // France
  'paris': 'CDG',
  'paris (orly)': 'ORY', 'orly': 'ORY',
  'paris (beauvais)': 'BVA', 'beauvais': 'BVA',
  'nisa': 'NCE', 'nice': 'NCE',
  'lyon': 'LYS',
  'marsilia': 'MRS', 'marseille': 'MRS',
  'toulouse': 'TLS',
  'bordeaux': 'BOD',
  'nantes': 'NTE',
  // Italy
  'roma': 'FCO', 'rome': 'FCO',
  'roma (ciampino)': 'CIA', 'ciampino': 'CIA',
  'milano': 'MXP', 'milan': 'MXP',
  'milano (linate)': 'LIN', 'linate': 'LIN',
  'milano (bergamo)': 'BGY', 'bergamo': 'BGY',
  'venetia': 'VCE', 'venice': 'VCE', 'venezia': 'VCE',
  'venetia (treviso)': 'TSF', 'treviso': 'TSF',
  'florenta': 'FLR', 'florence': 'FLR', 'firenze': 'FLR',
  'napoli': 'NAP', 'naples': 'NAP',
  'bologna': 'BLQ',
  'torino': 'TRN', 'turin': 'TRN',
  'bari': 'BRI',
  'catania': 'CTA',
  'palermo': 'PMO',
  'pisa': 'PSA',
  'verona': 'VRN',
  'genova': 'GOA', 'genoa': 'GOA',
  // Spain
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'malaga': 'AGP',
  'alicante': 'ALC',
  'valencia': 'VLC',
  'sevilla': 'SVQ', 'seville': 'SVQ',
  'palma': 'PMI', 'palma de mallorca': 'PMI', 'mallorca': 'PMI',
  'ibiza': 'IBZ',
  'tenerife': 'TFS',
  'gran canaria': 'LPA', 'las palmas': 'LPA',
  'bilbao': 'BIO',
  // Netherlands
  'amsterdam': 'AMS',
  'eindhoven': 'EIN',
  'rotterdam': 'RTM',
  // Belgium
  'bruxelles': 'BRU', 'brussels': 'BRU', 'brussel': 'BRU',
  'charleroi': 'CRL',
  // Austria
  'viena': 'VIE', 'vienna': 'VIE', 'wien': 'VIE',
  'salzburg': 'SZG',
  'innsbruck': 'INN',
  // Switzerland
  'zurich': 'ZRH', 'zuerich': 'ZRH',
  'geneva': 'GVA', 'geneve': 'GVA', 'genf': 'GVA',
  'basel': 'BSL',
  // Turkey
  'istanbul': 'IST',
  'istanbul (sabiha)': 'SAW', 'sabiha gokcen': 'SAW',
  'ankara': 'ESB',
  'antalya': 'AYT',
  'izmir': 'ADB',
  'bodrum': 'BJV',
  'dalaman': 'DLM',
  // UAE
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  // Egypt
  'hurghada': 'HRG',
  'sharm el sheikh': 'SSH', 'sharm': 'SSH',
  'cairo': 'CAI',
  // Other
  'dublin': 'DUB',
  'lisabona': 'LIS', 'lisbon': 'LIS', 'lisboa': 'LIS',
  'porto': 'OPO',
  'copenhaga': 'CPH', 'copenhagen': 'CPH', 'kobenhavn': 'CPH',
  'stockholm': 'ARN',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'praga': 'PRG', 'prague': 'PRG', 'praha': 'PRG',
  'budapesta': 'BUD', 'budapest': 'BUD',
  'bratislava': 'BTS',
  'sofia': 'SOF',
  'belgrad': 'BEG', 'belgrade': 'BEG', 'beograd': 'BEG',
  'zagreb': 'ZAG',
  'ljubljana': 'LJU',
  'skopje': 'SKP',
  'tirana': 'TIA',
  'podgorica': 'TGD',
  'sarajevo': 'SJJ',
  'riga': 'RIX',
  'vilnius': 'VNO',
  'tallinn': 'TLL',
  'moscova': 'SVO', 'moscow': 'SVO', 'moskva': 'SVO',
  'kiev': 'KBP', 'kyiv': 'KBP',
  'larnaca': 'LCA', 'larnaka': 'LCA',
  'paphos': 'PFO', 'pafos': 'PFO',
  'malta': 'MLA', 'valletta': 'MLA',
  'amman': 'AMM',
  'beirut': 'BEY',
  'doha': 'DOH',
  'riyadh': 'RUH',
  'jeddah': 'JED',
  'kuwait': 'KWI',
  'bahrain': 'BAH',
  'muscat': 'MCT',
  'new york': 'JFK',
  'los angeles': 'LAX',
  'chicago': 'ORD',
  'miami': 'MIA',
  'toronto': 'YYZ',
  'montreal': 'YUL',
  'singapore': 'SIN',
  'bangkok': 'BKK',
  'hong kong': 'HKG',
  'tokyo': 'NRT',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'seoul': 'ICN',
  'sydney': 'SYD',
  'melbourne': 'MEL',
  // Armenia
  'erevan': 'EVN', 'yerevan': 'EVN',
  // Syria
  'damasc': 'DAM', 'damascus': 'DAM',
  // Romania
  'bucuresti': 'OTP', 'bucharest': 'OTP', 'otopeni': 'OTP',
  'cluj': 'CLJ', 'cluj-napoca': 'CLJ',
  'timisoara': 'TSR',
  'iasi': 'IAS',
  'constanta': 'CND',
  'sibiu': 'SBZ',
  'craiova': 'CRA',
  'bacau': 'BCM',
  'oradea': 'OMR',
  'suceava': 'SCV',
  'targu mures': 'TGM',
  'arad': 'ARW',
  'satu mare': 'SUJ',
  'brasov': 'GHV',
  // Moldova
  'chisinau': 'RMO', 'kishinev': 'KIV',
  // Missing cities
  'billund': 'BLL',
  'lamezia terme': 'SUF', 'lamezia': 'SUF', 'lamezia-terme': 'SUF',
  'male': 'MLE', 'maldive': 'MLE', 'maldives': 'MLE', 'mal├⌐': 'MLE',
  'salalah': 'SLL', 'salala': 'SLL',
  // Azerbaijan
  'baku': 'GYD', 'baki': 'GYD',
  // Georgia
  'tbilisi': 'TBS',
  // Luxembourg
  'luxembourg': 'LUX', 'luxemburg': 'LUX',
  // Morocco
  'marrakech': 'RAK', 'marrakesh': 'RAK',
  // Spain additional
  'castellon': 'CDT', 'castellon de la plana': 'CDT',
  'zaragoza': 'ZAZ', 'saragossa': 'ZAZ',
  'girona': 'GRO', 'gerona': 'GRO',
  'santander': 'SDR',
  'reus': 'REU',
  // Italy additional
  'pescara': 'PSR',
  // Bulgaria additional
  'varna': 'VAR',
  // Finland additional
  'turku': 'TKU',
}

// IATA code to City name mapping (reverse of CITY_IATA_CODES)
const IATA_TO_CITY_NAME: Record<string, string> = {
  // Greece
  'ATH': 'Atena', 'SKG': 'Salonic', 'HER': 'Heraklion', 'RHO': 'Rhodos', 'CFU': 'Corfu', 'ZTH': 'Zakynthos',
  // Israel
  'TLV': 'Tel Aviv',
  // Poland
  'WAW': 'Varșovia', 'KRK': 'Cracovia', 'GDN': 'Gdansk', 'WRO': 'Wroclaw', 'POZ': 'Poznan', 'KTW': 'Katowice',
  // Germany
  'FRA': 'Frankfurt', 'MUC': 'Munchen', 'BER': 'Berlin', 'DUS': 'Dusseldorf', 'HAM': 'Hamburg',
  'CGN': 'Koln', 'STR': 'Stuttgart', 'NUE': 'Nurnberg', 'DTM': 'Dortmund', 'HAJ': 'Hannover',
  'FKB': 'Karlsruhe', 'FMM': 'Memmingen',
  // UK
  'LHR': 'Londra', 'LTN': 'Londra (Luton)', 'STN': 'Londra (Stansted)', 'LGW': 'Londra (Gatwick)',
  'MAN': 'Manchester', 'BHX': 'Birmingham', 'EDI': 'Edinburgh', 'GLA': 'Glasgow',
  'BRS': 'Bristol', 'LPL': 'Liverpool', 'LBA': 'Leeds', 'NCL': 'Newcastle', 'EMA': 'East Midlands',
  // France
  'CDG': 'Paris', 'ORY': 'Paris (Orly)', 'BVA': 'Paris (Beauvais)', 'NCE': 'Nisa', 'LYS': 'Lyon',
  'MRS': 'Marsilia', 'TLS': 'Toulouse', 'BOD': 'Bordeaux', 'NTE': 'Nantes',
  // Italy
  'FCO': 'Roma', 'CIA': 'Roma (Ciampino)', 'MXP': 'Milano', 'LIN': 'Milano (Linate)', 'BGY': 'Milano (Bergamo)',
  'VCE': 'Veneția', 'TSF': 'Treviso', 'FLR': 'Florența', 'NAP': 'Napoli', 'BLQ': 'Bologna',
  'TRN': 'Torino', 'BRI': 'Bari', 'CTA': 'Catania', 'PMO': 'Palermo', 'PSA': 'Pisa',
  'VRN': 'Verona', 'GOA': 'Genova', 'PSR': 'Pescara', 'SUF': 'Lamezia Terme',
  // Spain
  'MAD': 'Madrid', 'BCN': 'Barcelona', 'AGP': 'Malaga', 'ALC': 'Alicante', 'VLC': 'Valencia',
  'SVQ': 'Sevilla', 'PMI': 'Palma de Mallorca', 'IBZ': 'Ibiza', 'TFS': 'Tenerife', 'LPA': 'Gran Canaria', 'BIO': 'Bilbao',
  'CDT': 'Castellon', 'ZAZ': 'Zaragoza', 'GRO': 'Girona', 'SDR': 'Santander', 'REU': 'Reus',
  // Netherlands
  'AMS': 'Amsterdam', 'EIN': 'Eindhoven', 'RTM': 'Rotterdam',
  // Belgium
  'BRU': 'Bruxelles', 'CRL': 'Charleroi',
  // Austria
  'VIE': 'Viena', 'SZG': 'Salzburg', 'INN': 'Innsbruck',
  // Switzerland
  'ZRH': 'Zurich', 'GVA': 'Geneva', 'BSL': 'Basel',
  // Turkey
  'IST': 'Istanbul', 'SAW': 'Istanbul (Sabiha)', 'ESB': 'Ankara', 'AYT': 'Antalya', 'ADB': 'Izmir', 'BJV': 'Bodrum', 'DLM': 'Dalaman',
  // UAE
  'DXB': 'Dubai', 'AUH': 'Abu Dhabi',
  // Egypt
  'HRG': 'Hurghada', 'SSH': 'Sharm El Sheikh', 'CAI': 'Cairo',
  // Ireland
  'DUB': 'Dublin',
  // Portugal
  'LIS': 'Lisabona', 'OPO': 'Porto',
  // Denmark
  'CPH': 'Copenhaga', 'BLL': 'Billund',
  // Sweden
  'ARN': 'Stockholm',
  // Norway
  'OSL': 'Oslo',
  // Finland
  'HEL': 'Helsinki', 'TKU': 'Turku',
  // Czech Republic
  'PRG': 'Praga',
  // Hungary
  'BUD': 'Budapesta',
  // Slovakia
  'BTS': 'Bratislava',
  // Bulgaria
  'SOF': 'Sofia', 'VAR': 'Varna',
  // Serbia
  'BEG': 'Belgrad',
  // Croatia
  'ZAG': 'Zagreb',
  // Slovenia
  'LJU': 'Ljubljana',
  // North Macedonia
  'SKP': 'Skopje',
  // Albania
  'TIA': 'Tirana',
  // Montenegro
  'TGD': 'Podgorica',
  // Bosnia
  'SJJ': 'Sarajevo',
  // Latvia
  'RIX': 'Riga',
  // Lithuania
  'VNO': 'Vilnius',
  // Estonia
  'TLL': 'Tallinn',
  // Russia
  'SVO': 'Moscova',
  // Ukraine
  'KBP': 'Kiev',
  // Cyprus
  'LCA': 'Larnaca', 'PFO': 'Paphos',
  // Malta
  'MLA': 'Malta',
  // Jordan
  'AMM': 'Amman',
  // Lebanon
  'BEY': 'Beirut',
  // Qatar
  'DOH': 'Doha',
  // Saudi Arabia
  'RUH': 'Riyadh', 'JED': 'Jeddah',
  // Kuwait
  'KWI': 'Kuwait',
  // Bahrain
  'BAH': 'Bahrain',
  // Oman
  'MCT': 'Muscat', 'SLL': 'Salalah',
  // Armenia
  'EVN': 'Erevan',
  // Syria
  'DAM': 'Damasc',
  // Maldives
  'MLE': 'Maldive',
  // Azerbaijan
  'GYD': 'Baku',
  // Georgia
  'TBS': 'Tbilisi',
  // Luxembourg
  'LUX': 'Luxemburg',
  // Morocco
  'RAK': 'Marrakech',
  // Romania
  'OTP': 'București', 'BBU': 'București (Băneasa)', 'CLJ': 'Cluj-Napoca', 'TSR': 'Timișoara',
  'IAS': 'Iași', 'CND': 'Constanța', 'SBZ': 'Sibiu', 'CRA': 'Craiova', 'BCM': 'Bacău',
  'OMR': 'Oradea', 'SCV': 'Suceava', 'TGM': 'Târgu Mureș', 'ARW': 'Arad', 'SUJ': 'Satu Mare', 'GHV': 'Brașov',
  // Moldova
  'RMO': 'Chișinău', 'KIV': 'Chișinău',
  // USA
  'JFK': 'New York', 'LAX': 'Los Angeles', 'ORD': 'Chicago', 'MIA': 'Miami',
  // Canada
  'YYZ': 'Toronto', 'YUL': 'Montreal',
  // Asia
  'SIN': 'Singapore', 'BKK': 'Bangkok', 'HKG': 'Hong Kong', 'NRT': 'Tokyo',
  'PEK': 'Beijing', 'PVG': 'Shanghai', 'ICN': 'Seoul',
  // Australia
  'SYD': 'Sydney', 'MEL': 'Melbourne',
}

// Get city name from IATA code (for display purposes)
const getCityNameFromCode = (code: string): string => {
  if (!code) return ''
  const upperCode = code.toUpperCase()
  
  // Check direct mapping
  if (IATA_TO_CITY_NAME[upperCode]) {
    return IATA_TO_CITY_NAME[upperCode]
  }
  
  // If code is 3 letters and not found, return as-is (it's an unknown airport code)
  if (code.length === 3 && /^[A-Z]{3}$/i.test(code)) {
    return code
  }
  
  // Otherwise return the original value (it might already be a city name)
  return code
}

// City to Country mapping for grouping destinations
const CITY_COUNTRY_MAP: Record<string, string> = {
  // Romania
  'OTP': 'România', 'BBU': 'România', 'CLJ': 'România', 'TSR': 'România', 'IAS': 'România',
  'CND': 'România', 'SBZ': 'România', 'CRA': 'România', 'BCM': 'România', 'BAY': 'România',
  'OMR': 'România', 'SCV': 'România', 'TGM': 'România', 'ARW': 'România', 'SUJ': 'România', 'GHV': 'România',
  // Moldova
  'RMO': 'Moldova', 'KIV': 'Moldova',
  // Greece
  'ATH': 'Grecia', 'SKG': 'Grecia', 'HER': 'Grecia', 'RHO': 'Grecia', 'CFU': 'Grecia', 'ZTH': 'Grecia',
  // Israel
  'TLV': 'Israel',
  // Poland
  'WAW': 'Polonia', 'KRK': 'Polonia', 'GDN': 'Polonia', 'WRO': 'Polonia', 'POZ': 'Polonia', 'KTW': 'Polonia',
  // Germany
  'FRA': 'Germania', 'MUC': 'Germania', 'BER': 'Germania', 'DUS': 'Germania', 'HAM': 'Germania', 
  'CGN': 'Germania', 'STR': 'Germania', 'NUE': 'Germania', 'DTM': 'Germania', 'HAJ': 'Germania', 
  'FKB': 'Germania', 'FMM': 'Germania',
  // UK
  'LHR': 'Marea Britanie', 'LTN': 'Marea Britanie', 'STN': 'Marea Britanie', 'LGW': 'Marea Britanie',
  'MAN': 'Marea Britanie', 'BHX': 'Marea Britanie', 'EDI': 'Marea Britanie', 'GLA': 'Marea Britanie',
  'BRS': 'Marea Britanie', 'LPL': 'Marea Britanie', 'LBA': 'Marea Britanie', 'NCL': 'Marea Britanie', 'EMA': 'Marea Britanie',
  // France
  'CDG': 'Franța', 'ORY': 'Franța', 'BVA': 'Franța', 'NCE': 'Franța', 'LYS': 'Franța', 
  'MRS': 'Franța', 'TLS': 'Franța', 'BOD': 'Franța', 'NTE': 'Franța',
  // Italy
  'FCO': 'Italia', 'CIA': 'Italia', 'MXP': 'Italia', 'LIN': 'Italia', 'BGY': 'Italia',
  'VCE': 'Italia', 'TSF': 'Italia', 'FLR': 'Italia', 'NAP': 'Italia', 'BLQ': 'Italia',
  'TRN': 'Italia', 'BRI': 'Italia', 'CTA': 'Italia', 'PMO': 'Italia', 'PSA': 'Italia', 
  'VRN': 'Italia', 'GOA': 'Italia',
  // Spain
  'MAD': 'Spania', 'BCN': 'Spania', 'AGP': 'Spania', 'ALC': 'Spania', 'VLC': 'Spania',
  'SVQ': 'Spania', 'PMI': 'Spania', 'IBZ': 'Spania', 'TFS': 'Spania', 'LPA': 'Spania', 'BIO': 'Spania',
  // Netherlands
  'AMS': 'Olanda', 'EIN': 'Olanda', 'RTM': 'Olanda',
  // Belgium
  'BRU': 'Belgia', 'CRL': 'Belgia',
  // Austria
  'VIE': 'Austria', 'SZG': 'Austria', 'INN': 'Austria',
  // Switzerland
  'ZRH': 'Elveția', 'GVA': 'Elveția', 'BSL': 'Elveția',
  // Turkey
  'IST': 'Turcia', 'SAW': 'Turcia', 'ESB': 'Turcia', 'AYT': 'Turcia', 'ADB': 'Turcia', 'BJV': 'Turcia', 'DLM': 'Turcia',
  // UAE
  'DXB': 'Emiratele Arabe', 'AUH': 'Emiratele Arabe',
  // Egypt
  'HRG': 'Egipt', 'SSH': 'Egipt', 'CAI': 'Egipt',
  // Ireland
  'DUB': 'Irlanda',
  // Portugal
  'LIS': 'Portugalia', 'OPO': 'Portugalia',
  // Denmark
  'CPH': 'Danemarca',
  // Sweden
  'ARN': 'Suedia',
  // Norway
  'OSL': 'Norvegia',
  // Finland
  'HEL': 'Finlanda',
  // Czech Republic
  'PRG': 'Cehia',
  // Hungary
  'BUD': 'Ungaria',
  // Slovakia
  'BTS': 'Slovacia',
  // Bulgaria
  'SOF': 'Bulgaria',
  // Serbia
  'BEG': 'Serbia',
  // Croatia
  'ZAG': 'Croația',
  // Slovenia
  'LJU': 'Slovenia',
  // North Macedonia
  'SKP': 'Macedonia de Nord',
  // Albania
  'TIA': 'Albania',
  // Montenegro
  'TGD': 'Muntenegru',
  // Bosnia
  'SJJ': 'Bosnia',
  // Latvia
  'RIX': 'Letonia',
  // Lithuania
  'VNO': 'Lituania',
  // Estonia
  'TLL': 'Estonia',
  // Russia
  'SVO': 'Rusia',
  // Ukraine
  'KBP': 'Ucraina',
  // Cyprus
  'LCA': 'Cipru', 'PFO': 'Cipru',
  // Malta
  'MLA': 'Malta',
  // Jordan
  'AMM': 'Iordania',
  // Lebanon
  'BEY': 'Liban',
  // Qatar
  'DOH': 'Qatar',
  // Saudi Arabia
  'RUH': 'Arabia Saudită', 'JED': 'Arabia Saudită',
  // Kuwait
  'KWI': 'Kuweit',
  // Bahrain
  'BAH': 'Bahrain',
  // Oman
  'MCT': 'Oman', 'SLL': 'Oman',
  // Armenia
  'EVN': 'Armenia',
  // Syria
  'DAM': 'Siria',
  // Maldives
  'MLE': 'Maldive',
  // Denmark - add BLL
  'BLL': 'Danemarca',
  // USA
  'JFK': 'SUA', 'LAX': 'SUA', 'ORD': 'SUA', 'MIA': 'SUA',
  // Canada
  'YYZ': 'Canada', 'YUL': 'Canada',
  // Singapore
  'SIN': 'Singapore',
  // Thailand
  'BKK': 'Thailanda',
  // Hong Kong
  'HKG': 'Hong Kong',
  // Japan
  'NRT': 'Japonia',
  // China
  'PEK': 'China', 'PVG': 'China',
  // South Korea
  'ICN': 'Coreea de Sud',
  // Australia
  'SYD': 'Australia', 'MEL': 'Australia',
  // Azerbaijan
  'GYD': 'Azerbaidjan',
  // Georgia
  'TBS': 'Georgia',
  // Luxembourg
  'LUX': 'Luxemburg',
  // Morocco
  'RAK': 'Maroc',
  // Additional Spain airports
  'CDT': 'Spania', 'ZAZ': 'Spania', 'GRO': 'Spania', 'SDR': 'Spania', 'REU': 'Spania',
  // Additional Italy airports
  'PSR': 'Italia', 'SUF': 'Italia',
  // Additional Bulgaria airports
  'VAR': 'Bulgaria',
  // Finland - Turku
  'TKU': 'Finlanda',
}

// Get country for a destination code
const getCountryForDestination = (destCode: string, destName: string): string => {
  if (destCode && CITY_COUNTRY_MAP[destCode]) {
    return CITY_COUNTRY_MAP[destCode]
  }
  // Try to find by city name
  const iataCode = getCityIataCode(destName)
  if (iataCode && CITY_COUNTRY_MAP[iataCode]) {
    return CITY_COUNTRY_MAP[iataCode]
  }
  return 'Alte destinații'
}

// Get IATA code for city name
const getCityIataCode = (cityName: string): string => {
  if (!cityName) return ''
  const normalized = normalizeString(cityName)
  
  // Direct lookup - exact match first
  if (CITY_IATA_CODES[normalized]) {
    return CITY_IATA_CODES[normalized]
  }
  
  // Try without spaces/dashes
  const compacted = normalized.replace(/[\s-]/g, '')
  for (const [city, code] of Object.entries(CITY_IATA_CODES)) {
    const cityCompacted = city.replace(/[\s-]/g, '')
    if (compacted === cityCompacted) {
      return code
    }
  }
  
  // Partial match - but only if the city name CONTAINS the mapping key (not vice versa for short keys)
  // This prevents "venetia" matching "tirana" because "tia" is in both
  for (const [city, code] of Object.entries(CITY_IATA_CODES)) {
    // Only match if normalized contains the full city key, or city key contains normalized (for longer searches)
    if (normalized.includes(city) && city.length >= 4) {
      return code
    }
    // For reverse match, require the search term to be substantial
    if (city.includes(normalized) && normalized.length >= 5) {
      return code
    }
  }
  
  // Try first word match (for cases like "Lamezia Terme Airport")
  const firstWord = normalized.split(/[\s-]/)[0]
  if (firstWord && firstWord.length >= 4) {
    for (const [city, code] of Object.entries(CITY_IATA_CODES)) {
      const cityFirstWord = city.split(/[\s-]/)[0]
      if (cityFirstWord === firstWord) {
        return code
      }
    }
  }
  
  return ''
}

// Airline name normalization - merge variants into canonical names
const AIRLINE_MAPPINGS: Record<string, string> = {
  'w4': 'Wizz Air',
  'wizzair': 'Wizz Air',
  'wizz air malta': 'Wizz Air',
  'wizzair malta': 'Wizz Air',
  'wizz air': 'Wizz Air',
  'wizz air uk': 'Wizz Air',
  'bz': 'Bluebird Airways',
  'bluebird airways': 'Bluebird Airways',
  'xz': 'Aeroitalia',
  'aeroitalia': 'Aeroitalia',
  'fly air41': 'Aeroitalia',  // Corrupted name from API, XZ = Aeroitalia
  'flyone': 'FlyOne',
  'fly one': 'FlyOne',
  'flyone romania': 'FlyOne',
  'fly one romania': 'FlyOne',
  'flyone armenia': 'FlyOne',
  'fly one armenia': 'FlyOne',
  '5f': 'FlyOne',  // FlyOne IATA code
}

// Airline name to IATA code mapping for logo display
const AIRLINE_IATA_CODES: Record<string, string> = {
  'wizz air': 'W6',
  'ryanair': 'FR',
  'blue air': '0B',
  'tarom': 'RO',
  'lufthansa': 'LH',
  'austrian': 'OS',
  'turkish airlines': 'TK',
  'turkish': 'TK',
  'flyone': '5F',
  'air france': 'AF',
  'klm': 'KL',
  'british airways': 'BA',
  'british': 'BA',
  'easyjet': 'U2',
  'vueling': 'VY',
  'iberia': 'IB',
  'air europa': 'UX',
  'aegean': 'A3',
  'lot polish': 'LO',
  'lot': 'LO',
  'swiss': 'LX',
  'brussels airlines': 'SN',
  'air malta': 'KM',
  'air serbia': 'JU',
  'pegasus': 'PC',
  'sunexpress': 'XQ',
  'norwegian': 'DY',
  'finnair': 'AY',
  'sas': 'SK',
  'aeroitalia': 'XZ',
  'bluebird airways': 'BZ',
  'dan air': 'D5',
  'danair': 'D5',
  'hisky': 'H4',
  'air connect': 'KN',
  'animawings': 'A2',
  'flexflight': 'W2',
  'air moldova': '9U',
  // Added missing airlines
  'emirates': 'EK',
  'freebird': 'FH',
  'freebird airlines': 'FH',
  'qatar': 'QR',
  'qatar airways': 'QR',
  'smartwings': 'QS',
  'smart wings': 'QS',
  'eurowings': 'EW',
  'lufthansa city': 'CL',
  'lufthansa cityline': 'CL',
  'skyup': 'PQ',
  'skyup airlines': 'PQ',
  'azal': 'J2',
  'azerbaijan airlines': 'J2',
  'flydubai': 'FZ',
  'fly dubai': 'FZ',
}

const normalizeAirlineName = (airline: string): string => {
  if (!airline) return ''
  const lower = airline.toLowerCase().trim()
  
  // Check direct mapping
  if (AIRLINE_MAPPINGS[lower]) {
    return AIRLINE_MAPPINGS[lower]
  }
  
  // Check if contains wizz
  if (lower.includes('wizz') || lower === 'w4') {
    return 'Wizz Air'
  }
  
  // Check if contains bluebird
  if (lower.includes('bluebird') || lower === 'bz') {
    return 'Bluebird Airways'
  }
  
  // Check if contains flyone or fly one
  if (lower.includes('flyone') || lower.includes('fly one')) {
    return 'FlyOne'
  }
  
  // Check if it's Aeroitalia (including corrupted "Fly Air41" from API)
  if (lower.includes('aeroitalia') || lower === 'xz' || lower.includes('fly air41') || lower.includes('air41')) {
    return 'Aeroitalia'
  }
  
  return airline
}

// Get IATA code for airline name (for logo display)
const getAirlineIataCode = (airlineName: string): string => {
  if (!airlineName) return 'XX'
  const lower = airlineName.toLowerCase().trim()
  
  // Check direct mapping
  if (AIRLINE_IATA_CODES[lower]) {
    return AIRLINE_IATA_CODES[lower]
  }
  
  // Check partial matches
  for (const [name, code] of Object.entries(AIRLINE_IATA_CODES)) {
    if (lower.includes(name) || name.includes(lower)) {
      return code
    }
  }
  
  // Fallback to first 2 characters (uppercase)
  return airlineName.substring(0, 2).toUpperCase()
}

const isValidAirline = (airline: string): boolean => {
  if (!airline) return false
  const lower = airline.toLowerCase().trim()
  // Exclude unknown/invalid airlines - check multiple variations
  if (lower === 'unknown airlines' || 
      lower === 'unknown airline' || 
      lower === 'unknown' || 
      lower === '' ||
      lower.startsWith('unknown')) return false
  return true
}

// Cargo, charter VIP, private airlines to exclude
const EXCLUDED_AIRLINE_CODES = new Set([
  'FOE', // Unknown charter airline - exclude
  'SFB', // Unknown charter airline - exclude  
  'AG',  // Aruba Airlines / cargo
  'TOY', // Toy Airlines (charter)
  'QY',  // European Air Transport (DHL cargo)
  'BOX', // Aerologic (cargo)
  'BCS', // European Air Transport Leipzig (cargo)
  'DHK', // DHL Air UK (cargo)
  'FDX', // FedEx Express (cargo)
  'UPS', // UPS Airlines (cargo)
  'CLX', // Cargolux (cargo)
  'MPH', // Martinair Cargo (cargo)
  'ABR', // ASL Airlines Belgium (cargo)
  'TAY', // ASL Airlines Belgium (cargo)
  'GSS', // Global Aviation Services (cargo)
  'AHK', // Air Hong Kong (cargo)
  'CAO', // Air China Cargo (cargo)
  'SQC', // Singapore Airlines Cargo (cargo)
  'KAL', // Korean Air Cargo (cargo)
  'GTI', // Atlas Air (cargo)
  'PAC', // Polar Air Cargo (cargo)
  'NCA', // Nippon Cargo Airlines (cargo)
  'ABW', // AirBridgeCargo (cargo)
  'ICL', // CAL Cargo Airlines (cargo)
  'SWN', // West Atlantic (cargo)
  'NPT', // West Air Europe (cargo)
  'FAT', // Farnair Switzerland (cargo)
  'QAF', // Qatar Airways Cargo (cargo)
  'ETD', // Etihad Cargo (cargo)
  'UAE', // Emirates SkyCargo (cargo)
  'THA', // Thai Cargo (cargo)
  'CKK', // China Cargo Airlines (cargo)
  'MAS', // MASkargo (cargo)
  'KZR', // Air Astana Cargo (cargo)
  'VDA', // Volga-Dnepr Airlines (cargo)
  'ADB', // Antonov Airlines (cargo)
  'RCH', // US Air Force (military)
  'RRR', // Royal Air Force (military)
  'GAF', // German Air Force (military)
  'FAF', // French Air Force (military)
  'IAM', // Italian Air Force (military)
  'CNV', // Private/VIP
  'VJT', // VistaJet (private)
  'NJE', // NetJets Europe (private)
  'EJA', // NetJets Aviation (private)
  'XSR', // ExecuJet (private)
  'LXJ', // Flexjet (private)
  'TVF', // Transavia France (sometimes charter)
])

const EXCLUDED_AIRLINE_NAMES = [
  'cargo',
  'freight',
  'express cargo',
  'air cargo',
  'dhl',
  'fedex',
  'ups',
  'tnt',
  'military',
  'air force',
  'navy',
  'army',
  'private jet',
  'executive jet',
  'vip jet',
  'charter vip',
  'charter',  // Exclude all charter flights
  'business jet',
  'netjets',
  'vistajet',
  'execujet',
  'flexjet',
  'mpc air',  // Business aviation company - private charter
  'star east',  // Charter airline - exclude
  'star east airlines',  // Charter airline - exclude
]

const isExcludedAirline = (airline: string, flightNumber?: string): boolean => {
  if (!airline) return true
  
  const lower = airline.toLowerCase().trim()
  
  // Check if airline name contains excluded keywords
  for (const excluded of EXCLUDED_AIRLINE_NAMES) {
    if (lower.includes(excluded)) return true
  }
  
  // Check flight number prefix (airline code)
  if (flightNumber) {
    const code = flightNumber.substring(0, 2).toUpperCase()
    if (EXCLUDED_AIRLINE_CODES.has(code)) return true
    const code3 = flightNumber.substring(0, 3).toUpperCase()
    if (EXCLUDED_AIRLINE_CODES.has(code3)) return true
  }
  
  return false
}

export default function FlyFinderView() {
  // Data state
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Helper to get current day of week
  const getCurrentDayOfWeek = (): DayOfWeek => {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }
  
  // Search criteria state
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>(['OTP'])
  const [departureDays, setDepartureDays] = useState<DayOfWeek[]>([getCurrentDayOfWeek()])
  const [returnDays, setReturnDays] = useState<DayOfWeek[]>(['sunday'])
  const [departureTimeSlots, setDepartureTimeSlots] = useState<TimeSlot[]>(['morning', 'afternoon', 'evening'])
  const [returnTimeSlots, setReturnTimeSlots] = useState<TimeSlot[]>(['morning', 'afternoon', 'evening'])
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip')
  
  // Results state
  const [results, setResults] = useState<FlightResult[]>([])
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'combinations' | 'alphabetical' | 'score'>('combinations')
  const [groupByCountry, setGroupByCountry] = useState(false)
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())
  const [destinationSearch, setDestinationSearch] = useState('')
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [showAirlineFilter, setShowAirlineFilter] = useState(false)
  const [showProximityResults, setShowProximityResults] = useState(false)
  
  // Flight selection state for zbor.md redirect
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<SelectedFlight | null>(null)
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<SelectedFlight | null>(null)
  
  // Booking modal state
  const [bookingModal, setBookingModal] = useState<BookingModalState>({
    isOpen: false,
    step: 'departure',
    departureDate: null,
    returnDate: null,
    passengers: { adults: 1, children: 0, infants: 0 }
  })
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Proximity search hook
  const availableDestinations = useMemo(() => 
    results.map(r => r.destinationCode).filter(Boolean),
    [results]
  )
  
  const {
    search: searchProximity,
    result: proximityResult,
    isSearching: isProximitySearching,
    isCalculatingRoutes,
    error: proximityError,
    clearResult: clearProximityResult
  } = useProximitySearch({ availableDestinations })

  // Day names mapping for display
  const DAY_NAMES_RO: { [key: string]: string } = {
    monday: 'Lu', tuesday: 'Ma', wednesday: 'Mi', 
    thursday: 'Jo', friday: 'Vi', saturday: 'Sâ', sunday: 'Du'
  }

  // Helper to normalize city names for comparison
  const normalizeCityName = (name: string): string => {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]/g, '') // Remove special chars
  }

  // City name variations mapping (for matching different spellings)
  const CITY_VARIATIONS: { [key: string]: string[] } = {
    'venezia': ['venetia', 'venice', 'venedig'],
    'milano': ['milan', 'mailand'],
    'roma': ['rome', 'rom'],
    'munchen': ['munich', 'muenchen'],
    'wien': ['vienna', 'viena'],
    'koln': ['cologne', 'koeln'],
    'nurnberg': ['nuremberg', 'nuernberg'],
    'zurich': ['zurich', 'zuerich'],
    'geneve': ['geneva', 'genf'],
    'bruxelles': ['brussels', 'brussel'],
    'bucuresti': ['bucharest', 'bukarest'],
    'chisinau': ['kishinev', 'kisinau'],
  }

  // Enrich proximity results with flight info from schedule data
  // FILTERED by selected origins and departure days
  const enrichedProximityResult = useMemo(() => {
    if (!proximityResult || !scheduleData.length) return proximityResult
    
    // Get selected origin city names for matching
    const selectedOriginCities = selectedOrigins.map(code => {
      const airport = MAJOR_AIRPORTS.find(a => a.code === code)
      return airport ? normalizeCityName(airport.city) : ''
    }).filter(Boolean)
    
    // Map day names to weeklyPattern keys
    const DAY_KEY_MAP: { [key: string]: string } = {
      'Lu': 'monday', 'Ma': 'tuesday', 'Mi': 'wednesday',
      'Jo': 'thursday', 'Vi': 'friday', 'Sâ': 'saturday', 'Du': 'sunday'
    }
    
    const enrichedAirports = proximityResult.nearbyAirports.map(airport => {
      const normalizedAirportCity = normalizeCityName(airport.city)
      
      // Find all flights to this destination airport FROM SELECTED ORIGINS
      const flightsToDestination = scheduleData.filter(schedule => {
        // First check if origin matches selected origins
        const scheduleOriginNormalized = normalizeCityName(schedule.airport)
        const originMatches = selectedOriginCities.some(selectedCity => 
          scheduleOriginNormalized.includes(selectedCity) || selectedCity.includes(scheduleOriginNormalized)
        )
        if (!originMatches) return false
        
        // Check if flight operates on selected departure days
        const hasSelectedDay = departureDays.some(day => schedule.weeklyPattern[day])
        if (!hasSelectedDay) return false
        
        // Now check destination match
        const destNormalized = normalizeCityName(schedule.destination)
        
        // Direct match by IATA code
        if (schedule.destination === airport.code) return true
        
        // Match by normalized city name
        if (destNormalized === normalizedAirportCity) return true
        
        // Partial match (one contains the other)
        if (destNormalized.includes(normalizedAirportCity) || 
            normalizedAirportCity.includes(destNormalized)) return true
        
        // Check city variations
        for (const [base, variations] of Object.entries(CITY_VARIATIONS)) {
          const allVariations = [base, ...variations]
          const airportMatches = allVariations.some(v => normalizedAirportCity.includes(v))
          const destMatches = allVariations.some(v => destNormalized.includes(v))
          if (airportMatches && destMatches) return true
        }
        
        return false
      })
      
      if (flightsToDestination.length === 0) {
        return airport
      }
      
      // Extract unique origin cities, airlines, and days (only from filtered flights)
      const originCities = [...new Set(flightsToDestination.map(f => f.airport))]
      const originCodes = [...new Set(flightsToDestination.map(f => {
        // Try to find the IATA code for the origin airport
        const originAirport = MAJOR_AIRPORTS.find(a => 
          a.city === f.airport || a.name.includes(f.airport)
        )
        return originAirport?.code || f.airport
      }))]
      const airlines = [...new Set(flightsToDestination.map(f => f.airline))]
      
      // Get only active days that match selected departure days
      const activeDays: string[] = []
      flightsToDestination.forEach(f => {
        departureDays.forEach(day => {
          if (f.weeklyPattern[day] && !activeDays.includes(DAY_NAMES_RO[day])) {
            activeDays.push(DAY_NAMES_RO[day])
          }
        })
      })
      
      return {
        ...airport,
        flightInfo: {
          originCities,
          originCodes,
          airlines: airlines.slice(0, 3), // Limit to 3 airlines for display
          days: activeDays,
          flightCount: flightsToDestination.length
        }
      }
    })
    
    return {
      ...proximityResult,
      nearbyAirports: enrichedAirports
    }
  }, [proximityResult, scheduleData, selectedOrigins, departureDays])

  // Handle destination search with proximity
  const handleDestinationSearchChange = useCallback((value: string) => {
    setDestinationSearch(value)
    
    // If search term is long enough and no exact matches, trigger proximity search
    if (value.length >= 3) {
      const normalizedSearch = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const hasExactMatch = results.some(r => {
        const destNorm = r.destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const codeNorm = r.destinationCode.toLowerCase()
        return destNorm.includes(normalizedSearch) || codeNorm.includes(normalizedSearch)
      })
      
      if (!hasExactMatch) {
        setShowProximityResults(true)
        searchProximity(value)
      } else {
        setShowProximityResults(false)
        clearProximityResult()
      }
    } else {
      setShowProximityResults(false)
      clearProximityResult()
    }
  }, [results, searchProximity, clearProximityResult])

  // Handle selecting a destination from proximity results
  const handleProximitySelect = useCallback((airportCode: string, cityName: string) => {
    // Clear proximity results first
    setShowProximityResults(false)
    clearProximityResult()
    
    // Find the matching result by IATA code or city name
    const normalizedCity = normalizeString(cityName)
    const matchingResult = results.find(r => {
      // Match by IATA code
      if (r.destinationCode === airportCode) return true
      // Match by normalized city name
      const normalizedDest = normalizeString(r.destination)
      if (normalizedDest === normalizedCity) return true
      // Partial match for cities with airport names like "Milano (Bergamo)"
      if (normalizedDest.includes(normalizedCity) || normalizedCity.includes(normalizedDest)) return true
      return false
    })
    
    if (matchingResult) {
      // Set the search to the found destination name
      setDestinationSearch(matchingResult.destination)
      
      // Expand the destination to show flight details
      setExpandedResults(prev => {
        const next = new Set(prev)
        next.add(matchingResult.destination)
        return next
      })
      
      // Also expand the country (for grouped view)
      const country = getCountryForDestination(matchingResult.destinationCode, matchingResult.destination)
      setExpandedCountries(prev => {
        const next = new Set(prev)
        next.add(country)
        return next
      })
      
      // Scroll to the result after a short delay
      setTimeout(() => {
        const element = document.getElementById(`destination-${matchingResult.destinationCode}`) || 
                       document.getElementById(`destination-${airportCode}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 150)
    } else {
      // If not found in results, just set the search term
      setDestinationSearch(cityName)
    }
  }, [clearProximityResult, results])

  // Romanian/Moldovan airports
  const originAirports = useMemo(() => 
    MAJOR_AIRPORTS.filter(a => a.country === 'România' || a.country === 'Moldova'),
    []
  )

  // Load schedule data
  useEffect(() => {
    setMounted(true)
    loadScheduleData()
  }, [])

  const loadScheduleData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      const data = await response.json()
      if (data.success) {
        setScheduleData(data.data || [])
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter data by selected origins
  const filteredByOrigins = useMemo(() => {
    if (!scheduleData.length || !selectedOrigins.length) return []
    
    return scheduleData.filter(item => {
      // Exclude cargo/private/charter VIP airlines
      if (isExcludedAirline(item.airline, item.flightNumber)) return false
      
      return selectedOrigins.some(originCode => {
        const originCity = getCityName(originCode)
        const normalizedAirport = normalizeString(item.airport)
        const normalizedOrigin = normalizeString(originCity)
        return normalizedAirport.includes(normalizedOrigin) || normalizedOrigin.includes(normalizedAirport)
      })
    })
  }, [scheduleData, selectedOrigins])

  // Extract all unique airlines from FILTERED schedule data (based on selected origins and days)
  // MUST be defined AFTER filteredByOrigins
  const availableAirlines = useMemo(() => {
    const airlines = new Set<string>()
    
    // Use filteredByOrigins which already filters by selected airports
    filteredByOrigins.forEach(item => {
      // Also check if the airline has flights on selected departure days
      const hasFlightsOnSelectedDays = departureDays.some(day => item.weeklyPattern[day])
      
      if (hasFlightsOnSelectedDays && item.airline && isValidAirline(item.airline) && !isExcludedAirline(item.airline, item.flightNumber)) {
        const normalized = normalizeAirlineName(item.airline)
        if (normalized && isValidAirline(normalized) && !isExcludedAirline(normalized)) {
          airlines.add(normalized)
        }
      }
    })
    return Array.from(airlines).sort((a, b) => a.localeCompare(b))
  }, [filteredByOrigins, departureDays])

  // Perform intelligent search
  const performSearch = useCallback(() => {
    setSearching(true)
    
    // Group routes by destination
    const destinationMap = new Map<string, {
      routes: WeeklyScheduleData[]
      outboundFlights: ProcessedFlight[]
      returnFlights: ProcessedFlight[]
    }>()

    // Filter by selected airlines (if any selected) - use normalized names
    const filteredByAirlines = selectedAirlines.length > 0
      ? filteredByOrigins.filter(route => {
          const normalizedAirline = normalizeAirlineName(route.airline)
          return selectedAirlines.includes(normalizedAirline)
        })
      : filteredByOrigins

    // Process outbound flights
    filteredByAirlines.forEach(route => {
      const destName = route.destination
      if (!destinationMap.has(destName)) {
        destinationMap.set(destName, { routes: [], outboundFlights: [], returnFlights: [] })
      }
      
      const entry = destinationMap.get(destName)!
      entry.routes.push(route)
      
      // Find origin city from route.airport
      const originCity = route.airport
      const originAirport = MAJOR_AIRPORTS.find(a => 
        normalizeString(getCityName(a.code)).includes(normalizeString(originCity)) ||
        normalizeString(originCity).includes(normalizeString(getCityName(a.code)))
      )
      const originCode = originAirport?.code || ''
      
      // Check each departure day
      departureDays.forEach(day => {
        if (route.weeklyPattern[day]) {
          const times = route.scheduledTimes?.[day] || ['--:--']
          times.forEach(time => {
            const timeSlot = getTimeSlot(time)
            // Filter by time slot
            if (departureTimeSlots.includes(timeSlot)) {
              entry.outboundFlights.push({
                flightNumber: route.flightNumber,
                airline: route.airline,
                time,
                day,
                timeSlot,
                originCity,
                originCode
              })
            }
          })
        }
      })
    })

    // Process return flights (if roundtrip)
    if (tripType === 'roundtrip') {
      // Find return flights from destinations back to origins
      // Filter by selected airlines for return flights too - use normalized names
      const returnScheduleData = selectedAirlines.length > 0
        ? scheduleData.filter(route => {
            const normalizedAirline = normalizeAirlineName(route.airline)
            return selectedAirlines.includes(normalizedAirline)
          })
        : scheduleData
      
      returnScheduleData.forEach(route => {
        // Check if this route's origin is one of our destinations
        const routeOrigin = route.airport
        
        destinationMap.forEach((entry, destName) => {
          // Check if route origin matches destination
          const normalizedRouteOrigin = normalizeString(routeOrigin)
          const normalizedDest = normalizeString(destName)
          
          if (normalizedRouteOrigin.includes(normalizedDest) || normalizedDest.includes(normalizedRouteOrigin)) {
            // Check if route destination is one of our origins
            const routeDestination = route.destination
            const isReturnToOrigin = selectedOrigins.some(originCode => {
              const originCity = getCityName(originCode)
              const normalizedRouteDest = normalizeString(routeDestination)
              const normalizedOrigin = normalizeString(originCity)
              return normalizedRouteDest.includes(normalizedOrigin) || normalizedOrigin.includes(normalizedRouteDest)
            })
            
            if (isReturnToOrigin) {
              // Find the destination city (where we're returning to)
              const returnDestCity = routeDestination
              const returnDestAirport = MAJOR_AIRPORTS.find(a => 
                normalizeString(getCityName(a.code)).includes(normalizeString(returnDestCity)) ||
                normalizeString(returnDestCity).includes(normalizeString(getCityName(a.code)))
              )
              const returnDestCode = returnDestAirport?.code || ''
              
              // Check each return day
              returnDays.forEach(day => {
                if (route.weeklyPattern[day]) {
                  const times = route.scheduledTimes?.[day] || ['--:--']
                  times.forEach(time => {
                    const timeSlot = getTimeSlot(time)
                    // Filter by time slot
                    if (returnTimeSlots.includes(timeSlot)) {
                      entry.returnFlights.push({
                        flightNumber: route.flightNumber,
                        airline: route.airline,
                        time,
                        day,
                        timeSlot,
                        originCity: destName,  // Flying from destination
                        originCode: returnDestCode  // Returning to this code
                      })
                    }
                  })
                }
              })
            }
          }
        })
      })
    }

    // Build results
    const searchResults: FlightResult[] = []
    
    destinationMap.forEach((entry, destName) => {
      // For roundtrip, require both outbound AND return flights
      // For oneway, only require outbound flights
      const hasOutbound = entry.outboundFlights.length > 0
      const hasReturn = tripType === 'oneway' || entry.returnFlights.length > 0
      
      if (hasOutbound && hasReturn) {
        // Normalize flight number for comparison (remove spaces)
        const normalizeFlightNumber = (fn: string) => fn?.replace(/\s+/g, '').toUpperCase() || ''
        
        // Deduplicate flights
        const uniqueOutbound = entry.outboundFlights.filter((f, i, arr) => 
          arr.findIndex(x => normalizeFlightNumber(x.flightNumber) === normalizeFlightNumber(f.flightNumber) && x.day === f.day && x.time === f.time) === i
        )
        const uniqueReturn = entry.returnFlights.filter((f, i, arr) => 
          arr.findIndex(x => normalizeFlightNumber(x.flightNumber) === normalizeFlightNumber(f.flightNumber) && x.day === f.day && x.time === f.time) === i
        )
        
        // Get unique airlines (normalized)
        const airlines = [...new Set([
          ...uniqueOutbound.map(f => normalizeAirlineName(f.airline)),
          ...uniqueReturn.map(f => normalizeAirlineName(f.airline))
        ])].filter(a => a && isValidAirline(a))
        
        // Calculate match score (higher = better match)
        const outboundCount = uniqueOutbound.length
        const returnCount = uniqueReturn.length
        
        const isStableRoute = entry.routes.some(r => r.frequency >= 4)
        const matchScore = (outboundCount + returnCount) * (isStableRoute ? 1.5 : 1) * (airlines.length > 1 ? 1.2 : 1)
        
        // Get destination code - first try city mapping, then MAJOR_AIRPORTS
        const cityCode = getCityIataCode(destName)
        const destAirport = MAJOR_AIRPORTS.find(a => 
          normalizeString(getCityName(a.code)).includes(normalizeString(destName)) ||
          normalizeString(destName).includes(normalizeString(getCityName(a.code)))
        )
        
        searchResults.push({
          destination: getCityNameFromCode(destName),
          destinationCode: cityCode || destAirport?.code || destName,
          outboundFlights: uniqueOutbound.sort((a, b) => a.time.localeCompare(b.time)),
          returnFlights: uniqueReturn.sort((a, b) => a.time.localeCompare(b.time)),
          outboundCount,
          returnCount,
          airlines,
          isStableRoute,
          matchScore
        })
      }
    })
    
    // Sort results
    searchResults.sort((a, b) => {
      if (sortBy === 'combinations') return (b.outboundCount + b.returnCount) - (a.outboundCount + a.returnCount)
      if (sortBy === 'score') return b.matchScore - a.matchScore
      return a.destination.localeCompare(b.destination)
    })
    
    setResults(searchResults)
    setSearching(false)
  }, [filteredByOrigins, scheduleData, selectedOrigins, departureDays, returnDays, 
      departureTimeSlots, returnTimeSlots, tripType, sortBy, selectedAirlines])

  // Auto-search when criteria change
  useEffect(() => {
    if (mounted && !loading && scheduleData.length > 0) {
      performSearch()
    }
  }, [mounted, loading, scheduleData, performSearch])

  // Toggle day selection
  const toggleDay = (type: 'departure' | 'return', day: DayOfWeek) => {
    if (type === 'departure') {
      setDepartureDays(prev => {
        if (prev.includes(day)) {
          return prev.length > 1 ? prev.filter(d => d !== day) : prev
        }
        return [...prev, day]
      })
      // Reset airline selection when departure days change
      setSelectedAirlines([])
    } else {
      setReturnDays(prev => {
        if (prev.includes(day)) {
          return prev.length > 1 ? prev.filter(d => d !== day) : prev
        }
        return [...prev, day]
      })
    }
  }

  // Toggle time slot
  const toggleTimeSlot = (type: 'departure' | 'return', slot: TimeSlot) => {
    if (type === 'departure') {
      setDepartureTimeSlots(prev => {
        if (prev.includes(slot)) {
          return prev.length > 1 ? prev.filter(s => s !== slot) : prev
        }
        return [...prev, slot]
      })
    } else {
      setReturnTimeSlots(prev => {
        if (prev.includes(slot)) {
          return prev.length > 1 ? prev.filter(s => s !== slot) : prev
        }
        return [...prev, slot]
      })
    }
  }

  // Toggle origin airport
  const toggleOrigin = (code: string) => {
    setSelectedOrigins(prev => {
      if (prev.includes(code)) {
        return prev.length > 1 ? prev.filter(c => c !== code) : prev
      }
      return [...prev, code]
    })
    // Reset airline selection when origins change
    setSelectedAirlines([])
  }

  // Toggle result expansion
  const toggleExpanded = (dest: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev)
      if (next.has(dest)) {
        next.delete(dest)
      } else {
        next.add(dest)
      }
      return next
    })
  }

  // Toggle airline selection
  const toggleAirline = (airline: string) => {
    setSelectedAirlines(prev => {
      if (prev.includes(airline)) {
        return prev.filter(a => a !== airline)
      }
      return [...prev, airline]
    })
  }

  // Select outbound flight
  const selectOutboundFlight = (flight: ProcessedFlight, destination: string, destinationCode: string) => {
    setSelectedOutboundFlight(prev => {
      // If same flight clicked, deselect
      if (prev && prev.flight.flightNumber === flight.flightNumber && prev.flight.day === flight.day && prev.flight.time === flight.time) {
        return null
      }
      return { flight, type: 'outbound', destination, destinationCode }
    })
  }

  // Select return flight
  const selectReturnFlight = (flight: ProcessedFlight, destination: string, destinationCode: string) => {
    setSelectedReturnFlight(prev => {
      // If same flight clicked, deselect
      if (prev && prev.flight.flightNumber === flight.flightNumber && prev.flight.day === flight.day && prev.flight.time === flight.time) {
        return null
      }
      return { flight, type: 'return', destination, destinationCode }
    })
  }

  // Check if search button should be shown
  const canSearchZbor = tripType === 'oneway' 
    ? selectedOutboundFlight !== null 
    : selectedOutboundFlight !== null && selectedReturnFlight !== null

  // Get next date for a specific day of week
  const getNextDateForDay = (day: DayOfWeek): Date => {
    const dayMap: Record<DayOfWeek, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    const today = new Date()
    const targetDay = dayMap[day]
    const currentDay = today.getDay()
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7 // Next week if today or past
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysUntil)
    return nextDate
  }

  // Format date for zbor.md URL (YYYY-MM-DD)
  const formatDateForUrl = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
  }

  // Format date for display in Romanian format (DD luna YYYY or DD luna)
  const formatDateRomanian = (date: Date, includeYear: boolean = false): string => {
    const MONTH_NAMES_SHORT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const day = date.getDate()
    const month = MONTH_NAMES_SHORT[date.getMonth()]
    if (includeYear) {
      return `${day} ${month} ${date.getFullYear()}`
    }
    return `${day} ${month}`
  }

  // Generate zbor.md search URL with modal data
  // Format: https://www.zbor.md/search/RMO/LON/2026-01-17/2026-02-13?passengers=1_0_0&cabinclass=economy
  const generateZborUrl = (): string => {
    if (!selectedOutboundFlight || !bookingModal.departureDate) return ''
    
    const originCode = selectedOutboundFlight.flight.originCode || selectedOrigins[0] || 'RMO'
    const destCode = selectedOutboundFlight.destinationCode || ''
    const departureDate = formatDateForUrl(bookingModal.departureDate)
    const { adults, children, infants } = bookingModal.passengers
    
    // Build URL: /search/ORIGIN/DEST/DEPARTURE_DATE/RETURN_DATE?passengers=A_C_I&cabinclass=economy
    let url = `https://www.zbor.md/search/${originCode}/${destCode}/${departureDate}`
    
    // Add return date for roundtrip
    if (tripType === 'roundtrip' && bookingModal.returnDate) {
      const returnDate = formatDateForUrl(bookingModal.returnDate)
      url += `/${returnDate}`
    }
    
    // Add passengers and cabin class
    url += `?passengers=${adults}_${children}_${infants}&cabinclass=economy`
    
    return url
  }

  // Open booking modal
  const openBookingModal = () => {
    if (!selectedOutboundFlight) return
    
    const suggestedDepartureDate = getNextDateForDay(selectedOutboundFlight.flight.day)
    const suggestedReturnDate = selectedReturnFlight 
      ? getNextDateForDay(selectedReturnFlight.flight.day)
      : null
    
    // Ensure return date is after departure date
    let finalReturnDate = suggestedReturnDate
    if (finalReturnDate && finalReturnDate <= suggestedDepartureDate) {
      finalReturnDate = new Date(suggestedDepartureDate)
      finalReturnDate.setDate(finalReturnDate.getDate() + 7)
    }
    
    setBookingModal({
      isOpen: true,
      step: 'departure',
      departureDate: suggestedDepartureDate,
      returnDate: finalReturnDate,
      passengers: { adults: 1, children: 0, infants: 0 }
    })
    setCalendarMonth(suggestedDepartureDate)
  }

  // Close booking modal
  const closeBookingModal = () => {
    setBookingModal(prev => ({ ...prev, isOpen: false }))
  }

  // Handle final search
  const handleSearchZbor = () => {
    const url = generateZborUrl()
    if (url) {
      window.open(url, '_blank')
      closeBookingModal()
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    // Convert Sunday=0 to Monday=0 format
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const isSameDay = (date1: Date | null, date2: Date): boolean => {
    if (!date1) return false
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  }

  const isDateInPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDayOfWeekMatch = (date: Date, day: DayOfWeek): boolean => {
    const dayMap: Record<DayOfWeek, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    return date.getDay() === dayMap[day]
  }

  // Check if date matches any of the selected days from filter
  const isDateInSelectedDays = (date: Date, days: DayOfWeek[]): boolean => {
    const dayMap: Record<DayOfWeek, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    const dateDay = date.getDay()
    return days.some(day => dayMap[day] === dateDay)
  }

  // Get highlighted days from filter (departureDays or returnDays)
  const getHighlightedDays = (): DayOfWeek[] => {
    if (bookingModal.step === 'departure') {
      return departureDays
    }
    if (bookingModal.step === 'return') {
      return returnDays
    }
    return []
  }

  // Update passenger count
  const updatePassengers = (type: 'adults' | 'children' | 'infants', delta: number) => {
    setBookingModal(prev => {
      const newCount = Math.max(type === 'adults' ? 1 : 0, prev.passengers[type] + delta)
      const maxCount = type === 'infants' ? prev.passengers.adults : 9
      return {
        ...prev,
        passengers: {
          ...prev.passengers,
          [type]: Math.min(newCount, maxCount)
        }
      }
    })
  }

  // Select date in calendar
  const selectDate = (date: Date) => {
    if (isDateInPast(date)) return
    
    if (bookingModal.step === 'departure') {
      setBookingModal(prev => {
        // If return date is before new departure, adjust it
        let newReturnDate = prev.returnDate
        if (newReturnDate && newReturnDate <= date) {
          newReturnDate = new Date(date)
          newReturnDate.setDate(newReturnDate.getDate() + 1)
        }
        return {
          ...prev,
          departureDate: date,
          returnDate: newReturnDate,
          step: tripType === 'roundtrip' ? 'return' : 'passengers'
        }
      })
      if (tripType === 'roundtrip') {
        setCalendarMonth(date)
      }
    } else if (bookingModal.step === 'return') {
      if (bookingModal.departureDate && date <= bookingModal.departureDate) return
      setBookingModal(prev => ({
        ...prev,
        returnDate: date,
        step: 'passengers'
      }))
    }
  }

  // Navigate calendar month
  const navigateMonth = (delta: number) => {
    setCalendarMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + delta)
      return newDate
    })
  }

  // Clear flight selections when destination changes
  const clearFlightSelections = () => {
    setSelectedOutboundFlight(null)
    setSelectedReturnFlight(null)
  }

  // Romanian month names
  const MONTH_NAMES = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                       'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
  const DAY_NAMES_SHORT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-blue-200 rounded-full" />
            <div className="absolute top-0 left-0 h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-gray-600 font-medium">Se încarcă FlyFinder...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">FlyFinder | Colibri24.com</h1>
            </div>
            <p className="text-blue-100 text-sm md:text-base max-w-2xl mx-auto">
              Asistentul inteligent de călătorie. Selectează zilele, intervalele orare și găsește destinațiile perfecte.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Panel */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 -mt-6 relative z-10 overflow-hidden">
          {/* Trip Type Toggle */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTripType('roundtrip')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
                tripType === 'roundtrip' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ArrowRight className="h-4 w-4" />
                <span>Dus-Întors</span>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </div>
            </button>
            <button
              onClick={() => setTripType('oneway')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
                tripType === 'oneway' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ArrowRight className="h-4 w-4" />
                <span>Doar Dus</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Origin Airports Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                De unde pleci? (selectează unul sau mai multe aeroporturi)
              </label>
              <div className="flex flex-wrap gap-2">
                {originAirports.map(airport => (
                  <button
                    key={airport.code}
                    onClick={() => toggleOrigin(airport.code)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedOrigins.includes(airport.code)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCityName(airport.code)}
                    <span className="ml-1 opacity-70">({airport.code})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Days and Time Slots Grid */}
            <div className={`grid gap-6 ${tripType === 'roundtrip' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
              {/* Departure Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Plane className="h-5 w-5 mr-2 rotate-45" />
                  Plecare
                </h3>
                
                {/* Days */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-blue-700 mb-2 block">Zilele săptămânii:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay('departure', day.value)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                          departureDays.includes(day.value)
                            ? 'bg-blue-600 text-white shadow-md scale-105'
                            : 'bg-white text-gray-600 hover:bg-blue-100 border border-gray-200'
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Time Slots */}
                <div>
                  <label className="text-xs font-medium text-blue-700 mb-2 block">Interval orar:</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot.value}
                        onClick={() => toggleTimeSlot('departure', slot.value)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          departureTimeSlots.includes(slot.value)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-blue-100 border border-gray-200'
                        }`}
                      >
                        {slot.icon}
                        <span>{slot.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-blue-600 bg-blue-100/50 rounded-lg px-3 py-2">
                  • {departureDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ')} • {departureTimeSlots.map(s => TIME_SLOTS.find(x => x.value === s)?.label).join(', ')}
                </div>
              </div>

              {/* Return Section */}
              {tripType === 'roundtrip' && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                    <Plane className="h-5 w-5 mr-2 -rotate-45" />
                    Întoarcere
                  </h3>
                  
                  {/* Days */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-green-700 mb-2 block">Zilele săptămânii:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day.value}
                          onClick={() => toggleDay('return', day.value)}
                          className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                            returnDays.includes(day.value)
                              ? 'bg-green-600 text-white shadow-md scale-105'
                              : 'bg-white text-gray-600 hover:bg-green-100 border border-gray-200'
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Time Slots */}
                  <div>
                    <label className="text-xs font-medium text-green-700 mb-2 block">Interval orar:</label>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot.value}
                          onClick={() => toggleTimeSlot('return', slot.value)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            returnTimeSlots.includes(slot.value)
                              ? 'bg-green-600 text-white shadow-md'
                              : 'bg-white text-gray-600 hover:bg-green-100 border border-gray-200'
                          }`}
                        >
                          {slot.icon}
                          <span>{slot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-green-600 bg-green-100/50 rounded-lg px-3 py-2">
                    • {returnDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ')} • {returnTimeSlots.map(s => TIME_SLOTS.find(x => x.value === s)?.label).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Airline Filter - moved after days selection */}
            <div className="mt-6">
              <button
                onClick={() => setShowAirlineFilter(!showAirlineFilter)}
                className="flex items-center text-sm font-semibold text-gray-700 mb-3 hover:text-purple-600 transition-colors"
              >
                <Plane className="h-4 w-4 mr-2 text-purple-500" />
                Filtrează după companie aeriană
                {selectedAirlines.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {selectedAirlines.length} selectate
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAirlineFilter ? 'rotate-180' : ''}`} />
              </button>
              
              {showAirlineFilter && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => setSelectedAirlines([])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedAirlines.length === 0
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-purple-100 border border-gray-200'
                      }`}
                    >
                      Toate companiile
                    </button>
                    {availableAirlines.map(airline => {
                      const iataCode = getAirlineIataCode(airline)
                      return (
                        <button
                          key={airline}
                          onClick={() => toggleAirline(airline)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                            selectedAirlines.includes(airline)
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white text-gray-600 hover:bg-purple-100 border border-gray-200'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedAirlines.includes(airline)
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-500 text-white'
                          }`}>
                            {iataCode}
                          </span>
                          <span>{airline}</span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedAirlines.length > 0 && (
                    <div className="text-xs text-purple-600 bg-purple-100/50 rounded-lg px-3 py-2">
                      • Filtru activ: {selectedAirlines.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Summary Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  <span className="font-medium">{selectedOrigins.map(c => getCityName(c)).join(', ')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  <span className="font-medium">{results.length} destinații găsite</span>
                </div>
                {tripType === 'roundtrip' && (
                  <div className="flex items-center bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    <span className="font-medium">{results.reduce((sum, r) => sum + r.outboundCount, 0)} plecări</span>
                  </div>
                )}
                {selectedAirlines.length > 0 && (
                  <div className="flex items-center bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
                    <Plane className="h-3.5 w-3.5 mr-1.5" />
                    <span className="font-medium">{selectedAirlines.length} companii</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Group by Country Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Vizualizare:</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setGroupByCountry(false)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        !groupByCountry 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Lista completă"
                    >
                      <List className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Listă</span>
                    </button>
                    <button
                      onClick={() => setGroupByCountry(true)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        groupByCountry 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Grupat pe țări"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Pe țări</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Sortare:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="combinations">Nr. combinații</option>
                    <option value="score">Scor potrivire</option>
                    <option value="alphabetical">Alfabetic</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Destination Search */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={destinationSearch}
              onChange={(e) => handleDestinationSearchChange(e.target.value)}
              placeholder="Caută destinația (ex: Londra, Paris, Milano, Padova...)"
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
            {destinationSearch && (
              <button
                onClick={() => {
                  setDestinationSearch('')
                  setShowProximityResults(false)
                  clearProximityResult()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Proximity Search Results */}
          {showProximityResults && (
            <ProximitySearchResults
              result={enrichedProximityResult}
              isSearching={isProximitySearching}
              isCalculatingRoutes={isCalculatingRoutes}
              error={proximityError}
              onSelectDestination={handleProximitySelect}
            />
          )}
        </div>

        {/* Results Section */}
        <div className="mt-6">
          {loading || searching ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-12 w-12 border-4 border-blue-200 rounded-full" />
                  <div className="absolute top-0 left-0 h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">Căutăm destinațiile perfecte...</p>
                <p className="text-sm text-gray-400 mt-1">Analizăm programul săptămânal</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Info className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nu am găsit destinații</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Pentru criteriile selectate nu există destinații cu zboruri {tripType === 'roundtrip' ? 'dus-întors' : ''}.
                Încearcă să modifici zilele sau intervalele orare.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => {
                    setDepartureDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
                    setReturnDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Selectează toate zilele
                </button>
                <button
                  onClick={() => {
                    setDepartureTimeSlots(['morning', 'afternoon', 'evening'])
                    setReturnTimeSlots(['morning', 'afternoon', 'evening'])
                  }}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Toate intervalele orare
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Grouped by Country View */}
              {groupByCountry ? (
                <div className="space-y-6">
                  {(() => {
                    // Filter results first
                    const filteredResults = results.filter(result => {
                      if (!destinationSearch) return true
                      const searchLower = normalizeString(destinationSearch)
                      const destLower = normalizeString(result.destination)
                      const codeLower = normalizeString(result.destinationCode)
                      return destLower.includes(searchLower) || codeLower.includes(searchLower)
                    })
                    
                    // Group by country
                    const groupedByCountry = filteredResults.reduce((acc, result) => {
                      const country = getCountryForDestination(result.destinationCode, result.destination)
                      if (!acc[country]) {
                        acc[country] = []
                      }
                      acc[country].push(result)
                      return acc
                    }, {} as Record<string, FlightResult[]>)
                    
                    // Sort countries by total combinations (descending), but put "Alte destinații" last
                    const sortedCountries = Object.keys(groupedByCountry).sort((a, b) => {
                      if (a === 'Alte destinații') return 1
                      if (b === 'Alte destinații') return -1
                      const totalA = groupedByCountry[a].reduce((sum, r) => sum + r.outboundCount, 0)
                      const totalB = groupedByCountry[b].reduce((sum, r) => sum + r.outboundCount, 0)
                      return totalB - totalA
                    })
                    
                    return sortedCountries.map(country => (
                      <div key={country} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Country Header - Clickable to expand/collapse */}
                        <button
                          onClick={() => {
                            setExpandedCountries(prev => {
                              const next = new Set(prev)
                              if (next.has(country)) {
                                next.delete(country)
                              } else {
                                next.add(country)
                              }
                              return next
                            })
                          }}
                          className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 hover:from-indigo-100 hover:to-blue-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Globe className="h-4 w-4 text-white" />
                              </div>
                              <h3 className="text-base font-bold text-gray-900">{country}</h3>
                              <span className="text-sm text-gray-500">— {groupedByCountry[country].length} {groupedByCountry[country].length === 1 ? 'destinație disponibilă' : 'destinații disponibile'}</span>
                            </div>
                            {expandedCountries.has(country) ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Destinations in this country - vertical list */}
                        {expandedCountries.has(country) && (
                        <div className="divide-y divide-gray-100">
                          {groupedByCountry[country].map((result) => (
                            <div key={result.destination} id={`destination-${result.destinationCode}`}>
                              <button
                                onClick={() => toggleExpanded(result.destination)}
                                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                      {result.destinationCode}
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900">{result.destination}</h4>
                                        {result.isStableRoute && (
                                          <Star className="h-4 w-4 text-amber-500 fill-current" />
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-500">
                                        <span>{result.airlines.slice(0, 2).join(', ')}{result.airlines.length > 2 ? '...' : ''}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                      <div className="text-sm text-blue-600">
                                        <span className="font-bold">Plecare</span> <span className="text-blue-400 font-normal">- {result.outboundCount} opțiuni</span>
                                        {tripType === 'roundtrip' && (
                                          <> / <span className="font-bold">Întoarcere</span> <span className="text-blue-400 font-normal">- {result.returnCount} opțiuni</span></>
                                        )}
                                      </div>
                                    </div>
                                    {expandedResults.has(result.destination) ? (
                                      <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </button>
                              
                              {/* Expanded Details - same as list view */}
                              {expandedResults.has(result.destination) && (
                                <div className="border-t border-gray-100 bg-gray-50 p-5">
                                  <div className={`grid gap-6 ${tripType === 'roundtrip' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                                    {/* Outbound Flights */}
                                    <div>
                                      {(() => {
                                        const originCities = [...new Set(result.outboundFlights.map(f => f.originCity).filter(Boolean))]
                                        const originDisplay = originCities.length === 1 
                                          ? `din ${originCities[0]}` 
                                          : originCities.length > 1 
                                            ? `din ${originCities.slice(0, 2).join(', ')}${originCities.length > 2 ? '...' : ''}`
                                            : ''
                                        return (
                                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center flex-wrap">
                                            <Plane className="h-4 w-4 mr-2 rotate-45" />
                                            <span>Zboruri de plecare {originDisplay}</span>
                                            <span className="ml-1 text-blue-600">({result.outboundFlights.length})</span>
                                          </h4>
                                        )
                                      })()}
                                      <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {(() => {
                                          const groupedFlights = result.outboundFlights.reduce((acc, flight) => {
                                            const key = `${flight.flightNumber?.replace(/\s+/g, '')}_${flight.time}_${flight.originCity || ''}`
                                            if (!acc[key]) {
                                              acc[key] = { ...flight, days: [flight.day] }
                                            } else {
                                              if (!acc[key].days.includes(flight.day)) {
                                                acc[key].days.push(flight.day)
                                              }
                                            }
                                            return acc
                                          }, {} as Record<string, ProcessedFlight & { days: DayOfWeek[] }>)
                                          
                                          const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                          
                                          return Object.values(groupedFlights)
                                            .sort((a, b) => a.time.localeCompare(b.time))
                                            .map((flight, idx) => {
                                              const sortedDays = flight.days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                                              const daysDisplay = sortedDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ')
                                              
                                              const isSelected = selectedOutboundFlight && 
                                                selectedOutboundFlight.flight.flightNumber?.replace(/\s+/g, '') === flight.flightNumber?.replace(/\s+/g, '') &&
                                                selectedOutboundFlight.flight.time === flight.time &&
                                                selectedOutboundFlight.destination === result.destination
                                              
                                              const flightForSelection: ProcessedFlight = {
                                                ...flight,
                                                day: sortedDays[0],
                                                originCode: flight.originCode || selectedOrigins[0],
                                                destinationCode: result.destinationCode
                                              }
                                              
                                              return (
                                                <button
                                                  key={`out-${idx}`}
                                                  onClick={() => selectOutboundFlight(flightForSelection, result.destination, result.destinationCode)}
                                                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                    isSelected 
                                                      ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' 
                                                      : 'bg-white border-blue-100 hover:bg-blue-50 hover:border-blue-300'
                                                  }`}
                                                >
                                                  <div className="flex items-center space-x-3">
                                                    {isSelected ? (
                                                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-white" />
                                                      </div>
                                                    ) : (
                                                      <AirlineLogo 
                                                        airlineCode={extractAirlineCode(flight.flightNumber)} 
                                                        airlineName={flight.airline || 'Unknown'}
                                                        size="sm"
                                                      />
                                                    )}
                                                    <div className="text-left">
                                                      <div className="font-semibold text-gray-900">{normalizeFlightNumber(flight.flightNumber)}</div>
                                                      <div className="text-xs text-gray-500">{flight.airline}</div>
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <div className="font-bold text-blue-600">{flight.time}</div>
                                                    <div className="text-xs text-gray-500">
                                                      {daysDisplay}
                                                      {flight.originCity && <span className="ml-1">• din {flight.originCity}</span>}
                                                    </div>
                                                  </div>
                                                </button>
                                              )
                                            })
                                        })()}
                                      </div>
                                    </div>

                                    {/* Return Flights */}
                                    {tripType === 'roundtrip' && (
                                      <div>
                                        {(() => {
                                          const returnToCities = selectedOrigins.map(code => getCityName(code))
                                          const returnDisplay = returnToCities.length === 1 
                                            ? `spre ${returnToCities[0]}` 
                                            : returnToCities.length > 1 
                                              ? `spre ${returnToCities.slice(0, 2).join(', ')}${returnToCities.length > 2 ? '...' : ''}`
                                              : ''
                                          return (
                                            <h4 className="font-semibold text-green-900 mb-3 flex items-center flex-wrap">
                                              <Plane className="h-4 w-4 mr-2 -rotate-45" />
                                              <span>Zboruri de întoarcere {returnDisplay}</span>
                                              <span className="ml-1 text-green-600">({result.returnFlights.length})</span>
                                            </h4>
                                          )
                                        })()}
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                          {result.returnFlights.length > 0 ? (
                                            (() => {
                                              const groupedFlights = result.returnFlights.reduce((acc, flight) => {
                                                const key = `${flight.flightNumber?.replace(/\s+/g, '')}_${flight.time}_${flight.originCode || ''}`
                                                if (!acc[key]) {
                                                  acc[key] = { ...flight, days: [flight.day] }
                                                } else {
                                                  if (!acc[key].days.includes(flight.day)) {
                                                    acc[key].days.push(flight.day)
                                                  }
                                                }
                                                return acc
                                              }, {} as Record<string, ProcessedFlight & { days: DayOfWeek[] }>)
                                              
                                              const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                              
                                              return Object.values(groupedFlights)
                                                .sort((a, b) => a.time.localeCompare(b.time))
                                                .map((flight, idx) => {
                                                  const sortedDays = flight.days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                                                  const daysDisplay = sortedDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ')
                                                  
                                                  const isSelected = selectedReturnFlight && 
                                                    selectedReturnFlight.flight.flightNumber?.replace(/\s+/g, '') === flight.flightNumber?.replace(/\s+/g, '') &&
                                                    selectedReturnFlight.flight.time === flight.time &&
                                                    selectedReturnFlight.destination === result.destination
                                                  
                                                  const flightForSelection: ProcessedFlight = {
                                                    ...flight,
                                                    day: sortedDays[0],
                                                    originCode: flight.originCode || selectedOrigins[0],
                                                    destinationCode: result.destinationCode
                                                  }
                                                  
                                                  return (
                                                    <button
                                                      key={`ret-${idx}`}
                                                      onClick={() => selectReturnFlight(flightForSelection, result.destination, result.destinationCode)}
                                                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                        isSelected 
                                                          ? 'bg-green-100 border-green-500 ring-2 ring-green-300' 
                                                          : 'bg-white border-green-100 hover:bg-green-50 hover:border-green-300'
                                                      }`}
                                                    >
                                                      <div className="flex items-center space-x-3">
                                                        {isSelected ? (
                                                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                            <Check className="h-4 w-4 text-white" />
                                                          </div>
                                                        ) : (
                                                          <AirlineLogo 
                                                            airlineCode={extractAirlineCode(flight.flightNumber)} 
                                                            airlineName={flight.airline || 'Unknown'}
                                                            size="sm"
                                                          />
                                                        )}
                                                        <div className="text-left">
                                                          <div className="font-semibold text-gray-900">{normalizeFlightNumber(flight.flightNumber)}</div>
                                                          <div className="text-xs text-gray-500">{flight.airline}</div>
                                                        </div>
                                                      </div>
                                                      <div className="text-right">
                                                        <div className="font-bold text-green-600">{flight.time}</div>
                                                        <div className="text-xs text-gray-500">
                                                          {daysDisplay}
                                                          {flight.originCode && <span className="ml-1">spre {getCityName(flight.originCode) || flight.originCode}</span>}
                                                        </div>
                                                      </div>
                                                    </button>
                                                  )
                                                })
                                            })()
                                          ) : (
                                            <div className="text-center py-6 text-gray-500">
                                              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                              <p className="text-sm">Nu sunt zboruri de întoarcere pentru zilele selectate</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Bar */}
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                      <div className="text-sm text-gray-600">
                                        {tripType === 'roundtrip' ? (
                                          <span>
                                            <strong>{result.outboundFlights.length}</strong> plecări / <strong>{result.returnFlights.length}</strong> întoarceri
                                          </span>
                                        ) : (
                                          <span><strong className="text-blue-600">{result.outboundFlights.length}</strong> zboruri disponibile</span>
                                        )}
                                      </div>
                                      
                                      {((tripType === 'oneway' && selectedOutboundFlight?.destination === result.destination) ||
                                        (tripType === 'roundtrip' && selectedOutboundFlight?.destination === result.destination && selectedReturnFlight?.destination === result.destination)) && (
                                        <button
                                          onClick={openBookingModal}
                                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all"
                                        >
                                          <Search className="h-4 w-4" />
                                          <span>Caută oferte de zbor</span>
                                          <ExternalLink className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                    
                                    {(selectedOutboundFlight?.destination === result.destination || selectedReturnFlight?.destination === result.destination) && (
                                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
                                        <div className="text-xs font-medium text-gray-700 mb-2">Selecție curentă:</div>
                                        <div className="flex flex-wrap gap-2">
                                          {selectedOutboundFlight?.destination === result.destination && (
                                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm">
                                              <Plane className="h-3.5 w-3.5 rotate-45" />
                                              <span>Plecare: {normalizeFlightNumber(selectedOutboundFlight.flight.flightNumber)} • {selectedOutboundFlight.flight.time} • {DAYS_OF_WEEK.find(d => d.value === selectedOutboundFlight.flight.day)?.label}</span>
                                            </div>
                                          )}
                                          {tripType === 'roundtrip' && selectedReturnFlight?.destination === result.destination && (
                                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
                                              <Plane className="h-3.5 w-3.5 -rotate-45" />
                                              <span>Întoarcere: {normalizeFlightNumber(selectedReturnFlight.flight.flightNumber)} • {selectedReturnFlight.flight.time} • {DAYS_OF_WEEK.find(d => d.value === selectedReturnFlight.flight.day)?.label}</span>
                                            </div>
                                          )}
                                        </div>
                                        {tripType === 'roundtrip' && selectedOutboundFlight?.destination === result.destination && !selectedReturnFlight && (
                                          <div className="mt-2 text-xs text-amber-600 flex items-center">
                                            <Info className="h-3.5 w-3.5 mr-1" />
                                            Selectează și un zbor de întoarcere pentru a căuta oferte
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                /* List View - Original */
                <div className="space-y-4">
                  {results
                    .filter(result => {
                      if (!destinationSearch) return true
                      const searchLower = normalizeString(destinationSearch)
                      const destLower = normalizeString(result.destination)
                      const codeLower = normalizeString(result.destinationCode)
                      return destLower.includes(searchLower) || codeLower.includes(searchLower)
                    })
                    .map((result) => (
                    <div
                      key={result.destination}
                      id={`destination-${result.destinationCode}`}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Result Header */}
                      <button
                        onClick={() => toggleExpanded(result.destination)}
                        className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              {result.destinationCode}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {result.destination}
                                  <span className="ml-2 text-sm font-normal text-gray-500">({result.destinationCode})</span>
                                </h3>
                                {result.isStableRoute && (
                                  <span className="flex items-center text-amber-500" title="Rută stabilă">
                                    <Star className="h-4 w-4 fill-current" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Plane className="h-3.5 w-3.5 mr-1 text-blue-500" />
                                  {result.outboundFlights.length} plecare
                                </span>
                                {tripType === 'roundtrip' && (
                                  <span className="flex items-center">
                                    <Plane className="h-3.5 w-3.5 mr-1 text-green-500 rotate-180" />
                                    {result.returnFlights.length} întoarcere
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Users className="h-3.5 w-3.5 mr-1 text-purple-500" />
                                  {result.airlines.slice(0, 2).join(', ')}{result.airlines.length > 2 ? ` +${result.airlines.length - 2}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-base text-blue-600">
                                <span className="font-bold">Plecare</span> <span className="text-blue-400 font-normal">- {result.outboundCount} opțiuni</span>
                                  {tripType === 'roundtrip' && (
                                    <> / <span className="font-bold">Întoarcere</span> <span className="text-blue-400 font-normal">- {result.returnCount} opțiuni</span></>
                                  )}
                              </div>
                            </div>
                            {expandedResults.has(result.destination) ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedResults.has(result.destination) && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <div className={`grid gap-6 ${tripType === 'roundtrip' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                        {/* Outbound Flights */}
                        <div>
                          {(() => {
                            // Get unique origin cities from outbound flights
                            const originCities = [...new Set(result.outboundFlights.map(f => f.originCity).filter(Boolean))]
                            const originDisplay = originCities.length === 1 
                              ? `din ${originCities[0]}` 
                              : originCities.length > 1 
                                ? `din ${originCities.slice(0, 2).join(', ')}${originCities.length > 2 ? '...' : ''}`
                                : ''
                            return (
                              <h4 className="font-semibold text-blue-900 mb-3 flex items-center flex-wrap">
                                <Plane className="h-4 w-4 mr-2 rotate-45" />
                                <span>Zboruri de plecare {originDisplay}</span>
                                <span className="ml-1 text-blue-600">({result.outboundFlights.length})</span>
                              </h4>
                            )
                          })()}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(() => {
                              // Group flights by flightNumber + time + originCity
                              const groupedFlights = result.outboundFlights.reduce((acc, flight) => {
                                const key = `${flight.flightNumber?.replace(/\s+/g, '')}_${flight.time}_${flight.originCity || ''}`
                                if (!acc[key]) {
                                  acc[key] = { ...flight, days: [flight.day] }
                                } else {
                                  if (!acc[key].days.includes(flight.day)) {
                                    acc[key].days.push(flight.day)
                                  }
                                }
                                return acc
                              }, {} as Record<string, ProcessedFlight & { days: DayOfWeek[] }>)
                              
                              // Sort days in correct order
                              const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                              
                              return Object.values(groupedFlights)
                                .sort((a, b) => a.time.localeCompare(b.time))
                                .map((flight, idx) => {
                                  const sortedDays = flight.days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                                  const daysDisplay = sortedDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ')
                                  
                                  // Check if this flight is selected
                                  const isSelected = selectedOutboundFlight && 
                                    selectedOutboundFlight.flight.flightNumber?.replace(/\s+/g, '') === flight.flightNumber?.replace(/\s+/g, '') &&
                                    selectedOutboundFlight.flight.time === flight.time &&
                                    selectedOutboundFlight.destination === result.destination
                                  
                                  // Create a flight object with the first day for selection
                                  const flightForSelection: ProcessedFlight = {
                                    ...flight,
                                    day: sortedDays[0],
                                    originCode: flight.originCode || selectedOrigins[0],
                                    destinationCode: result.destinationCode
                                  }
                                  
                                  return (
                                    <button
                                      key={`out-${idx}`}
                                      onClick={() => selectOutboundFlight(flightForSelection, result.destination, result.destinationCode)}
                                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        isSelected 
                                          ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' 
                                          : 'bg-white border-blue-100 hover:bg-blue-50 hover:border-blue-300'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        {isSelected ? (
                                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Check className="h-4 w-4 text-white" />
                                          </div>
                                        ) : (
                                          <AirlineLogo 
                                            airlineCode={extractAirlineCode(flight.flightNumber)} 
                                            airlineName={flight.airline || 'Unknown'}
                                            size="sm"
                                          />
                                        )}
                                        <div className="text-left">
                                          <div className="font-semibold text-gray-900">{normalizeFlightNumber(flight.flightNumber)}</div>
                                          <div className="text-xs text-gray-500">{flight.airline}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-600">{flight.time}</div>
                                        <div className="text-xs text-gray-500">
                                          {daysDisplay}
                                          {flight.originCity && <span className="ml-1">• din {flight.originCity}</span>}
                                        </div>
                                      </div>
                                    </button>
                                  )
                                })
                            })()}
                          </div>
                        </div>

                        {/* Return Flights */}
                        {tripType === 'roundtrip' && (
                          <div>
                            {(() => {
                              // Get the destination cities we're returning to (selected origins)
                              const returnToCities = selectedOrigins.map(code => getCityName(code))
                              const returnDisplay = returnToCities.length === 1 
                                ? `spre ${returnToCities[0]}` 
                                : returnToCities.length > 1 
                                  ? `spre ${returnToCities.slice(0, 2).join(', ')}${returnToCities.length > 2 ? '...' : ''}`
                                  : ''
                              return (
                                <h4 className="font-semibold text-green-900 mb-3 flex items-center flex-wrap">
                                  <Plane className="h-4 w-4 mr-2 -rotate-45" />
                                  <span>Zboruri de ├«ntoarcere {returnDisplay}</span>
                                  <span className="ml-1 text-green-600">({result.returnFlights.length})</span>
                                </h4>
                              )
                            })()}
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {result.returnFlights.length > 0 ? (
                                (() => {
                                  // Group flights by flightNumber + time + originCode
                                  const groupedFlights = result.returnFlights.reduce((acc, flight) => {
                                    const key = `${flight.flightNumber?.replace(/\s+/g, '')}_${flight.time}_${flight.originCode || ''}`
                                    if (!acc[key]) {
                                      acc[key] = { ...flight, days: [flight.day] }
                                    } else {
                                      if (!acc[key].days.includes(flight.day)) {
                                        acc[key].days.push(flight.day)
                                      }
                                    }
                                    return acc
                                  }, {} as Record<string, ProcessedFlight & { days: DayOfWeek[] }>)
                                  
                                  // Sort days in correct order
                                  const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                  
                                  return Object.values(groupedFlights)
                                    .sort((a, b) => a.time.localeCompare(b.time))
                                    .map((flight, idx) => {
                                      const sortedDays = flight.days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                                      const daysDisplay = sortedDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ')
                                      
                                      // Check if this flight is selected
                                      const isSelected = selectedReturnFlight && 
                                        selectedReturnFlight.flight.flightNumber?.replace(/\s+/g, '') === flight.flightNumber?.replace(/\s+/g, '') &&
                                        selectedReturnFlight.flight.time === flight.time &&
                                        selectedReturnFlight.destination === result.destination
                                      
                                      // Create a flight object with the first day for selection
                                      const flightForSelection: ProcessedFlight = {
                                        ...flight,
                                        day: sortedDays[0],
                                        originCode: flight.originCode || selectedOrigins[0],
                                        destinationCode: result.destinationCode
                                      }
                                      
                                      return (
                                        <button
                                          key={`ret-${idx}`}
                                          onClick={() => selectReturnFlight(flightForSelection, result.destination, result.destinationCode)}
                                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            isSelected 
                                              ? 'bg-green-100 border-green-500 ring-2 ring-green-300' 
                                              : 'bg-white border-green-100 hover:bg-green-50 hover:border-green-300'
                                          }`}
                                        >
                                          <div className="flex items-center space-x-3">
                                            {isSelected ? (
                                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                <Check className="h-4 w-4 text-white" />
                                              </div>
                                            ) : (
                                              <AirlineLogo 
                                                airlineCode={extractAirlineCode(flight.flightNumber)} 
                                                airlineName={flight.airline || 'Unknown'}
                                                size="sm"
                                              />
                                            )}
                                            <div className="text-left">
                                              <div className="font-semibold text-gray-900">{normalizeFlightNumber(flight.flightNumber)}</div>
                                              <div className="text-xs text-gray-500">{flight.airline}</div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-bold text-green-600">{flight.time}</div>
                                            <div className="text-xs text-gray-500">
                                              {daysDisplay}
                                              {flight.originCode && <span className="ml-1">spre {getCityName(flight.originCode) || flight.originCode}</span>}
                                            </div>
                                          </div>
                                        </button>
                                      )
                                    })
                                })()
                              ) : (
                                <div className="text-center py-6 text-gray-500">
                                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">Nu sunt zboruri de întoarcere pentru zilele selectate</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="text-sm text-gray-600">
                            {tripType === 'roundtrip' ? (
                              <span>
                                <strong>{result.outboundFlights.length}</strong> plec─âri / <strong>{result.returnFlights.length}</strong> ├«ntoarceri
                              </span>
                            ) : (
                              <span><strong className="text-blue-600">{result.outboundFlights.length}</strong> zboruri disponibile</span>
                            )}
                          </div>
                          
                          {/* Search Button - shows when flights are selected for this destination */}
                          {((tripType === 'oneway' && selectedOutboundFlight?.destination === result.destination) ||
                            (tripType === 'roundtrip' && selectedOutboundFlight?.destination === result.destination && selectedReturnFlight?.destination === result.destination)) && (
                            <button
                              onClick={openBookingModal}
                              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                              <Search className="h-4 w-4" />
                              <span>Caut─â oferte de zbor</span>
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Selection Summary */}
                        {(selectedOutboundFlight?.destination === result.destination || selectedReturnFlight?.destination === result.destination) && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
                            <div className="text-xs font-medium text-gray-700 mb-2">Selec╚¢ie curent─â:</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedOutboundFlight?.destination === result.destination && (
                                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm">
                                  <Plane className="h-3.5 w-3.5 rotate-45" />
                                  <span>Plecare: {selectedOutboundFlight.flight.flightNumber} • {selectedOutboundFlight.flight.time} • {DAYS_OF_WEEK.find(d => d.value === selectedOutboundFlight.flight.day)?.label}</span>
                                </div>
                              )}
                              {tripType === 'roundtrip' && selectedReturnFlight?.destination === result.destination && (
                                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
                                  <Plane className="h-3.5 w-3.5 -rotate-45" />
                                  <span>Întoarcere: {selectedReturnFlight.flight.flightNumber} • {selectedReturnFlight.flight.time} • {DAYS_OF_WEEK.find(d => d.value === selectedReturnFlight.flight.day)?.label}</span>
                                </div>
                              )}
                            </div>
                            {tripType === 'roundtrip' && selectedOutboundFlight?.destination === result.destination && !selectedReturnFlight && (
                              <div className="mt-2 text-xs text-amber-600 flex items-center">
                                <Info className="h-3.5 w-3.5 mr-1" />
                                Selecteaz─â ╚Öi un zbor de ├«ntoarcere pentru a c─âuta oferte
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>

        {/* How It Works & Tips Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Flexibilitate Maximă</h3>
            <p className="text-sm text-gray-600">
              Selectează mai multe zile pentru plecare și întoarcere. FlyFinder găsește toate combinațiile posibile.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Intervale Orare</h3>
            <p className="text-sm text-gray-600">
              Filtrează după dimineața, amiază sau seară. Perfect pentru a găsi zboruri care se potrivesc programului tău.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Aeroporturi Multiple</h3>
            <p className="text-sm text-gray-600">
              Caută simultan din mai multe aeroporturi. Ideal când ești flexibil cu locul de plecare.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-gray-400" />
            Legendă și Sfaturi
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-gray-600">Rută stabilă (operează regulat)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-gray-600">Zi/interval selectat</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sunrise className="h-4 w-4 text-orange-500" />
              <span className="text-gray-600">Dimineața: 06:00-12:00</span>
            </div>
            <div className="flex items-center space-x-2">
              <Moon className="h-4 w-4 text-indigo-500" />
              <span className="text-gray-600">Seara: 18:00-24:00</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>💡 Sfat:</strong> Pentru cele mai multe opțiuni, selectează mai multe zile și toate intervalele orare. 
              Apoi restrânge căutarea pe măsură ce găsești destinații interesante.
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {bookingModal.step === 'departure' && 'Selectează data plecării'}
                {bookingModal.step === 'return' && 'Selectează data întoarcerii'}
                {bookingModal.step === 'passengers' && 'Selectează pasagerii'}
              </h3>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Step Tabs */}
            {(bookingModal.step === 'departure' || bookingModal.step === 'return') && (
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setBookingModal(prev => ({ ...prev, step: 'departure' }))}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                    bookingModal.step === 'departure'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Data plecării</span>
                </button>
                {tripType === 'roundtrip' && (
                  <button
                    onClick={() => bookingModal.departureDate && setBookingModal(prev => ({ ...prev, step: 'return' }))}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                      bookingModal.step === 'return'
                        ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    } ${!bookingModal.departureDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Data întoarcerii</span>
                  </button>
                )}
              </div>
            )}

            {/* Calendar View */}
            {(bookingModal.step === 'departure' || bookingModal.step === 'return') && (
              <div className="p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </h4>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_NAMES_SHORT.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before first of month */}
                  {Array.from({ length: getFirstDayOfMonth(calendarMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10" />
                  ))}
                  
                  {/* Days of month */}
                  {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1)
                    const isPast = isDateInPast(date)
                    const isSelected = bookingModal.step === 'departure' 
                      ? isSameDay(bookingModal.departureDate, date)
                      : isSameDay(bookingModal.returnDate, date)
                    const isDepartureDate = isSameDay(bookingModal.departureDate, date)
                    const isReturnDate = isSameDay(bookingModal.returnDate, date)
                    const highlightedDays = getHighlightedDays()
                    const isHighlighted = highlightedDays.length > 0 && isDateInSelectedDays(date, highlightedDays) && !isPast
                    const isBeforeDeparture = bookingModal.step === 'return' && 
                      bookingModal.departureDate !== null && date <= bookingModal.departureDate
                    
                    return (
                      <button
                        key={i}
                        onClick={() => selectDate(date)}
                        disabled={isPast || !!isBeforeDeparture}
                        className={`h-10 rounded-lg text-sm font-medium transition-all relative ${
                          isPast || isBeforeDeparture
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSelected
                              ? bookingModal.step === 'departure'
                                ? 'bg-blue-600 text-white'
                                : 'bg-green-600 text-white'
                              : isDepartureDate
                                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                                : isReturnDate
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                                  : isHighlighted
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {i + 1}
                        {isHighlighted && !isSelected && !isDepartureDate && !isReturnDate && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-amber-100 rounded" />
                    <span>Ziua recomandată</span>
                  </div>
                  {bookingModal.departureDate && (
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-blue-600 rounded" />
                      <span>Plecare</span>
                    </div>
                  )}
                  {bookingModal.returnDate && tripType === 'roundtrip' && (
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-green-600 rounded" />
                      <span>Întoarcere</span>
                    </div>
                  )}
                </div>

                {/* Selected Dates Summary */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-4 w-4 text-blue-500 rotate-45" />
                      <span className="text-gray-600">Plecare:</span>
                      <span className="font-medium text-gray-900">
                        {bookingModal.departureDate 
                          ? `${bookingModal.departureDate.getDate()} ${MONTH_NAMES[bookingModal.departureDate.getMonth()]} ${bookingModal.departureDate.getFullYear()}`
                          : 'Neselectată'}
                      </span>
                    </div>
                  </div>
                  {tripType === 'roundtrip' && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-green-500 -rotate-45" />
                        <span className="text-gray-600">Întoarcere:</span>
                        <span className="font-medium text-gray-900">
                          {bookingModal.returnDate 
                            ? `${bookingModal.returnDate.getDate()} ${MONTH_NAMES[bookingModal.returnDate.getMonth()]} ${bookingModal.returnDate.getFullYear()}`
                            : 'Neselectată'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => {
                    if (bookingModal.step === 'departure' && bookingModal.departureDate) {
                      if (tripType === 'roundtrip') {
                        setBookingModal(prev => ({ ...prev, step: 'return' }))
                      } else {
                        setBookingModal(prev => ({ ...prev, step: 'passengers' }))
                      }
                    } else if (bookingModal.step === 'return' && bookingModal.returnDate) {
                      setBookingModal(prev => ({ ...prev, step: 'passengers' }))
                    }
                  }}
                  disabled={
                    (bookingModal.step === 'departure' && !bookingModal.departureDate) ||
                    (bookingModal.step === 'return' && !bookingModal.returnDate)
                  }
                  className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  Continuă
                </button>
              </div>
            )}

            {/* Passengers View */}
            {bookingModal.step === 'passengers' && (
              <div className="p-4">
                {/* Flight Summary */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Rută:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedOutboundFlight?.flight.originCode || selectedOrigins[0]} ΓåÆ {selectedOutboundFlight?.destinationCode}
                      {tripType === 'roundtrip' && ` ΓåÆ ${selectedOutboundFlight?.flight.originCode || selectedOrigins[0]}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {bookingModal.departureDate && formatDateRomanian(bookingModal.departureDate)}
                      {tripType === 'roundtrip' && bookingModal.returnDate && ` - ${formatDateRomanian(bookingModal.returnDate)}`}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-gray-700 mb-4">Selectează pasagerii</h4>

                {/* Adults */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Adulți</div>
                      <div className="text-xs text-gray-500">De la 12 ani</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updatePassengers('adults', -1)}
                      disabled={bookingModal.passengers.adults <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-900">{bookingModal.passengers.adults}</span>
                    <button
                      onClick={() => updatePassengers('adults', 1)}
                      disabled={bookingModal.passengers.adults >= 9}
                      className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Copii</div>
                      <div className="text-xs text-gray-500">2-11 ani</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updatePassengers('children', -1)}
                      disabled={bookingModal.passengers.children <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-900">{bookingModal.passengers.children}</span>
                    <button
                      onClick={() => updatePassengers('children', 1)}
                      disabled={bookingModal.passengers.children >= 9}
                      className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Baby className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Bebeluși</div>
                      <div className="text-xs text-gray-500">Până la 2 ani</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updatePassengers('infants', -1)}
                      disabled={bookingModal.passengers.infants <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-900">{bookingModal.passengers.infants}</span>
                    <button
                      onClick={() => updatePassengers('infants', 1)}
                      disabled={bookingModal.passengers.infants >= bookingModal.passengers.adults}
                      className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {bookingModal.passengers.infants > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                    <Info className="h-4 w-4 inline mr-1" />
                    Bebelușii călătoresc în brațele adulților. Maxim 1 bebeluș per adult.
                  </div>
                )}

                {/* Total Passengers */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total pasageri:</span>
                  <span className="font-semibold text-gray-900">
                    {bookingModal.passengers.adults + bookingModal.passengers.children + bookingModal.passengers.infants}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setBookingModal(prev => ({ 
                      ...prev, 
                      step: tripType === 'roundtrip' ? 'return' : 'departure' 
                    }))}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Înapoi
                  </button>
                  <button
                    onClick={handleSearchZbor}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Caut─â</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
