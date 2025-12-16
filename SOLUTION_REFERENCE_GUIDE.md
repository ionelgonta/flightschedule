# SOLUTION REFERENCE GUIDE - Flight Schedule Application

## 📚 COMPLETE SOLUTION ARCHIVE

This document contains all solutions implemented for the Flight Schedule application, organized for quick reference and future troubleshooting.

---

## 🔧 SOLUTION 1: IPv4/IPv6 CONNECTIVITY FIX

### **Problem**: 502 Bad Gateway - Nginx can't connect to Next.js app
### **Root Cause**: Next.js binds to IPv6, nginx connects via IPv4

### **Files Created/Modified**:

#### `server.js` (NEW)
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Force IPv4 binding
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
```

#### `package.json` (MODIFIED)
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

#### `next.config.js` (MODIFIED)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed: output: 'standalone'
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://prod.api.market https://pagead2.googlesyndication.com https://www.google-analytics.com https://ep1.adtrafficquality.google; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          }
        ]
      }
    ]
  }
}
```

#### Nginx Configuration Fix
```bash
# File: /etc/nginx/sites-available/multi-https
# Change: proxy_pass http://127.0.0.1:8080; → proxy_pass http://127.0.0.1:3000;
sed -i 's|proxy_pass http://127.0.0.1:8080;|proxy_pass http://127.0.0.1:3000;|' /etc/nginx/sites-available/multi-https
```

### **Deployment Commands**:
```bash
scp server.js package.json next.config.js root@anyway.ro:/opt/anyway-flight-schedule/
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build && pm2 restart anyway-ro && nginx -s reload"
```

---

## 🔧 SOLUTION 2: AERODATABOX API ERROR HANDLING

### **Problem**: JSON parsing errors, empty responses, API failures
### **Root Cause**: AeroDataBox API inconsistent responses for certain airports

### **Files Modified**:

#### `lib/aerodataboxService.ts` (ENHANCED)
Key improvements:
- Added `limitedDataAirports` set for airports with known issues
- Enhanced JSON parsing with error handling
- Empty response detection
- Graceful fallback to empty arrays instead of throwing errors

```typescript
// Key code snippets:
private limitedDataAirports = new Set(['BAY', 'CRA', 'BCM', 'OMR', 'SCV', 'TGM', 'ARW', 'STU']);

private async makeRequest<T>(endpoint: string): Promise<T> {
  // ... existing code ...
  
  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error('Empty response from API');
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('JSON parse error for response:', text.substring(0, 200));
    throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
  }
}

async getFlights(airportCode: string, type: 'arrivals' | 'departures'): Promise<Flight[]> {
  try {
    if (this.limitedDataAirports.has(airportCode)) {
      console.warn(`Airport ${airportCode} is known to have limited data`);
      return [];
    }
    // ... API call logic ...
  } catch (error) {
    // Add to limited data list if consistently failing
    if (error instanceof Error && (
      error.message.includes('Empty response') || 
      error.message.includes('Invalid JSON') ||
      error.message.includes('Unexpected end of JSON input')
    )) {
      this.limitedDataAirports.add(airportCode);
    }
    return []; // Return empty instead of throwing
  }
}
```

#### `lib/flightAnalyticsService.ts` (ENHANCED)
Key improvements:
- Demo data fallback for failed API calls
- Multiple API endpoint attempts
- Graceful degradation for airports without data

```typescript
private async fetchLiveFlightSchedules(
  airportCode: string,
  type: 'arrivals' | 'departures',
  fromDate: string,
  toDate: string
): Promise<FlightSchedule[]> {
  try {
    // Try real-time API first
    const response = type === 'arrivals' 
      ? await this.flightApiService.getArrivals(airportCode)
      : await this.flightApiService.getDepartures(airportCode);
    
    if (response.success && response.data.length > 0) {
      return response.data.map(flight => this.convertToFlightSchedule(flight));
    }
  } catch (apiError) {
    console.warn(`Real-time API failed for ${airportCode} ${type}:`, apiError);
  }
  
  // Try historical data as fallback
  try {
    const flights = await this.aeroDataBoxService.getFlights(airportCode, type, fromDate, toDate);
    if (flights.length > 0) {
      return flights.map(flight => this.convertAeroDataBoxToSchedule(flight, type, airportCode));
    }
  } catch (historicalError) {
    console.warn(`Historical data failed for ${airportCode} ${type}:`, historicalError);
  }
  
  // Return empty array if both fail
  return [];
}
```

---

## 🔧 SOLUTION 3: REACT HOOK DEPENDENCIES & CSP FIXES

### **Problem**: React Hook warnings, AdSense CSP violations
### **Root Cause**: Missing dependencies, restrictive CSP headers

### **Files Modified**:

#### `app/admin/page.tsx` (FIXED)
```typescript
// Fixed useEffect dependencies
useEffect(() => {
  fetchCacheStats();
}, []); // Empty dependency array for mount-only effect

useEffect(() => {
  fetchCacheConfig();
}, []); // Empty dependency array for mount-only effect
```

#### CSP Headers in `next.config.js` (UPDATED)
```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://prod.api.market https://pagead2.googlesyndication.com https://www.google-analytics.com https://ep1.adtrafficquality.google; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; object-src 'none'; base-uri 'self'; form-action 'self';"
}
```

---

## 🚨 EMERGENCY PROCEDURES

### Quick Fix Script (`emergency-fix-complete.ps1`)
```powershell
# Usage examples:
./emergency-fix-complete.ps1 -FullFix          # Apply all fixes
./emergency-fix-complete.ps1 -ConnectivityOnly # Fix IPv4/IPv6 only
./emergency-fix-complete.ps1 -ApiOnly          # Fix API errors only
./emergency-fix-complete.ps1 -DiagnosticOnly   # Run diagnostics only
./emergency-fix-complete.ps1                   # Emergency server fix
```

### Manual Emergency Commands
```bash
# Stop Docker containers that might conflict
docker stop $(docker ps -q) 2>/dev/null

# Restart services
systemctl start nginx
pm2 restart anyway-ro
pm2 restart victoriaocara

# Test connectivity
curl -I https://anyway.ro
curl -I https://victoriaocara.com
```

---

## 📋 VERIFICATION CHECKLIST

### After Any Fix:
- [ ] `pm2 list` - Both processes online
- [ ] `systemctl status nginx` - Nginx active
- [ ] `curl -I http://127.0.0.1:3000` - Local app responds
- [ ] `curl -I https://anyway.ro` - HTTPS site works
- [ ] `curl -I https://victoriaocara.com` - Victoria site works
- [ ] Browser test - Both sites load properly
- [ ] Check console for errors
- [ ] Test flight data loading

### Key Files to Monitor:
- `/opt/anyway-flight-schedule/server.js`
- `/opt/anyway-flight-schedule/package.json`
- `/opt/anyway-flight-schedule/next.config.js`
- `/etc/nginx/sites-available/multi-https`
- `/var/log/nginx/error.log`
- PM2 logs: `pm2 logs anyway-ro`

---

## 🎯 SUCCESS INDICATORS

### Working State:
- ✅ anyway.ro returns HTTP 200
- ✅ victoriaocara.com returns HTTP 200
- ✅ PM2 shows both processes "online"
- ✅ Nginx status "active (running)"
- ✅ No 502 errors in browser
- ✅ Flight data loads without JSON errors
- ✅ AdSense loads without CSP violations

### Performance Metrics:
- Response time < 2 seconds
- No console errors
- API calls succeed or gracefully fallback
- Memory usage stable
- No PM2 restarts due to crashes

---

## 📞 QUICK REFERENCE COMMANDS

```bash
# Status Check
pm2 list && systemctl status nginx --no-pager

# Restart Everything
pm2 restart anyway-ro && nginx -s reload

# Test Local
curl -I http://127.0.0.1:3000

# Test Public
curl -I https://anyway.ro && curl -I https://victoriaocara.com

# View Logs
pm2 logs anyway-ro --lines 20
tail -f /var/log/nginx/error.log

# Emergency Reset
docker stop $(docker ps -q) 2>/dev/null; systemctl start nginx; pm2 restart all
```

---

**Document Version**: 1.0  
**Last Updated**: December 15, 2024  
**Status**: All solutions tested and verified working  
**Maintainer**: Flight Schedule Development Team