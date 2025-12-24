/**
 * Cache Manager - Sistem complet configurabil pentru cache și cron jobs
 * Toate intervalele sunt configurabile din admin, fără valori hardcodate
 * Extended with Historical Cache Manager for persistent data storage
 * Enhanced with Persistent Flight Cache for disk-based flight data storage
 */

// Server-side only imports
let fs: any = null
let path: any = null
let historicalCacheManager: any = null
let persistentFlightCache: any = null

// Initialize historical cache manager only on server-side
if (typeof window === 'undefined') {
  try {
    // Try to load the real historical cache manager (with SQLite)
    const historicalModule = require('./historicalCacheManager')
    historicalCacheManager = historicalModule.historicalCacheManager
    console.log('[Cache Manager] Using real historical cache manager with SQLite')
  } catch (error) {
    // Fallback to mock version for local development
    console.log('[Cache Manager] SQLite not available, using mock historical cache manager')
    historicalCacheManager = {
      async initialize() { console.log('[Mock Historical Cache] Initialized') },
      async hasDataForDate() { return false },
      async getDataForDate() { return [] },
      async saveDailySnapshot(snapshot: any) { console.log('[Mock Historical Cache] Saved snapshot for', snapshot.airportCode, snapshot.type) }
    }
  }

  // Initialize persistent flight cache
  try {
    const { persistentFlightCache: pfc } = require('./persistentFlightCache')
    persistentFlightCache = pfc
    console.log('[Cache Manager] Persistent flight cache loaded')
  } catch (error) {
    console.error('[Cache Manager] Failed to load persistent flight cache:', error)
  }
}

// Initialize server-side modules only when running on server
if (typeof window === 'undefined') {
  fs = require('fs/promises')
  path = require('path')
}

// Tipuri pentru configurația cache
export interface CacheConfig {
  // Sosiri/Plecări - cron la fiecare 60 minute (configurabil)
  flightData: {
    cronInterval: number // minute
  }
  
  // Analize/Statistici - cron la 30 zile, cache 360 zile (configurabil)
  analytics: {
    cronInterval: number // zile
    cacheMaxAge: number // zile
  }
  
  // Informații aeronave - cron la 360 zile, cache 360 zile (configurabil)
  aircraft: {
    cronInterval: number // zile
    cacheMaxAge: number // zile
  }

  // Date meteo - cron la 30 minute (configurabil)
  weather: {
    cronInterval: number // minute
  }
}

// Tipuri pentru tracking request-uri
export interface RequestCounter {
  flightData: number
  analytics: number
  aircraft: number
  weather: number
  lastReset: string
  totalRequests: number
}

// Tipuri pentru cache entries
export interface CacheEntry<T = any> {
  id: string
  category: 'flightData' | 'analytics' | 'aircraft' | 'weather'
  key: string // airport code, analysis type, aircraft id, weather city, etc.
  data: T
  createdAt: string
  expiresAt: string | null
  lastAccessed: string
  source: 'cron' | 'manual'
  success: boolean
  error?: string
}

// Paths pentru fișiere - doar pe server
const getCacheConfigPath = () => path?.join(process.cwd(), 'data', 'cache-config.json')
const getRequestCounterPath = () => path?.join(process.cwd(), 'data', 'request-counter.json')
const getCacheDataPath = () => path?.join(process.cwd(), 'data', 'cache-data.json')

class CacheManager {
  private static instance: CacheManager
  private config: CacheConfig | null = null
  private requestCounter: RequestCounter | null = null
  private cacheData: Map<string, CacheEntry> = new Map()
  private cronJobs: Map<string, NodeJS.Timeout> = new Map()
  private isInitialized: boolean = false

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Inițializează cache manager-ul - DOAR O DATĂ
   */
  async initialize(): Promise<void> {
    // Doar pe server-side
    if (typeof window !== 'undefined') return
    
    // Previne inițializarea multiplă
    if (this.isInitialized) {
      console.log('[Cache Manager] Already initialized, skipping...')
      return
    }
    
    console.log('[Cache Manager] Initializing for the first time...')
    
    // Oprește orice cron jobs existente înainte de inițializare
    this.stopCronJobs()
    
    await this.ensureDataDirectory()
    await this.loadConfig()
    await this.loadRequestCounter()
    await this.loadCacheData()
    
    // Initialize historical cache manager
    if (historicalCacheManager) {
      try {
        await historicalCacheManager.initialize()
        console.log('[Cache Manager] Historical cache manager initialized')
      } catch (error) {
        console.error('[Cache Manager] Failed to initialize historical cache manager:', error)
        // Continue without historical cache if it fails
      }
    }

    // Initialize persistent flight cache
    if (persistentFlightCache) {
      try {
        await persistentFlightCache.loadCache()
        console.log('[Cache Manager] Persistent flight cache initialized')
      } catch (error) {
        console.error('[Cache Manager] Failed to initialize persistent flight cache:', error)
        // Continue without persistent cache if it fails
      }
    }
    
    await this.startCronJobs()
    
    this.isInitialized = true
    console.log('[Cache Manager] Initialization complete')
  }

  /**
   * Asigură că directorul data există
   */
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
   * Încarcă configurația cache (cu valori default dacă nu există)
   */
  private async loadConfig(): Promise<void> {
    if (!fs) return
    
    try {
      const data = await fs.readFile(getCacheConfigPath(), 'utf-8')
      const loadedConfig = JSON.parse(data)
      
      // Ensure all required properties exist, merge with defaults
      this.config = {
        flightData: {
          cronInterval: loadedConfig.flightData?.cronInterval || 60
        },
        analytics: {
          cronInterval: loadedConfig.analytics?.cronInterval || 7,
          cacheMaxAge: loadedConfig.analytics?.cacheMaxAge || 30
        },
        aircraft: {
          cronInterval: loadedConfig.aircraft?.cronInterval || 7,
          cacheMaxAge: loadedConfig.aircraft?.cacheMaxAge || 30
        },
        weather: {
          cronInterval: loadedConfig.weather?.cronInterval || 30
        }
      }
      
      // Save the merged config to ensure all properties are present
      await this.saveConfig()
    } catch {
      // Configurație default - TOATE valorile sunt configurabile din admin
      this.config = {
        flightData: {
          cronInterval: 60 // minute
        },
        analytics: {
          cronInterval: 7, // zile (redus pentru a evita overflow)
          cacheMaxAge: 30 // zile (redus pentru a evita overflow)
        },
        aircraft: {
          cronInterval: 7, // zile (redus pentru a evita overflow)
          cacheMaxAge: 30 // zile (redus pentru a evita overflow)
        },
        weather: {
          cronInterval: 30 // minute - economisește API requests
        }
      }
      await this.saveConfig()
    }
  }

  /**
   * Salvează configurația cache
   */
  private async saveConfig(): Promise<void> {
    if (!fs || !this.config) return
    
    await fs.writeFile(getCacheConfigPath(), JSON.stringify(this.config, null, 2))
  }

  /**
   * Încarcă contorul de request-uri
   */
  private async loadRequestCounter(): Promise<void> {
    if (!fs) return
    
    try {
      const data = await fs.readFile(getRequestCounterPath(), 'utf-8')
      this.requestCounter = JSON.parse(data)
    } catch {
      this.requestCounter = {
        flightData: 0,
        analytics: 0,
        aircraft: 0,
        weather: 0,
        lastReset: new Date().toISOString(),
        totalRequests: 0
      }
      await this.saveRequestCounter()
    }
  }

  /**
   * Salvează contorul de request-uri
   */
  private async saveRequestCounter(): Promise<void> {
    if (!fs || !this.requestCounter) return
    
    await fs.writeFile(getRequestCounterPath(), JSON.stringify(this.requestCounter, null, 2))
  }

  /**
   * Încarcă datele din cache
   */
  private async loadCacheData(): Promise<void> {
    if (!fs) return
    
    try {
      const data = await fs.readFile(getCacheDataPath(), 'utf-8')
      const cacheArray: CacheEntry[] = JSON.parse(data)
      
      this.cacheData.clear()
      cacheArray.forEach(entry => {
        this.cacheData.set(entry.id, entry)
      })
      
      console.log(`Loaded ${this.cacheData.size} cache entries`)
    } catch {
      console.log('No existing cache data found, starting fresh')
    }
  }

  /**
   * Salvează datele cache
   */
  private async saveCacheData(): Promise<void> {
    if (!fs) return
    
    const cacheArray = Array.from(this.cacheData.values())
    await fs.writeFile(getCacheDataPath(), JSON.stringify(cacheArray, null, 2))
  }

  /**
   * Pornește cron jobs-urile bazate pe configurație
   */
  private async startCronJobs(): Promise<void> {
    if (!this.config) {
      console.error('[Cache Manager] No configuration available for cron jobs')
      return
    }

    // Validate configuration has all required properties
    if (!this.config.flightData?.cronInterval || 
        !this.config.analytics?.cronInterval || 
        !this.config.aircraft?.cronInterval || 
        !this.config.weather?.cronInterval) {
      console.error('[Cache Manager] Invalid configuration - missing required properties')
      console.log('[Cache Manager] Current config:', JSON.stringify(this.config, null, 2))
      return
    }

    // Oprește job-urile existente pentru a preveni duplicate
    this.stopCronJobs()
    
    console.log('[Cache Manager] Starting cron jobs...')

    // Flight Data Cron - la fiecare X minute
    const flightDataInterval = this.config.flightData.cronInterval * 60 * 1000 // convert to ms
    const flightDataJob = setInterval(async () => {
      await this.runFlightDataCron()
    }, flightDataInterval)
    this.cronJobs.set('flightData', flightDataJob)

    // Analytics Cron - la fiecare X zile (max 24 zile pentru a evita overflow)
    const maxAnalyticsInterval = Math.min(this.config.analytics.cronInterval, 24) // max 24 zile
    const analyticsInterval = maxAnalyticsInterval * 24 * 60 * 60 * 1000 // convert to ms
    const analyticsJob = setInterval(async () => {
      await this.runAnalyticsCron()
    }, analyticsInterval)
    this.cronJobs.set('analytics', analyticsJob)

    // Aircraft Cron - la fiecare X zile (max 24 zile pentru a evita overflow)
    const maxAircraftInterval = Math.min(this.config.aircraft.cronInterval, 24) // max 24 zile
    const aircraftInterval = maxAircraftInterval * 24 * 60 * 60 * 1000 // convert to ms
    const aircraftJob = setInterval(async () => {
      await this.runAircraftCron()
    }, aircraftInterval)
    this.cronJobs.set('aircraft', aircraftJob)

    // Weather Cron - la fiecare X minute
    const weatherInterval = this.config.weather.cronInterval * 60 * 1000 // convert to ms
    const weatherJob = setInterval(async () => {
      await this.runWeatherCron()
    }, weatherInterval)
    this.cronJobs.set('weather', weatherJob)

    console.log('[Cache Manager] Cron jobs started with intervals:', {
      flightData: `${this.config.flightData.cronInterval} minutes`,
      analytics: `${this.config.analytics.cronInterval} days`,
      aircraft: `${this.config.aircraft.cronInterval} days`,
      weather: `${this.config.weather.cronInterval} minutes`
    })

    // Rulează imediat pentru a popula cache-ul (doar dacă nu există deja date)
    if (this.cacheData.size === 0) {
      console.log('[Cache Manager] No cached data found, running initial population...')
      setTimeout(() => this.runFlightDataCron(), 1000)
      setTimeout(() => this.runAnalyticsCron(), 2000)
      setTimeout(() => this.runAircraftCron(), 3000)
      setTimeout(() => this.runWeatherCron(), 4000)
    } else {
      console.log(`[Cache Manager] Found ${this.cacheData.size} cached entries, skipping initial population`)
    }
  }

  /**
   * Oprește toate cron job-urile
   */
  private stopCronJobs(): void {
    console.log(`[Cache Manager] Stopping ${this.cronJobs.size} existing cron jobs...`)
    this.cronJobs.forEach((job, name) => {
      clearInterval(job)
      console.log(`[Cache Manager] Stopped cron job: ${name}`)
    })
    this.cronJobs.clear()
  }

  /**
   * Cron job pentru flight data (sosiri/plecări)
   */
  private async runFlightDataCron(): Promise<void> {
    console.log('Running flight data cron job...')
    
    // Obține toate aeroporturile din România și Moldova din baza de date
    const airports = await this.getAllSupportedAirports()
    
    for (const airport of airports) {
      await this.fetchAndCacheFlightData(airport, 'arrivals', 'cron')
      await this.fetchAndCacheFlightData(airport, 'departures', 'cron')
    }
  }

  /**
   * Cron job pentru analytics
   */
  private async runAnalyticsCron(): Promise<void> {
    console.log('Running analytics cron job...')
    
    // Obține toate aeroporturile din România și Moldova din baza de date
    const airports = await this.getAllSupportedAirports()
    
    for (const airport of airports) {
      await this.fetchAndCacheAnalytics(airport, 'cron')
    }
  }

  /**
   * Cron job pentru aircraft data
   */
  private async runAircraftCron(): Promise<void> {
    console.log('Running aircraft cron job...')
    
    // Obține lista de aeronave din cache-ul existent sau din API
    const aircraftList = await this.getKnownAircraft()
    
    for (const aircraft of aircraftList) {
      await this.fetchAndCacheAircraftData(aircraft, 'cron')
    }
  }

  /**
   * Cron job pentru weather data
   */
  private async runWeatherCron(): Promise<void> {
    console.log('Running weather cron job...')
    
    try {
      // Import dinamic pentru a evita circular dependencies
      const WeatherService = (await import('./weatherService')).default
      
      const apiKey = '213057a2c7203b4352a879db4465f273'
      const weatherService = new WeatherService(apiKey)
      
      // Fetch weather data pentru toate orașele din România și Moldova
      const allWeatherData = await weatherService.getAllWeatherData()
      
      if (Object.keys(allWeatherData).length > 0) {
        // Incrementează contorul pentru weather requests
        this.incrementRequestCounter('weather')
        
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
        
        // Șterge intrarea veche pentru weather
        const oldEntries = Array.from(this.cacheData.values()).filter(
          entry => entry.category === 'weather' && entry.key === cacheKey
        )
        oldEntries.forEach(entry => this.cacheData.delete(entry.id))
        
        this.cacheData.set(cacheEntry.id, cacheEntry)
        await this.saveCacheData()
        
        console.log(`[Cache Manager] Successfully cached weather data for ${Object.keys(allWeatherData).length} cities`)
        
        // INTEGRATE WEATHER INTO FLIGHT CACHE - Update existing flight cache entries with weather info
        await this.integrateWeatherIntoFlightCache(allWeatherData)
        
      } else {
        console.log('[Cache Manager] No weather data received from API')
      }
      
    } catch (error) {
      console.error('[Cache Manager] Error in weather cron job:', error)
      this.incrementRequestCounter('weather')
    }
  }

  /**
   * Integrate weather data into existing flight cache entries
   * This adds weather_info to flight cache for instant access without separate API calls
   */
  private async integrateWeatherIntoFlightCache(weatherData: { [cityName: string]: any }): Promise<void> {
    console.log('[Cache Manager] Integrating weather data into flight cache...')
    
    // Airport to city mapping for weather correlation
    const airportToCityMap: { [key: string]: string } = {
      'OTP': 'Bucharest',
      'BBU': 'Bucharest',
      'CLJ': 'Cluj-Napoca',
      'TSR': 'Timisoara',
      'IAS': 'Iasi',
      'CND': 'Constanta',
      'CRA': 'Craiova',
      'SBZ': 'Sibiu',
      'BCM': 'Bacau',
      'BAY': 'Baia Mare',
      'OMR': 'Oradea',
      'SCV': 'Suceava',
      'TGM': 'Targu Mures',
      'ARW': 'Arad',
      'SUJ': 'Satu Mare',
      'RMO': 'Chisinau'
    }
    
    let updatedEntries = 0
    
    // Find all flight cache entries and add weather info
    for (const [entryId, entry] of this.cacheData.entries()) {
      if (entry.category === 'flightData') {
        // Extract airport code from cache key (format: "OTP_arrivals" or "CLJ_departures")
        const [airportCode] = entry.key.split('_')
        const cityName = airportToCityMap[airportCode]
        
        if (cityName && weatherData[cityName]) {
          // Extract actual flight data - handle both old and new formats
          let actualFlightData = entry.data
          
          // If data is already in new format with flights property, extract the flights
          if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
            actualFlightData = entry.data.flights
            
            // Handle deeply nested flights structure (corruption fix)
            while (actualFlightData && typeof actualFlightData === 'object' && 'flights' in actualFlightData && !Array.isArray(actualFlightData)) {
              actualFlightData = actualFlightData.flights
            }
          }
          
          // Ensure we have an array of flights
          if (!Array.isArray(actualFlightData)) {
            actualFlightData = []
          }
          
          // Create updated entry with weather info
          const updatedEntry: CacheEntry = {
            ...entry,
            data: {
              flights: actualFlightData, // Clean flight data array
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
          
          // Replace the entry in cache
          this.cacheData.set(entryId, updatedEntry)
          updatedEntries++
        }
      }
    }
    
    if (updatedEntries > 0) {
      await this.saveCacheData()
      console.log(`[Cache Manager] Updated ${updatedEntries} flight cache entries with weather data`)
    }
  }

  /**
   * Get flight data with integrated weather information
   * Returns both flight data and weather info in a unified structure
   */
  getFlightDataWithWeather<T>(airportCode: string, type: 'arrivals' | 'departures'): {
    flights: T | null
    weather_info: any | null
    hasWeatherAlert: boolean
  } {
    const cacheKey = `${airportCode}_${type}`
    const entry = Array.from(this.cacheData.values()).find(
      e => e.category === 'flightData' && e.key === cacheKey && !this.isExpired(e)
    )
    
    if (!entry) {
      return { flights: null, weather_info: null, hasWeatherAlert: false }
    }
    
    // Handle corrupted nested structure and extract clean flight data
    let actualFlightData = entry.data
    let weatherInfo = null
    
    // Check if entry has integrated weather data (new format)
    if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data && 'weather_info' in entry.data) {
      actualFlightData = entry.data.flights
      weatherInfo = entry.data.weather_info
      
      // Handle deeply nested flights structure (corruption fix)
      while (actualFlightData && typeof actualFlightData === 'object' && 'flights' in actualFlightData && !Array.isArray(actualFlightData)) {
        actualFlightData = actualFlightData.flights
      }
    }
    // Handle old format or corrupted nested flights
    else if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
      actualFlightData = entry.data.flights
      
      // Handle deeply nested flights structure (corruption fix)
      while (actualFlightData && typeof actualFlightData === 'object' && 'flights' in actualFlightData && !Array.isArray(actualFlightData)) {
        actualFlightData = actualFlightData.flights
      }
    }
    
    // Ensure we have an array
    if (!Array.isArray(actualFlightData)) {
      actualFlightData = []
    }
    
    const hasAlert = weatherInfo?.flightImpact?.severity && 
                    ['moderate', 'high', 'severe'].includes(weatherInfo.flightImpact.severity)
    
    return {
      flights: actualFlightData as T,
      weather_info: weatherInfo,
      hasWeatherAlert: hasAlert || false
    }
  }
  private async fetchAndCacheFlightData(
    airportCode: string, 
    type: 'arrivals' | 'departures',
    source: 'cron' | 'manual'
  ): Promise<void> {
    console.log(`[Cache Manager] Fetching flight data for ${airportCode} ${type} (${source})`)
    
    // PRIMUL PAS: Încearcă să încarce datele din cache-ul persistent
    if (persistentFlightCache) {
      try {
        const cachedFlights = await persistentFlightCache.getFlightData(airportCode, type)
        
        if (cachedFlights.length > 0) {
          console.log(`[Cache Manager] Found ${cachedFlights.length} flights in persistent cache for ${airportCode} ${type}`)
          
          // Convertește datele din cache-ul persistent la formatul curent
          const convertedFlights = cachedFlights.map((flight: any) => ({
            flight_number: flight.flightNumber,
            airline: {
              code: flight.airlineCode,
              name: flight.airlineName
            },
            origin: {
              code: flight.originCode,
              name: flight.originName
            },
            destination: {
              code: flight.destinationCode,
              name: flight.destinationName
            },
            scheduled_time: flight.scheduledTime,
            actual_time: flight.actualTime,
            estimated_time: flight.estimatedTime,
            status: flight.status,
            delay: flight.delayMinutes
          }))

          // Salvează în cache-ul în memorie pentru acces rapid
          const cacheKey = `${airportCode}_${type}`
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

          const cacheEntry: CacheEntry = {
            id: `flight_${cacheKey}_${Date.now()}`,
            category: 'flightData',
            key: cacheKey,
            data: convertedFlights,
            createdAt: new Date().toISOString(),
            expiresAt,
            lastAccessed: new Date().toISOString(),
            source: 'manual', // Marchează ca manual pentru că vine din cache persistent
            success: true
          }

          // Remove old entry and add new one
          const oldEntries = Array.from(this.cacheData.values()).filter(
            entry => entry.category === 'flightData' && entry.key === cacheKey
          )
          oldEntries.forEach(entry => this.cacheData.delete(entry.id))
          
          this.cacheData.set(cacheEntry.id, cacheEntry)
          await this.saveCacheData()
          
          console.log(`[Cache Manager] Loaded ${convertedFlights.length} flights from persistent cache for ${airportCode} ${type}`)
          
          // MODIFICAT: Întotdeauna fă API call pentru a actualiza cache-ul persistent cu date fresh
          // Nu mai returna aici - continuă cu API call pentru actualizare
        }
      } catch (error) {
        console.error('[Cache Manager] Error loading from persistent cache:', error)
      }
    }
    
    // Check historical cache first to avoid redundant API calls
    if (historicalCacheManager && source === 'cron') {
      const today = new Date().toISOString().split('T')[0]
      const hasHistoricalData = await historicalCacheManager.hasDataForDate(airportCode, today, type)
      
      if (hasHistoricalData) {
        console.log(`[Cache Manager] Historical data exists for ${airportCode} ${type} on ${today}, using cached data`)
        
        // Get data from historical cache
        const historicalData = await historicalCacheManager.getDataForDate(airportCode, today, type)
        
        if (historicalData.length > 0) {
          // Convert historical data to current cache format and store in memory cache
          const cacheKey = `${airportCode}_${type}`
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days for statistics

          const cacheEntry: CacheEntry = {
            id: `flight_${cacheKey}_${Date.now()}`,
            category: 'flightData',
            key: cacheKey,
            data: historicalData,
            createdAt: new Date().toISOString(),
            expiresAt,
            lastAccessed: new Date().toISOString(),
            source: 'manual',
            success: true
          }

          // Remove old entry and add new one
          const oldEntries = Array.from(this.cacheData.values()).filter(
            entry => entry.category === 'flightData' && entry.key === cacheKey
          )
          oldEntries.forEach(entry => this.cacheData.delete(entry.id))
          
          this.cacheData.set(cacheEntry.id, cacheEntry)
          await this.saveCacheData()
          
          console.log(`[Cache Manager] Used historical cache data for ${airportCode} ${type} (${historicalData.length} flights)`)
          return
        }
      }
    }
    
    try {
      // Import dinamic pentru a evita circular dependencies
      const { default: FlightApiService } = await import('./flightApiService')
      
      const apiService = new FlightApiService({
        provider: 'aerodatabox',
        apiKey: process.env.NEXT_PUBLIC_FLIGHT_API_KEY || process.env.AERODATABOX_API_KEY || '',
        baseUrl: 'https://prod.api.market/api/v1/aedbx/aerodatabox',
        rateLimit: 100
      })
      const response = type === 'arrivals' 
        ? await apiService.getArrivals(airportCode)
        : await apiService.getDepartures(airportCode)

      console.log(`[Cache Manager] API response for ${airportCode} ${type}: success=${response.success}, data length=${response.data?.length || 0}`)

      // Incrementează contorul
      this.incrementRequestCounter('flightData')

      const cacheKey = `${airportCode}_${type}`
      // Pentru statistici pe perioade, păstrăm datele mai mult timp
      // Cache-ul pentru flight data nu expiră rapid - se păstrează pentru analize
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 zile pentru statistici

      const timestamp = Date.now()
      const cacheEntry: CacheEntry = {
        id: `flight_${cacheKey}_${timestamp}`,
        category: 'flightData',
        key: cacheKey,
        data: response.data,
        createdAt: new Date().toISOString(),
        expiresAt,
        lastAccessed: new Date().toISOString(),
        source,
        success: response.success,
        error: response.error
      }

      // Pentru flight data, păstrăm doar ultima intrare pentru fiecare cheie (pentru afișare curentă)
      // dar păstrăm datele în historical cache pentru statistici pe perioade
      const oldEntries = Array.from(this.cacheData.values()).filter(
        entry => entry.category === 'flightData' && entry.key === cacheKey
      )
      
      // NU ȘTERGE NICIODATĂ datele vechi automat - doar prin comandă manuală din admin
      if (response.success && response.data && response.data.length > 0) {
        // SALVEAZĂ ÎN CACHE-UL PERSISTENT ÎNAINTE DE ORICE
        if (persistentFlightCache) {
          try {
            await persistentFlightCache.addFlightData(airportCode, type, response.data, 'api')
            console.log(`[Cache Manager] Saved ${response.data.length} flights to persistent cache`)
          } catch (error) {
            console.error('[Cache Manager] Failed to save to persistent cache:', error)
          }
        }

        // Doar dacă avem date noi și valide, înlocuiește datele vechi în memoria cache
        oldEntries.forEach(entry => this.cacheData.delete(entry.id))
        
        // Adaugă noua intrare
        this.cacheData.set(cacheEntry.id, cacheEntry)
        await this.saveCacheData()
        console.log(`[Cache Manager] Successfully updated cache for ${airportCode} ${type} with ${response.data.length} flights`)
      } else {
        // Păstrează ÎNTOTDEAUNA datele vechi când API-ul eșuează sau nu returnează date
        console.log(`[Cache Manager] API failed or returned no data for ${airportCode} ${type}, keeping existing cache data`)
        if (oldEntries.length === 0) {
          // Doar dacă nu există deloc date, salvează intrarea cu eroare pentru debugging
          this.cacheData.set(cacheEntry.id, cacheEntry)
          await this.saveCacheData()
        }
      }

      // Save to historical cache if we have new data from API
      if (historicalCacheManager && response.success && response.data && response.data.length > 0 && source === 'cron') {
        try {
          const today = new Date().toISOString().split('T')[0]
          const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5) // HH:mm format
          
          // Convert API response to historical format
          const flightData: any[] = response.data
            .map((flight: any) => {
              // Skip flights without valid airport codes
              const originCode = flight.origin?.code || flight.originCode;
              const destinationCode = flight.destination?.code || flight.destinationCode;
              
              if (!originCode || !destinationCode) {
                return null; // Skip this flight - no valid airport codes
              }
              
              return {
                flightNumber: flight.flight_number || flight.flightNumber || 'N/A',
                airlineCode: flight.airline?.code || flight.airlineCode || 'XX',
                airlineName: flight.airline?.name || flight.airlineName || 'Unknown',
                originCode: originCode,
                originName: flight.origin?.name || flight.originName || originCode,
                destinationCode: destinationCode,
                destinationName: flight.destination?.name || flight.destinationName || destinationCode,
                scheduledTime: flight.scheduled_time || flight.scheduledTime || new Date().toISOString(),
                actualTime: flight.actual_time || flight.actualTime || undefined,
                estimatedTime: flight.estimated_time || flight.estimatedTime || undefined,
                status: flight.status || 'scheduled',
                delayMinutes: flight.delay || flight.delayMinutes || 0
              };
            })
            .filter(flight => flight !== null) // Remove null entries
          
          const dailySnapshot: any = {
            airportCode,
            date: today,
            time: currentTime,
            type,
            source: 'api',
            flights: flightData
          }
          
          await historicalCacheManager.saveDailySnapshot(dailySnapshot)
          console.log(`[Cache Manager] Saved ${flightData.length} flights to historical cache for ${airportCode} ${type}`)
          
        } catch (historicalError) {
          console.error('[Cache Manager] Failed to save to historical cache:', historicalError)
          // Don't fail the main caching operation if historical save fails
        }
      }

      console.log(`[Cache Manager] Successfully cached flight data for ${airportCode} ${type} (${source}) - ${response.data?.length || 0} flights`)
      console.log(`[Cache Manager] Cache now contains ${this.cacheData.size} total entries`)

    } catch (error) {
      console.error(`[Cache Manager] Error fetching flight data for ${airportCode} ${type}:`, error)
      
      // Incrementează contorul chiar și pentru erori
      this.incrementRequestCounter('flightData')
    }
  }

  /**
   * Fetch și cache analytics pentru un aeroport
   */
  private async fetchAndCacheAnalytics(airportCode: string, source: 'cron' | 'manual'): Promise<void> {
    try {
      // Generate REAL analytics from cached flight data (including persistent cache)
      const arrivalsKey = `${airportCode}_arrivals`
      const departuresKey = `${airportCode}_departures`
      
      const cachedArrivals = await this.getCachedDataWithPersistent<any[]>(arrivalsKey) || []
      const cachedDepartures = await this.getCachedDataWithPersistent<any[]>(departuresKey) || []
      
      const allFlights = [...cachedArrivals, ...cachedDepartures]
      
      if (allFlights.length === 0) {
        console.log(`No flight data available for analytics generation: ${airportCode}`)
        return // Skip analytics generation if no flight data exists
      }
      
      // Calculate REAL statistics from cached flight data
      const totalFlights = allFlights.length
      
      // Calculate statistics based on both times and status
      let onTimeFlights = 0
      let delayedFlights = 0
      let cancelledFlights = 0
      const delayCalculations: number[] = []
      
      allFlights.forEach((f: any) => {
        const status = f.status?.toLowerCase() || ''
        
        // Check for cancelled flights first
        if (status === 'cancelled' || status === 'canceled') {
          cancelledFlights++
          return
        }
        
        // Calculate delay from flight data - check multiple delay sources
        let delayMinutes = 0
        
        // Priority 1: Use existing delay field if available
        if (f.delay && typeof f.delay === 'number' && f.delay > 0) {
          delayMinutes = f.delay
        }
        // Priority 2: Calculate from times if available
        else if (f.scheduled_time && (f.actual_time || f.estimated_time)) {
          const scheduledTime = new Date(f.scheduled_time)
          const actualTime = new Date(f.actual_time || f.estimated_time)
          delayMinutes = Math.max(0, (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60))
        }
        // Priority 3: Use status to infer delay
        else if (status === 'delayed') {
          delayMinutes = 30 // Assume 30 minutes for status-only delayed flights
        }
        
        // Classify flight based on delay
        if (delayMinutes > 15) {
          delayedFlights++
          delayCalculations.push(delayMinutes)
        } else if (status === 'delayed' && delayMinutes <= 15) {
          // Status says delayed but calculated delay is small - trust the status
          delayedFlights++
          delayCalculations.push(Math.max(delayMinutes, 20)) // Minimum 20 min for delayed status
        } else {
          // On-time flight (delay <= 15 minutes or good status)
          onTimeFlights++
        }
      })
      
      const averageDelay = delayCalculations.length > 0 
        ? (() => {
            // Use median instead of mean for more realistic delay representation
            const sortedDelays = delayCalculations.sort((a, b) => a - b)
            const medianIndex = Math.floor(sortedDelays.length / 2)
            
            if (sortedDelays.length % 2 === 0) {
              // Even number of values - average of two middle values
              return Math.round((sortedDelays[medianIndex - 1] + sortedDelays[medianIndex]) / 2)
            } else {
              // Odd number of values - middle value
              return sortedDelays[medianIndex]
            }
          })()
        : 0
      
      const onTimePercentage = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0
      const delayIndex = Math.min(100, Math.round((delayedFlights / totalFlights) * 100 + (averageDelay / 60) * 10))
      
      // Calculate peak delay hours
      const peakDelayHours = this.calculatePeakDelayHours(allFlights)
      
      // Generate route analysis
      const mostFrequentRoutes = this.analyzeRoutes(allFlights, airportCode)
      
      const realStats = {
        airportCode,
        period: 'monthly',
        totalFlights,
        onTimeFlights,
        delayedFlights,
        cancelledFlights,
        averageDelay,
        onTimePercentage,
        delayIndex,
        peakDelayHours,
        mostFrequentRoutes
      }
      
      // NU incrementa contorul pentru analytics - acestea sunt generate din cache local
      // this.incrementRequestCounter('analytics')

      const cacheKey = `analytics_${airportCode}`
      const expiresAt = new Date(Date.now() + this.config!.analytics.cacheMaxAge * 24 * 60 * 60 * 1000).toISOString()

      const cacheEntry: CacheEntry = {
        id: `analytics_${cacheKey}_${Date.now()}`,
        category: 'analytics',
        key: cacheKey,
        data: realStats,
        createdAt: new Date().toISOString(),
        expiresAt,
        lastAccessed: new Date().toISOString(),
        source,
        success: true
      }

      // Șterge intrarea veche
      const oldEntries = Array.from(this.cacheData.values()).filter(
        entry => entry.category === 'analytics' && entry.key === cacheKey
      )
      oldEntries.forEach(entry => this.cacheData.delete(entry.id))

      this.cacheData.set(cacheEntry.id, cacheEntry)
      await this.saveCacheData()

      console.log(`Generated REAL analytics for ${airportCode} from ${totalFlights} cached flights (${source})`)

    } catch (error) {
      console.error(`Error generating analytics for ${airportCode}:`, error)
      // NU incrementa contorul pentru erori de analytics
    }
  }

  /**
   * Fetch și cache aircraft data
   */
  private async fetchAndCacheAircraftData(aircraftId: string, source: 'cron' | 'manual'): Promise<void> {
    try {
      // Import dinamic
      const { flightAnalyticsService } = await import('./flightAnalyticsService')
      
      const aircraftInfo = await flightAnalyticsService.getAircraftInfo(aircraftId)
      
      // Incrementează contorul
      this.incrementRequestCounter('aircraft')

      if (aircraftInfo) {
        const cacheKey = `aircraft_${aircraftId}`
        const expiresAt = new Date(Date.now() + this.config!.aircraft.cacheMaxAge * 24 * 60 * 60 * 1000).toISOString()

        const cacheEntry: CacheEntry = {
          id: `aircraft_${cacheKey}_${Date.now()}`,
          category: 'aircraft',
          key: cacheKey,
          data: aircraftInfo,
          createdAt: new Date().toISOString(),
          expiresAt,
          lastAccessed: new Date().toISOString(),
          source,
          success: true
        }

        // Șterge intrarea veche
        const oldEntries = Array.from(this.cacheData.values()).filter(
          entry => entry.category === 'aircraft' && entry.key === cacheKey
        )
        oldEntries.forEach(entry => this.cacheData.delete(entry.id))

        this.cacheData.set(cacheEntry.id, cacheEntry)
        await this.saveCacheData()

        console.log(`Cached aircraft data for ${aircraftId} (${source})`)
      }

    } catch (error) {
      console.error(`Error fetching aircraft data for ${aircraftId}:`, error)
      this.incrementRequestCounter('aircraft')
    }
  }





  /**
   * Refresh manual pentru o categorie specifică
   */
  async manualRefresh(category: 'flightData' | 'analytics' | 'aircraft' | 'weather', identifier?: string): Promise<void> {
    console.log(`Manual refresh triggered for ${category}${identifier ? ` (${identifier})` : ''}`)

    switch (category) {
      case 'flightData':
        if (identifier) {
          // Refresh pentru un aeroport specific
          await this.fetchAndCacheFlightData(identifier, 'arrivals', 'manual')
          await this.fetchAndCacheFlightData(identifier, 'departures', 'manual')
        } else {
          // Refresh pentru toate aeroporturile
          await this.runFlightDataCron()
        }
        break

      case 'analytics':
        if (identifier) {
          await this.fetchAndCacheAnalytics(identifier, 'manual')
        } else {
          await this.runAnalyticsCron()
        }
        break

      case 'aircraft':
        if (identifier) {
          await this.fetchAndCacheAircraftData(identifier, 'manual')
        } else {
          await this.runAircraftCron()
        }
        break

      case 'weather':
        // Weather nu are identifier specific - refresh pentru toate orașele
        await this.runWeatherCron()
        break
    }
  }

  /**
   * Actualizează configurația cache și repornește cron jobs
   */
  async updateConfig(newConfig: CacheConfig): Promise<void> {
    this.config = newConfig
    await this.saveConfig()
    
    // Oprește job-urile existente înainte de a le reporni
    this.stopCronJobs()
    await this.startCronJobs() // Repornește cu noile intervale
    
    console.log('[Cache Manager] Configuration updated and cron jobs restarted')
  }

  /**
   * Cleanup la shutdown
   */
  shutdown(): void {
    console.log('[Cache Manager] Shutting down...')
    this.stopCronJobs()
    this.isInitialized = false
  }



  /**
   * Obține statistici cache
   */
  getCacheStats(): {
    config: CacheConfig | null
    requestCounter: RequestCounter | null
    cacheEntries: {
      flightData: number
      analytics: number
      aircraft: number
      weather: number
      total: number
    }
    lastUpdated: {
      flightData: string | null
      analytics: string | null
      aircraft: string | null
      weather: string | null
    }
  } {
    const entries = Array.from(this.cacheData.values())
    
    const flightDataEntries = entries.filter(e => e.category === 'flightData')
    const analyticsEntries = entries.filter(e => e.category === 'analytics')
    const aircraftEntries = entries.filter(e => e.category === 'aircraft')
    const weatherEntries = entries.filter(e => e.category === 'weather')

    return {
      config: this.config,
      requestCounter: this.requestCounter,
      cacheEntries: {
        flightData: flightDataEntries.length,
        analytics: analyticsEntries.length,
        aircraft: aircraftEntries.length,
        weather: weatherEntries.length,
        total: entries.length
      },
      lastUpdated: {
        flightData: flightDataEntries.length > 0 
          ? flightDataEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null,
        analytics: analyticsEntries.length > 0
          ? analyticsEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null,
        aircraft: aircraftEntries.length > 0
          ? aircraftEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null,
        weather: weatherEntries.length > 0
          ? weatherEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null
      }
    }
  }

  /**
   * Obține statistici cache persistent
   */
  async getPersistentCacheStats(): Promise<any> {
    if (!persistentFlightCache) {
      return { error: 'Persistent cache not available' }
    }

    try {
      return await persistentFlightCache.getCacheStats()
    } catch (error) {
      console.error('[Cache Manager] Error getting persistent cache stats:', error)
      return { error: 'Failed to get persistent cache stats' }
    }
  }

  /**
   * Curăță cache-ul persistent (datele mai vechi de 14 zile)
   */
  async cleanPersistentCache(): Promise<number> {
    if (!persistentFlightCache) {
      console.log('[Cache Manager] Persistent cache not available')
      return 0
    }

    try {
      const deletedCount = await persistentFlightCache.cleanOldData()
      console.log(`[Cache Manager] Cleaned ${deletedCount} old entries from persistent cache`)
      return deletedCount
    } catch (error) {
      console.error('[Cache Manager] Error cleaning persistent cache:', error)
      return 0
    }
  }

  /**
   * Șterge tot cache-ul persistent (DOAR CU CONFIRMARE EXPLICITĂ!)
   * ATENȚIE: Această funcție șterge TOATE datele istorice!
   */
  async clearPersistentCache(confirmationToken?: string): Promise<void> {
    if (!persistentFlightCache) {
      console.log('[Cache Manager] Persistent cache not available')
      return
    }

    // PROTECȚIE: Necesită token de confirmare explicit
    if (confirmationToken !== 'CONFIRM_DELETE_ALL_HISTORICAL_DATA') {
      console.error('[Cache Manager] REJECTED: Persistent cache clear requires explicit confirmation token')
      throw new Error('Persistent cache clear requires explicit confirmation. This will delete ALL historical flight data!')
    }

    try {
      await persistentFlightCache.clearAllCache()
      console.log('[Cache Manager] ⚠️  CLEARED ALL PERSISTENT CACHE DATA - HISTORICAL DATA LOST!')
    } catch (error) {
      console.error('[Cache Manager] Error clearing persistent cache:', error)
    }
  }

  /**
   * Șterge cache-ul persistent pentru un aeroport specific
   */
  async clearAirportPersistentCache(airportCode: string): Promise<number> {
    if (!persistentFlightCache) {
      console.log('[Cache Manager] Persistent cache not available')
      return 0
    }

    try {
      const deletedCount = await persistentFlightCache.clearAirportCache(airportCode)
      console.log(`[Cache Manager] Cleared ${deletedCount} entries for ${airportCode} from persistent cache`)
      return deletedCount
    } catch (error) {
      console.error('[Cache Manager] Error clearing airport persistent cache:', error)
      return 0
    }
  }

  /**
   * Obține toate aeroporturile suportate din România și Moldova (coduri ICAO)
   */
  private async getAllSupportedAirports(): Promise<string[]> {
    try {
      // Import dinamic pentru a evita circular dependencies
      const { MAJOR_AIRPORTS } = await import('./airports')
      
      // Folosește codurile IATA direct
      const iataCodes = MAJOR_AIRPORTS
        .filter(airport => airport.country === 'România' || airport.country === 'Moldova')
        .map(airport => airport.code)
        .filter(iata => iata && iata.length === 3) // Validează codurile IATA
      
      console.log(`Found ${iataCodes.length} supported airports: ${iataCodes.join(', ')}`)
      return iataCodes
    } catch (error) {
      console.error('Error getting supported airports:', error)
      // Fallback la lista hardcodată în caz de eroare
      return ['OTP', 'TSR', 'CLJ', 'IAS', 'BCM', 'BBU', 'SBZ', 'SUJ', 'CND', 'OMR', 'SCV', 'TGM', 'BAY', 'CRA', 'ARW']
    }
  }

  /**
   * Obține lista de aeronave cunoscute din cache și din datele de zbor
   */
  private async getKnownAircraft(): Promise<string[]> {
    const aircraftSet = new Set<string>()
    
    // 1. Adaugă aeronave din cache-ul existent
    const aircraftEntries = Array.from(this.cacheData.values()).filter(
      entry => entry.category === 'aircraft'
    )
    aircraftEntries.forEach(entry => {
      aircraftSet.add(entry.key.replace('aircraft_', ''))
    })
    
    // 2. Extrage aeronave din datele de zbor cache-ate
    const flightEntries = Array.from(this.cacheData.values()).filter(
      entry => entry.category === 'flightData'
    )
    
    flightEntries.forEach(entry => {
      if (Array.isArray(entry.data)) {
        entry.data.forEach((flight: any) => {
          if (flight.aircraft?.icao24) {
            aircraftSet.add(flight.aircraft.icao24.toUpperCase())
          }
        })
      }
    })
    
    const aircraftList = Array.from(aircraftSet)
    console.log(`Found ${aircraftList.length} known aircraft from cache and flight data`)
    
    return aircraftList
  }

  /**
   * Curăță cache-ul expirat
   */
  async cleanExpiredCache(): Promise<number> {
    const now = new Date()
    let cleanedCount = 0

    const entries = Array.from(this.cacheData.entries())
    
    for (const [id, entry] of entries) {
      // Nu șterge flight data (se păstrează până la următoarea actualizare)
      if (entry.category === 'flightData') continue

      if (!entry.expiresAt) continue
      
      const expiresAt = new Date(entry.expiresAt)
      if (now > expiresAt) {
        this.cacheData.delete(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      await this.saveCacheData()
      console.log(`Cleaned ${cleanedCount} expired cache entries`)
    }

    return cleanedCount
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
      console.log(`Cleared ${deletedCount} cache entries matching pattern: ${pattern}`)
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
      console.log(`Cleared all ${totalEntries} cache entries`)
    }
  }

  /**
   * Reset request counter
   */
  resetRequestCounter(): void {
    if (this.requestCounter) {
      this.requestCounter.flightData = 0
      this.requestCounter.analytics = 0
      this.requestCounter.aircraft = 0
      this.requestCounter.totalRequests = 0
      this.requestCounter.lastReset = new Date().toISOString()
      
      this.saveRequestCounter()
      console.log('API request counter reset')
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expiresAt) return false
    return new Date() > new Date(entry.expiresAt)
  }

  /**
   * Calculate peak delay hours from flight data
   */
  private calculatePeakDelayHours(flights: any[]): number[] {
    const hourDelayMap = new Map<number, number[]>()
    
    flights.forEach(flight => {
      if (!flight.scheduled_time) return
      
      const scheduledTime = new Date(flight.scheduled_time)
      const hour = scheduledTime.getHours()
      let delayMinutes = 0
      
      // Calculate delay based on available data
      if (flight.actual_time || flight.estimated_time) {
        const actualTime = new Date(flight.actual_time || flight.estimated_time)
        delayMinutes = Math.max(0, (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60))
      } else {
        const status = flight.status?.toLowerCase() || ''
        if (status === 'delayed') {
          delayMinutes = 30 // Assume 30 minutes for status-only delayed flights
        }
      }
      
      if (delayMinutes > 0) {
        if (!hourDelayMap.has(hour)) {
          hourDelayMap.set(hour, [])
        }
        hourDelayMap.get(hour)!.push(delayMinutes)
      }
    })
    
    // Calculate average delay per hour
    const hourAverages: { hour: number; avgDelay: number }[] = []
    hourDelayMap.forEach((delays, hour) => {
      const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length
      hourAverages.push({ hour, avgDelay })
    })
    
    // Return top 4 hours with highest average delays, or default hours if no delays
    if (hourAverages.length === 0) {
      return [8, 12, 18, 22] // Default peak hours
    }
    
    return hourAverages
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 4)
      .map(item => item.hour)
  }

  /**
   * Analyze routes from flight data
   */
  private analyzeRoutes(flights: any[], airportCode: string): any[] {
    const routeMap = new Map<string, {
      flights: any[]
      origin: string
      destination: string
      airlines: Set<string>
    }>()
    
    flights.forEach(flight => {
      const origin = flight.origin?.code || flight.origin
      const destination = flight.destination?.code || flight.destination
      
      if (!origin || !destination || origin === destination) return
      
      // Determine the other airport (not the current one)
      let otherAirport: string
      let routeKey: string
      
      if (origin === airportCode) {
        otherAirport = destination
        routeKey = `${airportCode}-${destination}`
      } else if (destination === airportCode) {
        otherAirport = origin
        routeKey = `${origin}-${airportCode}`
      } else {
        return // Flight doesn't involve our airport
      }
      
      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          flights: [],
          origin: airportCode,
          destination: otherAirport,
          airlines: new Set()
        })
      }
      
      const route = routeMap.get(routeKey)!
      route.flights.push(flight)
      
      // Get airline code and add to set
      const airlineCode = flight.airline?.code || flight.airline || 'XX'
      route.airlines.add(airlineCode)
    })
    
    // Convert to route analysis format
    const routes: any[] = []
    
    routeMap.forEach((route) => {
      const flightCount = route.flights.length
      
      // Better delay calculation for routes
      let onTimeCount = 0
      let delayedCount = 0
      const delayCalculations: number[] = []
      
      route.flights.forEach((f: any) => {
        const status = f.status?.toLowerCase() || ''
        let delayMinutes = 0
        
        // Calculate delay using same logic as main analytics
        if (f.delay && typeof f.delay === 'number' && f.delay > 0) {
          delayMinutes = f.delay
        } else if (f.scheduled_time && (f.actual_time || f.estimated_time)) {
          const scheduledTime = new Date(f.scheduled_time)
          const actualTime = new Date(f.actual_time || f.estimated_time)
          delayMinutes = Math.max(0, (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60))
        } else if (status === 'delayed') {
          delayMinutes = 30
        }
        
        if (delayMinutes > 15) {
          delayedCount++
          delayCalculations.push(delayMinutes)
        } else {
          onTimeCount++
        }
      })
      
      const averageDelay = delayCalculations.length > 0
        ? Math.round(delayCalculations.reduce((sum, delay) => sum + delay, 0) / delayCalculations.length)
        : 0
      
      const onTimePercentage = flightCount > 0 ? Math.round((onTimeCount / flightCount) * 100) : 0
      
      // Count flights per airline to show most frequent operators
      const airlineFlightCount = new Map<string, number>()
      route.flights.forEach(flight => {
        const airlineCode = flight.airline?.code || flight.airline || 'XX'
        airlineFlightCount.set(airlineCode, (airlineFlightCount.get(airlineCode) || 0) + 1)
      })
      
      // Sort airlines by flight count and take top 2 most frequent
      const topAirlines = Array.from(airlineFlightCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([code]) => code)
      
      routes.push({
        origin: route.origin,
        destination: route.destination,
        flightCount,
        averageDelay,
        onTimePercentage,
        airlines: topAirlines // Show only top 2 airlines by flight count
      })
    })
    
    // Return top 15 routes by flight count
    return routes.sort((a, b) => b.flightCount - a.flightCount).slice(0, 15)
  }

  /**
   * Get cached data by key (simple version)
   */
  /**
   * Get cached data by key (simple version) - synchronous for compatibility
   */
  getCachedData<T>(key: string): T | null {
    console.log(`[Cache Manager] Looking for key: ${key}`)
    console.log(`[Cache Manager] Available keys: ${Array.from(this.cacheData.values()).map(e => e.key).join(', ')}`)
    
    for (const entry of this.cacheData.values()) {
      if (entry.key === key) {
        const expired = this.isExpired(entry)
        console.log(`[Cache Manager] Found key ${key}, expired: ${expired}`)
        if (!expired) {
          console.log(`[Cache Manager] Returning data for key: ${key}`)
          return entry.data as T
        }
      }
    }
    console.log(`[Cache Manager] No valid data found for key: ${key}`)
    return null
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
    if ((key.includes('_arrivals') || key.includes('_departures')) && persistentFlightCache) {
      try {
        const [airportCode, type] = key.split('_')
        if (airportCode && type) {
          const persistentData = await persistentFlightCache.getFlightData(airportCode, type as 'arrivals' | 'departures')
          if (persistentData && persistentData.length > 0) {
            console.log(`[Cache Manager] Found ${persistentData.length} flights in persistent cache for ${key}`)
            
            // Store in main cache for faster future access (with short TTL)
            this.setCachedData(key, persistentData as T, 'flightData', 5 * 60 * 1000) // 5 minutes
            return persistentData as T
          }
        }
      } catch (error) {
        console.error(`[Cache Manager] Error accessing persistent cache for ${key}:`, error)
      }
    }

    return null
  }

  /**
   * Set cached data (simple version)
   */
  setCachedData<T>(key: string, data: T, category: 'flightData' | 'analytics' | 'aircraft', ttlMs?: number): void {
    const now = new Date()
    const expiresAt = ttlMs ? new Date(now.getTime() + ttlMs) : null

    const entry: CacheEntry = {
      id: `${category}_${key}_${now.getTime()}`,
      category,
      key,
      data,
      createdAt: now.toISOString(),
      expiresAt: expiresAt?.toISOString() || null,
      lastAccessed: now.toISOString(),
      source: 'manual',
      success: true
    }

    this.cacheData.set(entry.id, entry)
    this.saveCacheData()
  }

  /**
   * Increment request counter
   */
  incrementRequestCounter(category: 'flightData' | 'analytics' | 'aircraft' | 'weather'): void {
    if (this.requestCounter) {
      this.requestCounter[category]++
      this.requestCounter.totalRequests++
      this.saveRequestCounter()
    }
  }
}

// Export singleton
export const cacheManager = CacheManager.getInstance()

// Auto-initialize disabled to prevent multiple initializations
// Initialize manually through API calls only
if (false && typeof window === 'undefined') {
  // Use setTimeout to avoid blocking the import
  setTimeout(async () => {
    try {
      await cacheManager.initialize()
      console.log('[Cache Manager] Auto-initialization completed')
    } catch (error) {
      console.error('[Cache Manager] Auto-initialization failed:', error)
    }
  }, 100)
}