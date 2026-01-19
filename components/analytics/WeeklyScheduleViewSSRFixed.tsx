'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Filter, BarChart3, Grid3X3, List, Search, MapPin, Plane } from 'lucide-react'
import { MAJOR_AIRPORTS } from '@/lib/airports'

interface WeeklyScheduleData {
  airport: string
  destination: string
  airline: string
  flightNumber: string
  weeklyPattern: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  // Scheduled times for each day (HH:MM format)
  scheduledTimes?: {
    monday?: string[]
    tuesday?: string[]
    wednesday?: string[]
    thursday?: string[]
    friday?: string[]
    saturday?: string[]
    sunday?: string[]
  }
  frequency: number
  lastUpdated: string
  dataSource: 'cache' | 'historical'
}

interface WeeklyScheduleViewProps {
  className?: string
  initialAirportFilter?: string
}

type ViewMode = 'destinations' | 'days'
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

interface DestinationRoute {
  destination: string
  routes: WeeklyScheduleData[]
  weeklyPattern: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  totalFlights: number
}

// Funcție pentru pluralul corect în română
const getRoutesPlural = (count: number): string => {
  if (count === 1) return 'rută'
  return 'rute'
}

const getFlightsPlural = (count: number): string => {
  if (count === 1) return 'zbor'
  return 'zboruri'
}

// Funcție pentru detectarea zborurilor codeshare
const isCodeshareFlightNumber = (flightNumber: string, airline: string): boolean => {
  if (!flightNumber || !airline) return false
  
  // Codeshare-urile au de obicei numere de zbor cu prefixe diferite pentru același zbor
  const codesharePatterns = [
    /\*/, // Asterisk indicates codeshare
    /operated by/i,
    /op by/i,
  ]
  
  // Check if flight number contains codeshare indicators
  if (codesharePatterns.some(pattern => pattern.test(flightNumber))) {
    return true
  }
  
  // Extract flight prefix and number (e.g., "TK" and "9019" from "TK 9019")
  const cleanFlightNumber = flightNumber.replace(/\s+/g, ' ').trim()
  const match = cleanFlightNumber.match(/^([A-Z0-9]{2})\s*(\d+)$/i)
  
  if (!match) return false
  
  const flightPrefix = match[1].toUpperCase()
  const flightNum = parseInt(match[2], 10)
  const airlineUpper = airline.toUpperCase()
  
  // PATTERN 1: Flight numbers >= 5000 are typically codeshares for major airlines
  // Exception: Some airlines use high numbers for regular flights (e.g., Wizz Air W4 3xxx, Ryanair FR 1xxx)
  const highNumberCodeshareAirlines = ['TK', 'AF', 'KL', 'LH', 'UA', 'AC', 'SQ', 'ET', 'JU', 'LY', 'BT', 'EK', 'OS', 'SK', 'AY']
  if (highNumberCodeshareAirlines.includes(flightPrefix) && flightNum >= 5000) {
    return true
  }
  
  // PATTERN 2: Airline code in flight number doesn't match operating airline
  const airlineCodeMap: { [key: string]: string[] } = {
    'RO': ['TAROM'],
    'W4': ['WIZZ', 'W4', 'WIZZ AIR MALTA'],
    'W9': ['WIZZ'],
    'FR': ['RYANAIR'],
    'LH': ['LUFTHANSA'],
    'AF': ['AIR FRANCE'],
    'KL': ['KLM'],
    'TK': ['TURKISH'],
    'EK': ['EMIRATES'],
    'FZ': ['FLYDUBAI'],
    'A3': ['AEGEAN'],
    'H4': ['HISKY'],
    'A2': ['ANIMAWINGS', 'AWG'],
    'JU': ['AIR SERBIA'],
    'LY': ['EL AL'],
    'UA': ['UNITED'],
    'AC': ['AIR CANADA'],
    'SQ': ['SINGAPORE'],
    'ET': ['ETHIOPIAN'],
    'BT': ['AIRBALTIC'],
    'BZ': ['BLUE BIRD', 'BZ'],
    '5F': ['FLYONE'],
    'U5': ['SKYUP', 'SKY UP', 'AURA'],
  }
  
  // Check if the flight prefix matches the airline name
  const expectedAirlineNames = airlineCodeMap[flightPrefix]
  if (expectedAirlineNames) {
    const airlineMatches = expectedAirlineNames.some(name => airlineUpper.includes(name))
    if (!airlineMatches) {
      return true
    }
  }
  
  return false
}

// Funcție pentru eliminarea duplicatelor de codeshare
const removeDuplicateCodeshares = (routes: WeeklyScheduleData[]): WeeklyScheduleData[] => {
  const routeMap = new Map<string, WeeklyScheduleData>()
  
  routes.forEach(route => {
    // Use airport-destination-flightNumber as key to catch all duplicates
    const routeKey = `${route.airport}-${route.destination}-${route.flightNumber}`
    const isCodeshare = isCodeshareFlightNumber(route.flightNumber, route.airline)
    
    if (!routeMap.has(routeKey)) {
      // Prima rută pentru această destinație și număr de zbor
      routeMap.set(routeKey, route)
    } else {
      const existingRoute = routeMap.get(routeKey)!
      const existingIsCodeshare = isCodeshareFlightNumber(existingRoute.flightNumber, existingRoute.airline)
      
      // Dacă ruta existentă este codeshare și noua nu este, înlocuiește
      if (existingIsCodeshare && !isCodeshare) {
        routeMap.set(routeKey, route)
      } else if (!existingIsCodeshare && isCodeshare) {
        // Păstrează ruta existentă (non-codeshare)
        return
      } else {
        // Ambele sunt de același tip - MERGE data instead of just combining strings
        // Merge weekly patterns
        const mergedPattern = {
          monday: existingRoute.weeklyPattern.monday || route.weeklyPattern.monday,
          tuesday: existingRoute.weeklyPattern.tuesday || route.weeklyPattern.tuesday,
          wednesday: existingRoute.weeklyPattern.wednesday || route.weeklyPattern.wednesday,
          thursday: existingRoute.weeklyPattern.thursday || route.weeklyPattern.thursday,
          friday: existingRoute.weeklyPattern.friday || route.weeklyPattern.friday,
          saturday: existingRoute.weeklyPattern.saturday || route.weeklyPattern.saturday,
          sunday: existingRoute.weeklyPattern.sunday || route.weeklyPattern.sunday,
        }
        
        // Determine which entry is newer based on lastUpdated
        const existingDate = new Date(existingRoute.lastUpdated)
        const newDate = new Date(route.lastUpdated)
        const newerRoute = newDate > existingDate ? route : existingRoute
        const olderRoute = newDate > existingDate ? existingRoute : route
        
        // CRITICAL FIX: For scheduled times, prefer the NEWER data
        const mergedTimes: typeof route.scheduledTimes = {}
        const days: (keyof typeof mergedTimes)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        days.forEach(day => {
          const newerTimes = newerRoute.scheduledTimes?.[day] || []
          const olderTimes = olderRoute.scheduledTimes?.[day] || []
          
          // Prefer newer data, fall back to older if newer doesn't have this day
          if (newerTimes.length > 0) {
            mergedTimes[day] = [newerTimes[0]] // Keep only ONE time
          } else if (olderTimes.length > 0) {
            mergedTimes[day] = [olderTimes[0]] // Keep only ONE time
          }
        })
        
        const combinedRoute: WeeklyScheduleData = {
          ...existingRoute,
          // Keep airline from newer entry
          airline: newerRoute.airline,
          frequency: Math.max(existingRoute.frequency, route.frequency),
          weeklyPattern: mergedPattern,
          scheduledTimes: Object.keys(mergedTimes).length > 0 ? mergedTimes : undefined,
          lastUpdated: newerRoute.lastUpdated,
        }
        routeMap.set(routeKey, combinedRoute)
      }
    }
  })
  
  return Array.from(routeMap.values())
}

export default function WeeklyScheduleViewSSRFixed({ className = '', initialAirportFilter = '' }: WeeklyScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData[]>([])
  const [filteredData, setFilteredData] = useState<WeeklyScheduleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataRange, setDataRange] = useState<{ from: string; to: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // View mode and filters
  const [viewMode, setViewMode] = useState<ViewMode>('destinations')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday')
  const [searchQuery, setSearchQuery] = useState('')
  const [airportFilter, setAirportFilter] = useState(initialAirportFilter)
  const [dayFilter, setDayFilter] = useState<DayOfWeek | ''>('') // New day filter
  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set()) // Track expanded destinations

  // Day labels for UI
  const dayLabels = {
    monday: 'Luni',
    tuesday: 'Marți', 
    wednesday: 'Miercuri',
    thursday: 'Joi',
    friday: 'Vineri',
    saturday: 'Sâmbătă',
    sunday: 'Duminică'
  }

  const dayShortLabels = {
    monday: 'L',
    tuesday: 'Ma',
    wednesday: 'Mi', 
    thursday: 'J',
    friday: 'V',
    saturday: 'S',
    sunday: 'D'
  }
  
  // Helper function to correct known airport code/name mismatches
  const correctAirportCodeNameMismatch = (codeOrName: string): string => {
    if (!codeOrName) return codeOrName
    
    // Known mismatches: when name contains city but code is wrong
    const corrections: { [key: string]: { wrongCode: string; correctCode: string; correctName: string } } = {
      // DUB is Dublin (Ireland), not Dubai - Dubai Al Maktoum is DWC
      'Dubai (Al Maktoum)': { wrongCode: 'DUB', correctCode: 'DWC', correctName: 'Dubai (Al Maktoum)' },
      'Dubai Al Maktoum': { wrongCode: 'DUB', correctCode: 'DWC', correctName: 'Dubai (Al Maktoum)' },
    }
    
    // If the input looks like a name (contains parentheses or is longer than 3 chars)
    if (codeOrName.includes('(') || codeOrName.length > 3) {
      const correction = corrections[codeOrName]
      if (correction) {
        return correction.correctName
      }
    }
    
    return codeOrName
  }

  // Helper function to convert airport codes to display names
  const getAirportDisplayName = (code: string): string => {
    if (!code) return 'Aeroport necunoscut'
    
    // First, apply corrections for known mismatches
    const correctedCode = correctAirportCodeNameMismatch(code)
    
    if (correctedCode.includes('(') || correctedCode.length > 3) {
      return correctedCode
    }
    
    const airport = MAJOR_AIRPORTS.find(a => a.code === code.toUpperCase())
    if (airport) {
      return airport.city
    }
    
    // Mapare pentru aeroporturi internaționale comune
    const internationalAirports: { [key: string]: string } = {
      'BVA': 'Paris (Beauvais)',
      'CDG': 'Paris (Charles de Gaulle)',
      'ORY': 'Paris (Orly)',
      'LHR': 'Londra (Heathrow)',
      'LGW': 'Londra (Gatwick)',
      'FCO': 'Roma (Fiumicino)',
      'MXP': 'Milano (Malpensa)',
      'AMS': 'Amsterdam',
      'FRA': 'Frankfurt',
      'MUC': 'München',
      'VIE': 'Viena',
      'ZUR': 'Zürich',
      'ATH': 'Atena',
      'IST': 'Istanbul',
      'DXB': 'Dubai',
      'DOH': 'Doha',
      'TLV': 'Tel Aviv',
      'AMM': 'Amman',
      'BEY': 'Beirut',
      'DAM': 'Damasc',
      'AGP': 'Málaga',
      'BCN': 'Barcelona',
      'MAD': 'Madrid',
      'LIS': 'Lisabona',
      'CPH': 'Copenhaga',
      'ARN': 'Stockholm',
      'OSL': 'Oslo',
      'HEL': 'Helsinki',
      'WAW': 'Varșovia',
      'PRG': 'Praga',
      'BUD': 'Budapesta',
      'SOF': 'Sofia',
      'BEG': 'Belgrad',
      'TBS': 'Tbilisi',
      'DWC': 'Dubai (Al Maktoum)',
      'NYO': 'Stockholm (Skavsta)',
      'CDT': 'Castellón',
      'LPA': 'Las Palmas (Gran Canaria)',
      'JFK': 'New York (JFK)',
      'EWR': 'New York (Newark)',
    }
    
    const upperCode = code ? code.toUpperCase() : ''
    return internationalAirports[upperCode] || code || 'Necunoscut'
  }

  // Helper function to correct destination names with wrong IATA codes
  // This fixes data where DUB (Dublin) was incorrectly labeled as Dubai
  const correctDestinationData = (routes: WeeklyScheduleData[]): WeeklyScheduleData[] => {
    return routes.map(route => {
      let correctedDestination = route.destination
      
      // Fix: If destination contains "Dubai" but the data came with DUB code
      // DUB = Dublin (Ireland), DWC = Dubai Al Maktoum, DXB = Dubai International
      if (route.destination.toLowerCase().includes('dubai')) {
        // Keep the name as is, it's correct - the issue was the IATA code association
        correctedDestination = route.destination.includes('Al Maktoum') 
          ? 'Dubai (Al Maktoum)' 
          : route.destination.includes('International')
            ? 'Dubai'
            : route.destination
      }
      
      // Fix: If destination is "DUB" code but should be Dublin
      if (route.destination === 'DUB') {
        correctedDestination = 'Dublin'
      }
      
      return {
        ...route,
        destination: correctedDestination
      }
    })
  }

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[WeeklySchedule] Starting to load data...')
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[WeeklySchedule] API response:', { success: data.success, count: data.data?.length })
      
      if (data.success) {
        // Elimină duplicatele de codeshare ÎNAINTE de conversie
        const deduplicatedData = removeDuplicateCodeshares(data.data)
        console.log('[WeeklySchedule] After deduplication:', deduplicatedData.length)
        
        // Apply destination corrections for known mismatches
        const correctedData = correctDestinationData(deduplicatedData)
        
        // Server already provides mapped city names, no need to re-map
        setScheduleData(correctedData)
        setFilteredData(correctedData)
        
        // Set data range if available
        if (data.dataRange) {
          setDataRange(data.dataRange)
        }
      } else {
        setError(data.error || 'Failed to load schedule data')
      }
    } catch (err) {
      console.error('[WeeklySchedule] Error loading data:', err)
      setError('Network error loading schedule data')
    } finally {
      setLoading(false)
    }
  }

  // Group similar routes and apply filters/sorting
  useEffect(() => {
    if (!mounted) return
    
    console.log('[WeeklySchedule] Filtering data, scheduleData length:', scheduleData.length)
    let filtered = [...scheduleData]
    
    // First, filter to only show departures from Romanian/Moldovan airports
    filtered = filtered.filter(item => {
      // List of Romanian and Moldovan airports from our data
      const romanianMoldovanAirports = [
        'București', 'BucureÈti', 'Bucuresti',
        'Cluj-Napoca', 'Cluj',
        'Timișoara', 'TimiÈoara', 'Timisoara',
        'Iași', 'IaÈi', 'Iasi',
        'Chișinău', 'ChiÈinÄu', 'Chisinau',
        'Bacău', 'BacÄu', 'Bacau',
        'Sibiu',
        'Craiova',
        'Constanța', 'ConstanÈa', 'Constanta',
        'Suceava',
        'Oradea',
        'Târgu Mureș', 'TÃ¢rgu MureÈ', 'Targu Mures',
        'Satu Mare',
        'Arad',
        'Baia Mare'
      ]
      
      // Check if this airport matches any of our Romanian/Moldovan airports
      const isRomanianMoldovan = romanianMoldovanAirports.some(targetAirport => 
        item.airport.toLowerCase().includes(targetAirport.toLowerCase()) ||
        targetAirport.toLowerCase().includes(item.airport.toLowerCase())
      )
      
      return isRomanianMoldovan
    })
    
    console.log('[WeeklySchedule] After Romanian/Moldovan filter:', filtered.length)
    
    // Apply day filter - NEW
    if (dayFilter) {
      filtered = filtered.filter(item => item.weeklyPattern[dayFilter])
      console.log('[WeeklySchedule] After day filter:', filtered.length)
    }
    
    // Apply airport filter
    if (airportFilter) {
      filtered = filtered.filter(item => 
        item.airport.toLowerCase().includes(airportFilter.toLowerCase())
      )
      console.log('[WeeklySchedule] After airport filter:', filtered.length)
    }
    
    // Apply search query (search in destinations)
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.airport.toLowerCase().includes(searchQuery.toLowerCase())
      )
      console.log('[WeeklySchedule] After search filter:', filtered.length)
    }
    
    // Sort by destination name for better UX
    filtered.sort((a, b) => a.destination.localeCompare(b.destination))
    
    console.log('[WeeklySchedule] Final filtered data:', filtered.length)
    setFilteredData(filtered)
  }, [scheduleData, airportFilter, searchQuery, dayFilter, mounted])

  // Process data for destinations matrix view
  const getDestinationsMatrix = (): DestinationRoute[] => {
    if (!mounted) return []
    
    const destinationMap = new Map<string, WeeklyScheduleData[]>()
    
    filteredData.forEach(route => {
      if (!destinationMap.has(route.destination)) {
        destinationMap.set(route.destination, [])
      }
      destinationMap.get(route.destination)!.push(route)
    })
    
    const destinations: DestinationRoute[] = []
    
    destinationMap.forEach((routes, destination) => {
      // Combine all routes to this destination
      const combinedPattern = {
        monday: routes.some(r => r.weeklyPattern.monday),
        tuesday: routes.some(r => r.weeklyPattern.tuesday),
        wednesday: routes.some(r => r.weeklyPattern.wednesday),
        thursday: routes.some(r => r.weeklyPattern.thursday),
        friday: routes.some(r => r.weeklyPattern.friday),
        saturday: routes.some(r => r.weeklyPattern.saturday),
        sunday: routes.some(r => r.weeklyPattern.sunday)
      }
      
      // Count actual flight entries that will be displayed (each day with a flight counts as 1)
      let totalFlightEntries = 0
      const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      routes.forEach(route => {
        days.forEach(day => {
          if (route.weeklyPattern[day]) {
            // Count each time slot as a separate flight entry
            const times = route.scheduledTimes?.[day] || []
            totalFlightEntries += times.length > 0 ? times.length : 1
          }
        })
      })
      
      destinations.push({
        destination,
        routes,
        weeklyPattern: combinedPattern,
        totalFlights: totalFlightEntries
      })
    })
    
    // Sortare după numărul de rute (de la mare la mic)
    return destinations.sort((a, b) => b.routes.length - a.routes.length)
  }

  // Get destinations for a specific day - sorted by scheduled time (earliest first)
  const getDestinationsForDay = (day: DayOfWeek): WeeklyScheduleData[] => {
    if (!mounted) return []
    
    return filteredData
      .filter(route => route.weeklyPattern[day])
      .sort((a, b) => {
        // Sort by scheduled time for this day (earliest first)
        const timeA = a.scheduledTimes?.[day]?.[0] || '99:99'
        const timeB = b.scheduledTimes?.[day]?.[0] || '99:99'
        return timeA.localeCompare(timeB)
      })
  }

  // Handle mounting for hydration
  useEffect(() => {
    setMounted(true)
    loadScheduleData()
  }, [])

  // Get unique values for filter dropdowns - only Romanian and Moldovan airports
  const departureAirports = mounted ? [...new Set(scheduleData.map(item => item.airport))]
    .filter(airport => {
      if (!airport || airport.length === 0) return false
      
      // List of Romanian and Moldovan airports from our data
      const romanianMoldovanAirports = [
        'București', 'BucureÈti', 'Bucuresti',
        'Cluj-Napoca', 'Cluj',
        'Timișoara', 'TimiÈoara', 'Timisoara',
        'Iași', 'IaÈi', 'Iasi',
        'Chișinău', 'ChiÈinÄu', 'Chisinau',
        'Bacău', 'BacÄu', 'Bacau',
        'Sibiu',
        'Craiova',
        'Constanța', 'ConstanÈa', 'Constanta',
        'Suceava',
        'Oradea',
        'Târgu Mureș', 'TÃ¢rgu MureÈ', 'Targu Mures',
        'Satu Mare',
        'Arad',
        'Baia Mare'
      ]
      
      // Check if this airport matches any of our Romanian/Moldovan airports
      const isRomanianMoldovan = romanianMoldovanAirports.some(targetAirport => 
        airport.toLowerCase().includes(targetAirport.toLowerCase()) ||
        targetAirport.toLowerCase().includes(airport.toLowerCase())
      )
      
      return isRomanianMoldovan
    })
    .sort() : []

  if (!mounted) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Se încarcă programul săptămânal...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Se încarcă programul săptămânal...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️ Eroare</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={loadScheduleData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Încearcă din nou
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Program Săptămânal Zboruri
              </h3>
              <p className="text-sm text-gray-600">
                {filteredData.length} {getRoutesPlural(filteredData.length)} disponibile
                {dataRange && (
                  <span className="ml-2">
                    • Perioada: {new Date(dataRange.from).toLocaleDateString('ro-RO')} - {new Date(dataRange.to).toLocaleDateString('ro-RO')}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('destinations')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'destinations'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              <span>Destinații</span>
            </button>
            <button
              onClick={() => setViewMode('days')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'days'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span>Zile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtre:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Căutare Destinație
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Caută după destinație sau aeroport..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Day Filter - NEW */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filtrare după Zi
            </label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value as DayOfWeek | '')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">Toate zilele</option>
              <option value="monday">Luni</option>
              <option value="tuesday">Marți</option>
              <option value="wednesday">Miercuri</option>
              <option value="thursday">Joi</option>
              <option value="friday">Vineri</option>
              <option value="saturday">Sâmbătă</option>
              <option value="sunday">Duminică</option>
            </select>
          </div>
          
          {/* Airport Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Plecări din România/Moldova
            </label>
            <select
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">Toate aeroporturile</option>
              <optgroup label="România">
                {departureAirports
                  .filter(airport => {
                    const romanianAirports = [
                      'București', 'BucureÈti', 'Bucuresti',
                      'Cluj-Napoca', 'Cluj',
                      'Timișoara', 'TimiÈoara', 'Timisoara',
                      'Iași', 'IaÈi', 'Iasi',
                      'Bacău', 'BacÄu', 'Bacau',
                      'Sibiu',
                      'Craiova',
                      'Constanța', 'ConstanÈa', 'Constanta',
                      'Suceava',
                      'Oradea',
                      'Târgu Mureș', 'TÃ¢rgu MureÈ', 'Targu Mures',
                      'Satu Mare',
                      'Arad',
                      'Baia Mare'
                    ]
                    return romanianAirports.some(targetAirport => 
                      airport.toLowerCase().includes(targetAirport.toLowerCase())
                    )
                  })
                  .map(airport => (
                    <option key={airport} value={airport}>{airport}</option>
                  ))
                }
              </optgroup>
              <optgroup label="Moldova">
                {departureAirports
                  .filter(airport => {
                    const moldovanAirports = ['Chișinău', 'ChiÈinÄu', 'Chisinau']
                    return moldovanAirports.some(targetAirport => 
                      airport.toLowerCase().includes(targetAirport.toLowerCase())
                    )
                  })
                  .map(airport => (
                    <option key={airport} value={airport}>{airport}</option>
                  ))
                }
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nu sunt rute disponibile
            </h4>
            <p className="text-gray-600 mb-4">
              Încearcă să modifici filtrele sau să aștepți actualizarea datelor.
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'destinations' ? (
              <DestinationsMatrixView destinations={getDestinationsMatrix()} />
            ) : (
              <DaysTabView 
                selectedDay={selectedDay}
                onDayChange={setSelectedDay}
                dayLabels={dayLabels}
                dayShortLabels={dayShortLabels}
                getDestinationsForDay={getDestinationsForDay}
              />
            )}
          </>
        )}
      </div>

      {/* Footer with metadata */}
      {filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Afișate: {filteredData.length} din {scheduleData.length} {getRoutesPlural(scheduleData.length)}
            </div>
            <div>
              Ultima actualizare: {scheduleData.length > 0 ? new Date(scheduleData[0].lastUpdated).toLocaleString('ro-RO') : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Destinations Matrix View Component
interface DestinationsMatrixViewProps {
  destinations: DestinationRoute[]
}

function DestinationsMatrixView({ destinations }: DestinationsMatrixViewProps) {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayShortLabels = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D']
  const dayLabels = {
    monday: 'Luni',
    tuesday: 'Marți', 
    wednesday: 'Miercuri',
    thursday: 'Joi',
    friday: 'Vineri',
    saturday: 'Sâmbătă',
    sunday: 'Duminică'
  }

  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set())

  const toggleDestination = (destination: string) => {
    const newExpanded = new Set(expandedDestinations)
    if (newExpanded.has(destination)) {
      newExpanded.delete(destination)
    } else {
      newExpanded.add(destination)
    }
    setExpandedDestinations(newExpanded)
  }

  // Interface for flattened flight entries with time
  interface FlightTimeEntry {
    route: WeeklyScheduleData
    time: string | null
  }

  // Group routes by destination and day for detailed view
  // Returns flattened list of flight-time entries sorted by time (earliest first)
  const getFlightEntriesForDestinationAndDay = (destination: string, day: DayOfWeek): FlightTimeEntry[] => {
    const destData = destinations.find(d => d.destination === destination)
    if (!destData) return []
    
    const routes = destData.routes.filter(route => route.weeklyPattern[day])
    
    // Flatten all routes with their times into individual entries
    const entries: FlightTimeEntry[] = []
    
    routes.forEach(route => {
      const times = route.scheduledTimes?.[day] || []
      if (times.length === 0) {
        // Route has no specific time, add with null time (will sort to end)
        entries.push({ route, time: null })
      } else {
        // Add each time as a separate entry
        times.forEach(time => {
          entries.push({ route, time })
        })
      }
    })
    
    // Sort all entries by time (earliest first, null times at end)
    return entries.sort((a, b) => {
      const timeA = a.time || '99:99'
      const timeB = b.time || '99:99'
      return timeA.localeCompare(timeB)
    })
  }

  // Legacy function for backward compatibility (if needed elsewhere)
  const getRoutesForDestinationAndDay = (destination: string, day: DayOfWeek): WeeklyScheduleData[] => {
    const destData = destinations.find(d => d.destination === destination)
    if (!destData) return []
    
    const routes = destData.routes.filter(route => route.weeklyPattern[day])
    
    // Sort routes by scheduled time for this day (earliest first)
    return routes.sort((a, b) => {
      const timeA = a.scheduledTimes?.[day]?.[0] || '99:99'
      const timeB = b.scheduledTimes?.[day]?.[0] || '99:99'
      return timeA.localeCompare(timeB)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          Matrice Destinații
        </h4>
        <p className="text-sm text-gray-600">
          {destinations.length} {destinations.length === 1 ? 'destinație disponibilă' : 'destinații disponibile'}
        </p>
      </div>

      {/* Desktop Matrix Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                Destinație
              </th>
              {dayShortLabels.map((day, index) => (
                <th key={day} className="px-3 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                  {day}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {destinations.map((dest, index) => (
              <React.Fragment key={dest.destination}>
                <tr 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-blue-50 transition-colors`}
                  onClick={() => toggleDestination(dest.destination)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        {expandedDestinations.has(dest.destination) ? '▼' : '▶'}
                      </button>
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>{dest.destination}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dest.routes.length} {getRoutesPlural(dest.routes.length)}
                    </div>
                  </td>
                  {days.map((day) => (
                    <td key={day} className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        dest.weeklyPattern[day]
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}>
                        {dest.weeklyPattern[day] ? '●' : '○'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dest.totalFlights}
                    </span>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedDestinations.has(dest.destination) && (
                  <tr className="bg-blue-50">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 mb-3">
                          Detalii rute către {dest.destination}:
                        </h5>
                        
                        <div className="grid grid-cols-7 gap-2">
                          {days.map((day) => {
                            const dayEntries = getFlightEntriesForDestinationAndDay(dest.destination, day)
                            return (
                              <div key={day} className="text-center">
                                <div className="text-xs font-medium text-gray-700 mb-2 bg-gray-100 py-1 rounded">
                                  {dayLabels[day]}
                                </div>
                                {dayEntries.length > 0 ? (
                                  <div className="space-y-2">
                                    {dayEntries.map((entry, idx) => (
                                      <div key={idx} className="bg-white rounded p-2 text-xs border border-gray-200 shadow-sm">
                                        <div className="text-gray-500 text-[10px] mb-1">
                                          din {entry.route.airport}
                                        </div>
                                        <div className="font-semibold text-blue-700">
                                          {entry.route.flightNumber}
                                        </div>
                                        {entry.time && (
                                          <div className="text-green-700 font-bold mt-1">
                                            <span className="inline-block bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                              {entry.time}
                                            </span>
                                          </div>
                                        )}
                                        <div className="text-gray-400 text-[10px] mt-1">
                                          {entry.route.airline.length > 10 ? `${entry.route.airline.substring(0, 10)}...` : entry.route.airline}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 py-2">
                                    -
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {destinations.map((dest) => (
          <div key={dest.destination} className="bg-white border border-gray-200 rounded-lg">
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleDestination(dest.destination)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    {expandedDestinations.has(dest.destination) ? '▼' : '▶'}
                  </button>
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{dest.destination}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {dest.totalFlights} {getFlightsPlural(dest.totalFlights)}
                </span>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIndex) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{dayShortLabels[dayIndex]}</div>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      dest.weeklyPattern[day]
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      {dest.weeklyPattern[day] ? '●' : '○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Expanded Details */}
            {expandedDestinations.has(dest.destination) && (
              <div className="border-t border-gray-200 p-4 bg-blue-50">
                <h5 className="font-medium text-gray-900 mb-3">
                  Detalii rute către {dest.destination}:
                </h5>
                
                <div className="space-y-3">
                  {days.map((day) => {
                    const dayEntries = getFlightEntriesForDestinationAndDay(dest.destination, day)
                    if (dayEntries.length === 0) return null
                    
                    return (
                      <div key={day} className="bg-white rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-2 pb-2 border-b border-gray-100">
                          {dayLabels[day]}
                        </div>
                        <div className="space-y-2">
                          {dayEntries.map((entry, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                              <div className="flex-1">
                                <div className="text-gray-500 text-[10px]">din {entry.route.airport}</div>
                                <div className="font-semibold text-blue-700">{entry.route.flightNumber}</div>
                                <div className="text-gray-400 text-[10px]">{entry.route.airline}</div>
                              </div>
                              {entry.time ? (
                                <div className="text-green-700 font-bold">
                                  <span className="inline-block bg-green-50 px-2 py-1 rounded border border-green-200">
                                    {entry.time}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-gray-400">-</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Days Tab View Component
interface DaysTabViewProps {
  selectedDay: DayOfWeek
  onDayChange: (day: DayOfWeek) => void
  dayLabels: Record<DayOfWeek, string>
  dayShortLabels: Record<DayOfWeek, string>
  getDestinationsForDay: (day: DayOfWeek) => WeeklyScheduleData[]
}

function DaysTabView({ selectedDay, onDayChange, dayLabels, dayShortLabels, getDestinationsForDay }: DaysTabViewProps) {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const destinationsForSelectedDay = getDestinationsForDay(selectedDay)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          Program pe Zile
        </h4>
        <p className="text-sm text-gray-600">
          {destinationsForSelectedDay.length} {destinationsForSelectedDay.length === 1 ? 'destinație' : 'destinații'} în {dayLabels[selectedDay]}
        </p>
      </div>

      {/* Day Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {days.map((day) => {
            const dayDestinations = getDestinationsForDay(day)
            return (
              <button
                key={day}
                onClick={() => onDayChange(day)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedDay === day
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">{dayLabels[day]}</span>
                <span className="sm:hidden">{dayShortLabels[day]}</span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedDay === day
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {dayDestinations.length}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Selected Day Content */}
      <div className="space-y-4">
        {destinationsForSelectedDay.length === 0 ? (
          <div className="text-center py-8">
            <Plane className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              Nu sunt zboruri programate în {dayLabels[selectedDay]}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {destinationsForSelectedDay.map((route, index) => {
              const times = route.scheduledTimes?.[selectedDay] || []
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-gray-900">{route.destination}</h5>
                        <p className="text-xs text-gray-500">din {route.airport}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {route.frequency}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Zbor:</span> {route.flightNumber}
                    </div>
                    {times.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Ora:</span>{' '}
                        {times.map((time, timeIdx) => (
                          <span key={timeIdx} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium mr-1 mb-1">
                            {time}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Companie:</span> {route.airline.length > 30 ? `${route.airline.substring(0, 30)}...` : route.airline}
                    </div>
                    
                    {/* Weekly pattern indicators */}
                    <div className="flex items-center space-x-1 pt-2">
                      <span className="text-xs text-gray-500">Zile:</span>
                      {days.map((day) => (
                        <span
                          key={day}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-medium ${
                            route.weeklyPattern[day]
                              ? day === selectedDay
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {dayShortLabels[day]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}