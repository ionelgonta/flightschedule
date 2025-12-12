# Configurare AeroDataBox prin API.Market

## 🔑 Obținere API Key

### 1. Înregistrare pe API.Market
1. Accesează https://api.market/
2. Creează cont nou sau loghează-te
3. Navighează la AeroDataBox API
4. Alege planul potrivit pentru nevoile tale

### 2. Generare Bearer Token
1. În dashboard-ul API.Market
2. Găsește secțiunea "API Keys" sau "Authentication"
3. Generează un nou Bearer Token
4. Copiază token-ul (va arăta ca: `am_xxxxxxxxxxxxxxxxxxxxxxxx`)

## ⚙️ Configurare în anyway.ro

### 1. Pe serverul de producție

```bash
# Navighează la proiect
cd /opt/anyway-flight-schedule

# Creează/editează .env.local
nano .env.local
```

### 2. Adaugă configurația

```bash
# API.Market Configuration
NEXT_PUBLIC_FLIGHT_API_KEY=am_your_actual_bearer_token_here
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
```

### 3. Rebuild și restart aplicația

```bash
# Rebuild cu noua configurație
docker-compose build --no-cache

# Restart serviciile
docker-compose up -d

# Verifică logs-urile
docker-compose logs app -f
```

## 🧪 Testare Configurație

### 1. Test manual API

```bash
# Test direct cu curl
curl -H "Authorization: Bearer am_your_token" \
     "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/2025-12-12T00:00/2025-12-12T23:59"
```

### 2. Test în aplicație

1. Accesează `https://anyway.ro/airport/OTP/arrivals`
2. Verifică că se încarcă datele reale
3. Deschide Developer Tools → Network tab
4. Verifică că request-urile către API sunt successful (200 OK)

### 3. Verificare logs

```bash
# Logs aplicație pentru erori API
docker-compose logs app | grep -i "api\|error\|flight"

# Logs scheduler pentru actualizări automate
docker-compose logs app | grep -i "scheduler"
```

## 🔍 Troubleshooting

### Eroare: "401 Unauthorized"
- Verifică că Bearer Token-ul este corect
- Asigură-te că token-ul nu a expirat
- Verifică că ai credite suficiente în contul API.Market

### Eroare: "429 Too Many Requests"
- Ai depășit rate limit-ul (150 requests/minute)
- Crește intervalul în `NEXT_PUBLIC_AUTO_REFRESH_INTERVAL`
- Reduce numărul aeroporturilor în `NEXT_PUBLIC_PRIORITY_AIRPORTS`

### Eroare: "404 Not Found"
- Verifică că URL-ul API este corect
- Unele aeroporturi pot să nu aibă date disponibile
- Verifică că codul aeroportului este valid (ex: LROP pentru OTP)

### Nu se încarcă date
1. Verifică configurația `.env.local`
2. Restart aplicația: `docker-compose restart`
3. Verifică logs: `docker-compose logs app -f`
4. Testează API manual cu curl

## 📊 Monitorizare Utilizare

### 1. API.Market Dashboard
- Accesează dashboard-ul API.Market
- Monitorizează numărul de request-uri
- Verifică creditele rămase

### 2. Aplicație Stats
În browser console:
```javascript
// Statistici cache
console.log(window.flightRepository?.getCacheStats());

// Statistici scheduler
console.log(window.flightScheduler?.getStats());
```

## 💰 Optimizare Costuri

### 1. Cache Eficient
- Intervalul default de 10 minute reduce request-urile cu 83%
- Cache-ul local reduce request-urile duplicate

### 2. Aeroporturi Prioritare
- Configurează doar aeroporturile importante în `NEXT_PUBLIC_PRIORITY_AIRPORTS`
- Elimină aeroporturile cu trafic redus

### 3. Rate Limiting
- Respectă limitele API pentru a evita penalizările
- Folosește batch processing pentru multiple aeroporturi

## 🔄 Migrare de la RapidAPI

Dacă ai deja configurație RapidAPI:

```bash
# Schimbă provider-ul
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox

# Schimbă API key-ul
NEXT_PUBLIC_FLIGHT_API_KEY=am_your_new_api_market_token

# Rebuild
docker-compose build --no-cache && docker-compose up -d
```

## 📞 Support

Pentru probleme cu API.Market:
1. **API.Market Support**: support@api.market
2. **Documentație**: https://api.market/aerodatabox/docs
3. **Status Page**: https://status.api.market

Pentru probleme cu aplicația:
1. Verifică logs: `docker-compose logs app -f`
2. Test manual API cu curl
3. Verifică configurația environment variables

---

**Status**: ✅ Configurație Actualizată pentru API.Market
**Compatibilitate**: API.Market + RapidAPI (fallback)
**Ultima actualizare**: 12 Decembrie 2025