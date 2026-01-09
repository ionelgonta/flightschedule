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
    
    // CRITICAL FIX: Clean up stale flight data (older than 48 hours)
    const staleEntriesCleaned = await this.cleanupStaleFlightData()
    if (staleEntriesCleaned > 0) {
      console.log(`[Fixed Cache Manager] Cleaned up ${staleEntriesCleaned} stale flight data entries`)
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
   * CRITICAL FIX: Clean up stale flight data older than 48 hours
   * This ensures old data doesn't persist and block fresh API calls
   */
  private async cleanupStaleFlightData(): Promise<number> {
    let cleanedCount = 0
    const now = new Date()
    const maxAgeHours = 48
    
    for (const [entryId, entry] of this.cacheData.entries()) {
      if (entry.category === 'flightData') {
        const createdAt = new Date(entry.createdAt)
        const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        
        if (ageHours > maxAgeHours) {
          console.log(`[Fixed Cache Manager] Removing stale entry ${entry.key} (${Math.round(ageHours)} hours old)`)
          this.cacheData.delete(entryId)
          cleanedCount++
        }
      }
    }
    
    if (cleanedCount > 0) {
      await this.saveCacheData()
    }
    
    return cleanedCount
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
      // BUT only skip if data is from TODAY - old data should always be refreshed
      const existingEntry = this.getValidCacheEntry(cacheKey)
      if (existingEntry && source === 'cron') {
        const createdAt = new Date(existingEntry.createdAt)
        const now = new Date()
        const ageMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
        const isFromToday = createdAt.toDateString() === now.toDateString()
        
        // Only skip if data is recent AND from today
        if (ageMinutes < 30 && isFromToday) {
          console.log(`[Fixed Cache Manager] Recent data exists for ${cacheKey} (${Math.round(ageMinutes)} min old, from today), skipping API call`)
          return
        }
        
        // Log if we're refreshing old data
        if (!isFromToday) {
          const daysSinceUpdate = Math.floor(ageMinutes / (60 * 24))
          console.log(`[Fixed Cache Manager] Data for ${cacheKey} is ${daysSinceUpdate} days old, forcing refresh`)
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

      // FIXED: Distinguish between API failure and empty results
      // Empty results (0 flights) is valid - some airports have no flights at certain times
      if (!response.success) {
        console.log(`[Fixed Cache Manager] API call failed for ${cacheKey}: ${response.error || 'Unknown error'}`)
        
        // Only keep existing data if API actually failed (not just empty results)
        if (existingEntry) {
          console.log(`[Fixed Cache Manager] Keeping existing data for ${cacheKey} due to API error`)
          existingEntry.lastAccessed = new Date().toISOString()
          this.cacheData.set(existingEntry.id, existingEntry)
          await this.saveCacheData()
        }
        return
      }
      
      // API succeeded - update cache even if empty (0 flights is valid data)
      const flightCount = response.data?.length || 0
      console.log(`[Fixed Cache Manager] API returned ${flightCount} flights for ${cacheKey}`)

      // Save successful response (even if empty - 0 flights is valid)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      
      const cacheEntry: CacheEntry = {
        id: `flight_${cacheKey}_${Date.now()}`,
        category: 'flightData',
        key: cacheKey,
        data: response.data || [],
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
          console.log(`[Fixed Cache Manager] Saving ${response.data.length} flights to persistent system for ${cacheKey}`)
          const result = await persistentFlightSystem.ingestFlightData(response.data, airportCode, type)
          console.log(`[Fixed Cache Manager] Persistent system result: saved ${result.savedToDatabase} flights, ${result.errors.length} errors`)
        } catch (error) {
          console.error('[Fixed Cache Manager] Failed to save to persistent system:', error)
        }
      } else {
        console.log(`[Fixed Cache Manager] Persistent system not available, skipping persistent save for ${cacheKey}`)
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
   * Also generates airport-statistics summary
   */
  private async runAnalyticsCron(): Promise<void> {
    console.log('[Fixed Cache Manager] Running analytics cron job...')
    
    const airports = await this.getAllSupportedAirports()
    
    for (const airport of airports) {
      await this.generateAnalyticsFromCache(airport, 'cron')
    }
    
    // Generate airport-statistics summary after individual analytics
    await this.generateAirportStatistics('cron')
    
    console.log('[Fixed Cache Manager] Analytics cron job completed')
  }

  /**
   * Generate airport-statistics summary from all airport analytics
   */
  private async generateAirportStatistics(source: 'cron' | 'manual'): Promise<void> {
    console.log('[Fixed Cache Manager] Generating airport-statistics summary...')
    
    const AIRPORTS: { [key: string]: { name: string; city: string; country: string } } = {
      'OTP': { name: 'Aeroportul Internațional Henri Coandă', city: 'București', country: 'România' },
      'BBU': { name: 'Aeroportul Internațional Aurel Vlaicu', city: 'București', country: 'România' },
      'CLJ': { name: 'Aeroportul Internațional Cluj-Napoca', city: 'Cluj-Napoca', country: 'România' },
      'TSR': { name: 'Aeroportul Internațional Timișoara Traian Vuia', city: 'Timișoara', country: 'România' },
      'IAS': { name: 'Aeroportul Internațional Iași', city: 'Iași', country: 'România' },
      'CND': { name: 'Aeroportul Internațional Mihail Kogălniceanu', city: 'Constanța', country: 'România' },
      'SBZ': { name: 'Aeroportul Internațional Sibiu', city: 'Sibiu', country: 'România' },
      'CRA': { name: 'Aeroportul Craiova', city: 'Craiova', country: 'România' },
      'BCM': { name: 'Aeroportul Bacău', city: 'Bacău', country: 'România' },
      'BAY': { name: 'Aeroportul Baia Mare', city: 'Baia Mare', country: 'România' },
      'OMR': { name: 'Aeroportul Internațional Oradea', city: 'Oradea', country: 'România' },
      'SCV': { name: 'Aeroportul Suceava Ștefan cel Mare', city: 'Suceava', country: 'România' },
      'TGM': { name: 'Aeroportul Târgu Mureș Transilvania', city: 'Târgu Mureș', country: 'România' },
      'ARW': { name: 'Aeroportul Arad', city: 'Arad', country: 'România' },
      'SUJ': { name: 'Aeroportul Satu Mare', city: 'Satu Mare', country: 'România' },
      'GHV': { name: 'Aeroportul Brașov-Ghimbav', city: 'Brașov', country: 'România' },
      'RMO': { name: 'Aeroportul Internațional Chișinău', city: 'Chișinău', country: 'Moldova' }
    }
    
    const airportStatistics: any[] = []
    const now = new Date()
    
    for (const airportCode of Object.keys(AIRPORTS)) {
      const arrivalsData = this.getCachedFlightData(`${airportCode}_arrivals`)
      const departuresData = this.getCachedFlightData(`${airportCode}_departures`)
      const allFlights = [...(arrivalsData || []), ...(departuresData || [])]
      
      if (allFlights.length === 0) {
        airportStatistics.push({
          code: airportCode,
          name: AIRPORTS[airportCode].name,
          city: AIRPORTS[airportCode].city,
          country: AIRPORTS[airportCode].country,
          statistics: null,
          message: 'Nu sunt suficiente date pentru a afișa această informație'
        })
        continue
      }
      
      const stats = this.calculateFlightStatistics(allFlights, airportCode)
      
      airportStatistics.push({
        code: airportCode,
        name: AIRPORTS[airportCode].name,
        city: AIRPORTS[airportCode].city,
        country: AIRPORTS[airportCode].country,
        statistics: {
          totalFlights: stats.totalFlights,
          onTimePercentage: stats.onTimePercentage,
          averageDelay: stats.averageDelay,
          dailyFlights: Math.round(stats.totalFlights / 7),
          cancelledFlights: stats.cancelledFlights,
          delayedFlights: stats.delayedFlights,
          lastUpdated: now.toISOString()
        }
      })
    }
    
    // Remove old airport-statistics entries
    const oldEntries = Array.from(this.cacheData.values()).filter(
      entry => entry.category === 'analytics' && entry.key === 'airport-statistics'
    )
    oldEntries.forEach(entry => this.cacheData.delete(entry.id))
    
    // Create new airport-statistics entry
    const cacheEntry: CacheEntry = {
      id: `analytics_airport-statistics_${Date.now()}`,
      category: 'analytics',
      key: 'airport-statistics',
      data: airportStatistics,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastAccessed: now.toISOString(),
      source,
      success: true
    }
    
    this.cacheData.set(cacheEntry.id, cacheEntry)
    await this.saveCacheData()
    
    console.log(`[Fixed Cache Manager] Generated airport-statistics for ${airportStatistics.length} airports`)
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

  getFlightDataWithWeather<T = any[]>(airportCode: string, type: 'arrivals' | 'departures'): {
    flights: T | null
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
      flights: flights as T,
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
    
    // Check explicit expiration
    if (new Date() > new Date(entry.expiresAt)) return true
    
    // CRITICAL FIX: Flight data older than 2 days should be considered expired
    // This prevents stale data from persisting indefinitely
    if (entry.category === 'flightData') {
      const createdAt = new Date(entry.createdAt)
      const now = new Date()
      const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      // Flight data older than 48 hours is expired regardless of expiresAt
      if (ageHours > 48) {
        console.log(`[Fixed Cache Manager] Flight data ${entry.key} is ${Math.round(ageHours)} hours old, marking as expired`)
        return true
      }
    }
    
    return false
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
    // Romanian and Moldovan airports only - OFFICIAL LIST (17 airports including GHV)
    return ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO']
  }

  /**
   * Manual refresh with proper error handling
   */
  async manualRefresh(category: 'flightData' | 'analytics' | 'aircraft' | 'weather', identifier?: string): Promise<void> {
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

      case 'aircraft':
        // Aircraft data is handled through flight data
        console.log('[Fixed Cache Manager] Aircraft refresh delegated to flight data')
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

  /**
   * Generic cache data retrieval by key
   * Used by weather API and other components
   */
  getCachedData<T = any>(key: string): T | null {
    const entry = this.getValidCacheEntry(key)
    if (!entry) return null
    return entry.data as T
  }

  /**
   * Get cached data with persistent cache fallback (async version)
   */
  async getCachedDataWithPersistent<T>(key: string): Promise<T | null> {
    // First try main cache
    const mainData = this.getCachedData<T>(key)
    if (mainData) {
      // Handle corrupted nested structure for flight data
      if ((key.includes('_arrivals') || key.includes('_departures')) && mainData && typeof mainData === 'object') {
        let actualData = mainData
        
        // If data has flights property, extract it
        if ('flights' in mainData) {
          actualData = (mainData as any).flights
          
          // Handle deeply nested flights structure (corruption fix)
          while (actualData && typeof actualData === 'object' && 'flights' in actualData && !Array.isArray(actualData)) {
            actualData = (actualData as any).flights
          }
        }
        
        // Ensure we return an array for flight data
        if (Array.isArray(actualData)) {
          return actualData as T
        }
      }
      
      return mainData
    }

    // If not found and it's flight data, try persistent cache
    if ((key.includes('_arrivals') || key.includes('_departures')) && persistentFlightSystem) {
      try {
        const [airportCode, type] = key.split('_')
        if (airportCode && type) {
          const persistentData = await persistentFlightSystem.getFlightData(airportCode, type as 'arrivals' | 'departures')
          if (persistentData && persistentData.length > 0) {
            console.log(`[Fixed Cache Manager] Found ${persistentData.length} flights in persistent cache for ${key}`)
            
            // Store in main cache for faster future access (with short TTL)
            this.setCachedData(key, persistentData as T, 'flightData', 5 * 60 * 1000) // 5 minutes
            return persistentData as T
          }
        }
      } catch (error) {
        console.error(`[Fixed Cache Manager] Error accessing persistent cache for ${key}:`, error)
      }
    }

    return null
  }

  /**
   * Set cached data (simple version)
   */
  setCachedData<T>(key: string, data: T, category: 'flightData' | 'analytics' | 'aircraft' | 'weather', ttlMs?: number): void {
    const now = new Date()
    const expiresAt = ttlMs ? new Date(now.getTime() + ttlMs) : null

    // Map aircraft to flightData for storage
    const storageCategory = category === 'aircraft' ? 'flightData' : category

    const entry: CacheEntry = {
      id: `${category}_${key}_${now.getTime()}`,
      category: storageCategory as 'flightData' | 'analytics' | 'weather',
      key,
      data,
      createdAt: now.toISOString(),
      expiresAt: expiresAt?.toISOString() || null,
      lastAccessed: now.toISOString(),
      source: 'manual',
      success: true
    }

    // Remove old entries with same key
    for (const [entryId, existingEntry] of this.cacheData.entries()) {
      if (existingEntry.key === key) {
        this.cacheData.delete(entryId)
      }
    }

    this.cacheData.set(entry.id, entry)
    this.saveCacheData()
  }

  /**
   * Clear cache by pattern
   */
  clearCacheByPattern(pattern: string): void {
    let deletedCount = 0
    
    for (const [key, entry] of this.cacheData.entries()) {
      if (entry.key.includes(pattern) || entry.category.includes(pattern)) {
        this.cacheData.delete(key)
        deletedCount++
      }
    }
    
    if (deletedCount > 0) {
      this.saveCacheData()
      console.log(`[Fixed Cache Manager] Cleared ${deletedCount} cache entries matching pattern: ${pattern}`)
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    const totalEntries = this.cacheData.size
    this.cacheData.clear()
    
    if (totalEntries > 0) {
      this.saveCacheData()
      console.log(`[Fixed Cache Manager] Cleared all ${totalEntries} cache entries`)
    }
  }

  /**
   * Reset request counter (stub - not used in fixed version)
   */
  resetRequestCounter(): void {
    console.log('[Fixed Cache Manager] Request counter reset (no-op in fixed version)')
  }

  /**
   * Increment request counter (stub - not used in fixed version)
   */
  incrementRequestCounter(category: 'flightData' | 'analytics' | 'aircraft' | 'weather'): void {
    // No-op in fixed version - we don't track request counts
  }

  /**
   * Update configuration and restart cron jobs
   */
  async updateConfig(newConfig: Partial<CacheConfig>): Promise<void> {
    if (this.config) {
      this.config = { ...this.config, ...newConfig }
      await this.saveConfig()
      
      // Restart cron jobs with new intervals
      this.stopCronJobs()
      await this.startCronJobs()
      
      console.log('[Fixed Cache Manager] Configuration updated and cron jobs restarted')
    }
  }

  /**
   * Get persistent cache stats (stub for compatibility)
   */
  async getPersistentCacheStats(): Promise<any> {
    return {
      totalEntries: this.cacheData.size,
      categories: {
        flightData: Array.from(this.cacheData.values()).filter(e => e.category === 'flightData').length,
        analytics: Array.from(this.cacheData.values()).filter(e => e.category === 'analytics').length,
        weather: Array.from(this.cacheData.values()).filter(e => e.category === 'weather').length
      }
    }
  }

  /**
   * Clean persistent cache (stub for compatibility)
   */
  async cleanPersistentCache(): Promise<{ cleaned: number }> {
    let cleaned = 0
    for (const [key, entry] of this.cacheData.entries()) {
      if (this.isExpired(entry)) {
        this.cacheData.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      await this.saveCacheData()
    }
    return { cleaned }
  }

  /**
   * Clear persistent cache (stub for compatibility)
   */
  async clearPersistentCache(confirmationToken?: string): Promise<void> {
    if (confirmationToken !== 'CONFIRM_DELETE_ALL_HISTORICAL_DATA') {
      console.log('[Fixed Cache Manager] Clear persistent cache requires confirmation token')
      return
    }
    this.cacheData.clear()
    await this.saveCacheData()
    console.log('[Fixed Cache Manager] Cleared all persistent cache')
  }

  /**
   * Clear airport persistent cache (stub for compatibility)
   */
  async clearAirportPersistentCache(airportCode: string): Promise<{ cleared: number }> {
    let cleared = 0
    for (const [key, entry] of this.cacheData.entries()) {
      if (entry.key.includes(airportCode)) {
        this.cacheData.delete(key)
        cleared++
      }
    }
    if (cleared > 0) {
      await this.saveCacheData()
    }
    return { cleared }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<{ cleaned: number }> {
    return this.cleanPersistentCache()
  }

  /**
   * Cleanup corrupted flight data (stub for compatibility)
   */
  async cleanupCorruptedFlightData(): Promise<{ fixed: number }> {
    return { fixed: await this.fixCorruptedCacheData() }
  }
}

// Export singleton
export const fixedCacheManager = FixedCacheManager.getInstance()

// Auto-initialize on server startup
if (typeof window === 'undefined') {
  setTimeout(async () => {
    try {
      console.log('[Fixed Cache Manager] Starting auto-initialization...')
      await fixedCacheManager.initialize()
      console.log('[Fixed Cache Manager] Auto-initialization completed')
    } catch (error) {
      console.error('[Fixed Cache Manager] Auto-initialization failed:', error)
    }
  }, 1000)
}