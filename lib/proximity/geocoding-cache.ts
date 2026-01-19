// Geocoding Cache - stores results to avoid repeated API calls

import { GeocodingCache, GeocodingResult, PROXIMITY_CONFIG } from './types'

const CACHE_KEY = 'flyFinder_geocodingCache'

/**
 * Get cached geocoding result
 */
export function getCachedGeocode(city: string): GeocodingResult | null {
  if (typeof window === 'undefined') {
    // Server-side: use in-memory cache
    return serverCache[normalizeKey(city)]?.result || null
  }
  
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) return null
    
    const cache: GeocodingCache = JSON.parse(cacheStr)
    const key = normalizeKey(city)
    const entry = cache[key]
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > PROXIMITY_CONFIG.CACHE_EXPIRY_MS) {
      // Remove expired entry
      delete cache[key]
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      return null
    }
    
    return entry.result
  } catch (e) {
    console.error('Error reading geocoding cache:', e)
    return null
  }
}

/**
 * Save geocoding result to cache
 */
export function setCachedGeocode(city: string, result: GeocodingResult): void {
  if (typeof window === 'undefined') {
    // Server-side: use in-memory cache
    serverCache[normalizeKey(city)] = { result, timestamp: Date.now() }
    return
  }
  
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    const cache: GeocodingCache = cacheStr ? JSON.parse(cacheStr) : {}
    
    cache[normalizeKey(city)] = {
      result,
      timestamp: Date.now()
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Error saving to geocoding cache:', e)
  }
}

/**
 * Clear all cached geocoding results
 */
export function clearGeocodingCache(): void {
  if (typeof window === 'undefined') {
    Object.keys(serverCache).forEach(key => delete serverCache[key])
    return
  }
  
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (e) {
    console.error('Error clearing geocoding cache:', e)
  }
}

/**
 * Normalize city name for cache key
 */
function normalizeKey(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '_')
}

// Server-side in-memory cache
const serverCache: GeocodingCache = {}
