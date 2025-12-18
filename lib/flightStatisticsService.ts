/**
 * Flight Statistics Service
 * Provides advanced analytics and statistics based on historical flight data
 * Integrates with Historical Cache Manager for long-term data analysis
 */

import { historicalCacheManager } from './historicalCacheManager'
import {
  DailyStatistics,
  RangeStatistics,
  TrendAnalysis,
  ComparativeAnalysis,
  PeakHoursAnalysis,
  AirlinePerformance,
  TrendDataPoint,
  PeriodStats,
  ComparisonType,
  AnalysisPeriod,
  AirlineStats,
  HourlyStats
} from './types/historical'

export class FlightStatisticsService {
  private static instance: FlightStatisticsService

  private constructor() {}

  static getInstance(): FlightStatisticsService {
    if (!FlightStatisticsService.instance) {
      FlightStatisticsService.instance = new FlightStatisticsService()
    }
    return FlightStatisticsService.instance
  }

  /**
   * Get daily statistics for a specific airport and date
   */
  async getDailyStatistics(airportCode: string, date: string): Promise<DailyStatistics> {
    console.log(`[Flight Statistics] Getting daily statistics for ${airportCode} on ${date}`)

    try {
      await historicalCacheManager.initialize()

      // Get flight data for the specific date
      let arrivals = await historicalCacheManager.getDataForDate(airportCode, date, 'arrivals')
      let departures = await historicalCacheManager.getDataForDate(airportCode, date, 'departures')
      let allFlights = [...arrivals, ...departures]

      // If no historical data found, try to use current cache data as fallback
      if (allFlights.length === 0) {
        console.log(`[Flight Statistics] No historical data found for ${airportCode} on ${date}, trying current cache...`)
        
        try {
          // Direct access to cache data file (fallback approach)
          const fs = require('fs')
          const path = require('path')
          const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json')
          
          if (fs.existsSync(cacheDataPath)) {
            const cacheData = JSON.parse(fs.readFileSync(cacheDataPath, 'utf8'))
            
            // Create a simple cache accessor
            const getCachedData = (key: string) => {
              const item = cacheData.find((entry: any) => entry.key === key)
              return item ? item.data : null
            }
            
            // Try both IATA and ICAO codes
            let currentArrivals = getCachedData(`${airportCode}_arrivals`) || []
            let currentDepartures = getCachedData(`${airportCode}_departures`) || []
            
            // If no data with IATA code, try ICAO code
            if (currentArrivals.length === 0 && currentDepartures.length === 0) {
              const icaoMapping: { [key: string]: string } = {
                'OTP': 'LROP',
                'BBU': 'LRBS', 
                'CLJ': 'LRCL',
                'TSR': 'LRTR',
                'IAS': 'LRIA',
                'CND': 'LRCK',
                'SBZ': 'LRSB',
                'CRA': 'LRCV',
                'RMO': 'LUKK'
              }
              
              const icaoCode = icaoMapping[airportCode]
              if (icaoCode) {
                currentArrivals = getCachedData(`${icaoCode}_arrivals`) || []
                currentDepartures = getCachedData(`${icaoCode}_departures`) || []
                console.log(`[Flight Statistics] Found data with ICAO code ${icaoCode}: ${currentArrivals.length} arrivals, ${currentDepartures.length} departures`)
              }
            }
          
          // Transform current cache data to historical format
          const transformedArrivals = currentArrivals.map((flight: any) => ({
            flightNumber: flight.flight_number || flight.number || 'N/A',
            airline: flight.airline?.name || flight.airline || 'Unknown',
            airlineCode: flight.airline?.code || flight.airline?.iata || flight.airline?.icao || 'XX',
            status: flight.status || 'scheduled',
            delayMinutes: flight.delay || flight.delayMinutes || 0,
            scheduledTime: flight.scheduled_time || flight.scheduledTime || new Date().toISOString(),
            actualTime: flight.actual_time || flight.actualTime || null,
            aircraft: flight.aircraft?.model || flight.aircraft || null,
            type: 'arrival'
          }))
          
          const transformedDepartures = currentDepartures.map((flight: any) => ({
            flightNumber: flight.flight_number || flight.number || 'N/A',
            airline: flight.airline?.name || flight.airline || 'Unknown',
            airlineCode: flight.airline?.code || flight.airline?.iata || flight.airline?.icao || 'XX',
            status: flight.status || 'scheduled',
            delayMinutes: flight.delay || flight.delayMinutes || 0,
            scheduledTime: flight.scheduled_time || flight.scheduledTime || new Date().toISOString(),
            actualTime: flight.actual_time || flight.actualTime || null,
            aircraft: flight.aircraft?.model || flight.aircraft || null,
            type: 'departure'
          }))
          
            allFlights = [...transformedArrivals, ...transformedDepartures]
            console.log(`[Flight Statistics] Using current cache data: ${allFlights.length} flights`)
          } else {
            console.log('[Flight Statistics] Cache data file not found')
          }
        } catch (cacheError) {
          console.error('[Flight Statistics] Error accessing current cache:', cacheError)
        }
      }

      if (allFlights.length === 0) {
        console.log(`[Flight Statistics] No flight data found for ${airportCode} on ${date}`)
        return this.createEmptyDailyStatistics(airportCode, date)
      }

      // Calculate basic statistics
      const totalFlights = allFlights.length
      const onTimeFlights = allFlights.filter(f => this.isOnTime(f)).length
      const delayedFlights = allFlights.filter(f => this.isDelayed(f)).length
      const cancelledFlights = allFlights.filter(f => this.isCancelled(f)).length

      // Calculate average delay
      const delayedFlightsList = allFlights.filter(f => f.delayMinutes > 0)
      const averageDelay = delayedFlightsList.length > 0
        ? Math.round(delayedFlightsList.reduce((sum, f) => sum + f.delayMinutes, 0) / delayedFlightsList.length)
        : 0

      // Calculate percentages
      const onTimePercentage = Math.round((onTimeFlights / totalFlights) * 100)
      const delayIndex = Math.min(100, Math.round((delayedFlights / totalFlights) * 100 + (averageDelay / 60) * 10))

      // Calculate peak hours
      const peakHours = this.calculatePeakHours(allFlights)

      // Calculate top airlines
      const topAirlines = this.calculateTopAirlines(allFlights)

      // Calculate hourly distribution
      const hourlyDistribution = this.calculateHourlyDistribution(allFlights)

      const statistics: DailyStatistics = {
        airport: airportCode,
        date,
        totalFlights,
        onTimeFlights,
        delayedFlights,
        cancelledFlights,
        averageDelay,
        onTimePercentage,
        delayIndex,
        peakHours,
        topAirlines,
        hourlyDistribution
      }

      console.log(`[Flight Statistics] Generated daily statistics for ${airportCode} on ${date}: ${totalFlights} flights, ${onTimePercentage}% on-time`)
      return statistics

    } catch (error) {
      console.error('[Flight Statistics] Error getting daily statistics:', error)
      return this.createEmptyDailyStatistics(airportCode, date)
    }
  }

  /**
   * Get range statistics for a date range
   */
  async getRangeStatistics(
    airportCode: string, 
    fromDate: string, 
    toDate: string
  ): Promise<RangeStatistics> {
    console.log(`[Flight Statistics] Getting range statistics for ${airportCode} from ${fromDate} to ${toDate}`)

    try {
      await historicalCacheManager.initialize()

      // Get all flight data for the range
      const allFlights = await historicalCacheManager.getDataForRange(airportCode, fromDate, toDate)

      if (allFlights.length === 0) {
        console.log(`[Flight Statistics] No flight data found for ${airportCode} in range ${fromDate} to ${toDate}`)
        return this.createEmptyRangeStatistics(airportCode, fromDate, toDate)
      }

      // Generate daily statistics for each day in range
      const dailyStats: DailyStatistics[] = []
      const startDate = new Date(fromDate)
      const endDate = new Date(toDate)
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const dayStats = await this.getDailyStatistics(airportCode, dateStr)
        dailyStats.push(dayStats)
      }

      // Calculate aggregated statistics
      const totalFlights = allFlights.length
      const totalDays = dailyStats.length
      const averageFlightsPerDay = Math.round(totalFlights / totalDays)

      const onTimeFlights = allFlights.filter(f => this.isOnTime(f)).length
      const overallOnTimePercentage = Math.round((onTimeFlights / totalFlights) * 100)

      const delayedFlights = allFlights.filter(f => f.delayMinutes > 0)
      const overallAverageDelay = delayedFlights.length > 0
        ? Math.round(delayedFlights.reduce((sum, f) => sum + f.delayMinutes, 0) / delayedFlights.length)
        : 0

      // Find best and worst days
      const daysWithFlights = dailyStats.filter(d => d.totalFlights > 0)
      const bestDay = daysWithFlights.reduce((best, day) => 
        day.onTimePercentage > best.onTimePercentage ? day : best, 
        daysWithFlights[0] || dailyStats[0]
      )
      const worstDay = daysWithFlights.reduce((worst, day) => 
        day.onTimePercentage < worst.onTimePercentage ? day : worst, 
        daysWithFlights[0] || dailyStats[0]
      )

      // Calculate trends
      const trends = this.calculateTrends(dailyStats)

      const rangeStats: RangeStatistics = {
        airport: airportCode,
        fromDate,
        toDate,
        totalDays,
        dailyStats,
        aggregated: {
          totalFlights,
          averageFlightsPerDay,
          overallOnTimePercentage,
          overallAverageDelay,
          bestDay: { date: bestDay.date, onTimePercentage: bestDay.onTimePercentage },
          worstDay: { date: worstDay.date, onTimePercentage: worstDay.onTimePercentage }
        },
        trends
      }

      console.log(`[Flight Statistics] Generated range statistics for ${airportCode}: ${totalFlights} flights over ${totalDays} days`)
      return rangeStats

    } catch (error) {
      console.error('[Flight Statistics] Error getting range statistics:', error)
      return this.createEmptyRangeStatistics(airportCode, fromDate, toDate)
    }
  }

  /**
   * Get trend analysis for a specific period
   */
  async getTrendAnalysis(airportCode: string, period: AnalysisPeriod): Promise<TrendAnalysis> {
    console.log(`[Flight Statistics] Getting trend analysis for ${airportCode} over ${period}`)

    try {
      const days = this.periodToDays(period)
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - days)

      const endDateStr = endDate.toISOString().split('T')[0]
      const startDateStr = startDate.toISOString().split('T')[0]

      const rangeStats = await this.getRangeStatistics(airportCode, startDateStr, endDateStr)

      // Create trend data points
      const dataPoints: TrendDataPoint[] = rangeStats.dailyStats.map(day => ({
        date: day.date,
        totalFlights: day.totalFlights,
        onTimePercentage: day.onTimePercentage,
        averageDelay: day.averageDelay,
        delayIndex: day.delayIndex
      }))

      // Calculate insights
      const insights = this.calculateTrendInsights(dataPoints)

      const trendAnalysis: TrendAnalysis = {
        airport: airportCode,
        period,
        dataPoints,
        insights
      }

      console.log(`[Flight Statistics] Generated trend analysis for ${airportCode} over ${period}`)
      return trendAnalysis

    } catch (error) {
      console.error('[Flight Statistics] Error getting trend analysis:', error)
      return {
        airport: airportCode,
        period,
        dataPoints: [],
        insights: {
          trafficChange: 0,
          delayChange: 0,
          bestPerformingDay: '',
          worstPerformingDay: '',
          recommendations: []
        }
      }
    }
  }

  /**
   * Get comparative analysis between periods
   */
  async getComparativeAnalysis(
    airportCode: string, 
    comparisonType: ComparisonType
  ): Promise<ComparativeAnalysis> {
    console.log(`[Flight Statistics] Getting comparative analysis for ${airportCode}: ${comparisonType}`)

    try {
      const { currentPeriod, previousPeriod } = this.getComparisonPeriods(comparisonType)
      
      const currentStats = await this.getRangeStatistics(airportCode, currentPeriod.start, currentPeriod.end)
      const previousStats = await this.getRangeStatistics(airportCode, previousPeriod.start, previousPeriod.end)

      const current: PeriodStats = {
        period: `${currentPeriod.start} to ${currentPeriod.end}`,
        totalFlights: currentStats.aggregated.totalFlights,
        onTimePercentage: currentStats.aggregated.overallOnTimePercentage,
        averageDelay: currentStats.aggregated.overallAverageDelay,
        delayIndex: this.calculateDelayIndex(currentStats.aggregated.overallOnTimePercentage, currentStats.aggregated.overallAverageDelay)
      }

      const previous: PeriodStats = {
        period: `${previousPeriod.start} to ${previousPeriod.end}`,
        totalFlights: previousStats.aggregated.totalFlights,
        onTimePercentage: previousStats.aggregated.overallOnTimePercentage,
        averageDelay: previousStats.aggregated.overallAverageDelay,
        delayIndex: this.calculateDelayIndex(previousStats.aggregated.overallOnTimePercentage, previousStats.aggregated.overallAverageDelay)
      }

      const changes = {
        trafficChange: this.calculatePercentageChange(previous.totalFlights, current.totalFlights),
        delayChange: this.calculatePercentageChange(previous.averageDelay, current.averageDelay),
        onTimeChange: this.calculatePercentageChange(previous.onTimePercentage, current.onTimePercentage)
      }

      const analysis: ComparativeAnalysis = {
        airport: airportCode,
        comparisonType,
        current,
        previous,
        changes
      }

      console.log(`[Flight Statistics] Generated comparative analysis for ${airportCode}: ${comparisonType}`)
      return analysis

    } catch (error) {
      console.error('[Flight Statistics] Error getting comparative analysis:', error)
      throw error
    }
  }

  /**
   * Get peak hours analysis
   */
  async getPeakHoursAnalysis(airportCode: string, period: string): Promise<PeakHoursAnalysis> {
    console.log(`[Flight Statistics] Getting peak hours analysis for ${airportCode} over ${period}`)

    try {
      const days = this.periodToDays(period as AnalysisPeriod)
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - days)

      const endDateStr = endDate.toISOString().split('T')[0]
      const startDateStr = startDate.toISOString().split('T')[0]

      const allFlights = await historicalCacheManager.getDataForRange(airportCode, startDateStr, endDateStr)

      // Group flights by hour
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourFlights = allFlights.filter(f => {
          const flightHour = new Date(f.scheduledTime).getHours()
          return flightHour === hour
        })

        const averageFlights = hourFlights.length / days
        const averageDelay = hourFlights.length > 0
          ? hourFlights.reduce((sum, f) => sum + f.delayMinutes, 0) / hourFlights.length
          : 0

        let trafficIntensity: 'low' | 'medium' | 'high' | 'peak'
        if (averageFlights < 2) trafficIntensity = 'low'
        else if (averageFlights < 5) trafficIntensity = 'medium'
        else if (averageFlights < 10) trafficIntensity = 'high'
        else trafficIntensity = 'peak'

        return {
          hour,
          averageFlights: Math.round(averageFlights * 10) / 10,
          averageDelay: Math.round(averageDelay),
          trafficIntensity
        }
      })

      // Identify peak and quiet hours
      const sortedByTraffic = [...hourlyData].sort((a, b) => b.averageFlights - a.averageFlights)
      const peakHours = sortedByTraffic.slice(0, 4).map(h => h.hour).sort((a, b) => a - b)
      const quietHours = sortedByTraffic.slice(-4).map(h => h.hour).sort((a, b) => a - b)

      const recommendations = this.generatePeakHoursRecommendations(hourlyData, peakHours, quietHours)

      const analysis: PeakHoursAnalysis = {
        airport: airportCode,
        period,
        hourlyData,
        peakHours,
        quietHours,
        recommendations
      }

      console.log(`[Flight Statistics] Generated peak hours analysis for ${airportCode}`)
      return analysis

    } catch (error) {
      console.error('[Flight Statistics] Error getting peak hours analysis:', error)
      throw error
    }
  }

  /**
   * Get airline performance analysis
   */
  async getAirlinePerformance(airportCode: string, period: string): Promise<AirlinePerformance[]> {
    console.log(`[Flight Statistics] Getting airline performance for ${airportCode} over ${period}`)

    try {
      const days = this.periodToDays(period as AnalysisPeriod)
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - days)

      const endDateStr = endDate.toISOString().split('T')[0]
      const startDateStr = startDate.toISOString().split('T')[0]

      const allFlights = await historicalCacheManager.getDataForRange(airportCode, startDateStr, endDateStr)

      // Group flights by airline
      const airlineMap = new Map<string, any[]>()
      allFlights.forEach(flight => {
        const key = flight.airlineCode
        if (!airlineMap.has(key)) {
          airlineMap.set(key, [])
        }
        airlineMap.get(key)!.push(flight)
      })

      const airlinePerformances: AirlinePerformance[] = []

      airlineMap.forEach((flights, airlineCode) => {
        const totalFlights = flights.length
        const onTimeFlights = flights.filter(f => this.isOnTime(f)).length
        const delayedFlights = flights.filter(f => this.isDelayed(f)).length
        const cancelledFlights = flights.filter(f => this.isCancelled(f)).length

        const averageDelay = flights.length > 0
          ? Math.round(flights.reduce((sum, f) => sum + f.delayMinutes, 0) / flights.length)
          : 0

        const onTimePercentage = Math.round((onTimeFlights / totalFlights) * 100)
        const performanceGrade = this.calculatePerformanceGrade(onTimePercentage)
        
        // Simple trend calculation (would need historical comparison for real trend)
        const trend: 'improving' | 'stable' | 'declining' = 'stable'

        airlinePerformances.push({
          airlineCode,
          airlineName: flights[0]?.airlineName || airlineCode,
          airport: airportCode,
          period,
          totalFlights,
          onTimeFlights,
          delayedFlights,
          cancelledFlights,
          averageDelay,
          onTimePercentage,
          performanceGrade,
          trend
        })
      })

      // Sort by total flights (most active airlines first)
      airlinePerformances.sort((a, b) => b.totalFlights - a.totalFlights)

      console.log(`[Flight Statistics] Generated airline performance for ${airportCode}: ${airlinePerformances.length} airlines`)
      return airlinePerformances

    } catch (error) {
      console.error('[Flight Statistics] Error getting airline performance:', error)
      return []
    }
  }

  // Helper methods

  private isOnTime(flight: any): boolean {
    const status = flight.status?.toLowerCase() || ''
    return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
            status === 'departed' || status === 'en-route') && flight.delayMinutes <= 15
  }

  private isDelayed(flight: any): boolean {
    const status = flight.status?.toLowerCase() || ''
    return status === 'delayed' || flight.delayMinutes > 15
  }

  private isCancelled(flight: any): boolean {
    const status = flight.status?.toLowerCase() || ''
    return status === 'cancelled' || status === 'canceled'
  }

  private calculatePeakHours(flights: any[]): number[] {
    const hourCounts = new Map<number, number>()
    
    flights.forEach(flight => {
      const hour = new Date(flight.scheduledTime).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    })

    return Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([hour]) => hour)
      .sort((a, b) => a - b)
  }

  private calculateTopAirlines(flights: any[]): AirlineStats[] {
    const airlineMap = new Map<string, any[]>()
    
    flights.forEach(flight => {
      const key = flight.airlineCode
      if (!airlineMap.has(key)) {
        airlineMap.set(key, [])
      }
      airlineMap.get(key)!.push(flight)
    })

    const airlines: AirlineStats[] = []
    airlineMap.forEach((airlineFlights, code) => {
      const onTimeFlights = airlineFlights.filter(f => this.isOnTime(f)).length
      const onTimePercentage = Math.round((onTimeFlights / airlineFlights.length) * 100)
      const averageDelay = airlineFlights.length > 0
        ? Math.round(airlineFlights.reduce((sum, f) => sum + f.delayMinutes, 0) / airlineFlights.length)
        : 0

      airlines.push({
        code,
        name: airlineFlights[0]?.airlineName || code,
        flights: airlineFlights.length,
        onTimePercentage,
        averageDelay
      })
    })

    return airlines.sort((a, b) => b.flights - a.flights).slice(0, 10)
  }

  private calculateHourlyDistribution(flights: any[]): HourlyStats[] {
    const hourlyStats: HourlyStats[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      flights: 0,
      averageDelay: 0,
      onTimePercentage: 0
    }))

    flights.forEach(flight => {
      const hour = new Date(flight.scheduledTime).getHours()
      hourlyStats[hour].flights++
    })

    hourlyStats.forEach(stat => {
      const hourFlights = flights.filter(f => new Date(f.scheduledTime).getHours() === stat.hour)
      if (hourFlights.length > 0) {
        const onTimeFlights = hourFlights.filter(f => this.isOnTime(f)).length
        stat.onTimePercentage = Math.round((onTimeFlights / hourFlights.length) * 100)
        stat.averageDelay = Math.round(hourFlights.reduce((sum, f) => sum + f.delayMinutes, 0) / hourFlights.length)
      }
    })

    return hourlyStats
  }

  private calculateTrends(dailyStats: DailyStatistics[]): any {
    if (dailyStats.length < 2) {
      return {
        trafficTrend: 'stable' as const,
        delayTrend: 'stable' as const,
        trendPercentage: 0
      }
    }

    const firstHalf = dailyStats.slice(0, Math.floor(dailyStats.length / 2))
    const secondHalf = dailyStats.slice(Math.floor(dailyStats.length / 2))

    const firstHalfAvgFlights = firstHalf.reduce((sum, d) => sum + d.totalFlights, 0) / firstHalf.length
    const secondHalfAvgFlights = secondHalf.reduce((sum, d) => sum + d.totalFlights, 0) / secondHalf.length

    const firstHalfAvgDelay = firstHalf.reduce((sum, d) => sum + d.averageDelay, 0) / firstHalf.length
    const secondHalfAvgDelay = secondHalf.reduce((sum, d) => sum + d.averageDelay, 0) / secondHalf.length

    const trafficChange = this.calculatePercentageChange(firstHalfAvgFlights, secondHalfAvgFlights)
    const delayChange = this.calculatePercentageChange(firstHalfAvgDelay, secondHalfAvgDelay)

    return {
      trafficTrend: trafficChange > 5 ? 'increasing' : trafficChange < -5 ? 'decreasing' : 'stable',
      delayTrend: delayChange > 5 ? 'worsening' : delayChange < -5 ? 'improving' : 'stable',
      trendPercentage: Math.round(trafficChange)
    }
  }

  private calculateTrendInsights(dataPoints: TrendDataPoint[]): any {
    if (dataPoints.length === 0) {
      return {
        trafficChange: 0,
        delayChange: 0,
        bestPerformingDay: '',
        worstPerformingDay: '',
        recommendations: []
      }
    }

    const firstPoint = dataPoints[0]
    const lastPoint = dataPoints[dataPoints.length - 1]

    const trafficChange = this.calculatePercentageChange(firstPoint.totalFlights, lastPoint.totalFlights)
    const delayChange = this.calculatePercentageChange(firstPoint.averageDelay, lastPoint.averageDelay)

    const bestDay = dataPoints.reduce((best, point) => 
      point.onTimePercentage > best.onTimePercentage ? point : best
    )
    const worstDay = dataPoints.reduce((worst, point) => 
      point.onTimePercentage < worst.onTimePercentage ? point : worst
    )

    const recommendations = this.generateRecommendations(trafficChange, delayChange, dataPoints)

    return {
      trafficChange: Math.round(trafficChange),
      delayChange: Math.round(delayChange),
      bestPerformingDay: bestDay.date,
      worstPerformingDay: worstDay.date,
      recommendations
    }
  }

  private generateRecommendations(trafficChange: number, delayChange: number, dataPoints: TrendDataPoint[]): string[] {
    const recommendations: string[] = []

    if (trafficChange > 10) {
      recommendations.push('Traffic is increasing significantly. Consider capacity planning.')
    } else if (trafficChange < -10) {
      recommendations.push('Traffic is decreasing. Investigate potential causes.')
    }

    if (delayChange > 10) {
      recommendations.push('Delays are increasing. Review operational procedures.')
    } else if (delayChange < -10) {
      recommendations.push('Delays are improving. Continue current practices.')
    }

    const avgOnTime = dataPoints.reduce((sum, p) => sum + p.onTimePercentage, 0) / dataPoints.length
    if (avgOnTime < 70) {
      recommendations.push('On-time performance is below industry standards. Focus on punctuality improvements.')
    }

    return recommendations
  }

  private generatePeakHoursRecommendations(hourlyData: any[], peakHours: number[], quietHours: number[]): string[] {
    const recommendations: string[] = []

    recommendations.push(`Peak traffic hours: ${peakHours.map(h => `${h}:00`).join(', ')}`)
    recommendations.push(`Quietest hours: ${quietHours.map(h => `${h}:00`).join(', ')}`)

    const peakDelays = peakHours.map(h => hourlyData[h].averageDelay)
    const avgPeakDelay = peakDelays.reduce((sum, d) => sum + d, 0) / peakDelays.length

    if (avgPeakDelay > 20) {
      recommendations.push('Consider additional resources during peak hours to reduce delays.')
    }

    return recommendations
  }

  private calculatePerformanceGrade(onTimePercentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (onTimePercentage >= 90) return 'A'
    if (onTimePercentage >= 80) return 'B'
    if (onTimePercentage >= 70) return 'C'
    if (onTimePercentage >= 60) return 'D'
    return 'F'
  }

  private calculateDelayIndex(onTimePercentage: number, averageDelay: number): number {
    return Math.min(100, Math.round((100 - onTimePercentage) + (averageDelay / 60) * 10))
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return ((newValue - oldValue) / oldValue) * 100
  }

  private periodToDays(period: AnalysisPeriod): number {
    switch (period) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '365d': return 365
      default: return 30
    }
  }

  private getComparisonPeriods(comparisonType: ComparisonType): any {
    const now = new Date()
    
    switch (comparisonType) {
      case 'day-over-day':
        return {
          currentPeriod: {
            start: now.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0]
          },
          previousPeriod: {
            start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }
      case 'week-over-week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const prevWeekStart = new Date(weekStart)
        prevWeekStart.setDate(weekStart.getDate() - 7)
        const prevWeekEnd = new Date(prevWeekStart)
        prevWeekEnd.setDate(prevWeekStart.getDate() + 6)
        
        return {
          currentPeriod: {
            start: weekStart.toISOString().split('T')[0],
            end: weekEnd.toISOString().split('T')[0]
          },
          previousPeriod: {
            start: prevWeekStart.toISOString().split('T')[0],
            end: prevWeekEnd.toISOString().split('T')[0]
          }
        }
      default:
        return {
          currentPeriod: { start: now.toISOString().split('T')[0], end: now.toISOString().split('T')[0] },
          previousPeriod: { start: now.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
        }
    }
  }

  private createEmptyDailyStatistics(airport: string, date: string): DailyStatistics {
    return {
      airport,
      date,
      totalFlights: 0,
      onTimeFlights: 0,
      delayedFlights: 0,
      cancelledFlights: 0,
      averageDelay: 0,
      onTimePercentage: 0,
      delayIndex: 0,
      peakHours: [],
      topAirlines: [],
      hourlyDistribution: []
    }
  }

  private createEmptyRangeStatistics(airport: string, fromDate: string, toDate: string): RangeStatistics {
    return {
      airport,
      fromDate,
      toDate,
      totalDays: 0,
      dailyStats: [],
      aggregated: {
        totalFlights: 0,
        averageFlightsPerDay: 0,
        overallOnTimePercentage: 0,
        overallAverageDelay: 0,
        bestDay: { date: '', onTimePercentage: 0 },
        worstDay: { date: '', onTimePercentage: 0 }
      },
      trends: {
        trafficTrend: 'stable',
        delayTrend: 'stable',
        trendPercentage: 0
      }
    }
  }
}

// Export singleton instance
export const flightStatisticsService = FlightStatisticsService.getInstance()