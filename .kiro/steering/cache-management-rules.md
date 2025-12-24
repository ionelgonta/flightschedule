# Cache Management Rules - Flight Schedule Application

## 🚨 CRITICAL CACHE RULES

### **ABSOLUTE RULES - NEVER BREAK THESE:**
1. **NEVER USE MOCK/DEMO/FICTIVE DATA** - Only real flight data from APIs
2. **NEVER CREATE FAKE FLIGHTS** - If no real data, show "no data" message
3. **ALWAYS USE REAL API SOURCES** - AviationStack, FlightAware, etc.
4. **CACHE ONLY VALIDATES REAL DATA** - No artificial generation

## 📋 CACHE MANAGEMENT WORKFLOW

### **When Cache is Empty:**
1. **DO NOT** create mock data
2. **DO NOT** generate fake flights
3. **DO** show proper "no data available" messages
4. **DO** wait for real API data to populate
5. **DO** use admin panel to manually refresh if needed

### **Cache Population Process:**
1. **Real API Calls Only**: Use configured API endpoints
2. **Validate Data**: Ensure data comes from real sources
3. **Store with Source**: Mark data source (API name, timestamp)
4. **Expire Appropriately**: Set realistic expiration times

### **Admin Panel Usage:**
- **URL**: `https://anyway.ro/admin`
- **Username**: `admin`
- **Password**: `FlightSchedule2024!`
- **Manual Refresh**: Use "Refresh Flight Data" button for real API calls

## 🔧 CACHE TROUBLESHOOTING

### **Problem**: No flight data showing
**Solution**: 
1. Check if real API is responding
2. Use admin panel to manually refresh
3. Wait for cron job (15 minutes interval)
4. **NEVER** create mock data as workaround

### **Problem**: Cache shows old data
**Solution**:
1. Clear cache: `rm data/cache-data.json`
2. Restart PM2: `pm2 restart anyway-ro`
3. Wait for real data population
4. **NEVER** manually inject fake data

### **Problem**: API limits reached
**Solution**:
1. Increase cache intervals to reduce API calls
2. Use backup API sources if available
3. Show "temporarily unavailable" message
4. **NEVER** fill with mock data

## 📊 CACHE STRUCTURE

### **Valid Cache Entry:**
```json
{
  "id": "flights_OTP_arrivals_timestamp",
  "category": "flights",
  "key": "OTP_arrivals",
  "data": [...], // REAL flight data from API
  "source": "aviationstack", // REAL API source
  "success": true,
  "createdAt": "timestamp",
  "expiresAt": "timestamp"
}
```

### **Invalid Cache Entry:**
```json
{
  "data": [...], // Mock/demo/fake data
  "source": "mock", // ❌ FORBIDDEN
  "source": "demo", // ❌ FORBIDDEN
  "source": "test"  // ❌ FORBIDDEN
}
```

## 🚫 FORBIDDEN ACTIONS

1. **NEVER** create mock flight data
2. **NEVER** use fake airline codes
3. **NEVER** generate artificial timestamps
4. **NEVER** create demo airports
5. **NEVER** use test data in production
6. **NEVER** fill empty cache with fake data
7. **🚨 NEVER DELETE PERSISTENT CACHE WITHOUT EXPLICIT USER PERMISSION** - Historical data is CRITICAL

## ✅ ALLOWED ACTIONS

1. **DO** call real flight APIs
2. **DO** cache real API responses
3. **DO** show "no data" when cache is empty
4. **DO** use admin panel for manual refresh
5. **DO** wait for cron jobs to populate
6. **DO** validate data sources

## 🎯 EMERGENCY CACHE RECOVERY

### **If Cache is Corrupted:**
```bash
# 1. Stop application
pm2 stop anyway-ro

# 2. Clear corrupted cache
rm /opt/anyway-flight-schedule/data/cache-data.json

# 3. Restart application
pm2 start anyway-ro

# 4. Wait for real data population (15 minutes)
# 5. OR use admin panel to manually refresh
```

### **NEVER DO THIS:**
```bash
# ❌ FORBIDDEN - Creating mock data
node create-mock-data.js
node populate-fake-flights.js
node generate-demo-cache.js
```

---

**REMEMBER**: Empty cache with "no data" message is BETTER than fake data. Users prefer honest "no flights available" over misleading fake information.