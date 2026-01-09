# Airport Mapping Rules - Flight Schedule Application

## 🚨 CRITICAL AIRPORT MAPPING RULES

### **ABSOLUTE RULES - NEVER CHANGE THESE:**
1. **IATA codes ONLY** - OTP, CLJ, TSR everywhere
2. **Cache uses IATA keys** - `OTP_arrivals`, `CLJ_departures`
3. **URLs use IATA codes** - `/aeroport/OTP`, `/flights/CLJ/arrivals`
4. **APIs use IATA codes** - All external API calls with IATA

## 📋 AIRPORT LIST (NEVER MODIFY)

### **Supported Airports:**
```
IATA → City (Cache/Statistics - România și Moldova)
OTP  → București (Henri Coandă)
BBU  → București (Aurel Vlaicu)
CLJ  → Cluj-Napoca
TSR  → Timișoara
IAS  → Iași
CND  → Constanța
SBZ  → Sibiu
CRA  → Craiova
BCM  → Bacău
BAY  → Oradea
OMR  → Oradea
SCV  → Suceava
TGM  → Târgu Mureș
ARW  → Arad
SUJ  → Satu Mare
GHV  → Brașov
RMO  → Chișinău

International Airports (Doar pentru denumiri în baza de date):
TKU  → Turku
SUF  → Lamezia Terme
RIX  → Riga
HRG  → Hurghada
LUX  → Luxembourg
```

## 🔄 FLOW LOGIC (FIXED)

### **API Request Flow:**
1. **User requests**: `/api/flights/OTP/arrivals`
2. **Cache lookup**: `OTP_arrivals`
3. **API calls**: Use OTP directly
4. **Response shows**: `airport_code: "OTP"`

### **Cache Population Flow:**
1. **Cron job runs**: For all IATA codes (OTP, CLJ, etc.)
2. **API calls made**: To external APIs with IATA codes
3. **Cache stored**: `OTP_arrivals`, `CLJ_departures`
4. **Data structure**: Real flight data from APIs

## 🚫 FORBIDDEN CHANGES

1. **NEVER use other code standards**
2. **NEVER change** cache key format (`{IATA}_{type}`)
3. **NEVER hardcode** airport codes outside mapping file
4. **NEVER bypass** validation functions

## ✅ REQUIRED FUNCTIONS (DO NOT MODIFY)

### **Validation Functions:**
- `isAirportSupported(code)` - Validates IATA codes
- `getAirportInfo(code)` - Gets complete airport data

### **Cache Key Generation:**
```typescript
// CORRECT - Always use IATA for cache keys
const cacheKey = `${iataCode}_${type}` // OTP_arrivals

// WRONG - Never use other formats
const cacheKey = `${otherCode}_${type}` // ❌
```

## 🎯 DEBUGGING CHECKLIST

### **If flights don't show:**
1. ✅ Check URL uses IATA: `/flights/OTP/arrivals`
2. ✅ Check cache key: `OTP_arrivals`
3. ✅ Check cache data: `"data": [...]` (may be empty if no flights)
4. ✅ Check API calls made with IATA codes

### **Cache Key Verification:**
```bash
# Check available cache keys
grep -o '"key":"[^"]*"' data/cache-data.json

# Should show: OTP_arrivals, CLJ_departures, TSR_arrivals, etc.
```

## 📊 CURRENT STATUS VERIFICATION

### **Working Flow:**
1. ✅ **Airport list exists**: All 22 airports supported
2. ✅ **Cache populated**: API requests made
3. ✅ **Keys correct**: `OTP_arrivals` format
4. ✅ **Data structure**: Real API responses (may be empty arrays)

### **Empty Data Explanation:**
- `"data": []` means API returned no flights (normal)
- `"success": true` means API call succeeded
- `"source": "cron"` means data from real API calls
- This is CORRECT behavior when no flights exist

---

**REMEMBER**: Use IATA codes ONLY everywhere. No other code standards allowed.