# PROJECT MAP - Flight Schedule Application

## 🏗️ ARHITECTURA SISTEMULUI

### Data Flow Overview
```
AeroDataBox API → Cache Manager → Persistent Cache → Flight Repository → API Routes → UI Components
                      ↓
                Historical Cache (SQLite) → Statistics Service → Statistics APIs → Statistics UI
```

### Detailed Data Flow
1. **AeroDataBox API** - External flight data source (60-minute intervals)
2. **Cache Manager** - Central caching system with configurable intervals
3. **Persistent Flight Cache** - Disk-based storage (`data/flights_cache.json`)
4. **Historical Cache** - SQLite database for long-term analytics
5. **Flight Repository** - Data access layer (cache-only, no direct API calls)
6. **API Routes** - REST endpoints for frontend consumption
7. **UI Components** - React components with real-time data display

## 📊 STRUCTURA CACHE-ULUI

### Main Cache Structure (`data/cache-data.json`)
```json
{
  "id": "flight_OTP_arrivals_1703123456789",
  "category": "flightData",
  "key": "OTP_arrivals",
  "data": [
    {
      "flight_number": "RO123",
      "airline": {
        "code": "RO",
        "name": "TAROM"
      },
      "origin": {
        "code": "LHR",
        "name": "London Heathrow",
        "city": "Londra"
      },
      "destination": {
        "code": "OTP",
        "name": "Henri Coandă International Airport",
        "city": "București"
      },
      "scheduled_time": "2024-12-22T14:30:00Z",
      "actual_time": "2024-12-22T14:45:00Z",
      "status": "landed",
      "delay": 15
    }
  ],
  "createdAt": "2024-12-22T12:00:00Z",
  "expiresAt": "2024-12-22T13:00:00Z",
  "source": "cron",
  "success": true
}
```

### Persistent Cache Structure (`data/flights_cache.json`)
```json
{
  "RO123_OTP_2024-12-22T14:30:00Z": {
    "flightNumber": "RO123",
    "airlineCode": "RO",
    "airlineName": "TAROM",
    "originCode": "LHR",
    "originName": "London Heathrow",
    "destinationCode": "OTP",
    "destinationName": "Henri Coandă International Airport",
    "scheduledTime": "2024-12-22T14:30:00Z",
    "actualTime": "2024-12-22T14:45:00Z",
    "status": "landed",
    "delayMinutes": 15,
    "airportCode": "OTP",
    "type": "arrivals",
    "cachedAt": "2024-12-22T12:00:00Z",
    "source": "api"
  }
}
```

### Cache Configuration (`data/cache-config.json`)
```json
{
  "flightData": {
    "cronInterval": 60
  },
  "analytics": {
    "cronInterval": 30,
    "cacheMaxAge": 360
  },
  "aircraft": {
    "cronInterval": 360,
    "cacheMaxAge": 360
  }
}
```

## 🔄 LOGICA DE AGREGARE

### Statistics Generation Algorithm
1. **Data Source**: Uses cached flight data from both main cache and persistent cache
2. **Fallback Logic**: Main cache → Persistent cache → "No data" message
3. **Real Data Only**: Never generates mock/demo data (per cache-management-rules.md)
4. **Aggregation Process**:
   ```typescript
   // Get cached flight data
   const arrivalsKey = `${airportCode}_arrivals`
   const departuresKey = `${airportCode}_departures`
   const cachedArrivals = await cacheManager.getCachedDataWithPersistent(arrivalsKey) || []
   const cachedDepartures = await cacheManager.getCachedDataWithPersistent(departuresKey) || []
   const allFlights = [...cachedArrivals, ...cachedDepartures]
   
   // Calculate statistics
   const onTimeFlights = allFlights.filter(f => isOnTime(f)).length
   const delayedFlights = allFlights.filter(f => isDelayed(f)).length
   const averageDelay = calculateAverageDelay(allFlights)
   const onTimePercentage = Math.round((onTimeFlights / totalFlights) * 100)
   ```

### Delay Classification Logic
- **On-time**: delay ≤ 15 minutes OR status = 'on-time'/'scheduled'/'landed'/'departed'
- **Delayed**: delay > 15 minutes OR status = 'delayed'
- **Cancelled**: status = 'cancelled'/'canceled'

### Peak Hours Calculation
- Groups flights by hour of scheduled time
- Sorts by flight count descending
- Returns top 4 hours with most traffic

## 🌐 ENDPOINTS UTILIZATE

### External API Endpoints (AeroDataBox)
- **Base URL**: `https://prod.api.market/api/v1/aedbx/aerodatabox`
- **Arrivals**: `/flights/airports/iata/{airport}/stats/routes/daily/{date}/arrivals`
- **Departures**: `/flights/airports/iata/{airport}/stats/routes/daily/{date}/departures`
- **Frequency**: Every 60 minutes (configurable)
- **Rate Limit**: 100 requests/day

### Internal API Endpoints

#### Flight Data APIs
- `GET /api/flights/[airport]/arrivals` - Get arrivals for airport
- `GET /api/flights/[airport]/departures` - Get departures for airport
- **Cache Strategy**: Reads only from cache, never makes direct API calls
- **Response Format**: Standardized flight data with IATA codes

#### Statistics APIs
- `GET /api/stats/daily?airport={code}&date={date}` - Daily statistics
- `GET /api/stats/trends?airport={code}&period={period}` - Trend analysis
- `GET /api/stats/range?airport={code}&from={date}&to={date}` - Range statistics
- **Data Source**: Generated from cached flight data
- **Languages**: All responses in Romanian

#### Admin APIs
- `POST /api/admin/cache-management` - Manual cache refresh
- `GET /api/admin/cache-stats` - Cache statistics
- **Authentication**: admin/FlightSchedule2024!

## 🗂️ STRUCTURA FIȘIERELOR CHEIE

### Core Libraries
- `lib/cacheManager.ts` - Central cache management system
- `lib/persistentFlightCache.ts` - Disk-based flight data storage
- `lib/flightRepository.ts` - Data access layer (cache-only)
- `lib/flightStatisticsService.ts` - Statistics generation service
- `lib/airlineMapping.ts` - Airline code to name mapping

### API Routes
- `app/api/flights/[airport]/[arrivals|departures]/route.ts` - Flight data endpoints
- `app/api/stats/[daily|trends|range]/route.ts` - Statistics endpoints
- `app/api/admin/cache-management/route.ts` - Cache management

### UI Components
- `app/statistici/page.tsx` - Statistics dashboard
- `components/` - Reusable UI components

### Data Files
- `data/cache-data.json` - Main cache storage
- `data/flights_cache.json` - Persistent flight cache
- `data/cache-config.json` - Cache configuration
- `data/request-counter.json` - API request tracking

## 🎯 AEROPORTURI SUPORTATE

### IATA Codes (ONLY - per airport-mapping-rules.md)
```
OTP - București Henri Coandă
BBU - București Băneasa  
CLJ - Cluj-Napoca
TSR - Timișoara
IAS - Iași
CND - Constanța
SBZ - Sibiu
CRA - Craiova
BCM - Bacău (NOT RMN)
BAY - Baia Mare
OMR - Oradea
SCV - Suceava
TGM - Târgu Mureș
ARW - Arad
SUJ - Satu Mare
RMO - Chișinău
```

### Cache Key Format
- **Arrivals**: `{IATA}_arrivals` (e.g., `OTP_arrivals`)
- **Departures**: `{IATA}_departures` (e.g., `CLJ_departures`)
- **Analytics**: `analytics_{IATA}` (e.g., `analytics_OTP`)

## 🔧 CONFIGURARE ȘI MANAGEMENT

### Cache Intervals (Configurable)
- **Flight Data**: 60 minutes (real-time updates)
- **Analytics**: 30 days (generated from cached flight data)
- **Aircraft**: 360 days (rarely changing data)

### Memory Optimization
- **Fixed Issue**: Infinite loop in persistent cache loading (resolved)
- **Current Usage**: ~95MB (down from 2.3GB)
- **Restart Count**: 3 controlled restarts (down from 134)

### Admin Panel Access
- **URL**: `https://anyway.ro/admin`
- **Credentials**: admin / FlightSchedule2024!
- **Features**: Manual cache refresh, statistics view, configuration

## 🚨 REGULI CRITICE

### NEVER DO (per steering rules)
1. **Never use mock/demo/fake data** - Only real API data
2. **Never change IATA codes** - OTP, CLJ, TSR only
3. **Never modify port configurations** - Breaks production
4. **Never create artificial flight data** - Show "no data" instead
5. **Never use English text** - All UI text in Romanian

### ALWAYS DO
1. **Use IATA codes everywhere** - Cache keys, URLs, APIs
2. **Check persistent cache first** - Before making API calls
3. **Generate statistics from real data** - From cached flights only
4. **Handle empty cache gracefully** - Show proper "no data" messages
5. **Follow airport-mapping-rules.md** - For all airport operations

## 📈 PERFORMANCE METRICS

### Current Status (Post-Optimization)
- **Memory Usage**: 95.9MB (96% improvement)
- **Cache Entries**: 31 flight entries in persistent cache
- **API Success Rate**: 100% for cached data
- **Statistics Generation**: Real data from 31 flights
- **UI Response Time**: <200ms for cached data

### Monitoring
- **Request Counter**: Tracks API usage by category
- **Cache Hit Rate**: Monitored via X-Cache-Status headers
- **Error Logging**: Comprehensive error tracking
- **Performance Logs**: Detailed timing information

---

## 📋 INSTRUCȚIUNI DE UTILIZARE

**IMPORTANT**: Înainte de a genera cod nou, citește întotdeauna acest fișier pentru a:

1. **Respecta structura stabilită** - Nu rescrie funcționalități existente
2. **Folosi cache-ul corect** - getCachedDataWithPersistent() pentru flight data
3. **Urma regulile IATA** - Doar coduri IATA, niciodată altele
4. **Genera statistici reale** - Din datele cache-ate, nu mock data
5. **Păstra limba română** - Toate textele în română
6. **Respecta regulile de cache** - Nu crea date false când cache-ul e gol

### Quick Reference Commands
```bash
# Check cache status
curl https://anyway.ro/api/admin/cache-stats

# Manual refresh for OTP
curl -X POST https://anyway.ro/api/admin/cache-management \
  -H "Content-Type: application/json" \
  -d '{"action":"manualRefresh","category":"flightData","identifier":"OTP"}'

# Test flight data API
curl https://anyway.ro/api/flights/OTP/arrivals

# Test statistics API
curl https://anyway.ro/api/stats/daily?airport=OTP&date=2024-12-22
```

**Ultima actualizare**: 22 decembrie 2024
**Versiune**: 1.0 (Post-Memory-Leak-Fix)