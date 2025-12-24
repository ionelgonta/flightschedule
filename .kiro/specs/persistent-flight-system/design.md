# Design Document - Persistent Flight System

## Overview

Sistemul Persistent Flight System este o arhitectură robustă care gestionează colectarea, procesarea și stocarea permanentă a datelor de zboruri pentru aeroporturile din România și Moldova. Sistemul implementează o bază de date istorică care nu se șterge niciodată, generează programe săptămânale precise și menține cache-uri meteorologice persistente.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flight APIs   │───▶│  Data Processor  │───▶│ Historical DB   │
│  (AeroDataBox)  │    │   & Validator    │    │   (SQLite)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Weather APIs   │───▶│  Cache Manager   │───▶│  Master Schedule│
│ (OpenWeatherMap)│    │   & Scheduler    │    │   Generator     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Daily Backup   │◀───│  Backup Manager  │    │   UI Modules    │
│   System        │    │                  │    │ (Stats/Planner) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Collection**: Flight APIs → Data Processor
2. **Validation**: Codeshare filtering, duplicate removal
3. **Storage**: UPSERT operations în Historical Database
4. **Aggregation**: Master Schedule generation
5. **Presentation**: UI Modules consume persistent data

## Components and Interfaces

### 1. Historical Database Manager

**Responsabilități:**
- Gestionarea bazei de date SQLite persistente
- Implementarea logicii UPSERT pentru zboruri
- Menținerea integrității datelor
- Schema management și migrații

**Interface:**
```typescript
interface HistoricalDatabaseManager {
  initializeDatabase(): Promise<void>
  upsertFlight(flight: FlightRecord): Promise<void>
  getFlightsByRoute(route: string): Promise<FlightRecord[]>
  getFlightsByAirport(airport: string, dateRange: DateRange): Promise<FlightRecord[]>
  generateMasterSchedule(): Promise<WeeklySchedule>
  createBackup(): Promise<string>
  restoreFromBackup(backupId: string): Promise<void>
}
```

### 2. Flight Data Processor

**Responsabilități:**
- Procesarea datelor brute din API-uri
- Filtrarea zborurilor codeshare
- Eliminarea duplicatelor
- Validarea și normalizarea datelor

**Interface:**
```typescript
interface FlightDataProcessor {
  processFlightData(rawData: RawFlightData[]): Promise<ProcessedFlight[]>
  filterCodeshareFlights(flights: RawFlightData[]): RawFlightData[]
  removeDuplicates(flights: RawFlightData[]): RawFlightData[]
  validateFlightData(flight: RawFlightData): boolean
  normalizeFlightData(flight: RawFlightData): ProcessedFlight
}
```

### 3. Master Schedule Generator

**Responsabilități:**
- Generarea programului săptămânal din datele istorice
- Agregarea pe rute, operatori și frecvență
- Calcularea statisticilor de punctualitate
- Optimizarea pentru afișare

**Interface:**
```typescript
interface MasterScheduleGenerator {
  generateWeeklySchedule(airport: string): Promise<WeeklySchedule>
  getRouteStatistics(route: string): Promise<RouteStats>
  getAirlineFrequency(airline: string, route: string): Promise<FrequencyData>
  calculatePunctualityStats(flights: FlightRecord[]): PunctualityStats
}
```

### 4. Weather Cache Manager

**Responsabilități:**
- Gestionarea cache-ului meteorologic persistent
- Actualizarea datelor la interval de 30 minute
- Fallback la ultimele date valide
- Integrarea cu OpenWeatherMap API

**Interface:**
```typescript
interface WeatherCacheManager {
  getWeatherData(destination: string): Promise<WeatherData>
  updateWeatherCache(destination: string): Promise<void>
  isWeatherDataStale(destination: string): boolean
  getLastValidWeatherData(destination: string): Promise<WeatherData>
}
```

### 5. Daily Backup Manager

**Responsabilități:**
- Crearea backup-urilor zilnice la 00:00
- Gestionarea rotației backup-urilor (7 zile)
- Restaurarea din backup-uri
- Validarea integrității backup-urilor

**Interface:**
```typescript
interface DailyBackupManager {
  createDailyBackup(): Promise<BackupInfo>
  listAvailableBackups(): Promise<BackupInfo[]>
  restoreFromBackup(backupId: string): Promise<void>
  cleanOldBackups(): Promise<void>
  validateBackupIntegrity(backupId: string): Promise<boolean>
}
```

## Data Models

### FlightRecord
```typescript
interface FlightRecord {
  id: string // Generated unique ID
  flightNumber: string // e.g., "W6 2345"
  airlineCode: string // IATA code
  airlineName: string
  route: string // "OTP-CDG" format
  originAirport: string
  destinationAirport: string
  scheduledTime: Date
  estimatedTime?: Date
  actualTime?: Date
  status: FlightStatus
  aircraft?: AircraftInfo
  gate?: string
  terminal?: string
  isCodeshare: boolean
  operatingAirline?: string // For codeshare flights
  createdAt: Date
  updatedAt: Date
}
```

### WeeklySchedule
```typescript
interface WeeklySchedule {
  airport: string
  weekStartDate: Date
  routes: RouteSchedule[]
  statistics: ScheduleStatistics
  lastUpdated: Date
}

interface RouteSchedule {
  route: string // "Paris - București"
  flights: ScheduledFlight[]
}

interface ScheduledFlight {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  airline: string
  flightNumber: string
  scheduledTime: string // "12:00"
  frequency: number // How many times per week
  punctualityScore: number // 0-100
}
```

### WeatherData
```typescript
interface WeatherData {
  destination: string
  temperature: number
  description: string
  icon: string
  windSpeed: number
  visibility: number
  flightImpact: FlightImpactLevel
  lastUpdated: Date
  source: 'api' | 'cache'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data Persistence Guarantee
*For any* flight data processed by the system, once stored in the Historical Database, the data should never be lost due to system restarts or failures
**Validates: Requirements 1.1, 1.3**

### Property 2: UPSERT Logic Consistency  
*For any* flight identified by flight number and date, if the flight exists in the database, updating it should preserve the original creation timestamp while updating the modification timestamp
**Validates: Requirements 1.2, 1.3**

### Property 3: Codeshare Filtering Accuracy
*For any* set of flight data containing codeshare flights, the filtering process should retain only the operating airline's flight number and remove all codeshare duplicates
**Validates: Requirements 2.3**

### Property 4: Master Schedule Completeness
*For any* airport and time period, the generated Master Schedule should include all unique routes found in the Historical Database for that period
**Validates: Requirements 3.1, 3.2**

### Property 5: Weather Cache Freshness
*For any* destination, if weather data is older than 30 minutes, the system should attempt to fetch fresh data from the API before serving cached data
**Validates: Requirements 4.2**

### Property 6: Backup Rotation Integrity
*For any* day when the backup system runs, there should never be more than 7 backup files, and the oldest backup should be automatically removed when creating the 8th backup
**Validates: Requirements 5.2, 5.3**

### Property 7: UI Data Consistency
*For any* UI module requesting flight data, the data served should come exclusively from the persistent cache and should be identical across all modules for the same query parameters
**Validates: Requirements 6.1, 6.2**

### Property 8: Database Recovery Reliability
*For any* system startup, if the database file is corrupted or missing, the system should either restore from the most recent valid backup or create a new database with the correct schema
**Validates: Requirements 7.3, 7.5**

### Property 9: Duplicate Flight Elimination
*For any* set of flight data containing duplicates, the processing system should eliminate all duplicates while preserving exactly one instance of each unique flight
**Validates: Requirements 2.2**

### Property 10: Codeshare Flight Filtering
*For any* flight data containing codeshare flights, the system should retain only the operating airline's flight and remove all codeshare variants
**Validates: Requirements 2.3**

### Property 11: Schedule Time Accuracy
*For any* flight processed by the system, the scheduled time field should be used as the primary time reference for all calculations and displays
**Validates: Requirements 2.4**

### Property 12: Route Aggregation Completeness
*For any* set of historical flight data, the aggregation process should group all flights correctly by route, operator, and weekly frequency without losing any data
**Validates: Requirements 2.5**

### Property 13: Master Schedule Data Source Integrity
*For any* generated Master Schedule, all data should originate exclusively from the Historical Database with no external or cached sources
**Validates: Requirements 3.1**

### Property 14: Schedule Entry Format Consistency
*For any* entry in the Master Schedule, it should conform to the [Day | Route | Operator | Time] format specification
**Validates: Requirements 3.2**

### Property 15: Multi-Operator Route Separation
*For any* route served by multiple operators, each operator should appear as a separate entry in the schedule with distinct timing and frequency information
**Validates: Requirements 3.4**

### Property 16: Weather Cache Destination Mapping
*For any* unique destination identified in flight data, a corresponding weather cache entry should be created and maintained
**Validates: Requirements 4.1**

### Property 17: Weather Data Freshness Validation
*For any* weather data request, if the cached data is older than 30 minutes, the system should attempt to fetch fresh data from the API
**Validates: Requirements 4.2**

### Property 18: Weather API Fallback Reliability
*For any* weather API failure, the system should serve the most recent valid cached data for the requested destination
**Validates: Requirements 4.3**

### Property 19: Backup Rotation Limit Enforcement
*For any* backup creation operation, the system should never maintain more than 7 backup files, automatically removing the oldest when creating the 8th
**Validates: Requirements 5.2, 5.3**

### Property 20: Module Data Source Consistency
*For any* UI module (Statistics, Planner, Analytics) requesting flight data, the data should come exclusively from the persistent cache with identical results for the same query parameters
**Validates: Requirements 6.1, 6.2, 6.4**

### Property 21: Database Initialization Reliability
*For any* system startup, the database verification process should correctly identify existing databases and create new ones with proper schema when needed
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 22: Data Integrity Validation
*For any* database loading operation, the system should validate data integrity and trigger recovery procedures when corruption is detected
**Validates: Requirements 7.4, 7.5**

## Error Handling

### Database Errors
- **Connection failures**: Retry with exponential backoff, fallback to read-only mode
- **Corruption detection**: Automatic restore from latest valid backup
- **Schema migration failures**: Rollback to previous version, log detailed error

### API Errors
- **Flight API failures**: Continue with cached data, log for manual review
- **Weather API failures**: Use last known good data, indicate staleness to users
- **Rate limiting**: Implement intelligent backoff, prioritize critical updates

### Backup Errors
- **Backup creation failures**: Retry up to 3 times, alert administrators
- **Restore failures**: Validate backup integrity before attempting restore
- **Storage space issues**: Clean old backups, compress if necessary

## Testing Strategy

### Unit Testing
- Database UPSERT operations with various flight data scenarios
- Codeshare filtering with complex airline partnership data
- Weather cache expiration and refresh logic
- Backup creation and restoration processes

### Property-Based Testing
- **Flight Data Processing**: Generate random flight datasets and verify all properties hold
- **Schedule Generation**: Test with various historical data patterns
- **Cache Management**: Verify cache behavior under different load patterns
- **Backup System**: Test backup/restore cycles with corrupted data scenarios

**Property-Based Testing Requirements:**
- Use **fast-check** library for TypeScript property-based testing
- Configure each property test to run minimum **100 iterations**
- Tag each test with format: **Feature: persistent-flight-system, Property {number}: {property_text}**
- Each correctness property must be implemented by a single property-based test

### Integration Testing
- End-to-end flight data flow from API to UI
- Cross-module data consistency verification
- Backup and restore system integration
- Weather data integration with flight information

### Performance Testing
- Database query performance with large historical datasets
- Memory usage during bulk data processing
- API response times under various load conditions
- Backup creation time with different database sizes