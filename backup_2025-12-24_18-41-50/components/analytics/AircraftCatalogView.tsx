'use client'

import { useState, useEffect } from 'react'
import { Search, Plane, Calendar, MapPin, AlertCircle, ExternalLink } from 'lucide-react'
import { AircraftInfo } from '@/lib/flightAnalyticsService'

interface Props {
  initialSearch?: string
  initialType: 'icao24' | 'registration'
}

export function AircraftCatalogView({ initialSearch, initialType }: Props) {
  const [aircraft, setAircraft] = useState<AircraftInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState(initialSearch || '')
  const [searchType, setSearchType] = useState(initialType)
  const [hasSearched, setHasSearched] = useState(false)

  // Perform search
  const performSearch = async () => {
    if (!search.trim()) {
      setError('Introduceți un termen de căutare')
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)
    
    try {
      const params = new URLSearchParams({
        q: search.trim(),
        type: searchType
      })
      
      const response = await fetch(`/api/aeronave?${params}`)
      
      if (!response.ok) {
        throw new Error('Eroare la căutarea aeronavelor')
      }
      
      const data = await response.json()
      setAircraft(data.aircraft || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  // Initial search if search param provided
  useEffect(() => {
    if (initialSearch) {
      performSearch()
    }
  }, [])

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Necunoscut'
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format delay
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search Type */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSearchType('icao24')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'icao24'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                ICAO24
              </button>
              <button
                type="button"
                onClick={() => setSearchType('registration')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'registration'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Înmatriculare
              </button>
            </div>

            {/* Search Input */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    searchType === 'icao24' 
                      ? 'Introduceți ICAO24 (ex: 4A1234)' 
                      : 'Introduceți înmatricularea (ex: YR-ABC)'
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Căutare...' : 'Căutare'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Se caută aeronavele...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={performSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Încearcă din nou
            </button>
          </div>
        </div>
      )}

      {!loading && !error && hasSearched && aircraft.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Plane className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nu au fost găsite aeronave pentru termenul căutat "{search}".
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Încercați cu un alt termen de căutare sau verificați ortografia.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && aircraft.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Rezultate Căutare
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {aircraft.length} aeronave găsite
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {aircraft.map((plane, index) => (
              <div key={plane.icao24} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        <Plane className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plane.registration}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          ICAO24: {plane.icao24}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Model</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{plane.model}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Producător</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{plane.manufacturer}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Operator</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{plane.operator}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Primul zbor</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(plane.firstFlightDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{plane.totalFlights.toLocaleString()}</span> zboruri totale
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Întârziere medie: <span className="font-medium">{formatDelay(plane.averageDelay)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <a
                      href={`/aeronave/${plane.icao24}`}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Detalii
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {!hasSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Plane className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Bun venit în Catalogul de Aeronave
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Căutați aeronave după ICAO24 sau numărul de înmatriculare pentru a vedea informații detaliate, 
              istoric zboruri și statistici de performanță.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Căutare ICAO24</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Codul ICAO24 este un identificator unic de 6 caractere hexadecimale 
                  atribuit fiecărei aeronave (ex: 4A1234).
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Căutare Înmatriculare</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Numărul de înmatriculare este codul vizibil pe aeronavă, 
                  pentru România începe cu YR- (ex: YR-ABC).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}