'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Plane, MapPin, Users, TrendingUp, RefreshCw } from 'lucide-react'
import { flightPlannerService, FlightPlannerFilters, FlightOption, PlannerStats } from '@/lib/flightPlannerService'
import { FlightPlannerFilters as FilterComponent } from './FlightPlannerFilters'
import { FlightOptionsGrid } from './FlightOptionsGrid'
import { PlannerStatsCard } from './PlannerStatsCard'

export function FlightPlannerView() {
  const [filters, setFilters] = useState<FlightPlannerFilters>({
    departureDays: ['friday', 'thursday', 'saturday'], // Friday ±1
    returnDays: ['sunday', 'saturday', 'monday'], // Sunday ±1
    departureTimeSlot: 'evening',
    returnTimeSlot: 'evening'
  })
  
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([])
  const [stats, setStats] = useState<PlannerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)

  // Load initial data and stats
  useEffect(() => {
    loadStats()
    performSearch()
  }, [])

  const loadStats = async () => {
    try {
      const plannerStats = await flightPlannerService.getPlannerStats()
      setStats(plannerStats)
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
      
      const options = await flightPlannerService.findFlightOptions(searchFilters)
      setFlightOptions(options)
      setLastSearchTime(new Date())
      
      // Update stats after search
      await loadStats()
      
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

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await flightPlannerService.refreshCachedData()
      await performSearch()
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError('Eroare la actualizarea datelor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && (
        <PlannerStatsCard stats={stats} />
      )}

      {/* Search Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-primary-600" />
            Preferințele tale de călătorie
          </h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizează</span>
          </button>
        </div>
        
        <FilterComponent
          filters={filters}
          onChange={handleFiltersChange}
          loading={loading}
        />
      </div>

      {/* Search Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Plane className="h-6 w-6 mr-2 text-primary-600" />
            Opțiuni de zbor disponibile
          </h2>
          {lastSearchTime && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ultima căutare: {lastSearchTime.toLocaleTimeString('ro-RO')}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
              <span className="text-gray-600 dark:text-gray-300">
                Căutăm zborurile perfecte pentru tine...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400">
                <strong>Eroare:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && flightOptions.length === 0 && (
          <div className="text-center py-12">
            <Plane className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nu am găsit zboruri pentru aceste preferințe
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Încearcă să modifici zilele sau intervalele orare pentru mai multe opțiuni.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Sugestie:</strong> Extinde căutarea la ±2 zile sau încearcă intervale orare diferite.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && flightOptions.length > 0 && (
          <>
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center text-green-800 dark:text-green-200">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  Găsit {flightOptions.length} destinații cu {flightOptions.reduce((sum, opt) => sum + opt.totalOptions, 0)} combinații de zboruri
                </span>
              </div>
            </div>
            
            <FlightOptionsGrid options={flightOptions} />
          </>
        )}
      </div>

      {/* Usage Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Sfaturi pentru utilizare
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎯 Flexibilitate maximă</h4>
            <p>Selectează zilele cu ±1 zi pentru mai multe opțiuni. Dacă vrei să pleci vineri, sistemul va căuta și joi și sâmbătă.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">⏰ Intervale orare</h4>
            <p>Dimineața (06-12), Amiaza (12-18), Seara (18-24). Alege intervalul care ți se potrivește cel mai bine.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔄 Date actualizate</h4>
            <p>Folosim doar datele din cache-ul local pentru performanță maximă. Apasă "Actualizează" pentru date fresh.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">📊 Comparare ușoară</h4>
            <p>Vezi toate opțiunile într-o singură privire: ore exacte, aeroporturi, companii aeriene și numărul de opțiuni.</p>
          </div>
        </div>
      </div>
    </div>
  )
}