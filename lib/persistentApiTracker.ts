/**
 * Persistent API Request Tracker - Sistem persistent cu cache în memorie
 * Păstrează datele în memorie cu backup periodic în fișier (doar server-side)
 */

// Server-side only module
if (typeof window !== 'undefined') {
  throw new Error('PersistentApiTracker can only be used on server-side')
}

// Tipuri pentru tracking persistent
export interface PersistentApiRequestLog {
  id: string
  timestamp: string
  endpoint: string
  method: string
  airportCode?: string
  requestType: 'arrivals' | 'departures' | 'statistics' | 'analytics' | 'aircraft' | 'routes'
  success: boolean
  responseSize?: number
  duration: number
  error?: string
  month: string // Format: YYYY-MM pentru grupare lunară
}

export interface PersistentApiRequestStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  requestsByType: Record<string, number>
  requestsByAirport: Record<string, number>
  lastRequest: string | null
  firstRequest: string | null
  totalDuration: number
  averageDuration: number
  currentMonth: string
  monthlyStats: Record<string, {
    requests: number
    lastReset: string
  }>
}

// Cache în memorie pentru request-uri și statistici
let requestsCache: PersistentApiRequestLog[] = []
let statsCache: PersistentApiRequestStats | null = null
let lastSaveTime = 0
let isInitialized = false

// Obține luna curentă în format YYYY-MM
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Verifică dacă trebuie să reseteze pentru luna nouă
function shouldResetForNewMonth(lastMonth: string): boolean {
  const currentMonth = getCurrentMonth()
  return currentMonth !== lastMonth
}

// Încarcă datele din fișier (doar server-side)
async function loadFromFile(): Promise<void> {
  if (typeof window !== 'undefined' || isInitialized) return
  
  try {
    // Doar pe server
    if (typeof window !== 'undefined') return
    
    const fs = require('fs')
    const path = require('path')
    const dbPath = path.join(process.cwd(), 'data', 'api-tracker.json')
    
    // Creează directorul dacă nu există
    const dataDir = path.dirname(dbPath)
    if (!fs?.existsSync(dataDir)) {
      fs?.mkdirSync(dataDir, { recursive: true })
    }
    
    if (fs?.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
      
      // Verifică dacă trebuie resetat pentru luna nouă
      const currentMonth = getCurrentMonth()
      if (shouldResetForNewMonth(data.stats?.currentMonth || '')) {
        console.log(`[Persistent API Tracker] New month detected (${currentMonth}), resetting counters...`)
        
        // Păstrează istoricul lunar dar resetează contoarele curente
        const monthlyStats = data.stats?.monthlyStats || {}
        if (data.stats?.currentMonth) {
          monthlyStats[data.stats.currentMonth] = {
            requests: data.stats.totalRequests || 0,
            lastReset: new Date().toISOString()
          }
        }
        
        requestsCache = []
        statsCache = {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          requestsByType: {},
          requestsByAirport: {},
          lastRequest: null,
          firstRequest: null,
          totalDuration: 0,
          averageDuration: 0,
          currentMonth,
          monthlyStats
        }
      } else {
        requestsCache = data.requests || []
        statsCache = data.stats || null
      }
    }
  } catch (error) {
    console.log('[Persistent API Tracker] Could not load from file, starting fresh:', error)
  }
  
  isInitialized = true
}

// Salvează datele în fișier (doar server-side, periodic)
async function saveToFile(): Promise<void> {
  if (typeof window !== 'undefined') return
  
  const now = Date.now()
  // Salvează doar o dată la 30 de secunde pentru performanță
  if (now - lastSaveTime < 30000) return
  
  try {
    if (typeof window !== 'undefined') return
    
    const fs = require('fs')
    const path = require('path')
    const dbPath = path.join(process.cwd(), 'data', 'api-tracker.json')
    
    const data = {
      requests: requestsCache,
      stats: statsCache,
      lastUpdated: new Date().toISOString()
    }
    
    fs?.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
    lastSaveTime = now
  } catch (error) {
    console.error('[Persistent API Tracker] Could not save to file:', error)
  }
}

// Calculează statisticile din request-uri
function calculateStats(requests: PersistentApiRequestLog[]): Omit<PersistentApiRequestStats, 'currentMonth' | 'monthlyStats'> {
  if (requests.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      requestsByType: {},
      requestsByAirport: {},
      lastRequest: null,
      firstRequest: null,
      totalDuration: 0,
      averageDuration: 0
    }
  }

  const successfulRequests = requests.filter(r => r.success).length
  const failedRequests = requests.length - successfulRequests
  
  const requestsByType: Record<string, number> = {}
  const requestsByAirport: Record<string, number> = {}
  let totalDuration = 0

  requests.forEach(request => {
    // Contorizare pe tip
    requestsByType[request.requestType] = (requestsByType[request.requestType] || 0) + 1
    
    // Contorizare pe aeroport
    if (request.airportCode) {
      requestsByAirport[request.airportCode] = (requestsByAirport[request.airportCode] || 0) + 1
    }
    
    totalDuration += request.duration
  })

  // Sortează request-urile după timestamp
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return {
    totalRequests: requests.length,
    successfulRequests,
    failedRequests,
    requestsByType,
    requestsByAirport,
    lastRequest: sortedRequests[sortedRequests.length - 1]?.timestamp || null,
    firstRequest: sortedRequests[0]?.timestamp || null,
    totalDuration,
    averageDuration: totalDuration / requests.length
  }
}

/**
 * Tracker persistent pentru request-uri API
 */
export class PersistentApiRequestTracker {
  private static instance: PersistentApiRequestTracker

  private constructor() {}

  static getInstance(): PersistentApiRequestTracker {
    if (!PersistentApiRequestTracker.instance) {
      PersistentApiRequestTracker.instance = new PersistentApiRequestTracker()
    }
    return PersistentApiRequestTracker.instance
  }

  /**
   * Inițializează tracker-ul (încarcă datele din fișier)
   */
  async initialize(): Promise<void> {
    await loadFromFile()
  }

  /**
   * Înregistrează un nou request API
   */
  async logRequest(
    endpoint: string,
    method: string,
    requestType: PersistentApiRequestLog['requestType'],
    airportCode?: string,
    success: boolean = true,
    duration: number = 0,
    responseSize?: number,
    error?: string
  ): Promise<void> {
    await this.initialize()
    
    const request: PersistentApiRequestLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      airportCode,
      requestType,
      success,
      responseSize,
      duration,
      error,
      month: getCurrentMonth()
    }

    // Adaugă noul request
    requestsCache.push(request)
    
    // Păstrează doar ultimele 5000 de request-uri pentru performanță
    if (requestsCache.length > 5000) {
      requestsCache = requestsCache.slice(-5000)
    }
    
    // Recalculează statisticile
    const newStats = calculateStats(requestsCache)
    statsCache = {
      ...newStats,
      currentMonth: getCurrentMonth(),
      monthlyStats: statsCache?.monthlyStats || {}
    }
    
    // Salvează periodic în fișier
    await saveToFile()
    
    console.log(`[Persistent API Tracker] ${requestType.toUpperCase()} request logged: ${endpoint} (${success ? 'SUCCESS' : 'FAILED'}) - Total: ${statsCache.totalRequests}`)
  }

  /**
   * Obține statisticile curente
   */
  async getStats(): Promise<PersistentApiRequestStats> {
    await this.initialize()
    
    if (!statsCache) {
      statsCache = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        requestsByType: {},
        requestsByAirport: {},
        lastRequest: null,
        firstRequest: null,
        totalDuration: 0,
        averageDuration: 0,
        currentMonth: getCurrentMonth(),
        monthlyStats: {}
      }
    }
    
    return statsCache
  }

  /**
   * Obține request-urile recente
   */
  async getRecentRequests(limit: number = 100): Promise<PersistentApiRequestLog[]> {
    await this.initialize()
    
    return requestsCache
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Obține request-urile pentru un anumit aeroport
   */
  async getRequestsByAirport(airportCode: string): Promise<PersistentApiRequestLog[]> {
    await this.initialize()
    return requestsCache.filter(r => r.airportCode === airportCode)
  }

  /**
   * Obține request-urile pentru un anumit tip
   */
  async getRequestsByType(requestType: PersistentApiRequestLog['requestType']): Promise<PersistentApiRequestLog[]> {
    await this.initialize()
    return requestsCache.filter(r => r.requestType === requestType)
  }

  /**
   * Resetează manual contorul de request-uri (doar pentru admin)
   */
  async resetCounter(): Promise<void> {
    await this.initialize()
    
    // Păstrează istoricul lunar
    const monthlyStats = statsCache?.monthlyStats || {}
    const currentMonth = getCurrentMonth()
    
    if (statsCache && statsCache.totalRequests > 0) {
      monthlyStats[currentMonth] = {
        requests: statsCache.totalRequests,
        lastReset: new Date().toISOString()
      }
    }
    
    requestsCache = []
    statsCache = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      requestsByType: {},
      requestsByAirport: {},
      lastRequest: null,
      firstRequest: null,
      totalDuration: 0,
      averageDuration: 0,
      currentMonth,
      monthlyStats
    }
    
    // Salvează imediat
    await saveToFile()
    
    console.log('[Persistent API Tracker] Request counter manually reset')
  }

  /**
   * Obține statistici detaliate pentru admin
   */
  async getDetailedStats(): Promise<{
    stats: PersistentApiRequestStats
    recentRequests: PersistentApiRequestLog[]
    topAirports: Array<{airport: string, count: number}>
    requestsByHour: Record<string, number>
    monthlyHistory: Array<{month: string, requests: number, lastReset: string}>
  }> {
    const stats = await this.getStats()
    const recentRequests = await this.getRecentRequests(50)
    
    // Top aeroporturi
    const topAirports = Object.entries(stats.requestsByAirport)
      .map(([airport, count]) => ({ airport, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Request-uri pe oră (ultimele 24h)
    const requestsByHour: Record<string, number> = {}
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    recentRequests
      .filter(r => new Date(r.timestamp) > last24h)
      .forEach(r => {
        const hour = new Date(r.timestamp).getHours()
        const hourKey = `${hour}:00`
        requestsByHour[hourKey] = (requestsByHour[hourKey] || 0) + 1
      })
    
    // Istoric lunar
    const monthlyHistory = Object.entries(stats.monthlyStats)
      .map(([month, data]) => ({
        month,
        requests: data.requests,
        lastReset: data.lastReset
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
    
    return {
      stats,
      recentRequests,
      topAirports,
      requestsByHour,
      monthlyHistory
    }
  }
}

// Export singleton instance
export const persistentApiRequestTracker = PersistentApiRequestTracker.getInstance()