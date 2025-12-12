# New API Key Implementation Guide

## 🔑 NEW API KEY
**Key**: `cmj2k38yg0004jy04yemilnaq`  
**Status**: Ready for testing and deployment  
**Provider**: API.Market AeroDataBox  

## 🚀 QUICK DEPLOYMENT

### Connect to server:
```bash
ssh root@23.88.113.154
# Password: FlightSchedule2024!
```

### Test and deploy new API key:
```bash
cd /opt/anyway-flight-schedule
git pull origin main
chmod +x test-new-api-key-2.sh update-api-key.sh
./test-new-api-key-2.sh    # Test the new key
./update-api-key.sh        # Deploy if test passes
```

## 📋 WHAT THE SCRIPTS DO

### 1. `test-new-api-key-2.sh`
- Tests new API key: `cmj2k38yg0004jy04yemilnaq`
- Verifies authentication with API.Market
- Tests multiple Romanian airports (OTP, CLJ, TSR, KIV)
- Tests advanced API endpoints
- Compares with old key performance

### 2. `update-api-key.sh`
- Validates new API key works
- Backs up current configuration
- Updates `.env.local` with new key
- Restarts application
- Tests all API endpoints
- Verifies external website access

## 🎯 EXPECTED RESULTS

After successful deployment:

### ✅ WORKING FEATURES
- **Flight Data Loading**: Real-time flight information
- **All Airports**: OTP, CLJ, TSR, IAS, CND, KIV, etc.
- **Advanced Search**: Flight number search at `/search`
- **API Endpoints**: All `/api/flights/*` and `/api/airports/*`
- **Scheduler**: Automatic data refresh every 10 minutes

### 🌐 TEST URLS
- **Main**: https://anyway.ro
- **OTP Flights**: https://anyway.ro/airport/OTP/arrivals
- **CLJ Flights**: https://anyway.ro/airport/CLJ/departures
- **Search**: https://anyway.ro/search
- **API Test**: https://anyway.ro/api/flights/search?flight=RO123

## 🔍 VERIFICATION STEPS

### 1. Check Browser Console
- No more "Failed to fetch" errors
- Scheduler shows successful API calls
- Flight data loads in real-time

### 2. Test Flight Pages
- Visit: https://anyway.ro/airport/OTP/arrivals
- Should show actual flight data (not cached)
- Status indicators should be accurate

### 3. Test Advanced Features
- Visit: https://anyway.ro/search
- Search for flight number (e.g., "RO123")
- Search routes (e.g., OTP → LHR)

### 4. Monitor Logs
```bash
docker-compose logs flight-schedule -f
```
Should show successful API calls instead of 404 errors.

## 🚨 TROUBLESHOOTING

### If API key test fails:
1. **Check API.Market Dashboard**: https://api.market/dashboard
2. **Verify Subscription**: Ensure AeroDataBox subscription is active
3. **Check Credits**: Verify sufficient API credits available
4. **Wait and Retry**: Sometimes there's propagation delay

### If deployment fails:
1. **Check Logs**: `docker-compose logs flight-schedule --tail=20`
2. **Verify Container**: `docker-compose ps`
3. **Restart Services**: `docker-compose restart`
4. **Rollback**: Restore from `.env.local.backup.*` if needed

### If website still shows old data:
1. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
2. **Check Cache**: API might be serving cached data
3. **Wait**: New data appears within 10 minutes (scheduler interval)

## 📊 MONITORING

### Real-time Monitoring:
```bash
# Application logs
docker-compose logs flight-schedule -f

# Container status
docker-compose ps

# API test
curl https://anyway.ro/api/flights/OTP/arrivals
```

### Success Indicators:
- ✅ HTTP 200 responses from API endpoints
- ✅ `"success":true` in API responses
- ✅ Flight data with recent timestamps
- ✅ No 404 errors in browser console

## 🎉 SUCCESS CRITERIA

After deployment, you should see:

1. **Real Flight Data**: Current flights with accurate times
2. **Live Updates**: Data refreshes automatically
3. **Working Search**: Flight search returns results
4. **No Errors**: Clean browser console
5. **All Features**: Advanced features fully functional

## 🔄 ROLLBACK PLAN

If new API key causes issues:

```bash
cd /opt/anyway-flight-schedule

# Restore old configuration
cp .env.local.backup.* .env.local

# Restart application
docker-compose restart flight-schedule
```

## 📞 SUPPORT INFO

- **Server**: 23.88.113.154
- **User**: root
- **Password**: FlightSchedule2024!
- **Project**: /opt/anyway-flight-schedule
- **Old Key**: cmj2m39qs0001k00404cmwu75 (404 errors)
- **New Key**: cmj2k38yg0004jy04yemilnaq (should work)

## 🎯 FINAL NOTES

This new API key should resolve all the "Failed to fetch" errors and enable:
- ✅ Real-time flight data
- ✅ Advanced search features  
- ✅ All API endpoints working
- ✅ Complete AeroDataBox integration

The implementation includes all advanced features based on the OpenAPI spec, so once the API key is working, you'll have access to the full suite of flight tracking capabilities!