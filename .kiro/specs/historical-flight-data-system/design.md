# Design Document

## Overview

Sistemul de cache istoric și statistici extinde aplicația existentă de zboruri cu capabilități avansate de colectare, stocare și analiză a datelor pe termen lung. Arhitectura este proiectată să fie scalabilă, performantă și să se integreze natural cu sistemul existent de cache (`cacheManager.ts`), transformând aplicația într-un instrument puternic de business intelligence pentru traficul aerian.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Flight Schedule App                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   API Layer  │─────▶│ Cache Layer  │─────▶│  Storage  │ │
│  │  (Next.js)   │      │ (Enhanced)   │      │ (SQLite)  │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                     │       │
│         │                      ▼                     │       │
│         │              ┌──────────────┐             │       │
│         │              │  Historical  │             │       │
│         └─────────────▶│    Cache     │◀────────────┘       │
│                        │   Manager    │                     │
│                        └──────────────┘                     │
│                               │                              │
│                               ▼                              │
│                        ┌──────────────┐                     │
│                        │  Statistics  │                     │
│                        │   Service    │                     │
│                        └──────────────┘                     │
│                               │                              │
│                               ▼                              │
│                        ┌──────────────┐                     │
│                        │  Analytics   │                     │
│                        │     APIs     │                     │
│                        └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Request → API Route → Check Historical Cache
                              ↓
                         Data Exists?
                         ↙         ↘
                      YES          NO
                       ↓            ↓
                  Return Cache   Call External API
                       ↓            ↓
                  Log Cache Hit  Save Snapshot
                                   ↓
                              Update Historical Cache
                                   ↓
                              Return Data + Log
```

## Components and Interfaces

### 1. Historical Cache Manager (`lib/historicalCacheManager.ts`)

**Purpose**: Gestionează stocarea persistentă a datelor istorice și verificarea redundanței.

**Interface**:
```typescript
interface HistoricalCacheManager {
  // Check if data exists for a specific date
  hasDataForDate(airportCode: string, date: string, type: 'arrivals' | 'departures'): Promise<boolean>
  
  // Save daily snapshot
  saveDailySnapshot(snapshot: DailySnapshot): Promise<void>
  
  // Get data for a specific date
  getDataForDate(airportCode: string, date: string, type: 'arrivals' | 'departures'): Promise<FlightData[]>
  
  // Get data for date range
  getDataForRange(airportCode: string, fromDate: string, toDate: string, type?: 'arrivals' | 'departures'): Promise<FlightData[]>
  
  // Get available dates for an airport
  getAvailableDates(airportCode: string): Promise<string[]>
  
  // Get cache statistics
  getCacheStatistics(): Promise<CacheStatistics>
}
```

### 2. Flight Statistics Service (`lib/flightStatisticsService.ts`)

**Purpose**: Agregare și analiză avansată a datelor istorice.

**Interface**:
```typescript
interface FlightStatisticsService {
  // Daily statistics
  getDailyStatistics(airportCode: string, date: string): Promise<DailyStatistics>
  
  // Range statistics
  getRangeStatistics(airportCode: string, fromDate: string, toDate: string): Promise<RangeStatistics>
  
  // Trend analysis
  getTrendAnalysis(airportCode: string, period: '7d' | '30d' | '90d'): Promise<TrendAnalysis>
  
  // Comparative analysis
  getComparativeAnalysis(airportCode: string, comparison: ComparisonType): Promise<ComparativeAnalysis>
  
  // Peak hours analysis
  getPeakHoursAnalysis(airportCode: string, period: string): Promise<PeakHoursAnalysis>
  
  // Airline performance
  getAirlinePerformance(airportCode: string, period: string): Promise<AirlinePerformance[]>
}
```

### 3. Statistics API Routes

**Purpose**: Expune datele agregate prin API-uri RESTful.

**Endpoints**:
```typescript
// Daily statistics
GET /api/stats/daily?airport=OTP&date=2025-12-18

// Range statistics  
GET /api/stats/range?airport=OTP&from=2025-12-01&to=2025-12-18

// Trend analysis
GET /api/stats/trends?airport=OTP&period=7d

// Comparative analysis
GET /api/stats/compare?airport=OTP&type=week-over-week

// Peak hours heatmap
GET /api/stats/peak-hours?airport=OTP&period=30d

// Airline performance
GET /api/stats/airlines?airport=OTP&period=30d
```

## Data Models

### Database Schema (SQLite)

```sql
-- Main historical flights table
CREATE TABLE historical_flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  airline_name TEXT,
  origin_code TEXT NOT NULL,
  origin_name TEXT,
  destination_code TEXT NOT NULL,
  destination_name TEXT,
  scheduled_time DATETIME NOT NULL,
  actual_time DATETIME,
  estimated_time DATETIME,
  status TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  flight_type TEXT NOT NULL, -- 'arrival' or 'departure'
  request_date DATE NOT NULL,
  request_time TIME NOT NULL,
  data_source TEXT NOT NULL, -- 'api' or 'cache'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for fast queries
  INDEX idx_airport_date (airport_iata, request_date),
  INDEX idx_date_range (request_date),
  INDEX idx_airline (airline_code),
  INDEX idx_scheduled_time (scheduled_time),
  INDEX idx_status (status)
);

-- Daily aggregated statistics (pre-computed for performance)
CREATE TABLE daily_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  stat_date DATE NOT NULL,
  total_flights INTEGER NOT NULL,
  on_time_flights INTEGER NOT NULL,
  delayed_flights INTEGER NOT NULL,
  cancelled_flights INTEGER NOT NULL,
  average_delay_minutes REAL NOT NULL,
  on_time_percentage REAL NOT NULL,
  delay_index REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(airport_iata, stat_date),
  INDEX idx_airport_stat_date (airport_iata, stat_date)
);

-- Hourly traffic patterns
CREATE TABLE hourly_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  hour_of_day INTEGER NOT NULL, -- 0-23
  day_of_week INTEGER NOT NULL, -- 0-6 (Monday-Sunday)
  avg_flights REAL NOT NULL,
  avg_delay_minutes REAL NOT NULL,
  sample_size INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(airport_iata, hour_of_day, day_of_week),
  INDEX idx_airport_patterns (airport_iata)
);

-- Airline performance metrics
CREATE TABLE airline_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_flights INTEGER NOT NULL,
  on_time_flights INTEGER NOT NULL,
  delayed_flights INTEGER NOT NULL,
  cancelled_flights INTEGER NOT NULL,
  average_delay_minutes REAL NOT NULL,
  on_time_percentage REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_airline_perf (airport_iata, airline_code, period_start)
);
```

### TypeScript Interfaces

```typescript
// Daily snapshot structure
interface DailySnapshot {
  airportCode: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: 'arrivals' | 'departures'
  source: string // API name
  flights: FlightData[]
}

// Flight data structure
interface FlightData {
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

// Daily statistics
interface DailyStatistics {
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

// Range statistics
interface RangeStatistics {
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
interface TrendAnalysis {
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

// Comparative analysis
interface ComparativeAnalysis {
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
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data Uniqueness
*For any* airport code, date, and flight type combination, there should be at most one daily snapshot stored in the historical cache.
**Validates: Requirements 1.4**

### Property 2: Cache Hit Accuracy
*For any* request where historical data exists for the same airport, date, and type, the system should return cached data and mark the source as 'cache' without calling the external API.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Metadata Completeness
*For any* saved daily snapshot, all required metadata fields (request_date, request_time, airport_iata, type, source) must be present and valid.
**Validates: Requirements 1.2**

### Property 4: Statistics Consistency
*For any* date range, the sum of daily statistics should equal the aggregated range statistics for total flights, delayed flights, and cancelled flights.
**Validates: Requirements 4.1, 4.2**

### Property 5: Trend Calculation Accuracy
*For any* two consecutive periods, the trend percentage should accurately reflect the change in metrics between the periods.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: API Response Format
*For any* statistics API endpoint, the response should include all required fields with correct data types and units (minutes, percentages).
**Validates: Requirements 6.4, 6.5, 7.4**

### Property 7: Chronological Ordering
*For any* range query, the returned data points should be ordered chronologically from oldest to newest.
**Validates: Requirements 6.5**

### Property 8: Data Accumulation
*For any* day where the system is running, new flight data should be added to the historical cache without removing existing data.
**Validates: Requirements 9.1**

### Property 9: Cache Statistics Accuracy
*For any* point in time, the cache statistics should accurately reflect the number of days of historical data stored in the system.
**Validates: Requirements 8.3**

### Property 10: Delay Calculation Consistency
*For any* flight with both scheduled_time and actual_time, the delay_minutes should equal the difference in minutes, with negative values treated as zero.
**Validates: Requirements 4.2**

## Error Handling

### Database Errors
- **Connection failures**: Retry with exponential backoff, fallback to in-memory cache
- **Write failures**: Log error, queue for retry, notify admin
- **Corruption**: Automatic backup restoration, integrity checks

### API Integration Errors
- **External API failures**: Use cached data if available, log incident
- **Timeout**: Implement request timeout (30s), fallback to cache
- **Rate limiting**: Respect API limits, use cache aggressively

### Data Validation Errors
- **Invalid dates**: Reject with clear error message
- **Missing required fields**: Log warning, attempt to infer or skip
- **Duplicate data**: Check uniqueness before insert, update if exists

### Performance Issues
- **Slow queries**: Implement query timeout (5s), optimize indexes
- **Large result sets**: Implement pagination, limit to 1000 records
- **Memory pressure**: Stream large datasets, implement chunking

## Testing Strategy

### Unit Testing
- Test each component in isolation
- Mock database connections
- Test edge cases (empty data, invalid dates, etc.)
- Test error handling paths

### Property-Based Testing
- Use fast-check library for TypeScript
- Configure each test to run minimum 100 iterations
- Test properties defined in Correctness Properties section
- Generate random valid inputs for comprehensive coverage

### Integration Testing
- Test full flow from API request to database storage
- Test cache hit/miss scenarios
- Test statistics calculation accuracy
- Test API endpoints with real database

### Performance Testing
- Benchmark query performance with various data volumes
- Test with 1 day, 30 days, 90 days, 365 days of data
- Measure API response times under load
- Test concurrent access scenarios

## Implementation Notes

### Database Choice: SQLite
- **Rationale**: Simple deployment, no separate server, perfect for single-instance apps
- **File location**: `/opt/anyway-flight-schedule/data/historical-flights.db`
- **Backup strategy**: Daily automated backups to `/opt/anyway-flight-schedule/data/backups/`
- **Migration path**: Can migrate to PostgreSQL if needed for scaling

### Integration with Existing Cache
- Extend `cacheManager.ts` with historical capabilities
- Maintain backward compatibility
- Add new methods without breaking existing functionality
- Share database connection pool

### Performance Optimizations
- Pre-compute daily statistics during off-peak hours
- Use database indexes strategically
- Implement query result caching for frequently accessed data
- Use connection pooling for database access

### Monitoring and Logging
- Log all database operations with timing
- Track cache hit rate metrics
- Monitor database size growth
- Alert on errors or performance degradation