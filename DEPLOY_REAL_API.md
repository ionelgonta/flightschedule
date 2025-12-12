# Deploy Real API Integration - anyway.ro

## 🎯 Obiectiv
Implementarea integrării complete cu API.Market pentru date reale de zboruri pe anyway.ro.

## 📋 Pași de Deployment

### 1. Conectare la Server
```bash
ssh root@23.88.113.154
# Parola: FlightSchedule2024!
```

### 2. Navigare la Proiect
```bash
cd /opt/anyway-flight-schedule
```

### 3. Backup Configurația Existentă
```bash
# Backup .env.local dacă există
if [ -f .env.local ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
fi
```

### 4. Actualizare Cod din Git
```bash
git pull origin main
```

### 5. Configurare API.Market
```bash
# Creează .env.local cu API key-ul real
cat > .env.local << 'EOF'
# API.Market Configuration pentru AeroDataBox
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2k3c1p000djy044wbqprap
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_SCHEDULER_ENABLED=true
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3
NEXT_PUBLIC_DEBUG_FLIGHTS=false

# Google AdSense (dacă este configurat)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-your-id-here
EOF
```

### 6. Test API Direct (Opțional)
```bash
# Test rapid pentru a verifica API key-ul
chmod +x test-api.sh
./test-api.sh
```

### 7. Rebuild Aplicația
```bash
# Rebuild cu noua configurație
docker-compose build --no-cache app
```

### 8. Restart Serviciile
```bash
# Restart pentru a aplica noua configurație
docker-compose up -d
```

### 9. Verificare Status
```bash
# Verifică că serviciile rulează
docker-compose ps

# Verifică logs-urile pentru erori
docker-compose logs app --tail=50
```

### 10. Test Aplicația
```bash
# Test local
curl -I http://localhost:8080/

# Test API endpoint
curl -I http://localhost:8080/api/flights/OTP/arrivals
```

## 🧪 Testare Completă

### 1. Test în Browser
Accesează următoarele URL-uri și verifică că se încarcă datele reale:

- **Homepage**: https://anyway.ro/
- **OTP Arrivals**: https://anyway.ro/airport/OTP/arrivals
- **OTP Departures**: https://anyway.ro/airport/OTP/departures
- **Cluj Arrivals**: https://anyway.ro/airport/CLJ/arrivals
- **Timișoara Arrivals**: https://anyway.ro/airport/TSR/arrivals

### 2. Verificare Developer Tools
1. Deschide Developer Tools (F12)
2. Mergi la Network tab
3. Reîncarcă pagina
4. Verifică că request-urile către `/api/flights/` returnează 200 OK
5. Verifică că răspunsurile conțin date reale de zboruri

### 3. Test Scheduler
```bash
# Monitorizează logs-urile pentru scheduler
docker-compose logs app -f | grep -i scheduler
```

Ar trebui să vezi mesaje ca:
```
[Scheduler] Run #1 started at 2025-12-12T...
[Scheduler] ✅ OTP arrivals: 15 flights
[Scheduler] ✅ CLJ departures: 8 flights
```

## 🔍 Troubleshooting

### Problema: API Key Invalid (401 Unauthorized)
```bash
# Verifică configurația
cat .env.local | grep API_KEY

# Test manual API
curl -H "Authorization: Bearer cmj2k3c1p000djy044wbqprap" \
     "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"
```

### Problema: Rate Limit (429 Too Many Requests)
```bash
# Verifică configurația rate limit
cat .env.local | grep RATE_LIMIT

# Crește intervalul de refresh
sed -i 's/REFRESH_INTERVAL=600000/REFRESH_INTERVAL=900000/' .env.local
docker-compose restart app
```

### Problema: Nu Se Încarcă Date
```bash
# Verifică logs pentru erori API
docker-compose logs app | grep -i "api\|error\|flight"

# Verifică cache-ul
# În browser console:
# localStorage.getItem('flight_cache')
```

### Problema: Build Failed
```bash
# Restaurează backup-ul
cp .env.local.backup.* .env.local

# Rebuild
docker-compose build --no-cache app
docker-compose up -d
```

## 📊 Monitorizare Post-Deployment

### 1. Logs Importante
```bash
# Logs aplicație
docker-compose logs app -f

# Logs scheduler
docker-compose logs app -f | grep -i scheduler

# Logs API errors
docker-compose logs app -f | grep -i "api\|error"
```

### 2. Metrici de Urmărit
- **API Response Time**: < 2 secunde
- **Cache Hit Rate**: > 80%
- **Scheduler Success Rate**: > 95%
- **Error Rate**: < 5%

### 3. Verificări Periodice
```bash
# Verifică status servicii (zilnic)
docker-compose ps

# Verifică utilizarea disk (săptămânal)
df -h

# Verifică logs pentru erori (zilnic)
docker-compose logs app --since=24h | grep -i error
```

## 🎯 Rezultate Așteptate

După deployment-ul reușit:

✅ **Homepage**: Afișează aeroporturile românești cu link-uri funcționale
✅ **Airport Pages**: Încarcă date reale de zboruri din API.Market
✅ **Real-time Updates**: Scheduler actualizează automat datele la 10 minute
✅ **Cache Performance**: Cache local reduce request-urile API cu 80%+
✅ **Error Handling**: Fallback la cache în caz de erori API
✅ **Mobile Responsive**: Funcționează perfect pe toate device-urile
✅ **SEO Optimized**: Meta tags și structured data pentru zboruri

## 📞 Support

Pentru probleme:
1. Verifică logs: `docker-compose logs app -f`
2. Test API manual cu curl
3. Verifică configurația `.env.local`
4. Restart servicii: `docker-compose restart`

---

**Status**: 🚀 Ready for Deployment
**API Provider**: AeroDataBox via API.Market
**Estimated Deployment Time**: 10-15 minute
**Rollback Time**: < 2 minute (restore backup)