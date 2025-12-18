/**
 * TypeScript interfaces for Historical Flight Data System
 * Defines all data models and types used throughout the system
 */

// Daily snapshot structure
export interface DailySnapshot {
  airportCode: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: 'arrivals' | 'departures'
  source: string // API name
  flights: FlightData[]
}

// Flight data structure
export interface FlightData {
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
}

// Database record for historical flights
export interface HistoricalFlightRecord {
  id?: number
  airport_iata: string
  flight_number: string
  airline_code: string
  airline_name?: string
  origin_code: string
  origin_name?: string
  destination_code: string
  destination_name?: string
  scheduled_time: string
  actual_time?: string
  estimated_time?: string
  status: string
  delay_minutes: number
  flight_type: 'arrival' | 'departure'
  request_date: string // YYYY-MM-DD
  request_time: string // HH:mm:ss
  data_source: 'api' | 'cache'
  created_at?: string
}

// Daily statistics
export interface DailyStatistics {
  airport: string
  date: string
  totalFlights: number
  onTimeFlights: number
  delayedFlights: number
  cancelledFlights: number
  averageDelay: number
  onTimePercentage: number
  delayIndex: number
  peakHours: number[]
  topAirlines: AirlineStats[]
  hourlyDistribution: HourlyStats[]
}

// Database record for daily statistics
export interface DailyStatisticsRecord {
  id?: number
  airport_iata: string
  stat_date: string
  total_flights: number
  on_time_flights: number
  delayed_flights: number
  cancelled_flights: number
  average_delay_minutes: number
  on_time_percentage: number
  delay_index: number
  created_at?: string
  updated_at?: string
}

// Range statistics
export interface RangeStatistics {
  airport: string
  fromDate: string
  toDate: string
  totalDays: number
  dailyStats: DailyStatistics[]
  aggregated: {
    totalFlights: number
    averageFlightsPerDay: number
    overallOnTimePercentage: number
    overallAverageDelay: number
    bestDay: { date: string; onTimePercentage: number }
    worstDay: { date: string; onTimePercentage: number }
  }
  trends: {
    trafficTrend: 'increasing' | 'decreasing' | 'stable'
    delayTrend: 'improving' | 'worsening' | 'stable'
    trendPercentage: number
  }
}

// Trend analysis
export interface TrendAnalysis {
  airport: string
  period: string
  dataPoints: TrendDataPoint[]
  insights: {
    trafficChange: number // percentage
    delayChange: number // percentage
    bestPerformingDay: string
    worstPerformingDay: string
    recommendations: string[]
  }
}

export interface TrendDataPoint {
  date: string
  totalFlights: number
  onTimePercentage: number
  averageDelay: number
  delayIndex: number
}

// Comparative analysis
export interface ComparativeAnalysis {
  airport: string
  comparisonType: 'day-over-day' | 'week-over-week' | 'month-over-month'
  current: PeriodStats
  previous: PeriodStats
  changes: {
    trafficChange: number
    delayChange: number
    onTimeChange: number
  }
}

export interface PeriodStats {
  period: string
  totalFlights: number
  onTimePercentage: number
  averageDelay: number
  delayIndex: number
}

// Airline statistics
export interface AirlineStats {
  code: string
  name: string
  flights: number
  onTimePercentage: number
  averageDelay: number
}

// Hourly statistics
export interface HourlyStats {
  hour: number
  flights: number
  averageDelay: number
  onTimePercentage: number
}

// Database record for hourly patterns
export interface HourlyPatternRecord {
  id?: number
  airport_iata: string
  hour_of_day: number
  day_of_week: number
  avg_flights: number
  avg_delay_minutes: number
  sample_size: number
  created_at?: string
  updated_at?: string
}

// Database record for airline performance
export interface AirlinePerformanceRecord {
  id?: number
  airport_iata: string
  airline_code: string
  period_start: string
  period_end: string
  total_flights: number
  on_time_flights: number
  delayed_flights: number
  cancelled_flights: number
  average_delay_minutes: number
  on_time_percentage: number
  created_at?: string
  updated_at?: string
}

// Peak hours analysis
export interface PeakHoursAnalysis {
  airport: string
  period: string
  hourlyData: Array<{
    hour: number
    averageFlights: number
    averageDelay: number
    trafficIntensity: 'low' | 'medium' | 'high' | 'peak'
  }>
  peakHours: number[]
  quietHours: number[]
  recommendations: string[]
}

// Airline performance analysis
export interface AirlinePerformance {
  airlineCode: string
  airlineName: string
  airport: string
  period: string
  totalFlights: number
  onTimeFlights: number
  delayedFlights: number
  cancelledFlights: number
  averageDelay: number
  onTimePercentage: number
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  trend: 'improving' | 'stable' | 'declining'
}

// Cache statistics
export interface CacheStatistics {
  totalRecords: number
  oldestRecord: string
  newestRecord: string
  airportCoverage: string[]
  dateRange: {
    start: string
    end: string
    totalDays: number
  }
  dataQuality: {
    recordsWithDelayData: number
    recordsWithActualTimes: number
    completenessPercentage: number
  }
}

// Comparison types for analysis
export type ComparisonType = 
  | 'day-over-day'
  | 'week-over-week' 
  | 'month-over-month'
  | 'same-day-last-week'
  | 'same-day-last-month'

// Time periods for analysis
export type AnalysisPeriod = '7d' | '30d' | '90d' | '365d'

// Data source types
export type DataSource = 'api' | 'cache'

// Flight status categories
export type FlightStatus = 
  | 'scheduled'
  | 'delayed'
  | 'cancelled'
  | 'on-time'
  | 'landed'
  | 'departed'
  | 'en-route'
  | 'unknown'

// Performance grades
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F'

// Trend directions
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'

// Traffic intensity levels
export type TrafficIntensity = 'low' | 'medium' | 'high' | 'peak'