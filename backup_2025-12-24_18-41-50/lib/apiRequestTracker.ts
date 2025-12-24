/**
 * API Request Tracker - Sistem complet de contorizare request-uri AeroDataBox
 * Păstrează în memorie și cache toate request-urile către API
 */

// Tipuri pentru tracking
export interface ApiRequestLog {
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
}

export interface ApiRequestStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  requestsByType: Record<string, number>
  requestsByAirport: Record<string, number>
  lastRequest: string | null
  firstRequest: string | null
  totalDuration: number
  averageDuration: number
}

// Cache în memorie pentru request-uri și statistici
let requestsCache: ApiRequestLog[] = []
let statsCache: ApiRequestStats | null = null

// Calculează statisticile din request-uri
function calculateStats(requests: ApiRequestLog[]): ApiRequestStats {
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
 * Tracker principal pentru request-uri API
 */
export class ApiRequestTracker {
  private static instance: ApiRequestTracker

  private constructor() {}

  static getInstance(): ApiRequestTracker {
    if (!ApiRequestTracker.instance) {
      ApiRequestTracker.instance = new ApiRequestTracker()
    }
    return ApiRequestTracker.instance
  }

  /**
   * Înregistrează un nou request API
   */
  async logRequest(
    endpoint: string,
    method: string,
    requestType: ApiRequestLog['requestType'],
    airportCode?: string,
    success: boolean = true,
    duration: number = 0,
    responseSize?: number,
    error?: string
  ): Promise<void> {
    const request: ApiRequestLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      airportCode,
      requestType,
      success,
      responseSize,
      duration,
      error
    }

    // Adaugă noul request în cache
    requestsCache.push(request)
    
    // Păstrează doar ultimele 1000 de request-uri pentru performanță
    if (requestsCache.length > 1000) {
      requestsCache = requestsCache.slice(-1000)
    }
    
    // Recalculează statisticile
    statsCache = calculateStats(requestsCache)
    
    console.log(`[API Tracker] ${requestType.toUpperCase()} request logged: ${endpoint} (${success ? 'SUCCESS' : 'FAILED'})`)
  }

  /**
   * Obține statisticile curente
   */
  async getStats(): Promise<ApiRequestStats> {
    if (!statsCache) {
      statsCache = calculateStats(requestsCache)
    }
    return statsCache
  }

  /**
   * Obține request-urile recente
   */
  async getRecentRequests(limit: number = 100): Promise<ApiRequestLog[]> {
    return requestsCache
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Obține request-urile pentru un anumit aeroport
   */
  async getRequestsByAirport(airportCode: string): Promise<ApiRequestLog[]> {
    return requestsCache.filter(r => r.airportCode === airportCode)
  }

  /**
   * Obține request-urile pentru un anumit tip
   */
  async getRequestsByType(requestType: ApiRequestLog['requestType']): Promise<ApiRequestLog[]> {
    return requestsCache.filter(r => r.requestType === requestType)
  }

  /**
   * Resetează contorul de request-uri
   */
  async resetCounter(): Promise<void> {
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
      averageDuration: 0
    }
    
    console.log('[API Tracker] Request counter reset')
  }

  /**
   * Obține statistici detaliate pentru admin
   */
  async getDetailedStats(): Promise<{
    stats: ApiRequestStats
    recentRequests: ApiRequestLog[]
    topAirports: Array<{airport: string, count: number}>
    requestsByHour: Record<string, number>
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
    
    return {
      stats,
      recentRequests,
      topAirports,
      requestsByHour
    }
  }
}

// Export singleton instance
export const apiRequestTracker = ApiRequestTracker.getInstance()