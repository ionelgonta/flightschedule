'use client'

import { useState, useEffect } from 'react'
import { Search, Plane, Calendar, Clock, MapPin, TrendingUp, Sparkles, Filter } from 'lucide-react'
// Types for the planner
interface FlightPlannerFilters {
  departureDays: string[]
  returnDays: string[]
  departureTimeSlot: 'morning' | 'afternoon' | 'evening'
  returnTimeSlot: 'morning' | 'afternoon' | 'evening'
  departureDayFlexibility?: number
  returnDayFlexibility?: number
  originAirports?: string[]
}

interface FlightOption {
  destination: {
    code: string
    name: string
    city: string
    country: string
  }
  outboundFlights: FlightMatch[]
  returnFlights: FlightMatch[]
  totalOptions: number
}

interface FlightMatch {
  flightNumber: string
  airline: {
    name: string
    code: string
  }
  origin: {
    code: string
    name: string
    city: string
  }
  destination: {
    code: string
    name: string
    city: string
  }
  scheduledTime: string
  dayOfWeek: string
  timeSlot: 'morning' | 'afternoon' | 'evening'
  status: string
  gate?: string
  terminal?: string
}

interface PlannerStats {
  totalAirportsScanned: number
  totalFlightsAnalyzed: number
  cacheHitRate: number
  lastUpdated: string
  availableDestinations: number
}
import { FlightPlannerFilters as FilterComponent } from './FlightPlannerFilters'
import { FlightOptionsGrid } from './FlightOptionsGrid'


export function FlightPlannerView() {
  const [filters, setFilters] = useState<FlightPlannerFilters>({
    departureDays: ['monday'], // Default: Monday
    returnDays: ['sunday'], // Default: Sunday
    departureTimeSlot: 'morning',
    returnTimeSlot: 'evening',
    departureDayFlexibility: 0, // ±0 days initially
    returnDayFlexibility: 0, // ±0 days initially
    originAirports: ['RMO'] // Default: Chișinău
  })
  
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([])
  const [stats, setStats] = useState<PlannerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Load initial data and stats
  useEffect(() => {
    loadStats()
    performSearch()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/planificator-zboruri?action=stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Error loading planner stats:', err)
    }
  }

  const performSearch = async (newFilters?: FlightPlannerFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchFilters = newFilters || filters
      console.log('Searching with filters:', searchFilters)
      
      const response = await fetch('/api/planificator-zboruri', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          filters: searchFilters
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setFlightOptions(data.data || [])
        setLastSearchTime(new Date())
        
        // Update stats after search
        await loadStats()
      } else {
        setError(data.error || 'Eroare la căutarea zborurilor')
      }
      
    } catch (err) {
      console.error('Error searching flights:', err)
      setError(err instanceof Error ? err.message : 'Eroare la căutarea zborurilor')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: FlightPlannerFilters) => {
    setFilters(newFilters)
    performSearch(newFilters)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section - Material Design M3 Style */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Planificator Zboruri Inteligent
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Găsește zborurile perfecte cu flexibilitate maximă. Caută după ziua preferată ±1, 2 sau 3 zile, 
              separat pentru plecare și întoarcere.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">




        {/* Search Interface - Material Design M3 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white">
                <Search className="h-6 w-6 mr-3" />
                <h2 className="text-2xl font-bold">Caută Zboruri</h2>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Simplu' : 'Avansat'}
              </button>
            </div>
          </div>
          
          <div className="p-8">
            <FilterComponent
              filters={filters}
              onChange={handleFiltersChange}
              loading={loading}
              showAdvanced={showAdvancedFilters}
            />
          </div>
        </div>

        {/* Search Results - Material Design Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Plane className="h-6 w-6 mr-3 text-blue-600" />
                Rezultate Căutare
              </h2>
              {lastSearchTime && (
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  Actualizat: {lastSearchTime.toLocaleTimeString('ro-RO')}
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="h-12 w-12 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                  <div className="absolute top-0 left-0 h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
                  Căutăm zborurile perfecte pentru tine...
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Analizăm {stats?.totalAirportsScanned || 16} aeroporturi și {stats?.totalFlightsAnalyzed || 0} zboruri
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl mr-4">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Eroare la căutare</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && flightOptions.length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nu am găsit destinații dus-întors
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Pentru criteriile selectate, nu există destinații cu zboruri atât la plecare cât și la întoarcere. Încearcă să modifici zilele sau intervalele orare.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 max-w-md mx-auto border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🚀 În curând:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                    <li>• Căutare inteligentă cu flexibilitate avansată</li>
                    <li>• Recomandări personalizate de destinații</li>
                    <li>• Compararea prețurilor și timpilor de zbor</li>
                    <li>• Alertele pentru zborurile preferate</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Între timp, poți consulta <a href="/program-zboruri" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">programul zborurilor</a> pentru informații actualizate.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && flightOptions.length > 0 && (
              <>
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center text-green-800 dark:text-green-200">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl mr-4">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Destinații cu zboruri dus-întors</h3>
                      <p className="text-sm mt-1">
                        {flightOptions.length} destinații complete • {flightOptions.reduce((sum, opt) => sum + opt.totalOptions, 0)} combinații dus-întors
                      </p>
                    </div>
                  </div>
                </div>
                
                <FlightOptionsGrid options={flightOptions} />
              </>
            )}
          </div>
        </div>

        {/* Usage Guide - Material Design */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Cum funcționează planificatorul?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Flexibilitate Zilelor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alege ziua preferată și setează flexibilitatea ±1, 2 sau 3 zile separat pentru plecare și întoarcere.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Intervale Orare</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dimineața (06-12), Amiaza (12-18), Seara (18-24). Personalizează pentru plecare și întoarcere.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Aeroporturi Multiple</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selectează unul sau mai multe aeroporturi de plecare din România și Moldova.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rezultate Inteligente</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vezi toate combinațiile posibile sortate după numărul de opțiuni disponibile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}