// React Hook for Proximity Search

import { useState, useCallback, useEffect, useRef } from 'react'
import { ProximityResult, AirportWithDistance } from './types'
import { getProximityService, formatDrivingTime, formatDistance } from './proximity-service'

interface UseProximitySearchOptions {
  availableDestinations?: string[]
  debounceMs?: number
}

interface UseProximitySearchReturn {
  search: (city: string) => Promise<void>
  result: ProximityResult | null
  isSearching: boolean
  isCalculatingRoutes: boolean
  error: string | null
  clearResult: () => void
}

export function useProximitySearch(options: UseProximitySearchOptions = {}): UseProximitySearchReturn {
  const { availableDestinations = [], debounceMs = 2000 } = options  // 2 seconds debounce
  
  const [result, setResult] = useState<ProximityResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const proximityService = getProximityService()

  // Update available destinations when they change
  useEffect(() => {
    if (availableDestinations.length > 0) {
      proximityService.setAvailableDestinations(availableDestinations)
    }
  }, [availableDestinations])

  const search = useCallback(async (city: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!city || city.trim().length < 2) {
      setResult(null)
      setError(null)
      return
    }

    // Debounce the search
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      setError(null)

      try {
        // First phase: geocoding and Haversine
        setIsCalculatingRoutes(false)
        
        const searchResult = await proximityService.findNearbyAirports(city.trim())
        
        // If we have nearby airports, we're calculating routes
        if (searchResult.nearbyAirports.length > 0 && !searchResult.hasDirectFlights) {
          setIsCalculatingRoutes(true)
        }
        
        setResult(searchResult)
        setIsCalculatingRoutes(false)
      } catch (err) {
        console.error('Proximity search error:', err)
        setError('A apărut o eroare la căutare. Încearcă din nou.')
        setResult(null)
      } finally {
        setIsSearching(false)
        setIsCalculatingRoutes(false)
      }
    }, debounceMs)
  }, [debounceMs])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    search,
    result,
    isSearching,
    isCalculatingRoutes,
    error,
    clearResult
  }
}

// Helper component props for displaying results
export interface ProximityResultDisplayProps {
  result: ProximityResult
  onSelectAirport?: (airport: AirportWithDistance) => void
}

// Format airport result for display
export function formatAirportResult(airport: AirportWithDistance): {
  title: string
  subtitle: string
  distance: string
  drivingTime: string | null
} {
  return {
    title: `${airport.city} (${airport.code})`,
    subtitle: airport.country,
    distance: formatDistance(airport.distanceKm),
    drivingTime: airport.drivingTimeSeconds ? formatDrivingTime(airport.drivingTimeSeconds) : null
  }
}
