# 🚀 Server Update Guide - New API Key Deployment

## 📋 Update Summary

**Obiectiv:** Deploy noul API key `cmj2m39qs0001k00404cmwu75` pe serverul anyway.ro

**Server Details:**
- **IP:** 23.88.113.154
- **User:** root
- **Password:** FlightSchedule2024!
- **Project Path:** /opt/anyway-flight-schedule

## 🔄 Method 1: Automated Update (Recommended)

### Step 1: Connect to Server

```bash
# Conectare SSH
ssh root@23.88.113.154
# Password: FlightSchedule2024!
```

### Step 2: Navigate to Project

```bash
cd /opt/anyway-flight-schedule
```

### Step 3: Run Automated Update

```bash
# Make script executable
chmod +x server-update.sh

# Run update script
./server-update.sh
```

Scriptul va face automat:
- ✅ Backup current deployment
- ✅ Pull latest code from Git
- ✅ Update .env.local with new API key
- ✅ Test API key functionality
- ✅ Rebuild Docker containers
- ✅ Restart services
- ✅ Verify deployment

## 🔧 Method 2: Manual Update

Dacă scriptul automat nu funcționează:

### Step 1: Backup & Update Code

```bash
# Conectare la server
ssh root@23.88.113.154
cd /opt/anyway-flight-schedule

# Backup
cp -r . ../anyway-backup-$(date +%Y%m%d-%H%M%S)

# Update code
git pull origin main
```

### Step 2: Update Environment Configuration

```bash
# Creează/editează .env.local
nano .env.local
```

Conținut pentru .env.local:
```bash
# API.Market Configuration - Updated API Key
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2m39qs0001k00404cmwu75
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_DEBUG_FLIGHTS=false
```

### Step 3: Test New API Key

```bash
# Test manual API key
curl -H "x-magicapi-key: cmj2m39qs0001k00404cmwu75" \
     "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"
```

Răspuns așteptat:
- **HTTP 200:** ✅ API key funcționează
- **HTTP 401:** ❌ API key invalid
- **HTTP 404:** ⚠️ Nu sunt date (normal pentru unele aeroporturi)

### Step 4: Rebuild & Restart

```bash
# Stop services
docker-compose down

# Rebuild with new config
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs app --tail=20
```

### Step 5: Verify Deployment

```bash
# Test API endpoints
curl "http://localhost:3000/api/flights/OTP/arrivals"
curl "http://localhost:3000/api/flights/CLJ/departures"

# Test website
curl -I "http://localhost:3000"
```

## 🧪 Testing After Update

### 1. Website Testing

Accesează în browser:
- **Main Site:** https://anyway.ro
- **OTP Arrivals:** https://anyway.ro/airport/OTP/arrivals
- **CLJ Departures:** https://anyway.ro/airport/CLJ/departures
- **TSR Arrivals:** https://anyway.ro/airport/TSR/arrivals
- **Admin Panel:** https://anyway.ro/admin (password: admin123)

### 2. Verifică Flight Data Loading

Pe paginile de zboruri:
- ✅ Se încarcă lista de zboruri
- ✅ Nu sunt erori în browser console (F12)
- ✅ Datele se actualizează automat
- ✅ Căutarea și filtrarea funcționează

### 3. Check Logs

```bash
# Monitor logs în timp real
docker-compose logs app -f

# Caută erori
docker-compose logs app | grep -i error

# Caută API calls
docker-compose logs app | grep -i "api\|flight"
```

## 🔍 Troubleshooting

### Problem: API Key Returns 404

**Cauze:**
- API key expirat sau invalid
- Credite insuficiente în API.Market
- Probleme temporare cu API

**Soluții:**
```bash
# 1. Verifică API.Market dashboard
# Accesează: https://api.market/dashboard

# 2. Test manual API key
curl -H "x-magicapi-key: cmj2m39qs0001k00404cmwu75" \
     "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"

# 3. Dacă API key nu funcționează, înlocuiește în .env.local
nano .env.local
# Schimbă NEXT_PUBLIC_FLIGHT_API_KEY cu noul key
docker-compose restart
```

### Problem: Application Won't Start

**Verificări:**
```bash
# Check container status
docker-compose ps

# Check build errors
docker-compose logs app

# Rebuild if needed
docker-compose build --no-cache
docker-compose up -d
```

### Problem: No Flight Data Loading

**Verificări:**
```bash
# 1. Check API endpoints
curl "http://localhost:3000/api/flights/OTP/arrivals"

# 2. Check browser console for JavaScript errors

# 3. Check application logs
docker-compose logs app | grep -i "flight\|api\|error"

# 4. Verify environment variables
docker-compose exec app env | grep NEXT_PUBLIC
```

## 📊 Success Indicators

### ✅ Deployment Successful When:

1. **Containers Running:**
   ```bash
   docker-compose ps
   # Should show app container as "Up"
   ```

2. **Website Accessible:**
   - https://anyway.ro loads without errors
   - Flight pages load flight data
   - No errors in browser console

3. **API Working:**
   ```bash
   curl "http://localhost:3000/api/flights/OTP/arrivals"
   # Should return JSON with success:true
   ```

4. **Logs Clean:**
   ```bash
   docker-compose logs app --tail=50
   # Should show no critical errors
   # Should show scheduler updates every 10 minutes
   ```

## 📞 Support

### API.Market Issues:
- **Dashboard:** https://api.market/dashboard
- **Support:** support@api.market
- **Documentation:** https://api.market/aerodatabox/docs

### Server Issues:
- **Check logs:** `docker-compose logs app -f`
- **Restart services:** `docker-compose restart`
- **Rebuild:** `docker-compose build --no-cache && docker-compose up -d`

## 🎯 Expected Results

După update successful:

### ✅ Flight Data Loading:
- OTP (București): 20-50 zboruri/zi
- CLJ (Cluj): 10-30 zboruri/zi  
- TSR (Timișoara): 5-20 zboruri/zi
- KIV (Chișinău): 5-15 zboruri/zi

### ✅ Performance:
- Page load: <3 secunde
- API response: <2 secunde
- Cache hit rate: >80%
- Auto-refresh: la 10 minute

### ✅ Features Working:
- Search în flight list
- Filter by airline/status
- Sort by time/airline/destination
- Real-time status updates
- Mobile responsive design

---

## 🚀 Ready to Deploy!

**Command to run on server:**
```bash
ssh root@23.88.113.154
cd /opt/anyway-flight-schedule
./server-update.sh
```

**New API Key:** `cmj2m39qs0001k00404cmwu75`  
**Expected Result:** Real flight data loading on anyway.ro