# COMPLETE TROUBLESHOOTING GUIDE - Flight Schedule Application

## 🚨 CRITICAL SERVER ISSUES & SOLUTIONS

### 1. IPv4/IPv6 CONNECTIVITY ISSUE (502 Bad Gateway)

#### **SYMPTOMS**
- Sites return 502 Bad Gateway errors
- Nginx is running but can't connect to application
- App works on localhost but not through nginx proxy

#### **ROOT CAUSE**
Next.js default server binds to IPv6 (:::3000) but nginx tries to connect via IPv4 (127.0.0.1:3000)

#### **SOLUTION FILES**

**A. Custom Server (`server.js`)**
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

**B. Package.json Update**
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

**C. Next.js Config (`next.config.js`)**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'standalone' to allow custom server
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // ... rest of config
}
```

#### **DEPLOYMENT STEPS**
```bash
# 1. Upload files to server
scp server.js package.json next.config.js root@anyway.ro:/opt/anyway-flight-schedule/

# 2. Build application
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

# 3. Update nginx configuration (check active config file)
ssh root@anyway.ro "grep -r 'anyway.ro' /etc/nginx/sites-enabled/"

# 4. Fix nginx proxy_pass to correct port
ssh root@anyway.ro "sed -i 's|proxy_pass http://127.0.0.1:8080;|proxy_pass http://127.0.0.1:3000;|' /etc/nginx/sites-available/multi-https"

# 5. Restart services
ssh root@anyway.ro "pm2 restart anyway-ro && nginx -s reload"
```

#### **VERIFICATION**
```bash
# Test local connectivity
curl -I http://127.0.0.1:3000
# Expected: HTTP/1.1 200 OK

# Test HTTPS site
curl -I https://anyway.ro
# Expected: HTTP/2 200 OK
```

---

### 2. AERODATABOX API JSON PARSING ERRORS

#### **SYMPTOMS**
- "SyntaxError: Unexpected end of JSON input"
- "Empty response from API"
- Flights not loading for certain airports

#### **ROOT CAUSE**
- AeroDataBox API returns empty responses for some airports
- JSON parsing fails on malformed responses
- IPv4/IPv6 connectivity issues with API calls

#### **SOLUTION FILES**

**A. Enhanced AeroDataBox Service (`lib/aerodataboxService.ts`)**
```typescript
// Key improvements:
private limitedDataAirports = new Set(['BAY', 'CRA', 'BCM', 'OMR', 'SCV', 'TGM', 'ARW', 'STU']);

private async makeRequest<T>(endpoint: string): Promise<T> {
  // ... existing code ...
  
  // Check if response has content
  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error('Empty response from API');
  }

  // Try to parse JSON with error handling
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('JSON parse error for response:', text.substring(0, 200));
    throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
  }
}

async getFlights(airportCode: string, type: 'arrivals' | 'departures'): Promise<Flight[]> {
  try {
    // Check if this airport is known to have limited data
    if (this.limitedDataAirports.has(airportCode)) {
      console.warn(`Airport ${airportCode} is known to have limited data in AeroDataBox API`);
      return [];
    }
    
    // ... API call logic ...
    
  } catch (error) {
    console.error(`Failed to get ${type} for airport ${airportCode}:`, error);
    
    // Add airport to limited data list if it consistently fails
    if (error instanceof Error && (
      error.message.includes('Empty response') || 
      error.message.includes('Invalid JSON') ||
      error.message.includes('Unexpected end of JSON input')
    )) {
      console.warn(`Adding ${airportCode} to limited data airports list due to API issues`);
      this.limitedDataAirports.add(airportCode);
    }
    
    // Return empty array instead of throwing
    return [];
  }
}
```

**B. Enhanced Flight Analytics Service (`lib/flightAnalyticsService.ts`)**
```typescript
// Demo data fallback for failed API calls
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
  console.warn(`No flight data available for ${airportCode} ${type} from ${fromDate} to ${toDate}`);
  return [];
}
```

---

### 3. REACT HYDRATION ERROR (Theme Icons)

#### **SYMPTOMS**
- "Hydration failed because the initial UI does not match what was rendered on the server"
- "Expected server HTML to contain a matching <circle> in <svg>"
- Console errors about DOM structure mismatches

#### **ROOT CAUSE**
Server renders default theme icon, client renders stored theme icon, causing hydration mismatch

#### **SOLUTION FILES**

**A. Enhanced ThemeProvider (`components/ThemeProvider.tsx`)**
```typescript
// Add mounted state to track hydration
const [theme, setTheme] = useState<Theme>(defaultTheme)
const [mounted, setMounted] = useState(false)

// Initialize theme from localStorage after component mounts
useEffect(() => {
  const storedTheme = localStorage.getItem(storageKey) as Theme
  if (storedTheme) {
    setTheme(storedTheme)
  }
  setMounted(true)
}, [storageKey])

// Updated context value
const value = {
  theme,
  mounted, // NEW: Track hydration state
  setTheme: (theme: Theme) => {
    localStorage.setItem(storageKey, theme)
    setTheme(theme)
  },
}
```

**B. Fixed Navbar Component (`components/Navbar.tsx`)**
```typescript
// Hydration-safe icon rendering
{mounted ? (
  theme === 'dark' ? (
    <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
  ) : (
    <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
  )
) : (
  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
)}
```

#### **DEPLOYMENT STEPS**
```bash
# Upload fixed components
scp components/ThemeProvider.tsx components/Navbar.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/

# Build and restart
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build && pm2 restart anyway-ro"
```

---

### 4. ADBANNER HYDRATION ERROR (ClassName Mismatch)

#### **SYMPTOMS**
- "Warning: Prop `className` did not match. Server: 'ad-banner adsense-banner' Client: 'ad-banner demo-banner'"
- Console errors about className mismatches in AdBanner components

#### **ROOT CAUSE**
Server renders AdSense banner className, client renders demo banner className based on localStorage

#### **SOLUTION FILES**

**Enhanced AdBanner Component (`components/ads/AdBanner.tsx`)**
```typescript
// Add mounted state to track hydration
const [mounted, setMounted] = useState(false)

useEffect(() => {
  // Safe localStorage access after mounting
  const demoEnabled = localStorage.getItem('demoAdsEnabled')
  if (demoEnabled === 'true') {
    setConfig({
      ...adConfig.zones[slot],
      mode: 'demo' as any
    })
  }
  setMounted(true) // Mark as mounted
}, [slot])

// During SSR or before mounting, always render AdSense banner
if (!mounted) {
  return (
    <div className={`ad-banner adsense-banner ${className}`}>
      <ins className="adsbygoogle" /* AdSense config */ />
    </div>
  )
}

// After mounting, check for demo mode
if ((config.mode as any) === 'demo') {
  return (
    <div className={`ad-banner demo-banner ${className}`}>
      {/* Demo content */}
    </div>
  )
}
```

#### **DEPLOYMENT STEPS**
```bash
# Upload fixed component
scp components/ads/AdBanner.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/ads/

# Build and restart
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build && pm2 restart anyway-ro"
```

---

### 5. REACT HOOK DEPENDENCIES & CSP VIOLATIONS

#### **SYMPTOMS**
- React Hook warnings in console
- AdSense not loading due to CSP violations
- Build warnings about missing dependencies

#### **SOLUTION**
**A. Fixed React Hooks in Admin Page (`app/admin/page.tsx`)**
```typescript
// Fixed useEffect dependencies
useEffect(() => {
  fetchCacheStats();
}, []); // Empty dependency array for mount-only effect

useEffect(() => {
  fetchCacheConfig();
}, []); // Empty dependency array for mount-only effect
```

**B. Updated CSP Headers (`next.config.js`)**
```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://prod.api.market https://pagead2.googlesyndication.com https://www.google-analytics.com https://ep1.adtrafficquality.google; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; object-src 'none'; base-uri 'self'; form-action 'self';"
}
```

---

## 🔧 EMERGENCY PROCEDURES

### Quick Fix Script
```bash
#!/bin/bash
echo "=== EMERGENCY SERVER FIX ==="

# Stop conflicting Docker containers
echo "Stopping conflicting Docker containers..."
docker stop $(docker ps -q) 2>/dev/null

# Start nginx
echo "Starting nginx..."
systemctl start nginx

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart anyway-ro
pm2 restart victoriaocara

# Check status
echo "=== STATUS CHECK ==="
systemctl status nginx --no-pager
pm2 list

# Test sites
echo "=== TESTING SITES ==="
curl -I https://anyway.ro
curl -I https://victoriaocara.com

echo "=== FIX COMPLETE ==="
```

### Diagnostic Commands
```bash
# Check PM2 processes
pm2 list
pm2 logs anyway-ro --lines 20

# Check nginx status
systemctl status nginx
nginx -t

# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Check nginx configuration
grep -r "anyway.ro" /etc/nginx/sites-enabled/
grep -r "proxy_pass" /etc/nginx/sites-available/

# Test local connectivity
curl -I http://127.0.0.1:3000
curl -H 'Host: anyway.ro' http://127.0.0.1:3000

# Check logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Backup current configuration files
- [ ] Check PM2 process status
- [ ] Verify nginx is running
- [ ] Test current site functionality

### Deployment Steps
- [ ] Upload updated files to `/opt/anyway-flight-schedule/`
- [ ] Run `npm run build`
- [ ] Update nginx configuration if needed
- [ ] Restart PM2: `pm2 restart anyway-ro`
- [ ] Reload nginx: `nginx -s reload`

### Post-Deployment Verification
- [ ] Check PM2 status: `pm2 list`
- [ ] Test local connectivity: `curl -I http://127.0.0.1:3000`
- [ ] Test HTTPS: `curl -I https://anyway.ro`
- [ ] Test external access from browser
- [ ] Check both anyway.ro and victoriaocara.com
- [ ] Monitor logs for errors

---

## 🚫 CRITICAL DON'TS

1. **NEVER modify port configurations** - This breaks both sites
2. **NEVER touch network settings** - Ports 80, 443 are off-limits
3. **NEVER run Docker containers on ports 80/443** - Conflicts with nginx
4. **NEVER modify nginx without testing** - Always run `nginx -t` first
5. **NEVER restart nginx unless necessary** - Only restart if broken

---

## 📞 QUICK REFERENCE

### File Locations
- **App Files**: `/opt/anyway-flight-schedule/`
- **Nginx Config**: `/etc/nginx/sites-available/multi-https`
- **PM2 Logs**: `/root/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`

### Key Commands
- **Restart App**: `pm2 restart anyway-ro`
- **Reload Nginx**: `nginx -s reload`
- **Test Nginx**: `nginx -t`
- **Check Status**: `pm2 list && systemctl status nginx`

### Working Configuration
- **anyway-ro**: PM2 process running on port 3000
- **victoriaocara**: PM2 process running on port 3001
- **nginx**: Proxying HTTPS to local apps
- **Custom server**: Forces IPv4 binding for compatibility

---

**Last Updated**: December 15, 2024  
**Status**: All issues resolved, both sites operational