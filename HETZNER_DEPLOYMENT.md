# 🚀 Deployment pe Hetzner Cloud - Flight Schedule

## 📋 Pregătire Inițială

### 🖥️ **1. Configurare Server Hetzner**

#### Creează Server:
1. **Login** pe [Hetzner Cloud Console](https://console.hetzner-cloud.com)
2. **Creează proiect nou**: "Flight Schedule"
3. **Adaugă server**:
   - **Locație**: Nuremberg (cel mai aproape de România)
   - **Image**: Ubuntu 22.04
   - **Type**: CPX11 (2 vCPU, 4GB RAM) - suficient pentru început
   - **Networking**: IPv4 public
   - **SSH Key**: Adaugă cheia ta SSH publică
   - **Name**: flight-schedule-server

#### Configurare DNS:
1. **Domeniu**: Pointează DNS-ul către IP-ul serverului
2. **A Record**: `@` → IP server
3. **A Record**: `www` → IP server

### 🔑 **2. Configurare SSH**

```bash
# Testează conexiunea SSH
ssh root@YOUR_SERVER_IP

# Dacă nu ai cheie SSH, generează una
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

## 🐳 Deployment Automat cu Docker

### 📝 **1. Configurare Script**

Editează `deploy-hetzner.sh`:

```bash
# Setează variabilele tale
SERVER_IP="YOUR_SERVER_IP"          # IP-ul serverului Hetzner
SERVER_USER="root"                  # Utilizator SSH
DOMAIN="your-domain.com"            # Domeniul tău
```

### 🚀 **2. Rulează Deployment**

```bash
# Fă scriptul executabil
chmod +x deploy-hetzner.sh

# Rulează deployment-ul
./deploy-hetzner.sh
```

### ⚙️ **Ce face scriptul automat:**

✅ **Instalează Docker & Docker Compose**  
✅ **Uploadează codul proiectului**  
✅ **Configurează Nginx cu SSL**  
✅ **Buildează și pornește containerele**  
✅ **Configurează firewall-ul**  
✅ **Generează certificat SSL self-signed**  

## 🔧 Deployment Manual (Pas cu Pas)

### **1. Conectare la Server**

```bash
ssh root@YOUR_SERVER_IP
```

### **2. Instalare Docker**

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### **3. Upload Proiect**

```bash
# Pe mașina locală
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
    ./ root@YOUR_SERVER_IP:/opt/flight-schedule/
```

### **4. Configurare SSL**

```bash
# Pe server
cd /opt/flight-schedule
mkdir -p ssl

# Generează certificat self-signed (temporar)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN=your-domain.com"
```

### **5. Actualizare Configurație**

```bash
# Actualizează domeniul în nginx.conf
sed -i "s/your-domain.com/YOUR_ACTUAL_DOMAIN/g" nginx.conf
```

### **6. Build și Start**

```bash
# Build containers
docker-compose build --no-cache

# Start services
docker-compose up -d

# Verifică status
docker-compose ps
```

### **7. Configurare Firewall**

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

## 🔍 Verificare și Monitorizare

### **Verifică Serviciile:**

```bash
# Status containere
docker-compose ps

# Logs aplicație
docker-compose logs -f flight-schedule

# Logs Nginx
docker-compose logs -f nginx

# Resurse sistem
htop
df -h
```

### **Testează Website-ul:**

1. **HTTP**: `http://your-domain.com` (redirect la HTTPS)
2. **HTTPS**: `https://your-domain.com`
3. **Admin**: `https://your-domain.com/admin`
4. **Aeroporturi**: `https://your-domain.com/airport/OTP`

## 🔒 Securitate și SSL Real

### **1. Certificat SSL Real cu Let's Encrypt**

```bash
# Instalează Certbot
apt install certbot python3-certbot-nginx

# Oprește Nginx temporar
docker-compose stop nginx

# Generează certificat
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copiază certificatele
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/flight-schedule/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/flight-schedule/ssl/key.pem

# Restart Nginx
docker-compose start nginx
```

### **2. Auto-renewal SSL**

```bash
# Adaugă în crontab
crontab -e

# Adaugă linia:
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/flight-schedule/docker-compose.yml restart nginx
```

## 📊 Optimizare Performanță

### **1. Monitoring**

```bash
# Instalează monitoring tools
apt install htop iotop nethogs

# Verifică performanța
docker stats
```

### **2. Backup Automat**

```bash
# Script backup
cat > /opt/backup-flight-schedule.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Backup code
tar -czf $BACKUP_DIR/flight-schedule-$DATE.tar.gz /opt/flight-schedule

# Keep only last 7 backups
find $BACKUP_DIR -name "flight-schedule-*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-flight-schedule.sh

# Adaugă în crontab pentru backup zilnic
echo "0 2 * * * /opt/backup-flight-schedule.sh" | crontab -
```

## 🔄 Update și Maintenance

### **Update Aplicație:**

```bash
# Pe mașina locală - rulează din nou scriptul
./deploy-hetzner.sh

# Sau manual pe server
cd /opt/flight-schedule
git pull  # dacă folosești git
docker-compose build --no-cache
docker-compose up -d
```

### **Comenzi Utile:**

```bash
# Restart servicii
docker-compose restart

# Rebuild complet
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Curățare Docker
docker system prune -a

# Verifică spațiu disk
df -h
du -sh /opt/flight-schedule
```

## 💰 Costuri Hetzner

### **Server CPX11** (recomandat pentru început):
- **2 vCPU, 4GB RAM, 40GB SSD**
- **Cost**: ~€4.15/lună
- **Trafic**: 20TB inclus

### **Upgrade la CPX21** (pentru trafic mare):
- **3 vCPU, 8GB RAM, 80GB SSD**
- **Cost**: ~€8.30/lună
- **Trafic**: 20TB inclus

## 🎯 Post-Deployment

### **Configurări Finale:**

1. **✅ Testează toate paginile**
2. **✅ Configurează Google AdSense**
3. **✅ Schimbă parola admin**
4. **✅ Configurează Google Analytics**
5. **✅ Testează pe mobile**
6. **✅ Verifică SSL certificate**
7. **✅ Configurează backup-uri**

### **URLs Finale:**

- **🏠 Homepage**: `https://your-domain.com`
- **✈️ Aeroporturi**: `https://your-domain.com/airports`
- **🎯 Admin**: `https://your-domain.com/admin`
- **📊 OTP Sosiri**: `https://your-domain.com/airport/OTP/arrivals`

**🎉 Felicitări! Website-ul Flight Schedule rulează acum pe propriul tău server Hetzner!** 🛫🇷🇴