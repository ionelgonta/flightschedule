/**
 * Cache Manager - Sistem complet configurabil pentru cache și cron jobs
 * Toate intervalele sunt configurabile din admin, fără valori hardcodate
 */

// Server-side only imports
let fs: any = null
let path: any = null

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
    cacheUntilNext: boolean // păstrează până la următoarea actualizare
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
}

// Tipuri pentru tracking request-uri
export interface RequestCounter {
  flightData: number
  analytics: number
  aircraft: number
  lastReset: string
  totalRequests: number
}

// Tipuri pentru cache entries
export interface CacheEntry<T = any> {
  id: string
  category: 'flightData' | 'analytics' | 'aircraft'
  key: string // airport code, analysis type, aircraft id, etc.
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
    
    await this.ensureDataDirectory()
    await this.loadConfig()
    await this.loadRequestCounter()
    await this.loadCacheData()
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
      this.config = JSON.parse(data)
    } catch {
      // Configurație default - TOATE valorile sunt configurabile din admin
      this.config = {
        flightData: {
          cronInterval: 60, // minute
          cacheUntilNext: true
        },
        analytics: {
          cronInterval: 30, // zile
          cacheMaxAge: 360 // zile
        },
        aircraft: {
          cronInterval: 360, // zile
          cacheMaxAge: 360 // zile
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
    if (!this.config) return

    // Oprește job-urile existente pentru a preveni duplicate
    this.stopCronJobs()
    
    console.log('[Cache Manager] Starting cron jobs...')

    // Flight Data Cron - la fiecare X minute
    const flightDataInterval = this.config.flightData.cronInterval * 60 * 1000 // convert to ms
    const flightDataJob = setInterval(async () => {
      await this.runFlightDataCron()
    }, flightDataInterval)
    this.cronJobs.set('flightData', flightDataJob)

    // Analytics Cron - la fiecare X zile
    const analyticsInterval = this.config.analytics.cronInterval * 24 * 60 * 60 * 1000 // convert to ms
    const analyticsJob = setInterval(async () => {
      await this.runAnalyticsCron()
    }, analyticsInterval)
    this.cronJobs.set('analytics', analyticsJob)

    // Aircraft Cron - la fiecare X zile
    const aircraftInterval = this.config.aircraft.cronInterval * 24 * 60 * 60 * 1000 // convert to ms
    const aircraftJob = setInterval(async () => {
      await this.runAircraftCron()
    }, aircraftInterval)
    this.cronJobs.set('aircraft', aircraftJob)

    console.log('[Cache Manager] Cron jobs started with intervals:', {
      flightData: `${this.config.flightData.cronInterval} minutes`,
      analytics: `${this.config.analytics.cronInterval} days`,
      aircraft: `${this.config.aircraft.cronInterval} days`
    })

    // Rulează imediat pentru a popula cache-ul (doar dacă nu există deja date)
    if (this.cacheData.size === 0) {
      console.log('[Cache Manager] No cached data found, running initial population...')
      setTimeout(() => this.runFlightDataCron(), 1000)
      setTimeout(() => this.runAnalyticsCron(), 2000)
      setTimeout(() => this.runAircraftCron(), 3000)
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
    
    // Lista aeroporturilor active
    const airports = ['LROP', 'LRTR', 'LRCL', 'LRIA', 'LRBC', 'LRBS', 'LRSB', 'LRSM', 'LRCS', 'LROD', 'LRSU', 'LRTU', 'LRBM', 'LRCV', 'LRCT', 'LRAR']
    
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
    
    const airports = ['LROP', 'LRTR', 'LRCL', 'LRIA', 'LRBC', 'LRBS', 'LRSB', 'LRSM', 'LRCS', 'LROD', 'LRSU', 'LRTU', 'LRBM', 'LRCV', 'LRCT', 'LRAR']
    
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
   * Fetch și cache flight data pentru un aeroport
   */
  private async fetchAndCacheFlightData(
    airportCode: string, 
    type: 'arrivals' | 'departures',
    source: 'cron' | 'manual'
  ): Promise<void> {
    try {
      // Import dinamic pentru a evita circular dependencies
      const { default: FlightApiService, API_CONFIGS } = await import('./flightApiService')
      
      const apiService = new FlightApiService(API_CONFIGS.aerodatabox)
      const response = type === 'arrivals' 
        ? await apiService.getArrivals(airportCode)
        : await apiService.getDepartures(airportCode)

      // Incrementează contorul
      this.incrementRequestCounter('flightData')

      const cacheKey = `${airportCode}_${type}`
      const expiresAt = this.config!.flightData.cacheUntilNext 
        ? new Date(Date.now() + this.config!.flightData.cronInterval * 60 * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 an dacă nu e until next

      const cacheEntry: CacheEntry = {
        id: `flight_${cacheKey}_${Date.now()}`,
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

      // Șterge intrarea veche pentru această cheie
      const oldEntries = Array.from(this.cacheData.values()).filter(
        entry => entry.category === 'flightData' && entry.key === cacheKey
      )
      oldEntries.forEach(entry => this.cacheData.delete(entry.id))

      // Adaugă noua intrare
      this.cacheData.set(cacheEntry.id, cacheEntry)
      await this.saveCacheData()

      console.log(`Cached flight data for ${airportCode} ${type} (${source})`)

    } catch (error) {
      console.error(`Error fetching flight data for ${airportCode} ${type}:`, error)
      
      // Incrementează contorul chiar și pentru erori
      this.incrementRequestCounter('flightData')
    }
  }

  /**
   * Fetch și cache analytics pentru un aeroport
   */
  private async fetchAndCacheAnalytics(airportCode: string, source: 'cron' | 'manual'): Promise<void> {
    try {
      // Generate REAL analytics from cached flight data
      const arrivalsKey = `${airportCode}_arrivals`
      const departuresKey = `${airportCode}_departures`
      
      const cachedArrivals = this.getCachedData<any[]>(arrivalsKey) || []
      const cachedDepartures = this.getCachedData<any[]>(departuresKey) || []
      
      const allFlights = [...cachedArrivals, ...cachedDepartures]
      
      if (allFlights.length === 0) {
        console.log(`No flight data available for analytics generation: ${airportCode}`)
        return // Skip analytics generation if no flight data exists
      }
      
      // Calculate REAL statistics from cached flight data
      const totalFlights = allFlights.length
      
      const onTimeFlights = allFlights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        const delay = f.delay || 0
        return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                status === 'departed' || status === 'active' || status === 'en-route') && 
               delay <= 15
      }).length
      
      const delayedFlights = allFlights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        const delay = f.delay || 0
        return status === 'delayed' || delay > 15
      }).length
      
      const cancelledFlights = allFlights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        return status === 'cancelled' || status === 'canceled'
      }).length
      
      // Calculate average delay from flights with actual delay data
      const flightsWithDelay = allFlights.filter((f: any) => f.delay && f.delay > 0)
      const averageDelay = flightsWithDelay.length > 0 
        ? Math.round(flightsWithDelay.reduce((sum: number, f: any) => sum + (f.delay || 0), 0) / flightsWithDelay.length)
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
  async manualRefresh(category: 'flightData' | 'analytics' | 'aircraft', identifier?: string): Promise<void> {
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
    }
  }

  /**
   * Actualizează configurația cache și repornește cron jobs
   */
  async updateConfig(newConfig: CacheConfig): Promise<void> {
    this.config = newConfig
    await this.saveConfig()
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
      total: number
    }
    lastUpdated: {
      flightData: string | null
      analytics: string | null
      aircraft: string | null
    }
  } {
    const entries = Array.from(this.cacheData.values())
    
    const flightDataEntries = entries.filter(e => e.category === 'flightData')
    const analyticsEntries = entries.filter(e => e.category === 'analytics')
    const aircraftEntries = entries.filter(e => e.category === 'aircraft')

    return {
      config: this.config,
      requestCounter: this.requestCounter,
      cacheEntries: {
        flightData: flightDataEntries.length,
        analytics: analyticsEntries.length,
        aircraft: aircraftEntries.length,
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
          : null
      }
    }
  }

  /**
   * Obține lista de aeronave cunoscute din cache
   */
  private async getKnownAircraft(): Promise<string[]> {
    const aircraftEntries = Array.from(this.cacheData.values()).filter(
      entry => entry.category === 'aircraft'
    )
    
    return aircraftEntries.map(entry => entry.key.replace('aircraft_', ''))
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
      if (flight.delay && flight.delay > 0) {
        const hour = new Date(flight.scheduled_time || flight.scheduledTime || Date.now()).getHours()
        if (!hourDelayMap.has(hour)) {
          hourDelayMap.set(hour, [])
        }
        hourDelayMap.get(hour)!.push(flight.delay)
      }
    })
    
    // Calculate average delay per hour
    const hourAverages: { hour: number; avgDelay: number }[] = []
    hourDelayMap.forEach((delays, hour) => {
      const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length
      hourAverages.push({ hour, avgDelay })
    })
    
    // Return top 4 hours with highest average delays
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
      route.airlines.add(flight.airline?.code || flight.airline || 'Unknown')
    })
    
    // Convert to route analysis format
    const routes: any[] = []
    
    routeMap.forEach((route) => {
      const flightCount = route.flights.length
      
      const onTimeFlights = route.flights.filter((f: any) => {
        const status = f.status?.toLowerCase() || ''
        const delay = f.delay || 0
        return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                status === 'departed' || status === 'active' || status === 'en-route') && 
               delay <= 15
      })
      
      const delayedFlights = route.flights.filter((f: any) => {
        const delay = f.delay || 0
        return delay > 15
      })
      
      const averageDelay = delayedFlights.length > 0
        ? Math.round(delayedFlights.reduce((sum, f) => sum + (f.delay || 0), 0) / delayedFlights.length)
        : 0
      
      const onTimePercentage = flightCount > 0 ? Math.round((onTimeFlights.length / flightCount) * 100) : 0
      
      routes.push({
        origin: route.origin,
        destination: route.destination,
        flightCount,
        averageDelay,
        onTimePercentage,
        airlines: Array.from(route.airlines)
      })
    })
    
    // Return top 15 routes by flight count
    return routes.sort((a, b) => b.flightCount - a.flightCount).slice(0, 15)
  }

  /**
   * Get cached data by key (simple version)
   */
  getCachedData<T>(key: string): T | null {
    for (const entry of this.cacheData.values()) {
      if (entry.key === key && !this.isExpired(entry)) {
        return entry.data as T
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
  incrementRequestCounter(category: 'flightData' | 'analytics' | 'aircraft'): void {
    if (this.requestCounter) {
      this.requestCounter[category]++
      this.requestCounter.totalRequests++
      this.saveRequestCounter()
    }
  }
}

// Export singleton
export const cacheManager = CacheManager.getInstance()