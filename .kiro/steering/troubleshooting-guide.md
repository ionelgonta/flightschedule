---
inclusion: always
---

# Flight Schedule Application - Troubleshooting Guide

## 🚨 CRITICAL SERVER RULES

### **ABSOLUTE RULES - NEVER BREAK THESE:**
1. **NEVER MODIFY PORT CONFIGURATIONS** - Breaks both anyway.ro and victoriaocara.com
2. **NEVER TOUCH NETWORK SETTINGS** - Ports 80, 443 are OFF-LIMITS
3. **ALWAYS CHECK NGINX STATUS** before making changes
4. **Server hostname**: `anyway.ro` (never use IP addresses)
5. **Project path**: `/opt/anyway-flight-schedule`

## 🆘 EMERGENCY SERVER RESTORATION

### If both sites are down (403 errors, not responding):

```bash
# Emergency fix script - save as emergency-fix.sh
#!/bin/bash
echo "=== EMERGENCY SERVER FIX ==="
echo "Stopping conflicting Docker containers..."
docker stop $(docker ps -q) 2>/dev/null
echo "Starting nginx..."
systemctl start nginx
echo "Restarting PM2 processes..."
pm2 restart anyway-ro
pm2 restart victoriaocara
echo "=== STATUS CHECK ==="
systemctl status nginx --no-pager
pm2 list
echo "=== TESTING SITES ==="
curl -I https://anyway.ro
curl -I https://victoriaocara.com
echo "=== FIX COMPLETE ==="
```

### Step-by-step emergency procedure:
1. **Check nginx**: `ssh root@anyway.ro "systemctl status nginx"`
2. **Check port conflicts**: `ssh root@anyway.ro "netstat -tulpn | grep :80"`
3. **Stop Docker containers**: `ssh root@anyway.ro "docker stop $(docker ps -q)"`
4. **Start nginx**: `ssh root@anyway.ro "systemctl start nginx"`
5. **Restart PM2**: `ssh root@anyway.ro "pm2 restart anyway-ro && pm2 restart victoriaocara"`

## 🔧 COMMON ISSUES & SOLUTIONS

### 1. IPv4/IPv6 Connectivity Issue (502 Bad Gateway)

**Symptoms**: Sites return 502 Bad Gateway, nginx running but can't connect to app

**Root Cause**: Next.js binds to IPv6 (:::3000) but nginx connects via IPv4 (127.0.0.1:3000)

**Solution**: Use custom server.js that forces IPv4 binding:
```javascript
const hostname = '0.0.0.0' // Force IPv4 binding
const port = process.env.PORT || 3000
```

### 2. React onClick Errors

**Symptoms**: "Event handlers cannot be passed to Client Component props" on `<tr>` elements

**Root Cause**: Next.js 14 App Router doesn't allow onClick handlers on server-rendered elements

**Solution**: Remove onClick from `<tr>` elements, add 'use client' directive to interactive components

### 3. Cache Analytics Loop

**Symptoms**: Analytics cron job running but no data generated, API counter incrementing

**Root Cause**: Analytics cron generating mock data instead of using cached flight data

**Solution**: Analytics must be generated from real cached flight data:
```typescript
// Get cached flight data
const cachedArrivals = this.getCachedData<any[]>(`${airportCode}_arrivals`) || []
const cachedDepartures = this.getCachedData<any[]>(`${airportCode}_departures`) || []

// Generate real statistics from cached data
const allFlights = [...cachedArrivals, ...cachedDepartures]
if (allFlights.length === 0) {
  return // Skip analytics if no flight data
}
```

### 4. Hydration Errors

**Symptoms**: "Hydration failed" errors in console

**Root Cause**: Server renders different content than client (theme icons, ad banners)

**Solution**: Add mounted state to track hydration:
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

// Render consistent content during SSR
if (!mounted) {
  return <DefaultComponent />
}
```

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Backup current files
- [ ] Check PM2 status: `pm2 list`
- [ ] Verify nginx running: `systemctl status nginx`

### Deployment Steps:
```bash
# 1. Upload files
scp -r ./app ./components ./lib root@anyway.ro:/opt/anyway-flight-schedule/

# 2. Build application
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

# 3. Restart PM2 (NOT nginx unless broken)
ssh root@anyway.ro "pm2 restart anyway-ro"

# 4. Verify both sites
curl -I https://anyway.ro
curl -I https://victoriaocara.com
```

### Post-Deployment Verification:
- [ ] Test local connectivity: `curl -I http://127.0.0.1:3000`
- [ ] Test HTTPS: `curl -I https://anyway.ro`
- [ ] Check PM2 logs: `pm2 logs anyway-ro --lines 20`
- [ ] Verify both sites load in browser

## 🎯 CACHE SYSTEM MANAGEMENT

### Admin Access:
- **URL**: `https://anyway.ro/admin`
- **Username**: `admin`
- **Password**: `FlightSchedule2024!`

### Cache Configuration:
- **Flight Data**: 60 minutes interval (configurable 1-1440 min)
- **Analytics**: 30 days interval (configurable 1-365 days)
- **Aircraft**: 360 days interval (configurable 1-365 days)

### Manual Refresh:
1. Go to Admin → Cache Management
2. Click appropriate "Refresh" button
3. Wait for completion confirmation

### Cache Troubleshooting:
- **No data on site**: Use manual refresh buttons in admin
- **Too many API requests**: Increase cron intervals in config
- **Cache errors**: Check `/opt/anyway-flight-schedule/data/` permissions

## 🚫 CRITICAL DON'TS

1. **NEVER modify docker-compose.yml port mappings**
2. **NEVER change nginx port configurations**
3. **NEVER run Docker containers on ports 80/443**
4. **NEVER use IP addresses** - always use `anyway.ro` hostname
5. **NEVER restart nginx unless it's actually broken**

## 📞 QUICK DIAGNOSTIC COMMANDS

### PowerShell Commands (Windows):
```powershell
# Test site availability
Invoke-WebRequest -Uri "https://anyway.ro" -Method Head
Invoke-WebRequest -Uri "https://victoriaocara.com" -Method Head

# Test API endpoints
Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals" | Select-Object -ExpandProperty Content | ConvertFrom-Json

# Check specific flight data
$response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals"
$data = $response.Content | ConvertFrom-Json
$data.data | Select-Object -First 5 | Format-Table flight_number, @{Name='Origin';Expression={$_.origin.city}}, @{Name='Destination';Expression={$_.destination.city}}, status

# Manual cache refresh (if flight data is empty)
Invoke-WebRequest -Uri "https://anyway.ro/api/admin/cache-management" -Method Post -ContentType "application/json" -Body '{"action":"manualRefresh","category":"flightData","identifier":"OTP"}'

# Refresh all flight data
Invoke-WebRequest -Uri "https://anyway.ro/api/admin/cache-management" -Method Post -ContentType "application/json" -Body '{"action":"manualRefresh","category":"flightData"}'

# Test statistics APIs (should show proper "no data" messages)
$statsResponse = Invoke-WebRequest -Uri "https://anyway.ro/api/statistici-aeroporturi"
$statsData = $statsResponse.Content | ConvertFrom-Json
$statsData.data[0] | Format-List

# Test individual airport statistics
$airportStats = Invoke-WebRequest -Uri "https://anyway.ro/api/aeroport/OTP/statistici"
$airportData = $airportStats.Content | ConvertFrom-Json
$airportData | Format-List
```

### SSH Commands (from PowerShell):
```bash
# Check services status
ssh root@anyway.ro "pm2 list && systemctl status nginx"

# Check port usage
ssh root@anyway.ro "netstat -tulpn | grep -E ':(80|443|3000)'"

# Check nginx config
ssh root@anyway.ro "nginx -t"

# Check logs
ssh root@anyway.ro "pm2 logs anyway-ro --lines 20"
ssh root@anyway.ro "tail -20 /var/log/nginx/error.log"

# Test local connectivity
ssh root@anyway.ro "curl -I http://127.0.0.1:3000"
ssh root@anyway.ro "curl -I https://anyway.ro"
```

## 🎯 WORKING CONFIGURATION

### Current Setup:
- **anyway-ro**: PM2 process on port 3000
- **victoriaocara**: PM2 process on port 3001  
- **nginx**: System nginx on ports 80/443
- **Docker**: Containers stopped (not using ports 80/443)

### File Locations:
- **App Files**: `/opt/anyway-flight-schedule/`
- **Nginx Config**: `/etc/nginx/sites-available/multi-https`
- **Cache Data**: `/opt/anyway-flight-schedule/data/`
- **PM2 Logs**: `/root/.pm2/logs/`

---

**Remember**: The main issue is always Docker containers conflicting with nginx on ports 80/443. Stop Docker, start nginx, restart PM2. Never modify port configurations.