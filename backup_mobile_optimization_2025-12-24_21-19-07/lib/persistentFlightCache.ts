/**
 * Persistent Flight Cache - Sistem de cache persistent pe disc
 * Păstrează datele de zboruri pe disc pentru a evita pierderea la restart
 * Implementează logica de fuziune și păstrare pe 14 zile
 */

import * as fs from 'fs/promises'
import * as path from 'path'

export interface FlightCacheEntry {
  flightNumber: string
  airlineCode: string
  airlineName: string
  originCode: string
  originName: string
  destinationCode: string
  destinationName: string
  scheduledTime: string
  actualTime?: string
  estimatedTime?: string
  status: string
  delayMinutes: number
  airportCode: string // Aeroportul pentru care este cached
  type: 'arrivals' | 'departures'
  cachedAt: string // Când a fost adăugat în cache
  source: string // API source
}

export interface FlightCacheData {
  [key: string]: FlightCacheEntry // key format: `${flightNumber}_${airportCode}_${scheduledTime}`
}

class PersistentFlightCache {
  private static instance: PersistentFlightCache
  private cacheFilePath: string
  private cache: FlightCacheData = {}
  private isLoaded: boolean = false

  private constructor() {
    this.cacheFilePath = path.join(process.cwd(), 'data', 'flights_cache.json')
  }

  static getInstance(): PersistentFlightCache {
    if (!PersistentFlightCache.instance) {
      PersistentFlightCache.instance = new PersistentFlightCache()
    }
    return PersistentFlightCache.instance
  }

  /**
   * Încarcă cache-ul de pe disc la pornire
   */
  async loadCache(): Promise<void> {
    if (this.isLoaded) return

    try {
      // Verifică dacă fișierul există
      await fs.access(this.cacheFilePath)
      
      // Citește conținutul
      const data = await fs.readFile(this.cacheFilePath, 'utf-8')
      this.cache = JSON.parse(data)
      
      console.log(`[Persistent Cache] Loaded ${Object.keys(this.cache).length} flight entries from disk`)
      
      // NU apela cleanOldData() aici pentru a evita bucla infinită
      // cleanOldData() va fi apelat separat prin cron job
      
    } catch (error) {
      // Fișierul nu există sau e corupt - începe cu cache gol
      console.log('[Persistent Cache] No existing cache file found, starting fresh')
      this.cache = {}
    }
    
    this.isLoaded = true
  }

  /**
   * Salvează cache-ul pe disc
   */
  private async saveCache(): Promise<void> {
    try {
      // Asigură că directorul există
      const dataDir = path.dirname(this.cacheFilePath)
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }

      // Scrie fișierul cu formatare pentru debugging
      await fs.writeFile(
        this.cacheFilePath, 
        JSON.stringify(this.cache, null, 2),
        'utf-8'
      )
      
      console.log(`[Persistent Cache] Saved ${Object.keys(this.cache).length} flight entries to disk`)
      
    } catch (error) {
      console.error('[Persistent Cache] Failed to save cache to disk:', error)
    }
  }

  /**
   * Adaugă date noi de zboruri în cache (fuziune cu cele existente)
   */
  async addFlightData(
    airportCode: string,
    type: 'arrivals' | 'departures',
    flights: any[],
    source: string = 'api'
  ): Promise<void> {
    // Asigură că cache-ul este încărcat
    await this.loadCache()

    const now = new Date().toISOString()
    let addedCount = 0
    let updatedCount = 0

    flights.forEach(flight => {
      // Creează cheia unică pentru zbor
      const scheduledTime = flight.scheduled_time || flight.scheduledTime || now
      const flightNumber = flight.flight_number || flight.flightNumber || 'UNKNOWN'
      const key = `${flightNumber}_${airportCode}_${scheduledTime}`

      // Convertește datele la formatul nostru
      const cacheEntry: FlightCacheEntry = {
        flightNumber,
        airlineCode: flight.airline?.code || flight.airlineCode || 'XX',
        airlineName: flight.airline?.name || flight.airlineName || 'Unknown',
        originCode: flight.origin?.code || flight.originCode || '',
        originName: flight.origin?.name || flight.originName || '',
        destinationCode: flight.destination?.code || flight.destinationCode || '',
        destinationName: flight.destination?.name || flight.destinationName || '',
        scheduledTime,
        actualTime: flight.actual_time || flight.actualTime,
        estimatedTime: flight.estimated_time || flight.estimatedTime,
        status: flight.status || 'scheduled',
        delayMinutes: flight.delay || flight.delayMinutes || 0,
        airportCode,
        type,
        cachedAt: now,
        source
      }

      // Verifică dacă zborul există deja
      if (this.cache[key]) {
        // Actualizează doar dacă datele noi sunt mai recente
        const existingEntry = this.cache[key]
        const existingTime = new Date(existingEntry.cachedAt)
        const newTime = new Date(now)
        
        if (newTime > existingTime) {
          this.cache[key] = cacheEntry
          updatedCount++
        }
      } else {
        // Adaugă zborul nou
        this.cache[key] = cacheEntry
        addedCount++
      }
    })

    // Salvează pe disc după adăugare
    await this.saveCache()

    console.log(`[Persistent Cache] Added ${addedCount} new flights, updated ${updatedCount} existing flights for ${airportCode} ${type}`)
  }

  /**
   * Obține datele de zboruri pentru un aeroport și tip
   */
  async getFlightData(airportCode: string, type: 'arrivals' | 'departures'): Promise<FlightCacheEntry[]> {
    // Asigură că cache-ul este încărcat
    await this.loadCache()

    const flights = Object.values(this.cache).filter(
      flight => flight.airportCode === airportCode && flight.type === type
    )

    // Sortează după timpul programat (cel mai recent primul)
    flights.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())

    console.log(`[Persistent Cache] Retrieved ${flights.length} ${type} for ${airportCode}`)
    return flights
  }

  /**
   * Obține toate datele de zboruri pentru un aeroport
   */
  async getAllFlightData(airportCode: string): Promise<FlightCacheEntry[]> {
    await this.loadCache()

    const flights = Object.values(this.cache).filter(
      flight => flight.airportCode === airportCode
    )

    flights.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())

    console.log(`[Persistent Cache] Retrieved ${flights.length} total flights for ${airportCode}`)
    return flights
  }

  /**
   * Curăță datele mai vechi de 14 zile
   */
  async cleanOldData(): Promise<number> {
    await this.loadCache()

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    let deletedCount = 0
    const keysToDelete: string[] = []

    Object.entries(this.cache).forEach(([key, flight]) => {
      const flightDate = new Date(flight.scheduledTime)
      
      // Șterge doar zborurile mai vechi de 14 zile
      if (flightDate < fourteenDaysAgo) {
        keysToDelete.push(key)
        deletedCount++
      }
    })

    // Șterge zborurile vechi
    keysToDelete.forEach(key => {
      delete this.cache[key]
    })

    if (deletedCount > 0) {
      await this.saveCache()
      console.log(`[Persistent Cache] Cleaned ${deletedCount} flights older than 14 days`)
    }

    return deletedCount
  }

  /**
   * Obține statistici despre cache
   */
  async getCacheStats(): Promise<{
    totalFlights: number
    flightsByAirport: { [airportCode: string]: number }
    flightsByType: { arrivals: number; departures: number }
    oldestFlight: string | null
    newestFlight: string | null
    cacheSize: string
  }> {
    await this.loadCache()

    const flights = Object.values(this.cache)
    const flightsByAirport: { [airportCode: string]: number } = {}
    const flightsByType = { arrivals: 0, departures: 0 }

    let oldestDate: Date | null = null
    let newestDate: Date | null = null

    flights.forEach(flight => {
      // Count by airport
      flightsByAirport[flight.airportCode] = (flightsByAirport[flight.airportCode] || 0) + 1
      
      // Count by type
      flightsByType[flight.type]++
      
      // Track date range
      const flightDate = new Date(flight.scheduledTime)
      if (!oldestDate || flightDate < oldestDate) {
        oldestDate = flightDate
      }
      if (!newestDate || flightDate > newestDate) {
        newestDate = flightDate
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
      totalFlights: flights.length,
      flightsByAirport,
      flightsByType,
      oldestFlight: oldestDate ? (oldestDate as Date).toISOString() : null,
      newestFlight: newestDate ? (newestDate as Date).toISOString() : null,
      cacheSize
    }
  }

  /**
   * Șterge tot cache-ul (doar pentru debugging/admin)
   */
  async clearAllCache(): Promise<void> {
    this.cache = {}
    await this.saveCache()
    console.log('[Persistent Cache] Cleared all cache data')
  }

  /**
   * Șterge cache-ul pentru un aeroport specific
   */
  async clearAirportCache(airportCode: string): Promise<number> {
    await this.loadCache()

    const keysToDelete = Object.keys(this.cache).filter(
      key => this.cache[key].airportCode === airportCode
    )

    keysToDelete.forEach(key => {
      delete this.cache[key]
    })

    if (keysToDelete.length > 0) {
      await this.saveCache()
      console.log(`[Persistent Cache] Cleared ${keysToDelete.length} flights for ${airportCode}`)
    }

    return keysToDelete.length
  }

  /**
   * Forțează salvarea cache-ului (pentru debugging)
   */
  async forceSave(): Promise<void> {
    await this.saveCache()
  }
}

// Export singleton
export const persistentFlightCache = PersistentFlightCache.getInstance()