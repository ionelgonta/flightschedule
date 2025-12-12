# Deployment Instructions

## Deploy pe Hetzner Cloud

### 1. Prerequisites
- Acces SSH la serverul Hetzner (23.88.113.154)
- Docker și Docker Compose instalate pe server
- Git repository actualizat

### 2. Conectare la Server
```bash
ssh root@23.88.113.154
cd /opt/anyway-flight-schedule
```

### 3. Deploy Actualizări
```bash
# Pull ultimele modificări din Git
git pull origin main

# Configurează environment variables (dacă e necesar)
nano .env.local

# Rebuild aplicația cu noile modificări
docker-compose build --no-cache

# Restart toate serviciile
docker-compose up -d
```

### 4. Verificare Deployment
```bash
# Verifică statusul containerelor
docker-compose ps

# Verifică logs-urile pentru erori
docker-compose logs app -f

# Test aplicația local
curl -I http://localhost:8080

# Test API endpoints
curl -I http://localhost:8080/api/flights/OTP/arrivals
```

### 5. Acces Public
- **HTTPS Principal**: https://anyway.ro
- **HTTP**: http://anyway.ro:8080  
- **HTTPS Alternativ**: https://anyway.ro:8443

### 6. Monitoring și Troubleshooting
```bash
# Monitorizare logs în timp real
docker-compose logs app -f

# Restart doar aplicația
docker-compose restart app

# Verificare utilizare resurse
docker stats

# Verificare spațiu disk
df -h
```

### 7. Backup și Recovery
```bash
# Backup configurație
cp .env.local .env.local.backup.$(date +%Y%m%d)

# Backup baza de date (dacă există)
# docker-compose exec db pg_dump -U user database > backup.sql

# Recovery la versiunea anterioară
git checkout HEAD~1
docker-compose build --no-cache
docker-compose up -d
```

### 8. SSL Certificate Renewal
```bash
# Verificare certificat SSL
openssl x509 -in ssl/cert.pem -text -noout | grep "Not After"

# Renewal manual (dacă e necesar)
certbot renew --dry-run
```

## Environment Configuration

Pentru producție, asigură-te că ai următoarele configurate în `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_FLIGHT_API_KEY=your_api_key_here
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000

# Site Configuration  
NEXT_PUBLIC_SITE_URL=https://anyway.ro
```

## Performance Optimization

### 1. Docker Optimization
```bash
# Cleanup unused images
docker system prune -a

# Optimize build cache
docker-compose build --no-cache --parallel
```

### 2. Nginx Optimization
- Gzip compression enabled
- Static file caching
- SSL/TLS optimization
- Rate limiting configured

### 3. Application Optimization
- Next.js production build
- Image optimization enabled
- Font preloading
- Code splitting automatic