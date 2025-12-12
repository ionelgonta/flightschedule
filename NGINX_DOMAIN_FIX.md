# Nginx Domain Fix - anyway.ro fără port

## 🎯 OBIECTIV
- `anyway.ro` să funcționeze fără port (https://anyway.ro)
- `victoriaocara.com` să rămână neschimbat
- Port 3000 să fie doar intern (nu extern)

## 🔧 SOLUȚIA IMPLEMENTATĂ

### 1. Nginx Configuration
- **anyway.ro** → Flight Schedule app (port 3000 intern)
- **victoriaocara.com** → Victoria Ocara site (păstrat neschimbat)
- SSL certificates pentru ambele domenii
- Port 3000 nu mai este expus extern

### 2. Docker Configuration
- Port 3000: `expose` (intern) în loc de `ports` (extern)
- Nginx: porturile 80/443 pentru ambele domenii
- Volume mounts pentru SSL și Victoria Ocara

## 🚀 COMENZI PENTRU SERVER

### Conectare la server:
```bash
ssh root@23.88.113.154
# Password: FlightSchedule2024!
```

### Implementare fix:
```bash
cd /opt/anyway-flight-schedule
git pull origin main
chmod +x fix-nginx-domains.sh
./fix-nginx-domains.sh
```

## 📋 CE FACE SCRIPTUL

1. **Backup** configurația nginx actuală
2. **Pull** noua configurație din Git
3. **Verifică** certificatele SSL
4. **Testează** configurația nginx
5. **Restart** serviciile cu noua configurație
6. **Testează** rutarea domeniilor

## 🔍 VERIFICĂRI MANUALE

### Test SSL certificates:
```bash
ls -la /etc/letsencrypt/live/anyway.ro/
ls -la /etc/letsencrypt/live/victoriaocara.com/
```

### Test nginx config:
```bash
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t
```

### Test port 3000 (nu trebuie să fie accesibil extern):
```bash
curl http://localhost:3000  # Trebuie să eșueze
```

### Test domenii:
```bash
curl -I https://anyway.ro
curl -I https://victoriaocara.com
```

## 🌐 REZULTATUL AȘTEPTAT

### anyway.ro (Flight Schedule):
- ✅ `https://anyway.ro` - Pagina principală
- ✅ `https://anyway.ro/airport/OTP/arrivals` - Zboruri
- ✅ `https://anyway.ro/admin` - Admin panel

### victoriaocara.com (Păstrat neschimbat):
- ✅ `https://victoriaocara.com` - Site Victoria Ocara
- ✅ `https://www.victoriaocara.com` - Redirect sau alias

### Port 3000:
- ❌ `http://anyway.ro:3000` - Nu mai funcționează (corect)
- ❌ `https://anyway.ro:3000` - Nu mai funcționează (corect)

## 🔧 DACĂ CERTIFICATELE SSL LIPSESC

### Pentru anyway.ro:
```bash
certbot --nginx -d anyway.ro -d www.anyway.ro
```

### Pentru victoriaocara.com (dacă e necesar):
```bash
certbot --nginx -d victoriaocara.com -d www.victoriaocara.com
```

## 🚨 TROUBLESHOOTING

### Dacă anyway.ro nu funcționează:
```bash
# Check nginx logs
docker-compose logs nginx -f

# Check app logs
docker-compose logs flight-schedule -f

# Restart services
docker-compose restart
```

### Dacă victoriaocara.com nu funcționează:
```bash
# Verifică path-ul fișierelor
ls -la /var/www/victoriaocara.com/

# Verifică configurația nginx
grep -A 20 "victoriaocara.com" nginx.conf
```

### Dacă portul 3000 încă este accesibil extern:
```bash
# Verifică docker-compose.yml
grep -A 5 "ports:" docker-compose.yml

# Trebuie să fie "expose: 3000" nu "ports: 3000:3000"
```

## 📊 MONITORING

### Logs în timp real:
```bash
# Nginx logs
docker-compose logs nginx -f

# App logs
docker-compose logs flight-schedule -f

# Toate logs
docker-compose logs -f
```

### Status containere:
```bash
docker-compose ps
```

### Port usage:
```bash
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :3000  # Nu trebuie să apară
```

## ✅ SUCCESS CRITERIA

După implementare:
1. ✅ `https://anyway.ro` funcționează fără port
2. ✅ `https://victoriaocara.com` funcționează normal
3. ❌ `http://anyway.ro:3000` NU funcționează (corect)
4. ✅ SSL certificates active pentru ambele domenii
5. ✅ Nginx rutează corect cererile

## 📞 SUPPORT INFO

- **Server**: 23.88.113.154
- **User**: root
- **Password**: FlightSchedule2024!
- **Project**: /opt/anyway-flight-schedule
- **Nginx Config**: nginx.conf
- **Docker Config**: docker-compose.yml