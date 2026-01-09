/**
 * FIXED Cache Manager - Soluție completă pentru problemele de blocare cache
 * 
 * PROBLEME REZOLVATE:
 * 1. Corupția structurii nested în cache
 * 2. Rate limiting agresiv pentru API calls
 * 3. Cron jobs suprapuse
 * 4. Gestionarea deficitară a erorilor
 * 5. Pierderea datelor la API failures
 */

// Server-side only imports
let fs: any = null
let path: any = null
let persistentFlightSystem: any = null

if (typeof window === 'undefined') {
  try {
    fs = require('fs/promises')
    path = require('path')
    const { persistentFlightSystem: pfs } = require('./persistentFlightSystem')
    persistentFlightSystem = pfs
  } catch (error) {
    console.error('[Fixed Cache Manager] Failed to load dependencies:', error)
  }
}

export interface CacheConfig {
  flightData: {
    cronInterval: number // minutes - INCREASED to prevent API overload
  }
  analytics: {
    cronInterval: number // days
    cacheMaxAge: number // days
  }
  aircraft: {
    cronInterval: number // days
    cacheMaxAge: number // days
  }
  weather: {
    cronInterval: number // minutes
  }
}

export interface CacheEntry<T = any> {
  id: string
  category: 'flightData' | 'analytics' | 'aircraft' | 'weather'
  key: string
  data: T
  createdAt: string
  expiresAt: string | null
  lastAccessed: string
  source: 'cron' | 'manual'
  success: boolean
  error?: string
}

// Paths pentru fișiere
const getCacheConfigPath = () => path?.join(process.cwd(), 'data', 'cache-config.json')
const getCacheDataPath = () => path?.join(process.cwd(), 'data', 'cache-data.json')

class FixedCacheManager {
  private static instance: FixedCacheManager
  private config: CacheConfig | null = null
  private cacheData: Map<string, CacheEntry> = new Map()
  private cronJobs: Map<string, NodeJS.Timeout> = new Map()
  private isInitialized: boolean = false
  
  // CRITICAL FIX: API Rate Limiting Management
  private apiRequestQueue: Array<{
    resolve: (value: any) => void
    reject: (error: any) => void
    apiCall: () => Promise<any>
    airportCode: string
    type: string
  }> = []
  private isProcessingQueue: boolean = false
  private lastApiCall: number = 0
  private readonly MIN_API_INTERVAL = 500 // 500ms between API calls (120 calls/minute max)

  private constructor() {}

  static getInstance(): FixedCacheManager {
    if (!FixedCacheManager.instance) {
      FixedCacheManager.instance = new FixedCacheManager()
    }
    return FixedCacheManager.instance
  }

  /**
   * FIXED: Inițializare cu protecție împotriva inițializării multiple
   */
  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') return
    
    if (this.isInitialized) {
      console.log('[Fixed Cache Manager] Already initialized, skipping...')
      return
    }
    
    console.log('[Fixed Cache Manager] Starting initialization...')
    
    // Stop any existing cron jobs
    this.stopCronJobs()
    
    await this.ensureDataDirectory()
    await this.loadConfig()
    await this.loadCacheData()
    
    // CRITICAL FIX: Clean up corrupted cache data immediately
    const cleanedEntries = await this.fixCorruptedCacheData()
    if (cleanedEntries > 0) {
      console.log(`[Fixed Cache Manager] Auto-repaired ${cleanedEntries} corrupted cache entries`)
    }
    
    // Initialize persistent system with timeout
    if (persistentFlightSystem) {
      try {
        await Promise.race([
          persistentFlightSystem.initialize(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ])
        console.log('[Fixed Cache Manager] Persistent flight system initialized')
      } catch (error) {
        console.error('[Fixed Cache Manager] Persistent system failed, continuing without it:', error)
      }
    }
    
    // Start cron jobs with proper intervals
    await this.startCronJobs()
    
    this.isInitialized = true
    console.log('[Fixed Cache Manager] Initialization complete')
  }

  /**
   * FIXED: Configurație cu intervale mai mari pentru a preveni API overload
   */
  private async loadConfig(): Promise<void> {
    if (!fs) return
    
    try {
      const data = await fs.readFile(getCacheConfigPath(), 'utf-8')
      const loadedConfig = JSON.parse(data)
      
      // FIXED: Use safer intervals to prevent API rate limiting
      this.config = {
        flightData: {
          cronInterval: Math.max(15, loadedConfig.flightData?.cronInterval || 15) // Minimum 15 minutes
        },
        analytics: {
          cronInterval: Math.max(1, loadedConfig.analytics?.cronInterval || 7), // Minimum 1 day
          cacheMaxAge: Math.max(7, loadedConfig.analytics?.cacheMaxAge || 30) // Minimum 7 days
        },
        aircraft: {
          cronInterval: Math.max(7, loadedConfig.aircraft?.cronInterval || 30), // Minimum 7 days
          cacheMaxAge: Math.max(7, loadedConfig.aircraft?.cacheMaxAge || 30) // Minimum 7 days
        },
        weather: {
          cronInterval: Math.max(30, loadedConfig.weather?.cronInterval || 30) // Minimum 30 minutes
        }
      }
      
      await this.saveConfig()
    } catch {
      // Default safe configuration
      this.config = {
        flightData: { cronInterval: 15 }, // 15 minutes - safe interval
        analytics: { cronInterval: 7, cacheMaxAge: 30 },
        aircraft: { cronInterval: 30, cacheMaxAge: 30 },
        weather: { cronInterval: 30 }
      }
      await this.saveConfig()
    }
  }

  private async saveConfig(): Promise<void> {
    if (!fs || !this.config) return
    await fs.writeFile(getCacheConfigPath(), JSON.stringify(this.config, null, 2))
  }

  private async ensureDataDirectory(): Promise<void> {
    if (!fs || !path) return
    
    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }
  }

  /**
   * FIXED: Încărcare cache cu repararea automată a corupției
   */
  private async loadCacheData(): Promise<void> {
    if (!fs) return
    
    try {
      const data = await fs.readFile(getCacheDataPath(), 'utf-8')
      const cacheArray: CacheEntry[] = JSON.parse(data)
      
      this.cacheData.clear()
      let corruptedCount = 0
      
      cacheArray.forEach(entry => {
        // FIXED: Validate and repair entry structure
        const repairedEntry = this.repairCacheEntry(entry)
        if (repairedEntry) {
          this.cacheData.set(repairedEntry.id, repairedEntry)
        } else {
          corruptedCount++
        }
      })
      
      console.log(`[Fixed Cache Manager] Loaded ${this.cacheData.size} cache entries`)
      if (corruptedCount > 0) {
        console.log(`[Fixed Cache Manager] Skipped ${corruptedCount} corrupted entries`)
      }
    } catch (error) {
      console.log('[Fixed Cache Manager] No existing cache data found, starting fresh')
    }
  }

  /**
   * CRITICAL FIX: Repară intrările de cache corupte
   */
  private repairCacheEntry(entry: any): CacheEntry | null {
    try {
      // Validate basic structure
      if (!entry.id || !entry.category || !entry.key) {
        return null
      }

      // FIXED: Repair nested flight data corruption
      if (entry.category === 'flightData' && entry.data) {
        let cleanData = entry.data

        // Handle nested flights structure corruption
        if (typeof cleanData === 'object' && 'flights' in cleanData) {
          let flightData = cleanData.flights
          
          // Fix deeply nested corruption
          while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
            flightData = flightData.flights
          }
          
          // Preserve weather info if it exists
          const weatherInfo = cleanData.weather_info || null
          
          cleanData = weatherInfo ? {
            flights: Array.isArray(flightData) ? flightData : [],
            weather_info: weatherInfo
          } : (Array.isArray(flightData) ? flightData : [])
        }
        
        // Ensure flight data is an array or proper object
        if (!Array.isArray(cleanData) && !(typeof cleanData === 'object' && 'flights' in cleanData)) {
          cleanData = []
        }

        entry.data = cleanData
      }

      return {
        id: entry.id,
        category: entry.category,
        key: entry.key,
        data: entry.data,
        createdAt: entry.createdAt || new Date().toISOString(),
        expiresAt: entry.expiresAt || null,
        lastAccessed: entry.lastAccessed || new Date().toISOString(),
        source: entry.source || 'manual',
        success: entry.success !== false,
        error: entry.error
      }
    } catch (error) {
      console.error('[Fixed Cache Manager] Failed to repair cache entry:', error)
      return null
    }
  }

  private async saveCacheData(): Promise<void> {
    if (!fs) return
    
    const cacheArray = Array.from(this.cacheData.values())
    await fs.writeFile(getCacheDataPath(), JSON.stringify(cacheArray, null, 2))
  }

  /**
   * FIXED: Cron jobs cu intervale sigure și fără suprapunere
   */
  private async startCronJobs(): Promise<void> {
    if (!this.config) {
      console.error('[Fixed Cache Manager] No configuration available')
      return
    }

    this.stopCronJobs()
    
    console.log('[Fixed Cache Manager] Starting cron jobs with safe intervals:', {
      flightData: `${this.config.flightData.cronInterval} minutes`,
      analytics: `${this.config.analytics.cronInterval} days`,
      aircraft: `${this.config.aircraft.cronInterval} days`,
      weather: `${this.config.weather.cronInterval} minutes`
    })

    // FIXED: Staggered start times to prevent simultaneous API calls
    
    // Flight Data Cron - starts immediately, then every X minutes
    setTimeout(async () => {
      await this.runFlightDataCron()
      const flightDataInterval = this.config!.flightData.cronInterval * 60 * 1000
      const flightDataJob = setInterval(async () => {
        await this.runFlightDataCron()
      }, flightDataInterval)
      this.cronJobs.set('flightData', flightDataJob)
    }, 1000)

    // Weather Cron - starts after 2 minutes, then every X minutes
    setTimeout(async () => {
      await this.runWeatherCron()
      const weatherInterval = this.config!.weather.cronInterval * 60 * 1000
      const weatherJob = setInterval(async () => {
        await this.runWeatherCron()
      }, weatherInterval)
      this.cronJobs.set('weather', weatherJob)
    }, 2 * 60 * 1000)

    // Analytics Cron - starts after 5 minutes, then every X days
    setTimeout(async () => {
      await this.runAnalyticsCron()
      const analyticsInterval = Math.min(this.config!.analytics.cronInterval, 1) * 24 * 60 * 60 * 1000
      const analyticsJob = setInterval(async () => {
        await this.runAnalyticsCron()
      }, analyticsInterval)
      this.cronJobs.set('analytics', analyticsJob)
    }, 5 * 60 * 1000)

    console.log('[Fixed Cache Manager] All cron jobs scheduled with staggered start times')
  }

  private stopCronJobs(): void {
    this.cronJobs.forEach((job, name) => {
      clearInterval(job)
      console.log(`[Fixed Cache Manager] Stopped cron job: ${name}`)
    })
    this.cronJobs.clear()
  }

  /**
   * FIXED: Flight data cron cu rate limiting și error handling îmbunătățit
   */
  private async runFlightDataCron(): Promise<void> {
    console.log('[Fixed Cache Manager] Running flight data cron job...')
    
    const airports = await this.getAllSupportedAirports()
    
    // FIXED: Process airports sequentially to avoid API rate limiting
    for (const airport of airports) {
      try {
        await this.fetchAndCacheFlightDataSafe(airport, 'arrivals', 'cron')
        await this.delay(1000) // 1 second delay between airport requests
        
        await this.fetchAndCacheFlightDataSafe(airport, 'departures', 'cron')
        await this.delay(1000) // 1 second delay between requests
        
      } catch (error) {
        console.error(`[Fixed Cache Manager] Error processing ${airport}:`, error)
        // Continue with next airport instead of failing completely
      }
    }
    
    console.log('[Fixed Cache Manager] Flight data cron job completed')
  }

  /**
   * FIXED: Safe flight data fetching with proper error handling
   */
  private async fetchAndCacheFlightDataSafe(
    airportCode: string, 
    type: 'arrivals' | 'departures',
    source: 'cron' | 'manual'
  ): Promise<void> {
    console.log(`[Fixed Cache Manager] Fetching ${type} for ${airportCode} (${source})`)
    
    const cacheKey = `${airportCode}_${type}`
    
    try {
      // Check if we have recent data (less than 30 minutes old)
      const existingEntry = this.getValidCacheEntry(cacheKey)
      if (existingEntry && source === 'cron') {
        const ageMinutes = (Date.now() - new Date(existingEntry.createdAt).getTime()) / (1000 * 60)
        if (ageMinutes < 30) {
          console.log(`[Fixed Cache Manager] Recent data exists for ${cacheKey} (${Math.round(ageMinutes)} min old), skipping API call`)
          return
        }
      }

      // Make API call with rate limiting
      const response = await this.makeRateLimitedApiCall(async () => {
        const { default: FlightApiService } = await import('./flightApiService')
        const apiService = new FlightApiService({
          provider: 'aerodatabox',
          apiKey: process.env.NEXT_PUBLIC_FLIGHT_API_KEY || process.env.AERODATABOX_API_KEY || '',
          baseUrl: 'https://prod.api.market/api/v1/aedbx/aerodatabox',
          rateLimit: 100
        })
        
        return type === 'arrivals' 
          ? await apiService.getArrivals(airportCode)
          : await apiService.getDepartures(airportCode)
      }, airportCode, type)

      // FIXED: Always preserve existing data on API failure
      if (!response.success || !response.data || response.data.length === 0) {
        console.log(`[Fixed Cache Manager] API failed for ${cacheKey}, keeping existing data`)
        
        // Update last accessed time for existing entry
        if (existingEntry) {
          existingEntry.lastAccessed = new Date().toISOString()
          this.cacheData.set(existingEntry.id, existingEntry)
          await this.saveCacheData()
        }
        return
      }

      // Save successful response
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      
      const cacheEntry: CacheEntry = {
        id: `flight_${cacheKey}_${Date.now()}`,
        category: 'flightData',
        key: cacheKey,
        data: response.data,
        createdAt: new Date().toISOString(),
        expiresAt,
        lastAccessed: new Date().toISOString(),
        source,
        success: true
      }

      // Remove old entries for this key
      const oldEntries = Array.from(this.cacheData.values()).filter(
        entry => entry.category === 'flightData' && entry.key === cacheKey
      )
      oldEntries.forEach(entry => this.cacheData.delete(entry.id))
      
      // Add new entry
      this.cacheData.set(cacheEntry.id, cacheEntry)
      await this.saveCacheData()
      
      console.log(`[Fixed Cache Manager] Successfully cached ${response.data.length} flights for ${cacheKey}`)

      // Save to persistent system if available
      if (persistentFlightSystem) {
        try {
          await persistentFlightSystem.ingestFlightData(response.data, airportCode, type)
        } catch (error) {
          console.error('[Fixed Cache Manager] Failed to save to persistent system:', error)
        }
      }

    } catch (error) {
      console.error(`[Fixed Cache Manager] Error fetching ${cacheKey}:`, error)
      
      // FIXED: Don't delete existing data on error
      const existingEntry = this.getValidCacheEntry(cacheKey)
      if (existingEntry) {
        console.log(`[Fixed Cache Manager] Keeping existing data for ${cacheKey} due to API error`)
        existingEntry.lastAccessed = new Date().toISOString()
        this.cacheData.set(existingEntry.id, existingEntry)
        await this.saveCacheData()
      }
    }
  }

  /**
   * FIXED: Rate limited API calls to prevent blocking
   */
  private async makeRateLimitedApiCall<T>(
    apiCall: () => Promise<T>,
    airportCode: string,
    type: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.apiRequestQueue.push({
        resolve,
        reject,
        apiCall,
        airportCode,
        type
      })
      
      this.processApiQueue()
    })
  }

  private async processApiQueue(): Promise<void> {
    if (this.isProcessingQueue || this.apiRequestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.apiRequestQueue.length > 0) {
      const request = this.apiRequestQueue.shift()
      if (!request) break

      try {
        // Ensure minimum interval between API calls
        const timeSinceLastCall = Date.now() - this.lastApiCall
        if (timeSinceLastCall < this.MIN_API_INTERVAL) {
          await this.delay(this.MIN_API_INTERVAL - timeSinceLastCall)
        }

        console.log(`[Fixed Cache Manager] Making API call for ${request.airportCode} ${request.type}`)
        const result = await request.apiCall()
        this.lastApiCall = Date.now()
        
        request.resolve(result)
      } catch (error) {
        console.error(`[Fixed Cache Manager] API call failed for ${request.airportCode} ${request.type}:`, error)
        request.reject(error)
      }
    }

    this.isProcessingQueue = false
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * FIXED: Analytics generation from cached data only
   */
  private async runAnalyticsCron(): Promise<void> {
    console.log('[Fixed Cache Manager] Running analytics cron job...')
    
    const airports = await this.getAllSupportedAirports()
    
    for (const airport of airports) {
      await this.generateAnalyticsFromCache(airport, 'cron')
    }
    
    console.log('[Fixed Cache Manager] Analytics cron job completed')
  }

  private async generateAnalyticsFromCache(airportCode: string, source: 'cron' | 'manual'): Promise<void> {
    try {
      const arrivalsData = this.getCachedFlightData(`${airportCode}_arrivals`)
      const departuresData = this.getCachedFlightData(`${airportCode}_departures`)
      
      const allFlights = [...(arrivalsData || []), ...(departuresData || [])]
      
      if (allFlights.length === 0) {
        console.log(`[Fixed Cache Manager] No flight data for analytics: ${airportCode}`)
        return
      }
      
      // Generate real statistics
      const stats = this.calculateFlightStatistics(allFlights, airportCode)
      
      const cacheKey = `analytics_${airportCode}`
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

      const cacheEntry: CacheEntry = {
        id: `analytics_${cacheKey}_${Date.now()}`,
        category: 'analytics',
        key: cacheKey,
        data: stats,
        createdAt: new Date().toISOString(),
        expiresAt,
        lastAccessed: new Date().toISOString(),
        source,
        success: true
      }

      // Remove old analytics
      const oldEntries = Array.from(this.cacheData.values()).filter(
        entry => entry.category === 'analytics' && entry.key === cacheKey
      )
      oldEntries.forEach(entry => this.cacheData.delete(entry.id))

      this.cacheData.set(cacheEntry.id, cacheEntry)
      await this.saveCacheData()

      console.log(`[Fixed Cache Manager] Generated analytics for ${airportCode} from ${allFlights.length} flights`)

    } catch (error) {
      console.error(`[Fixed Cache Manager] Error generating analytics for ${airportCode}:`, error)
    }
  }

  private async runWeatherCron(): Promise<void> {
    console.log('[Fixed Cache Manager] Running weather cron job...')
    
    try {
      const WeatherService = (await import('./weatherService')).default
      const apiKey = process.env.OPENWEATHER_API_KEY
      
      if (!apiKey) {
        console.error('[Fixed Cache Manager] OpenWeatherMap API key not found')
        return
      }
      
      const weatherService = new WeatherService(apiKey)
      const allWeatherData = await weatherService.getAllWeatherData()
      
      if (Object.keys(allWeatherData).length > 0) {
        const cacheKey = 'current_weather'
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        
        const cacheEntry: CacheEntry = {
          id: `weather_${cacheKey}_${Date.now()}`,
          category: 'weather',
          key: cacheKey,
          data: allWeatherData,
          createdAt: new Date().toISOString(),
          expiresAt,
          lastAccessed: new Date().toISOString(),
          source: 'cron',
          success: true
        }
        
        // Remove old weather data
        const oldEntries = Array.from(this.cacheData.values()).filter(
          entry => entry.category === 'weather' && entry.key === cacheKey
        )
        oldEntries.forEach(entry => this.cacheData.delete(entry.id))
        
        this.cacheData.set(cacheEntry.id, cacheEntry)
        await this.saveCacheData()
        
        console.log(`[Fixed Cache Manager] Cached weather data for ${Object.keys(allWeatherData).length} cities`)
        
        // Integrate weather into flight cache
        await this.integrateWeatherIntoFlightCache(allWeatherData)
      }
      
    } catch (error) {
      console.error('[Fixed Cache Manager] Error in weather cron job:', error)
    }
  }

  /**
   * FIXED: Weather integration without corruption
   */
  private async integrateWeatherIntoFlightCache(weatherData: { [cityName: string]: any }): Promise<void> {
    const airportToCityMap: { [key: string]: string } = {
      'OTP': 'Bucharest', 'BBU': 'Bucharest', 'CLJ': 'Cluj-Napoca', 'TSR': 'Timisoara',
      'IAS': 'Iasi', 'CND': 'Constanta', 'CRA': 'Craiova', 'SBZ': 'Sibiu',
      'BCM': 'Bacau', 'BAY': 'Baia Mare', 'OMR': 'Oradea', 'SCV': 'Suceava',
      'TGM': 'Targu Mures', 'ARW': 'Arad', 'SUJ': 'Satu Mare', 'RMO': 'Chisinau'
    }
    
    let updatedEntries = 0
    
    for (const [entryId, entry] of this.cacheData.entries()) {
      if (entry.category === 'flightData') {
        const [airportCode] = entry.key.split('_')
        const cityName = airportToCityMap[airportCode]
        
        if (cityName && weatherData[cityName]) {
          // FIXED: Proper data structure handling
          let flightData: any[] = []
          let needsUpdate = false
          
          if (Array.isArray(entry.data)) {
            // Legacy format - direct array
            flightData = entry.data
            needsUpdate = true
          } else if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
            // New format - check if weather needs update
            flightData = entry.data.flights
            const currentWeatherTime = entry.data.weather_info?.lastUpdated ? 
              new Date(entry.data.weather_info.lastUpdated).getTime() : 0
            const newWeatherTime = new Date(weatherData[cityName].lastUpdated).getTime()
            needsUpdate = newWeatherTime > currentWeatherTime
          }
          
          if (needsUpdate && Array.isArray(flightData)) {
            const updatedEntry: CacheEntry = {
              ...entry,
              data: {
                flights: flightData,
                weather_info: {
                  city: weatherData[cityName].city,
                  temperature: weatherData[cityName].temperature,
                  feelsLike: weatherData[cityName].feelsLike,
                  description: weatherData[cityName].description,
                  icon: weatherData[cityName].icon,
                  windSpeed: weatherData[cityName].windSpeed,
                  visibility: weatherData[cityName].visibility,
                  flightImpact: weatherData[cityName].flightImpact,
                  lastUpdated: weatherData[cityName].lastUpdated
                }
              },
              lastAccessed: new Date().toISOString()
            }
            
            this.cacheData.set(entryId, updatedEntry)
            updatedEntries++
          }
        }
      }
    }
    
    if (updatedEntries > 0) {
      await this.saveCacheData()
      console.log(`[Fixed Cache Manager] Updated ${updatedEntries} flight entries with weather data`)
    }
  }

  /**
   * FIXED: Safe cache data retrieval with corruption protection
   */
  getCachedFlightData(key: string): any[] | null {
    const entry = this.getValidCacheEntry(key)
    if (!entry) return null
    
    // Handle different data formats safely
    if (Array.isArray(entry.data)) {
      return entry.data
    }
    
    if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
      let flightData = entry.data.flights
      
      // Fix nested corruption
      while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
        flightData = flightData.flights
      }
      
      return Array.isArray(flightData) ? flightData : []
    }
    
    return []
  }

  getFlightDataWithWeather(airportCode: string, type: 'arrivals' | 'departures'): {
    flights: any[] | null
    weather_info: any | null
    hasWeatherAlert: boolean
  } {
    const cacheKey = `${airportCode}_${type}`
    const entry = this.getValidCacheEntry(cacheKey)
    
    if (!entry) {
      return { flights: null, weather_info: null, hasWeatherAlert: false }
    }
    
    let flights: any[] = []
    let weatherInfo: any = null
    
    if (Array.isArray(entry.data)) {
      flights = entry.data
    } else if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
      flights = Array.isArray(entry.data.flights) ? entry.data.flights : []
      weatherInfo = entry.data.weather_info || null
    }
    
    const hasAlert = weatherInfo?.flightImpact?.severity && 
                    ['moderate', 'high', 'severe'].includes(weatherInfo.flightImpact.severity)
    
    return {
      flights,
      weather_info: weatherInfo,
      hasWeatherAlert: hasAlert || false
    }
  }

  private getValidCacheEntry(key: string): CacheEntry | null {
    for (const entry of this.cacheData.values()) {
      if (entry.key === key && !this.isExpired(entry)) {
        entry.lastAccessed = new Date().toISOString()
        return entry
      }
    }
    return null
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expiresAt) return false
    return new Date() > new Date(entry.expiresAt)
  }

  /**
   * FIXED: Corruption cleanup
   */
  private async fixCorruptedCacheData(): Promise<number> {
    let fixedCount = 0
    
    for (const [entryId, entry] of this.cacheData.entries()) {
      if (entry.category === 'flightData') {
        const repairedEntry = this.repairCacheEntry(entry)
        if (repairedEntry && JSON.stringify(repairedEntry) !== JSON.stringify(entry)) {
          this.cacheData.set(entryId, repairedEntry)
          fixedCount++
        }
      }
    }
    
    if (fixedCount > 0) {
      await this.saveCacheData()
    }
    
    return fixedCount
  }

  private calculateFlightStatistics(flights: any[], airportCode: string): any {
    const totalFlights = flights.length
    let onTimeFlights = 0
    let delayedFlights = 0
    let cancelledFlights = 0
    const delays: number[] = []
    
    flights.forEach(flight => {
      const status = flight.status?.toLowerCase() || ''
      
      if (status === 'cancelled' || status === 'canceled') {
        cancelledFlights++
        return
      }
      
      let delayMinutes = 0
      if (flight.delay && typeof flight.delay === 'number') {
        delayMinutes = flight.delay
      } else if (flight.scheduled_time && (flight.actual_time || flight.estimated_time)) {
        const scheduled = new Date(flight.scheduled_time)
        const actual = new Date(flight.actual_time || flight.estimated_time)
        delayMinutes = Math.max(0, (actual.getTime() - scheduled.getTime()) / (1000 * 60))
      }
      
      if (delayMinutes > 15) {
        delayedFlights++
        delays.push(delayMinutes)
      } else {
        onTimeFlights++
      }
    })
    
    const averageDelay = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0
    const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0
    
    return {
      airportCode,
      totalFlights,
      onTimeFlights,
      delayedFlights,
      cancelledFlights,
      averageDelay,
      onTimePercentage,
      lastUpdated: new Date().toISOString()
    }
  }

  private async getAllSupportedAirports(): Promise<string[]> {
    // Romanian and Moldovan airports only
    return ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO']
  }

  /**
   * Manual refresh with proper error handling
   */
  async manualRefresh(category: 'flightData' | 'analytics' | 'weather', identifier?: string): Promise<void> {
    console.log(`[Fixed Cache Manager] Manual refresh: ${category}${identifier ? ` (${identifier})` : ''}`)

    switch (category) {
      case 'flightData':
        if (identifier) {
          await this.fetchAndCacheFlightDataSafe(identifier, 'arrivals', 'manual')
          await this.delay(1000)
          await this.fetchAndCacheFlightDataSafe(identifier, 'departures', 'manual')
        } else {
          await this.runFlightDataCron()
        }
        break

      case 'analytics':
        if (identifier) {
          await this.generateAnalyticsFromCache(identifier, 'manual')
        } else {
          await this.runAnalyticsCron()
        }
        break

      case 'weather':
        await this.runWeatherCron()
        break
    }
  }

  getCacheStats(): any {
    const entries = Array.from(this.cacheData.values())
    
    return {
      config: this.config,
      cacheEntries: {
        flightData: entries.filter(e => e.category === 'flightData').length,
        analytics: entries.filter(e => e.category === 'analytics').length,
        weather: entries.filter(e => e.category === 'weather').length,
        total: entries.length
      },
      lastUpdated: {
        flightData: this.getLastUpdated(entries, 'flightData'),
        analytics: this.getLastUpdated(entries, 'analytics'),
        weather: this.getLastUpdated(entries, 'weather')
      }
    }
  }

  private getLastUpdated(entries: CacheEntry[], category: string): string | null {
    const categoryEntries = entries.filter(e => e.category === category)
    if (categoryEntries.length === 0) return null
    
    return categoryEntries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      .createdAt
  }

  shutdown(): void {
    console.log('[Fixed Cache Manager] Shutting down...')
    this.stopCronJobs()
    this.isInitialized = false
  }
}

// Export singleton
export const fixedCacheManager = FixedCacheManager.getInstance()

// DISABLED: Auto-initialize on server startup - USING FIXED CACHE MANAGER INSTEAD
// if (typeof window === 'undefined') {
//   setTimeout(async () => {
//     try {
//       console.log('[Fixed Cache Manager] Starting auto-initialization...')
//       await fixedCacheManager.initialize()
//       console.log('[Fixed Cache Manager] Auto-initialization completed')
//     } catch (error) {
//       console.error('[Fixed Cache Manager] Auto-initialization failed:', error)
//     }
//   }, 1000)
// }