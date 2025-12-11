# Ghid Manual pentru Deployment pe Hetzner

## Pasul 1: Schimbarea Parolei SSH

Serverul Hetzner cere schimbarea parolei la prima conectare. Urmează acești pași:

### 1.1 Conectare cu PuTTY
1. **Deschide PuTTY**
2. **Host Name**: `23.88.113.154`
3. **Port**: `22`
4. **Connection Type**: `SSH`
5. **Click "Open"**

### 1.2 Autentificare
1. **Username**: `root`
2. **Parola actuală**: `ba94wtRqEnMu773TpWEr`

### 1.3 Schimbarea Parolei
Serverul va cere:
1. **New password**: `FlightSchedule2024!`
2. **Retype new password**: `FlightSchedule2024!`

## Pasul 2: Deployment Automat

După schimbarea parolei, rulează următoarele comenzi în terminal:

### 2.1 Actualizare Sistem
```bash
apt update && apt upgrade -y
```

### 2.2 Instalare Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
```

### 2.3 Instalare Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2.4 Crearea Directorului Proiect
```bash
mkdir -p /opt/flight-schedule
cd /opt/flight-schedule
```

## Pasul 3: Upload Fișiere Proiect

### 3.1 Pe computerul local (Windows)
Rulează în PowerShell din directorul proiectului:

```powershell
# Creează arhiva
Compress-Archive -Path ".\*" -DestinationPath "project.zip" -Force

# Upload pe server (folosește noua parolă)
pscp -pw FlightSchedule2024! project.zip root@23.88.113.154:/opt/flight-schedule/
```

### 3.2 Pe server (în PuTTY)
```bash
cd /opt/flight-schedule
unzip -o project.zip
rm project.zip
```

## Pasul 4: Configurare SSL și Nginx

### 4.1 Creează Directorul SSL
```bash
mkdir -p ssl
```

### 4.2 Generează Certificat SSL Temporar
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN=victoriaocara.com"
```

### 4.3 Actualizează Configurația Nginx
```bash
sed -i "s/your-domain.com/victoriaocara.com/g" nginx.conf
```

## Pasul 5: Build și Pornire Aplicație

### 5.1 Build Containerele Docker
```bash
docker-compose build --no-cache
```

### 5.2 Pornește Aplicația
```bash
docker-compose up -d
```

### 5.3 Verifică Statusul
```bash
docker-compose ps
docker-compose logs -f
```

## Pasul 6: Configurare Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Pasul 7: Verificare Finală

### 7.1 Testează Aplicația
- **Site principal**: `https://victoriaocara.com`
- **Admin panel**: `https://victoriaocara.com/admin`
- **Parola admin**: `admin123`

### 7.2 Verifică Serviciile
```bash
# Status containere
docker-compose ps

# Loguri aplicație
docker-compose logs app

# Loguri nginx
docker-compose logs nginx
```

## Pasul 8: Configurare DNS

În panoul de control al domeniului `victoriaocara.com`:
1. **Adaugă înregistrare A**: `@ → 23.88.113.154`
2. **Adaugă înregistrare A**: `www → 23.88.113.154`

## Pasul 9: SSL Real (Opțional)

Pentru certificat SSL real cu Let's Encrypt:

```bash
# Instalează certbot
apt install certbot python3-certbot-nginx -y

# Obține certificat
certbot --nginx -d victoriaocara.com -d www.victoriaocara.com

# Testează reînnoirea automată
certbot renew --dry-run
```

## Comenzi Utile pentru Administrare

### Restart Aplicație
```bash
cd /opt/flight-schedule
docker-compose restart
```

### Update Aplicație
```bash
cd /opt/flight-schedule
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Backup
```bash
# Backup configurații
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/flight-schedule
```

### Monitorizare
```bash
# CPU și memorie
htop

# Spațiu disk
df -h

# Loguri sistem
journalctl -f
```

## Informații Importante

- **Server IP**: `23.88.113.154`
- **SSH Username**: `root`
- **SSH Password**: `FlightSchedule2024!`
- **Domeniu**: `victoriaocara.com`
- **Admin Panel**: `https://victoriaocara.com/admin`
- **Admin Password**: `admin123` (schimbă în producție!)

## Suport

Dacă întâmpini probleme:
1. Verifică logurile: `docker-compose logs -f`
2. Restart servicii: `docker-compose restart`
3. Verifică firewall: `ufw status`
4. Testează DNS: `nslookup victoriaocara.com`