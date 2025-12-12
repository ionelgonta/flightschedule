# Quick Deploy Commands - anyway.ro Flight Schedule

## 🚨 CRITICAL ISSUES IDENTIFIED

Based on the logs and context, here are the main issues:

1. **API Key Invalid**: `cmj2m39qs0001k00404cmwu75` returns 404 errors
2. **Docker Container Issues**: App service not running properly  
3. **Wrong Website**: Victoria Ocara loading instead of flight schedule

## 🔧 IMMEDIATE FIX COMMANDS

### Connect to Server
```bash
ssh root@23.88.113.154
# Password: FlightSchedule2024!
```

### Navigate to Project
```bash
cd /opt/anyway-flight-schedule
```

### Run Debug Script
```bash
chmod +x debug-api.sh
./debug-api.sh
```

### Run Complete Fix
```bash
chmod +x deploy-final.sh
./deploy-final.sh
```

## 🔑 API KEY TROUBLESHOOTING

### Current API Key Status
- **Key**: `cmj2m39qs0001k00404cmwu75`
- **Status**: Returning 404 errors (likely invalid/expired)
- **Provider**: API.Market AeroDataBox

### Fix API Key
1. **Visit API.Market Dashboard**: https://api.market/dashboard
2. **Check Subscription**: Verify it's active and has credits
3. **Generate New Key**: If current key is invalid
4. **Update Server Configuration**:
   ```bash
   cd /opt/anyway-flight-schedule
   nano .env.local
   # Update NEXT_PUBLIC_FLIGHT_API_KEY=NEW_KEY_HERE
   docker-compose restart
   ```

### Test API Key Manually
```bash
# Test current key
curl -H "x-magicapi-key: cmj2m39qs0001k00404cmwu75" \
  "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"

# Should return HTTP 200 with flight data
# If 404/401 = key is invalid
# If 429 = rate limit exceeded
```

## 🐳 DOCKER TROUBLESHOOTING

### Check Container Status
```bash
cd /opt/anyway-flight-schedule
docker-compose ps
```

### Restart All Services
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Logs
```bash
# App logs
docker-compose logs app -f

# Nginx logs  
docker-compose logs nginx -f

# All logs
docker-compose logs -f
```

### Force Rebuild
```bash
docker-compose down --volumes --remove-orphans
docker system prune -f
docker-compose build --no-cache --parallel
docker-compose up -d
```

## 🌐 WEBSITE ROUTING ISSUES

### Check Nginx Configuration
```bash
cat nginx.conf | grep -A 10 -B 10 "anyway.ro"
```

### Verify Port Mapping
```bash
# Should show flight-schedule-app on port 3000
docker-compose ps

# Test local access
curl http://localhost:3000
curl http://localhost:3000/api/flights/OTP/arrivals
```

### Fix Domain Routing
If Victoria Ocara site is loading instead:
```bash
# Check nginx config for correct proxy_pass
grep -n "proxy_pass" nginx.conf

# Should point to flight-schedule:3000 for anyway.ro
# Restart nginx after changes
docker-compose restart nginx
```

## 🧪 TESTING COMMANDS

### Test Local Endpoints
```bash
# Main app
curl http://localhost:3000

# API endpoints
curl http://localhost:3000/api/flights/OTP/arrivals
curl http://localhost:3000/api/flights/CLJ/departures
curl http://localhost:3000/api/flights/TSR/arrivals

# Flight pages
curl http://localhost:3000/airport/OTP
curl http://localhost:3000/airport/OTP/arrivals
```

### Test External URLs
```bash
# Main site
curl -I https://anyway.ro

# Flight pages
curl -I https://anyway.ro/airport/OTP/arrivals
curl -I https://anyway.ro/airport/CLJ/departures

# Admin panel
curl -I https://anyway.ro/admin
```

## 📊 MONITORING COMMANDS

### Real-time Logs
```bash
# Watch app logs
docker-compose logs app -f --tail=50

# Watch all logs
docker-compose logs -f --tail=20
```

### System Status
```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Disk space
df -h
```

### Application Health
```bash
# Check if scheduler is running
curl http://localhost:3000/api/flights/OTP/arrivals | jq '.cached'

# Check cache stats (in browser console)
# Should show cache hits/misses
```

## 🎯 SUCCESS CRITERIA

After deployment, verify:

1. **✅ Containers Running**:
   ```bash
   docker-compose ps
   # Should show both flight-schedule-app and flight-schedule-nginx as "Up"
   ```

2. **✅ API Working**:
   ```bash
   curl http://localhost:3000/api/flights/OTP/arrivals
   # Should return {"success":true,"data":[...]}
   ```

3. **✅ Website Accessible**:
   - https://anyway.ro (main page)
   - https://anyway.ro/airport/OTP/arrivals (flight data)
   - https://anyway.ro/admin (admin panel)

4. **✅ Flight Data Loading**:
   - Visit flight pages in browser
   - Check for flight cards/tables
   - No "Failed to fetch" errors in console

## 🆘 EMERGENCY ROLLBACK

If deployment fails completely:
```bash
cd /opt/anyway-flight-schedule
docker-compose down

# Restore from backup
cd ..
cp -r anyway-backup-YYYYMMDD-HHMMSS/* anyway-flight-schedule/
cd anyway-flight-schedule

# Start old version
docker-compose up -d
```

## 📞 SUPPORT INFORMATION

- **Server**: 23.88.113.154
- **User**: root
- **Password**: FlightSchedule2024!
- **Project Path**: /opt/anyway-flight-schedule
- **Domain**: anyway.ro
- **Admin Password**: admin123

## 🔗 USEFUL LINKS

- **API.Market Dashboard**: https://api.market/dashboard
- **Live Website**: https://anyway.ro
- **Admin Panel**: https://anyway.ro/admin
- **OTP Flights**: https://anyway.ro/airport/OTP/arrivals
- **CLJ Flights**: https://anyway.ro/airport/CLJ/departures