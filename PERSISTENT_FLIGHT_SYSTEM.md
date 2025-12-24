# Persistent Flight System

A comprehensive, persistent flight data management system for Romanian and Moldovan airports. This system implements UPSERT operations, codeshare filtering, weather integration, and automated backups while maintaining full backward compatibility.

## 🏗️ Architecture Overview

The Persistent Flight System consists of 5 core components:

### 1. Historical Database Manager (`lib/historicalDatabaseManager.ts`)
- **Purpose**: JSON-based persistent storage that never loses data
- **Key Features**:
  - UPSERT operations (update if exists, insert if new)
  - Preserves creation timestamps, updates modification timestamps
  - Automatic backup creation and 7-day rotation
  - Database integrity validation

### 2. Flight Data Processor (`lib/flightDataProcessor.ts`)
- **Purpose**: Intelligent flight data processing and filtering
- **Key Features**:
  - Codeshare flight detection and filtering (keeps only operating airline)
  - Duplicate flight elimination
  - Data validation and normalization
  - Uses scheduled time as primary time reference

### 3. Master Schedule Generator (`lib/masterScheduleGenerator.ts`)
- **Purpose**: Generates weekly schedules from historical data
- **Key Features**:
  - Route analysis and frequency calculation
  - Punctuality statistics
  - Peak time and day analysis
  - Follows IATA airport mapping rules strictly

### 4. Weather Cache Manager (`lib/weatherCacheManager.ts`)
- **Purpose**: Persistent weather data with 30-minute refresh cycle
- **Key Features**:
  - OpenWeatherMap API integration
  - Flight impact assessment
  - Fallback to cached data when API fails
  - Automatic destination mapping from IATA codes

### 5. Daily Backup Manager (`lib/dailyBackupManager.ts`)
- **Purpose**: Automated daily backups at 00:00 with 7-day retention
- **Key Features**:
  - Automatic backup creation and rotation
  - Backup integrity validation
  - Manual backup and restore capabilities
  - Pre-restore safety backups

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Install additional testing dependencies
npm install --save-dev jest @types/jest ts-jest jest-environment-node fast-check
```

### Initialization

```typescript
import { persistentFlightSystem } from './lib/persistentFlightSystem'

// Initialize the entire system
await persistentFlightSystem.initialize()
```

### Basic Usage

```typescript
// Ingest flight data from APIs
const result = await persistentFlightSystem.ingestFlightData(
  rawFlightData,
  'OTP', // IATA airport code
  'arrivals'
)

// Get flight data (with optional date range)
const flights = await persistentFlightSystem.getFlightData('OTP', 'arrivals')

// Generate weekly schedule
const schedule = await persistentFlightSystem.generateWeeklySchedule('OTP')

// Get weather data
const weather = await persistentFlightSystem.getWeatherData('OTP')

// Create manual backup
const backup = await persistentFlightSystem.createBackup('Manual backup before update')
```

## 📊 API Endpoints

### Enhanced Flight Data API v2

```bash
# Get flight data
GET /api/flights-v2/OTP/arrivals
GET /api/flights-v2/OTP/arrivals?startDate=2024-01-01&endDate=2024-01-31

# Ingest flight data
POST /api/flights-v2/OTP/arrivals
{
  "flightData": [...]
}
```

### Persistent System Management

```bash
# Get system status
GET /api/persistent-system?action=status

# Get backup statistics
GET /api/persistent-system?action=backup-stats

# Create backup
POST /api/persistent-system
{
  "action": "create-backup",
  "description": "Manual backup"
}

# Generate schedule
POST /api/persistent-system
{
  "action": "generate-schedule",
  "airportCode": "OTP"
}
```

## 🧪 Testing

The system includes comprehensive property-based tests using fast-check:

```bash
# Run all tests
npm test

# Run property-based tests specifically
npm run test:properties

# Run tests in watch mode
npm run test:watch
```

### Property-Based Tests

The system validates 22 correctness properties with minimum 100 iterations each:

1. **Data Persistence Guarantee** - Data never lost on restart
2. **UPSERT Logic Consistency** - Preserves creation timestamps
3. **Codeshare Filtering Accuracy** - Keeps only operating airlines
4. **Master Schedule Completeness** - Includes all routes
5. **Weather Cache Freshness** - 30-minute refresh cycle
6. **Backup Rotation Integrity** - Never more than 7 backups
7. **Database Initialization Reliability** - Proper startup validation

## 🔧 Configuration

### Airport Mapping (IATA Codes Only)

The system strictly follows IATA airport codes:

```typescript
const SUPPORTED_AIRPORTS = [
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA',
  'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'
]
```

### Cache Key Format

All cache keys follow the format: `{IATA_CODE}_{TYPE}`

```typescript
// ✅ Correct
const cacheKey = `OTP_arrivals`
const cacheKey = `CLJ_departures`

// ❌ Wrong
const cacheKey = `LROP_arrivals` // ICAO code not allowed
```

### Data Sources

The system only accepts real flight data from APIs:

- ✅ AviationStack, FlightAware, AeroDataBox
- ❌ Mock, demo, or test data

## 📁 File Structure

```
lib/
├── persistentFlightSystem.ts      # Main integration layer
├── historicalDatabaseManager.ts   # Persistent database
├── flightDataProcessor.ts         # Data processing & filtering
├── masterScheduleGenerator.ts     # Schedule generation
├── weatherCacheManager.ts         # Weather data management
├── dailyBackupManager.ts          # Backup system
└── cacheManager.ts               # Legacy integration

app/api/
├── flights-v2/[airport]/[type]/   # Enhanced flight API
└── persistent-system/             # System management API

__tests__/
└── persistent-flight-system.test.ts # Property-based tests

data/
├── historical_flights.json        # Historical database
├── flights_cache.json            # Legacy persistent cache
├── weather_cache.json            # Weather cache
└── daily_backups/                # Automated backups
```

## 🔄 Integration with Existing System

The persistent flight system maintains full backward compatibility:

### Cache Manager Integration

```typescript
// The cache manager automatically uses the new system
import { cacheManager } from './lib/cacheManager'

// This now uses the persistent system under the hood
await cacheManager.initialize()
```

### Legacy API Compatibility

Existing API endpoints continue to work unchanged:

```bash
# These still work exactly as before
GET /api/flights/OTP/arrivals
GET /api/flights/OTP/departures
```

## 🚨 Critical Rules

### Never Delete Historical Data

```typescript
// ❌ FORBIDDEN - Never delete persistent cache without explicit permission
await persistentFlightCache.clearAllCache()

// ✅ ALLOWED - Only with explicit confirmation token
await cacheManager.clearPersistentCache('CONFIRM_DELETE_ALL_HISTORICAL_DATA')
```

### Always Use IATA Codes

```typescript
// ✅ Correct
await persistentFlightSystem.getFlightData('OTP', 'arrivals')

// ❌ Wrong
await persistentFlightSystem.getFlightData('LROP', 'arrivals')
```

### Only Real Flight Data

```typescript
// ✅ Correct - Real API data
const apiData = await flightApiService.getArrivals('OTP')
await persistentFlightSystem.ingestFlightData(apiData, 'OTP', 'arrivals')

// ❌ Forbidden - Mock data
const mockData = generateMockFlights()
await persistentFlightSystem.ingestFlightData(mockData, 'OTP', 'arrivals')
```

## 📈 Performance Considerations

### Database Operations
- UPSERT operations are optimized for frequent updates
- Indexes on flight number, route, and scheduled time
- Automatic cleanup of old data (configurable retention)

### Memory Management
- In-memory cache for frequently accessed data
- Lazy loading of historical data
- Automatic garbage collection of expired entries

### API Rate Limiting
- Weather API calls limited to 30-minute intervals
- Flight API calls respect provider rate limits
- Intelligent fallback to cached data

## 🔍 Monitoring and Debugging

### System Status

```typescript
const status = await persistentFlightSystem.getSystemStatus()
console.log('System Status:', status)
```

### Backup Monitoring

```typescript
const backupStats = await dailyBackupManager.getBackupStats()
console.log('Backup Statistics:', backupStats)
```

### Cache Statistics

```typescript
const weatherStats = await weatherCacheManager.getCacheStats()
console.log('Weather Cache:', weatherStats)
```

## 🛠️ Troubleshooting

### Common Issues

1. **No flight data showing**
   - Check if persistent system is initialized
   - Verify IATA airport codes are used
   - Check API connectivity and rate limits

2. **Backup failures**
   - Verify disk space availability
   - Check file permissions in data directory
   - Validate backup integrity

3. **Weather data stale**
   - Check OpenWeatherMap API key
   - Verify network connectivity
   - Check API rate limits

### Debug Commands

```bash
# Check system status
curl http://localhost:3000/api/persistent-system?action=status

# Check backup statistics
curl http://localhost:3000/api/persistent-system?action=backup-stats

# Test flight data API
curl http://localhost:3000/api/flights-v2/OTP/arrivals
```

## 📝 Contributing

When contributing to the persistent flight system:

1. **Follow IATA airport mapping rules** - Never use ICAO codes
2. **Write property-based tests** - Use fast-check for new features
3. **Maintain backward compatibility** - Don't break existing APIs
4. **Use real data only** - Never create mock or test data
5. **Document changes** - Update this README for new features

## 🔐 Security Considerations

- All API endpoints validate IATA airport codes
- Backup operations require explicit confirmation
- Weather API keys are environment-specific
- File operations are restricted to data directory
- Input validation on all external data

---

**Remember**: This system handles critical flight data. Always prioritize data integrity and never delete historical information without explicit user permission.