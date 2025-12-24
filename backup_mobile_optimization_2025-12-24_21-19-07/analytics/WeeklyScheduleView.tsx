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

export default function WeeklyScheduleView({ className = '', initialAirportFilter = '' }: WeeklyScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData[]>([])
  const [filteredData, setFilteredData] = useState<WeeklyScheduleData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [autoUpdateEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataRange, setDataRange] = useState<{ from: string; to: string } | null>(null)
  
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
    // Handle undefined or null code
    if (!code) return 'Unknown Airport'
    
    // Handle cases where code might already be a city name or contain parentheses
    if (code.includes('(') || code.length > 3) {
      return code
    }
    
    // First check Romanian/Moldovan airports
    const airport = MAJOR_AIRPORTS.find(a => a.code === code.toUpperCase())
    if (airport) {
      return airport.city
    }
    
    // For international airports, use a basic mapping for common ones
    const internationalAirports: { [key: string]: string } = {
      // France
      'BVA': 'Paris (Beauvais)',
      'CDG': 'Paris (Charles de Gaulle)',
      'ORY': 'Paris (Orly)',
      'LYS': 'Lyon',
      'MRS': 'Marseille',
      'NCE': 'Nisa',
      'TLS': 'Toulouse',
      'BOD': 'Bordeaux',
      'NTE': 'Nantes',
      'SXB': 'Strasbourg',
      
      // UK & Ireland
      'LHR': 'Londra (Heathrow)',
      'LGW': 'Londra (Gatwick)',
      'STN': 'Londra (Stansted)',
      'LTN': 'Londra (Luton)',
      'LBA': 'Leeds',
      'EDI': 'Edinburgh',
      'GLA': 'Glasgow',
      'MAN': 'Manchester',
      'BHX': 'Birmingham',
      'LPL': 'Liverpool',
      'NCL': 'Newcastle',
      'BRS': 'Bristol',
      'CWL': 'Cardiff',
      'BFS': 'Belfast',
      'DUB': 'Dublin',
      'ORK': 'Cork',
      
      // Italy
      'FCO': 'Roma (Fiumicino)',
      'CIA': 'Roma (Ciampino)',
      'MXP': 'Milano (Malpensa)',
      'BGY': 'Milano (Bergamo)',
      'LIN': 'Milano (Linate)',
      'VRN': 'Verona',
      'TSF': 'Treviso',
      'VCE': 'Veneția',
      'BLQ': 'Bologna',
      'FLR': 'Florența',
      'PSA': 'Pisa',
      'PSR': 'Pescara',
      'TRN': 'Torino',
      'GRO': 'Girona',
      'NAP': 'Napoli',
      'CTA': 'Catania',
      'PMO': 'Palermo',
      'CAG': 'Cagliari',
      'BRI': 'Bari',
      'BDS': 'Brindisi',
      'REG': 'Reggio Calabria',
      'LMP': 'Lampedusa',
      'PNL': 'Pantelleria',
      
      // Germany
      'MUC': 'München',
      'FRA': 'Frankfurt',
      'DUS': 'Düsseldorf',
      'CGN': 'Köln',
      'DTM': 'Dortmund',
      'HAM': 'Hamburg',
      'BER': 'Berlin',
      'SXF': 'Berlin (Schönefeld)',
      'TXL': 'Berlin (Tegel)',
      'STR': 'Stuttgart',
      'NUE': 'Nürnberg',
      'HHN': 'Frankfurt (Hahn)',
      'FKB': 'Karlsruhe/Baden-Baden',
      'LEJ': 'Leipzig',
      'DRS': 'Dresden',
      'HAN': 'Hannover',
      'BRE': 'Bremen',
      
      // Netherlands & Belgium
      'AMS': 'Amsterdam',
      'RTM': 'Rotterdam',
      'EIN': 'Eindhoven',
      'MST': 'Maastricht',
      'BRU': 'Bruxelles',
      'CRL': 'Bruxelles (Charleroi)',
      'ANR': 'Antwerp',
      'LGG': 'Liège',
      
      // Spain & Portugal
      'MAD': 'Madrid',
      'BCN': 'Barcelona',
      'AGP': 'Málaga',
      'VLC': 'Valencia',
      'PMI': 'Palma de Mallorca',
      'SVQ': 'Sevilla',
      'BIO': 'Bilbao',
      'SDR': 'Santander',
      'LCG': 'A Coruña',
      'VGO': 'Vigo',
      'LIS': 'Lisabona',
      'OPO': 'Porto',
      'FAO': 'Faro',
      'FNC': 'Funchal',
      'TER': 'Terceira',
      
      // Switzerland & Austria
      'ZUR': 'Zürich',
      'ZRH': 'Zürich',
      'GVA': 'Geneva',
      'BSL': 'Basel',
      'BRN': 'Berna',
      'VIE': 'Viena',
      'SZG': 'Salzburg',
      'GRZ': 'Graz',
      'INN': 'Innsbruck',
      'LNZ': 'Linz',
      'KLU': 'Klagenfurt',
      
      // Scandinavia
      'CPH': 'Copenhaga',
      'BLL': 'Billund',
      'AAL': 'Aalborg',
      'ARN': 'Stockholm',
      'GOT': 'Göteborg',
      'MMX': 'Malmö',
      'OSL': 'Oslo',
      'BGO': 'Bergen',
      'TRD': 'Trondheim',
      'SVG': 'Stavanger',
      'HEL': 'Helsinki',
      'TMP': 'Tampere',
      'TKU': 'Turku',
      'OUL': 'Oulu',
      'RVN': 'Rovaniemi',
      
      // Turkey
      'IST': 'Istanbul',
      'SAW': 'Istanbul (Sabiha)',
      'AYT': 'Antalya',
      'ESB': 'Ankara',
      'ADB': 'Izmir',
      'BJV': 'Bodrum',
      'DLM': 'Dalaman',
      'GZT': 'Gaziantep',
      'TZX': 'Trabzon',
      
      // Greece & Cyprus
      'ATH': 'Atena',
      'SKG': 'Thessaloniki',
      'HER': 'Heraklion',
      'CHQ': 'Chania',
      'RHO': 'Rodos',
      'KOS': 'Kos',
      'CFU': 'Corfu',
      'ZTH': 'Zakynthos',
      'JTR': 'Santorini',
      'MYK': 'Mykonos',
      'LCA': 'Larnaca',
      'PFO': 'Paphos',
      
      // Eastern Europe
      'SOF': 'Sofia',
      'VAR': 'Varna',
      'BOJ': 'Burgas',
      'PDV': 'Plovdiv',
      'BEG': 'Belgrad',
      'NIS': 'Niš',
      'ZAG': 'Zagreb',
      'SPU': 'Split',
      'DBV': 'Dubrovnik',
      'ZAD': 'Zadar',
      'PUY': 'Pula',
      'RJK': 'Rijeka',
      'LJU': 'Ljubljana',
      'MBX': 'Maribor',
      'BUD': 'Budapesta',
      'DEB': 'Debrecen',
      'PEV': 'Pécs',
      'SOB': 'Szeged',
      'PRG': 'Praga',
      'BRQ': 'Brno',
      'OSR': 'Ostrava',
      'PED': 'Pardubice',
      'WAW': 'Varșovia',
      'WMI': 'Varșovia (Modlin)',
      'KRK': 'Cracovia',
      'GDN': 'Gdansk',
      'WRO': 'Wrocław',
      'KTW': 'Katowice',
      'POZ': 'Poznań',
      'SZZ': 'Szczecin',
      'LUZ': 'Lublin',
      'RZE': 'Rzeszów',
      
      // Balkans
      'SKP': 'Skopje',
      'OHD': 'Ohrid',
      'TGD': 'Podgorica',
      'TIV': 'Tivat',
      'SJJ': 'Sarajevo',
      'OMO': 'Mostar',
      'TZL': 'Tuzla',
      'BNX': 'Banja Luka',
      
      // Middle East & North Africa
      'TLV': 'Tel Aviv',
      'VDA': 'Eilat',
      'HFA': 'Haifa',
      'DOH': 'Doha',
      'DXB': 'Dubai',
      'EVN': 'Erevan',
      'BTS': 'Bratislava',
      'CAI': 'Cairo',
      'HRG': 'Hurghada',
      'SSH': 'Sharm el-Sheikh',
      'LXR': 'Luxor',
      'ASW': 'Aswan',
      'RMF': 'Marsa Alam',
      'TUN': 'Tunis',
      'MIR': 'Monastir',
      'DJE': 'Djerba',
      'SFA': 'Sfax',
      'CMN': 'Casablanca',
      'RAK': 'Marrakech',
      'AGA': 'Agadir',
      'FEZ': 'Fez',
      'TNG': 'Tanger',
      'NDR': 'Nador',
      'OUD': 'Oujda',
      
      // Luxembourg & Monaco
      'LUX': 'Luxemburg',
      'MCM': 'Monaco',
      
      // Malta
      'MLA': 'Malta',
      
      // Iceland
      'KEF': 'Reykjavik',
      'AEY': 'Akureyri',
      
      // Baltic States
      'RIX': 'Riga',
      'VNO': 'Vilnius',
      'KUN': 'Kaunas',
      'TLL': 'Tallinn',
      'TRU': 'Tartu',
      
      // Russia & CIS
      'SVO': 'Moscova (Sheremetyevo)',
      'DME': 'Moscova (Domodedovo)',
      'VKO': 'Moscova (Vnukovo)',
      'LED': 'Sankt Petersburg',
      'KZN': 'Kazan',
      'ROV': 'Rostov-pe-Don',
      'VOG': 'Volgograd',
      'KRR': 'Krasnodar',
      'AER': 'Soci',
      'UFA': 'Ufa',
      'SVX': 'Ekaterinburg',
      'OVB': 'Novosibirsk',
      'KJA': 'Krasnoyarsk',
      'IKT': 'Irkutsk',
      'VVO': 'Vladivostok',
      'KHV': 'Habarovsk',
      'YKS': 'Yakutsk',
      'MAG': 'Magadan',
      'PKC': 'Petropavlovsk-Kamchatsky',
      'KGD': 'Kaliningrad',
      'MRV': 'Mineralnye Vody',
      'STW': 'Stavropol',
      'ASF': 'Astrakhan',
      'PEE': 'Perm',
      'CEK': 'Chelyabinsk',
      'TJM': 'Tyumen',
      'OMS': 'Omsk',
      'BAX': 'Barnaul',
      'TOF': 'Tomsk',
      'KEJ': 'Kemerovo',
      'SUR': 'Surgut',
      'NJC': 'Nizhnevartovsk',
      'HMA': 'Khanty-Mansiysk',
      'NYM': 'Nadym',
      'ABA': 'Abakan',
      'KYZ': 'Kyzyl',
      'UUD': 'Ulan-Ude',
      'CHT': 'Chita',
      'BQS': 'Blagoveshchensk',
      'DYR': 'Anadyr',
      'PWE': 'Pevek',
      'TIK': 'Tiksi',
      'ARH': 'Arkhangelsk',
      'MMK': 'Murmansk',
      'PES': 'Petrozavodsk',
      'JOK': 'Yoshkar-Ola',
      'CSY': 'Cheboksary',
      'ULV': 'Ulyanovsk',
      'PZA': 'Penza',
      'LPK': 'Lipetsk',
      'VOR': 'Voronezh',
      'KUF': 'Samara',
      'TOL': 'Togliatti',
      'RTW': 'Saratov',
      'EGO': 'Belgorod',
      'KUR': 'Kursk',
      'ORL': 'Orel',
      'TBW': 'Tambov',
      'RYB': 'Rybinsk',
      'IAR': 'Yaroslavl',
      'KLD': 'Kaluga',
      'TLA': 'Tula',
      'VKT': 'Vorkuta',
      'NNM': 'Naryan-Mar',
      'AMV': 'Amderma',
      'KTT': 'Kittilä'
    }
    
    const upperCode = code ? code.toUpperCase() : ''
    return internationalAirports[upperCode] || code || 'Unknown'
  }

  // Get Romanian and Moldovan airports for filters
  const romanianMoldovanAirports = MAJOR_AIRPORTS.filter(airport => 
    airport.country === 'România' || airport.country === 'Moldova'
  )

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      console.log('[WeeklySchedule] Starting to load schedule data...')
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule?action=get')
      console.log('[WeeklySchedule] API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[WeeklySchedule] API response data:', { success: data.success, count: data.count })
      
      if (data.success) {
        console.log(`[WeeklySchedule] Received ${data.data.length} schedule entries from API`)
        
        // Convert airport codes to city names synchronously using MAJOR_AIRPORTS
        try {
          console.log('[WeeklySchedule] Starting airport code conversion...')
          const processedData = data.data.map((item: WeeklyScheduleData, index: number) => {
            if (index < 5) {
              console.log(`[WeeklySchedule] Processing item ${index}:`, { airport: item.airport, destination: item.destination })
            }
            return {
              ...item,
              airport: getAirportDisplayName(item.airport),
              destination: getAirportDisplayName(item.destination)
            }
          })
          
          console.log(`[WeeklySchedule] Processed ${processedData.length} schedule entries, converted IATA codes to city names`)
          
          setScheduleData(processedData)
          setFilteredData(processedData)
        } catch (error) {
          console.error('[WeeklySchedule] Error processing schedule data:', error)
          // Fallback: use raw data without conversion
          console.log('[WeeklySchedule] Using fallback - raw data without conversion')
          setScheduleData(data.data)
          setFilteredData(data.data)
        }
        
        // Set data range if available
        if (data.dataRange) {
          console.log('[WeeklySchedule] Setting data range:', data.dataRange)
          setDataRange(data.dataRange)
        }
        
        console.log('[WeeklySchedule] Data loading completed successfully')
      } else {
        const errorMsg = data.error || 'Failed to load schedule data'
        console.error('[WeeklySchedule] API returned error:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      const errorMsg = 'Network error loading schedule data'
      console.error('[WeeklySchedule] Network error:', err)
      setError(errorMsg)
    } finally {
      console.log('[WeeklySchedule] Setting loading to false')
      setLoading(false)
    }
  }

  // Auto-update schedule table from cache (runs automatically)
  const updateScheduleTable = async () => {
    try {
      setUpdating(true)
      setError(null)
      
      const response = await fetch('/api/admin/weekly-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadScheduleData() // Reload data after update
      } else {
        setError(data.error || 'Failed to update schedule table')
      }
    } catch (err) {
      setError('Network error updating schedule table')
      console.error('Error updating schedule table:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Group similar routes and apply filters/sorting
  useEffect(() => {
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
    
    // Group similar routes (same origin-destination pair)
    const routeGroups = new Map<string, WeeklyScheduleData[]>()
    
    filtered.forEach(item => {
      const routeKey = `${item.airport} → ${item.destination}`
      if (!routeGroups.has(routeKey)) {
        routeGroups.set(routeKey, [])
      }
      routeGroups.get(routeKey)!.push(item)
    })
    
    // Create grouped data with combined information
    const groupedData: WeeklyScheduleData[] = []
    
    routeGroups.forEach((flights, routeKey) => {
      if (flights.length === 1) {
        // Single flight, keep as is
        groupedData.push(flights[0])
      } else {
        // Multiple flights on same route, create grouped entry
        const airlines = [...new Set(flights.map(f => f.airline))].join(', ')
        const flightNumbers = flights.map(f => f.flightNumber).join(', ')
        const totalFrequency = flights.reduce((sum, f) => sum + f.frequency, 0)
        
        // Combine weekly patterns (OR operation)
        const combinedPattern = {
          monday: flights.some(f => f.weeklyPattern.monday),
          tuesday: flights.some(f => f.weeklyPattern.tuesday),
          wednesday: flights.some(f => f.weeklyPattern.wednesday),
          thursday: flights.some(f => f.weeklyPattern.thursday),
          friday: flights.some(f => f.weeklyPattern.friday),
          saturday: flights.some(f => f.weeklyPattern.saturday),
          sunday: flights.some(f => f.weeklyPattern.sunday)
        }
        
        groupedData.push({
          airport: flights[0].airport,
          destination: flights[0].destination,
          airline: airlines,
          flightNumber: flightNumbers,
          weeklyPattern: combinedPattern,
          frequency: totalFrequency,
          lastUpdated: flights[0].lastUpdated,
          dataSource: flights[0].dataSource
        })
      }
    })
    
    // Sort by destination name for better UX
    groupedData.sort((a, b) => a.destination.localeCompare(b.destination))
    
    setFilteredData(groupedData)
  }, [scheduleData, airportFilter, searchQuery])

  // Process data for destinations matrix view
  const getDestinationsMatrix = (): DestinationRoute[] => {
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
    return filteredData
      .filter(route => route.weeklyPattern[day])
      .sort((a, b) => a.destination.localeCompare(b.destination))
  }

  // Handle URL parameters for pre-filtering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const airportParam = urlParams.get('airport')
      if (airportParam && airportParam !== airportFilter) {
        setAirportFilter(airportParam)
      }
    }
  }, [])

  // Load data on component mount and set up auto-update
  useEffect(() => {
    loadScheduleData()
    
    // Auto-update schedule table on first load if no data exists
    const autoUpdate = async () => {
      try {
        const response = await fetch('/api/admin/weekly-schedule?action=get')
        const data = await response.json()
        
        if (data.success && data.count === 0) {
          console.log('No schedule data found, auto-updating from cache...')
          setUpdating(true)
          
          const updateResponse = await fetch('/api/admin/weekly-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update' })
          })
          
          const updateData = await updateResponse.json()
          
          if (updateData.success) {
            console.log('Schedule updated successfully, reloading data...')
            await loadScheduleData()
          } else {
            console.error('Failed to update schedule:', updateData.error)
            setError(updateData.error || 'Failed to auto-update schedule')
          }
          
          setUpdating(false)
        }
      } catch (err) {
        console.error('Auto-update error:', err)
        setError('Failed to auto-update schedule data')
        setUpdating(false)
      }
    }
    
    autoUpdate()
    
    // Set up periodic auto-update every 30 minutes
    const interval = setInterval(() => {
      if (autoUpdateEnabled) {
        console.log('Auto-updating weekly schedule from cache...')
        updateScheduleTable()
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    return () => clearInterval(interval)
  }, [autoUpdateEnabled])

  // Get unique values for filter dropdowns from Romanian and Moldovan airports
  const departureAirports = [...new Set(scheduleData.map(item => item.airport))]
    .filter(airport => airport && airport.length > 0)
    .sort()

  if (loading) {
    console.log('[WeeklySchedule] Rendering loading state')
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
    console.log('[WeeklySchedule] Rendering error state:', error)
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

  console.log('[WeeklySchedule] Rendering main content with', filteredData.length, 'entries')

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
                {filteredData.length} rute disponibile
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

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
              Se generează programul săptămânal...
            </h4>
            <p className="text-gray-600 mb-4">
              Sistemul procesează automat datele pentru a genera programul săptămânal.
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
              Afișate: {filteredData.length} din {scheduleData.length} rute
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
          {destinations.length} destinații disponibile
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
                    {dest.routes.length} rută{dest.routes.length !== 1 ? 'e' : ''}
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
                {dest.totalFlights} zboruri
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{dayShortLabels[index]}</div>
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
          {destinationsForSelectedDay.length} destinații în {dayLabels[selectedDay]}
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