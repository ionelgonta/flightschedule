'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, BarChart3, Grid3X3, List, Search, MapPin, Plane } from 'lucide-react'
import { WeeklyScheduleData } from '@/lib/weeklyScheduleAnalyzer'
import { MAJOR_AIRPORTS } from '@/lib/airports'

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
    /\//, // Slash indicates shared flight
  ]
  
  // Check if flight number contains codeshare indicators
  if (codesharePatterns.some(pattern => pattern.test(flightNumber))) {
    return true
  }
  
  // Check if airline code in flight number doesn't match airline name
  const flightPrefix = flightNumber.substring(0, 2).toUpperCase()
  const airlineUpper = airline.toUpperCase()
  
  // Common codeshare mismatches
  const codeShareMismatches = [
    { flight: 'JL', airline: 'BRITISH' }, // Japan Airlines code on British Airways
    { flight: 'AA', airline: 'BRITISH' }, // American Airlines code on British Airways
    { flight: 'LH', airline: 'UNITED' },  // Lufthansa code on United
    { flight: 'UA', airline: 'LUFTHANSA' }, // United code on Lufthansa
    { flight: 'AF', airline: 'DELTA' },   // Air France code on Delta
    { flight: 'DL', airline: 'AIR FRANCE' }, // Delta code on Air France
  ]
  
  return codeShareMismatches.some(mismatch => 
    flightPrefix === mismatch.flight && airlineUpper.includes(mismatch.airline)
  )
}

// Funcție pentru eliminarea duplicatelor de codeshare
const removeDuplicateCodeshares = (routes: WeeklyScheduleData[]): WeeklyScheduleData[] => {
  const routeMap = new Map<string, WeeklyScheduleData>()
  
  routes.forEach(route => {
    const routeKey = `${route.airport}-${route.destination}`
    const isCodeshare = isCodeshareFlightNumber(route.flightNumber, route.airline)
    
    if (!routeMap.has(routeKey)) {
      // Prima rută pentru această destinație
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
        // Ambele sunt de același tip, combină datele
        const combinedRoute: WeeklyScheduleData = {
          ...existingRoute,
          airline: existingRoute.airline === route.airline ? 
            existingRoute.airline : 
            `${existingRoute.airline}, ${route.airline}`,
          flightNumber: existingRoute.flightNumber === route.flightNumber ?
            existingRoute.flightNumber :
            `${existingRoute.flightNumber}, ${route.flightNumber}`,
          frequency: existingRoute.frequency + route.frequency,
          weeklyPattern: {
            monday: existingRoute.weeklyPattern.monday || route.weeklyPattern.monday,
            tuesday: existingRoute.weeklyPattern.tuesday || route.weeklyPattern.tuesday,
            wednesday: existingRoute.weeklyPattern.wednesday || route.weeklyPattern.wednesday,
            thursday: existingRoute.weeklyPattern.thursday || route.weeklyPattern.thursday,
            friday: existingRoute.weeklyPattern.friday || route.weeklyPattern.friday,
            saturday: existingRoute.weeklyPattern.saturday || route.weeklyPattern.saturday,
            sunday: existingRoute.weeklyPattern.sunday || route.weeklyPattern.sunday,
          }
        }
        routeMap.set(routeKey, combinedRoute)
      }
    }
  })
  
  return Array.from(routeMap.values())
}

export default function WeeklyScheduleViewReliable({ className = '', initialAirportFilter = '' }: WeeklyScheduleViewProps) {
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

  // Helper function to convert airport codes to display names
  const getAirportDisplayName = (code: string): string => {
    if (!code) return 'Aeroport necunoscut'
    
    if (code.includes('(') || code.length > 3) {
      return code
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
      'BEG': 'Belgrad'
    }
    
    const upperCode = code ? code.toUpperCase() : ''
    return internationalAirports[upperCode] || code || 'Necunoscut'
  }

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Elimină duplicatele de codeshare ÎNAINTE de conversie
        const deduplicatedData = removeDuplicateCodeshares(data.data)
        
        // Convert airport codes to city names
        const processedData = deduplicatedData.map((item: WeeklyScheduleData) => ({
          ...item,
          airport: getAirportDisplayName(item.airport),
          destination: getAirportDisplayName(item.destination)
        }))
        
        setScheduleData(processedData)
        setFilteredData(processedData)
        
        // Set data range if available
        if (data.dataRange) {
          setDataRange(data.dataRange)
        }
      } else {
        setError(data.error || 'Failed to load schedule data')
      }
    } catch (err) {
      setError('Network error loading schedule data')
      console.error('Error loading schedule data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Group similar routes and apply filters/sorting
  useEffect(() => {
    if (!mounted) return
    
    let filtered = [...scheduleData]
    
    // Apply airport filter
    if (airportFilter) {
      filtered = filtered.filter(item => 
        item.airport.toLowerCase().includes(airportFilter.toLowerCase())
      )
    }
    
    // Apply search query (search in destinations)
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.airport.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort by destination name for better UX
    filtered.sort((a, b) => a.destination.localeCompare(b.destination))
    
    setFilteredData(filtered)
  }, [scheduleData, airportFilter, searchQuery, mounted])

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
      
      const totalFlights = routes.reduce((sum, r) => sum + r.frequency, 0)
      
      destinations.push({
        destination,
        routes,
        weeklyPattern: combinedPattern,
        totalFlights
      })
    })
    
    return destinations.sort((a, b) => a.destination.localeCompare(b.destination))
  }

  // Get destinations for a specific day
  const getDestinationsForDay = (day: DayOfWeek): WeeklyScheduleData[] => {
    if (!mounted) return []
    
    return filteredData
      .filter(route => route.weeklyPattern[day])
      .sort((a, b) => a.destination.localeCompare(b.destination))
  }

  // Handle mounting for hydration
  useEffect(() => {
    setMounted(true)
    loadScheduleData()
  }, [])

  // Get unique values for filter dropdowns
  const departureAirports = mounted ? [...new Set(scheduleData.map(item => item.airport))]
    .filter(airport => airport && airport.length > 0)
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {departureAirports.map(airport => (
                <option key={airport} value={airport}>{airport}</option>
              ))}
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
              <tr key={dest.destination} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center space-x-2">
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {destinations.map((dest) => (
          <div key={dest.destination} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
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
            {destinationsForSelectedDay.map((route, index) => (
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
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Companie:</span> {route.airline.length > 30 ? `${route.airline.substring(0, 30)}...` : route.airline}
                  </div>
                  
                  {/* Weekly pattern indicators */}
                  <div className="flex items-center space-x-1 pt-2">
                    <span className="text-xs text-gray-500">Zile:</span>
                    {days.map((day, dayIndex) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}