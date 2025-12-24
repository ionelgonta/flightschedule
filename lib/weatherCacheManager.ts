/**
 * Weather Cache Manager - Persistent weather data storage and management
 * Part of the Persistent Flight System architecture
 * Integrates with OpenWeatherMap API and provides fallback to cached data
 */

import * as fs from 'fs/promises'
import * as path from 'path'

export interface WeatherData {
  destination: string
  temperature: number
  feelsLike: number
  description: string
  icon: string
  windSpeed: number
  visibility: number
  flightImpact: FlightImpactLevel
  lastUpdated: Date
  source: 'api' | 'cache'
}

export interface FlightImpactLevel {
  severity: 'none' | 'low' | 'moderate' | 'high' | 'severe'
  description: string
  affectedOperations: string[]
}

export interface WeatherCacheEntry {
  destination: string
  data: WeatherData
  cachedAt: Date
  expiresAt: Date
  apiSource: string
}

/**
 * Weather Cache Manager class
 */
class WeatherCacheManager {
  private static instance: WeatherCacheManager
  private cacheFilePath: string
  private cache: Map<string, WeatherCacheEntry> = new Map()
  private isLoaded: boolean = false
  private readonly CACHE_DURATION_MINUTES = 30
  private readonly API_KEY = process.env.OPENWEATHER_API_KEY || '' // OpenWeatherMap API key from environment

  // Destination mapping for flight routes (IATA codes to city names)
  private readonly DESTINATION_MAPPING: { [key: string]: string } = {
    // Romanian airports
    'OTP': 'Bucharest',
    'BBU': 'Bucharest',
    'CLJ': 'Cluj-Napoca',
    'TSR': 'Timisoara',
    'IAS': 'Iasi',
    'CND': 'Constanta',
    'SBZ': 'Sibiu',
    'CRA': 'Craiova',
    'BCM': 'Bacau',
    'BAY': 'Baia Mare',
    'OMR': 'Oradea',
    'SCV': 'Suceava',
    'TGM': 'Targu Mures',
    'ARW': 'Arad',
    'SUJ': 'Satu Mare',
    'RMO': 'Chisinau',
    
    // Major European destinations
    'LHR': 'London',
    'CDG': 'Paris',
    'FRA': 'Frankfurt',
    'AMS': 'Amsterdam',
    'FCO': 'Rome',
    'MAD': 'Madrid',
    'BCN': 'Barcelona',
    'MUC': 'Munich',
    'VIE': 'Vienna',
    'ZUR': 'Zurich',
    'BRU': 'Brussels',
    'CPH': 'Copenhagen',
    'ARN': 'Stockholm',
    'OSL': 'Oslo',
    'HEL': 'Helsinki',
    'WAW': 'Warsaw',
    'PRG': 'Prague',
    'BUD': 'Budapest',
    'SOF': 'Sofia',
    'ATH': 'Athens',
    'IST': 'Istanbul',
    'DXB': 'Dubai',
    'DOH': 'Doha',
    'TLV': 'Tel Aviv'
  }

  private constructor() {
    this.cacheFilePath = path.join(process.cwd(), 'data', 'weather_cache.json')
  }

  static getInstance(): WeatherCacheManager {
    if (!WeatherCacheManager.instance) {
      WeatherCacheManager.instance = new WeatherCacheManager()
    }
    return WeatherCacheManager.instance
  }

  /**
   * Load weather cache from disk
   */
  async loadCache(): Promise<void> {
    if (this.isLoaded) return

    try {
      await fs.access(this.cacheFilePath)
      const data = await fs.readFile(this.cacheFilePath, 'utf-8')
      const entries: WeatherCacheEntry[] = JSON.parse(data)
      
      this.cache.clear()
      entries.forEach(entry => {
        // Convert date strings back to Date objects
        entry.cachedAt = new Date(entry.cachedAt)
        entry.expiresAt = new Date(entry.expiresAt)
        entry.data.lastUpdated = new Date(entry.data.lastUpdated)
        
        this.cache.set(entry.destination, entry)
      })

      console.log(`[Weather Cache] Loaded ${this.cache.size} weather entries from disk`)
    } catch (error) {
      console.log('[Weather Cache] No existing cache file found, starting fresh')
      this.cache.clear()
    }
    
    this.isLoaded = true
  }

  /**
   * Save weather cache to disk
   */
  private async saveCache(): Promise<void> {
    try {
      const dataDir = path.dirname(this.cacheFilePath)
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }

      const entries = Array.from(this.cache.values())
      await fs.writeFile(this.cacheFilePath, JSON.stringify(entries, null, 2), 'utf-8')
      
      console.log(`[Weather Cache] Saved ${entries.length} weather entries to disk`)
    } catch (error) {
      console.error('[Weather Cache] Failed to save cache to disk:', error)
    }
  }

  /**
   * Get weather data for a destination
   */
  async getWeatherData(destination: string): Promise<WeatherData> {
    await this.loadCache()

    const cityName = this.getCityName(destination)
    const cacheEntry = this.cache.get(cityName)

    // Check if we have valid cached data
    if (cacheEntry && !this.isWeatherDataStale(cityName)) {
      console.log(`[Weather Cache] Using cached weather data for ${cityName}`)
      return {
        ...cacheEntry.data,
        source: 'cache'
      }
    }

    // Try to fetch fresh data from API
    try {
      console.log(`[Weather Cache] Fetching fresh weather data for ${cityName}`)
      const freshData = await this.fetchWeatherFromAPI(cityName)
      
      // Update cache with fresh data
      await this.updateWeatherCache(cityName, freshData)
      
      return {
        ...freshData,
        source: 'api'
      }
    } catch (error) {
      console.error(`[Weather Cache] Failed to fetch weather data for ${cityName}:`, error)
      
      // Fallback to cached data even if stale
      if (cacheEntry) {
        console.log(`[Weather Cache] Using stale cached data for ${cityName} as fallback`)
        return {
          ...cacheEntry.data,
          source: 'cache'
        }
      }
      
      // Return default weather data if no cache available
      return this.getDefaultWeatherData(cityName)
    }
  }

  /**
   * Refresh weather cache for a destination
   */
  async refreshWeatherCache(destination: string): Promise<void> {
    await this.loadCache()

    const cityName = this.getCityName(destination)
    
    try {
      const weatherData = await this.fetchWeatherFromAPI(cityName)
      await this.updateWeatherCache(cityName, weatherData)
      console.log(`[Weather Cache] Updated weather cache for ${cityName}`)
    } catch (error) {
      console.error(`[Weather Cache] Failed to update weather cache for ${cityName}:`, error)
    }
  }

  /**
   * Check if weather data is stale (older than 30 minutes)
   */
  isWeatherDataStale(destination: string): boolean {
    const cityName = this.getCityName(destination)
    const cacheEntry = this.cache.get(cityName)
    
    if (!cacheEntry) return true
    
    const now = new Date()
    return now > cacheEntry.expiresAt
  }

  /**
   * Get last valid weather data for a destination
   */
  async getLastValidWeatherData(destination: string): Promise<WeatherData> {
    await this.loadCache()

    const cityName = this.getCityName(destination)
    const cacheEntry = this.cache.get(cityName)
    
    if (cacheEntry) {
      return {
        ...cacheEntry.data,
        source: 'cache'
      }
    }
    
    return this.getDefaultWeatherData(cityName)
  }

  /**
   * Update weather cache with new data
   */
  private async updateWeatherCache(cityName: string, weatherData: WeatherData): Promise<void> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION_MINUTES * 60 * 1000)

    const cacheEntry: WeatherCacheEntry = {
      destination: cityName,
      data: weatherData,
      cachedAt: now,
      expiresAt,
      apiSource: 'openweathermap'
    }

    this.cache.set(cityName, cacheEntry)
    await this.saveCache()
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  private async fetchWeatherFromAPI(cityName: string): Promise<WeatherData> {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${this.API_KEY}&units=metric`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      destination: cityName,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: Math.round(data.wind?.speed * 3.6) || 0, // Convert m/s to km/h
      visibility: Math.round((data.visibility || 10000) / 1000), // Convert m to km
      flightImpact: this.calculateFlightImpact(data),
      lastUpdated: new Date(),
      source: 'api'
    }
  }

  /**
   * Calculate flight impact based on weather conditions
   */
  private calculateFlightImpact(weatherData: any): FlightImpactLevel {
    const conditions = weatherData.weather[0]
    const main = weatherData.main
    const wind = weatherData.wind || {}
    const visibility = weatherData.visibility || 10000

    const affectedOperations: string[] = []
    let severity: FlightImpactLevel['severity'] = 'none'
    let description = 'Normal flight operations'

    // Check various weather conditions
    const windSpeed = wind.speed || 0
    const weatherId = conditions.id
    const temp = main.temp

    // Wind conditions
    if (windSpeed > 15) { // > 54 km/h
      severity = 'high'
      affectedOperations.push('takeoff', 'landing')
      description = 'Strong winds may cause delays'
    } else if (windSpeed > 10) { // > 36 km/h
      severity = 'moderate'
      affectedOperations.push('landing')
      description = 'Moderate winds may affect operations'
    }

    // Precipitation conditions
    if (weatherId >= 200 && weatherId < 300) { // Thunderstorm
      severity = 'severe'
      affectedOperations.push('takeoff', 'landing', 'ground_operations')
      description = 'Thunderstorms - significant delays expected'
    } else if (weatherId >= 500 && weatherId < 600) { // Rain
      if (weatherId >= 520) { // Heavy rain
        severity = severity === 'none' ? 'moderate' : (severity === 'moderate' ? 'moderate' : severity)
        affectedOperations.push('ground_operations')
        description = 'Heavy rain may cause minor delays'
      }
    } else if (weatherId >= 600 && weatherId < 700) { // Snow
      severity = 'high'
      affectedOperations.push('takeoff', 'landing', 'ground_operations')
      description = 'Snow conditions - delays likely'
    } else if (weatherId >= 700 && weatherId < 800) { // Atmosphere (fog, etc.)
      if (visibility < 1000) { // Low visibility
        severity = 'high'
        affectedOperations.push('takeoff', 'landing')
        description = 'Low visibility - significant delays possible'
      } else if (visibility < 5000) {
        severity = severity === 'none' ? 'moderate' : (severity === 'moderate' ? 'moderate' : severity)
        affectedOperations.push('landing')
        description = 'Reduced visibility may affect operations'
      }
    }

    // Temperature extremes
    if (temp < -20 || temp > 40) {
      severity = severity === 'none' ? 'low' : severity
      affectedOperations.push('ground_operations')
      if (temp < -20) {
        description = 'Extreme cold may cause minor delays'
      } else {
        description = 'Extreme heat may affect ground operations'
      }
    }

    // If no issues found, keep as 'none'
    if (severity === 'none') {
      description = 'Good weather conditions for flying'
    }

    return {
      severity,
      description,
      affectedOperations: [...new Set(affectedOperations)] // Remove duplicates
    }
  }

  /**
   * Get city name from airport code or destination
   */
  private getCityName(destination: string): string {
    // If it's an IATA code, convert to city name
    if (this.DESTINATION_MAPPING[destination]) {
      return this.DESTINATION_MAPPING[destination]
    }
    
    // Otherwise, assume it's already a city name
    return destination
  }

  /**
   * Get default weather data when no data is available
   */
  private getDefaultWeatherData(cityName: string): WeatherData {
    return {
      destination: cityName,
      temperature: 20,
      feelsLike: 20,
      description: 'Weather data unavailable',
      icon: '01d',
      windSpeed: 0,
      visibility: 10,
      flightImpact: {
        severity: 'none',
        description: 'Weather data unavailable',
        affectedOperations: []
      },
      lastUpdated: new Date(),
      source: 'cache'
    }
  }

  /**
   * Get weather cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number
    freshEntries: number
    staleEntries: number
    destinations: string[]
    lastUpdated: Date | null
    cacheSize: string
  }> {
    await this.loadCache()

    const entries = Array.from(this.cache.values())
    let freshEntries = 0
    let staleEntries = 0
    let lastUpdated: Date | null = null

    entries.forEach(entry => {
      if (this.isWeatherDataStale(entry.destination)) {
        staleEntries++
      } else {
        freshEntries++
      }

      if (!lastUpdated || entry.data.lastUpdated > lastUpdated) {
        lastUpdated = entry.data.lastUpdated
      }
    })

    // Calculate cache file size
    let cacheSize = '0 KB'
    try {
      const stats = await fs.stat(this.cacheFilePath)
      const sizeInKB = Math.round(stats.size / 1024)
      cacheSize = `${sizeInKB} KB`
    } catch {
      // File doesn't exist yet
    }

    return {
      totalEntries: entries.length,
      freshEntries,
      staleEntries,
      destinations: entries.map(e => e.destination).sort(),
      lastUpdated,
      cacheSize
    }
  }

  /**
   * Clear weather cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear()
    await this.saveCache()
    console.log('[Weather Cache] Cleared all weather cache data')
  }

  /**
   * Update weather data for all known destinations
   */
  async updateAllDestinations(): Promise<void> {
    console.log('[Weather Cache] Updating weather for all destinations...')
    
    const destinations = Object.values(this.DESTINATION_MAPPING)
    const uniqueDestinations = [...new Set(destinations)]
    
    for (const destination of uniqueDestinations) {
      try {
        await this.refreshWeatherCache(destination)
        // Add small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[Weather Cache] Failed to update ${destination}:`, error)
      }
    }
    
    console.log(`[Weather Cache] Finished updating weather for ${uniqueDestinations.length} destinations`)
  }
}

// Export singleton instance
export const weatherCacheManager = WeatherCacheManager.getInstance()