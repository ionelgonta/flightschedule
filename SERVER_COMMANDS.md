# SERVER COMMANDS - Copy-Paste pentru anyway.ro

## 🚨 PROBLEMA IDENTIFICATĂ
- Git conflict cu `lib/icaoMapping.ts`
- Fișierele nu au fost trase corect
- Scripturile nu sunt executabile

## 🔧 SOLUȚIA RAPIDĂ

### Conectează la server:
```bash
ssh root@23.88.113.154
# Password: FlightSchedule2024!
```

### Rulează fix-ul complet:
```bash
cd /opt/anyway-flight-schedule
git pull origin main
chmod +x fix-server-now.sh
./fix-server-now.sh
```

## 📋 COMENZI ALTERNATIVE (dacă fix-server-now.sh nu există)

### 1. Rezolvă conflictul Git:
```bash
cd /opt/anyway-flight-schedule
git reset --hard HEAD
git clean -fd
git pull origin main
```

### 2. Fă scripturile executabile:
```bash
chmod +x *.sh
```

### 3. Rulează deployment:
```bash
./deploy-final.sh
```

## 🧪 TEST MANUAL API KEY

Dacă vrei să testezi API key-ul manual:
```bash
curl -H "Authorization: Bearer cmj2m39qs0001k00404cmwu75" \
  "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"
```

**Rezultate așteptate:**
- **HTTP 200** = API key funcționează
- **HTTP 404** = API key invalid/expirat
- **HTTP 401** = API key neautorizat

## 🐳 DOCKER COMMANDS

Dacă containerele nu pornesc:
```bash
cd /opt/anyway-flight-schedule
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d
```

Verifică statusul:
```bash
docker-compose ps
docker-compose logs app --tail=20
```

## 🌐 TEST FINAL

După deployment, testează:
```bash
# Test local
curl http://localhost:3000
curl http://localhost:3000/api/flights/OTP/arrivals

# Test extern (din browser)
# https://anyway.ro
# https://anyway.ro/airport/OTP/arrivals
```

## 🔑 DACĂ API KEY NU FUNCȚIONEAZĂ

1. **Vizitează**: https://api.market/dashboard
2. **Verifică subscripția** și credits
3. **Generează API key nou**
4. **Actualizează pe server**:
   ```bash
   cd /opt/anyway-flight-schedule
   nano .env.local
   # Schimbă NEXT_PUBLIC_FLIGHT_API_KEY=NEW_KEY_HERE
   docker-compose restart
   ```

## ⚡ COMENZI RAPIDE - COPY/PASTE

```bash
# Conectare și fix complet
ssh root@23.88.113.154
cd /opt/anyway-flight-schedule && git reset --hard HEAD && git pull origin main && chmod +x *.sh && ./fix-server-now.sh
```

## 📞 INFO SERVER
- **IP**: 23.88.113.154
- **User**: root
- **Password**: FlightSchedule2024!
- **Project**: /opt/anyway-flight-schedule
- **Domain**: anyway.ro