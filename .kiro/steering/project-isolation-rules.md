# Project Isolation Rules - anyway.ro Server

## 🚨 CRITICAL ISOLATION RULES

### **ABSOLUTE PORT ASSIGNMENTS - NEVER CHANGE:**
1. **anyway.ro** → Port 3000 → `/opt/anyway-flight-schedule/`
2. **victoriaocara.com** → Port 3001 → `/opt/victoriaocara/`
3. **citytravel.ro** → Port 3002 → (FacturaPro - separate config)

## 📋 NGINX CONFIGURATION STRUCTURE

### **Master Config:**
- **File**: `/etc/nginx/sites-available/master-config`
- **Symlink**: `/etc/nginx/sites-enabled/master-config`
- **Contains**: anyway.ro + victoriaocara.com only
- **Why together?**: Acestea sunt proiecte înrudite (ambele gestionate de același owner, deployment similar)

### **Separate Configs:**
- **citytravel.ro**: `/etc/nginx/sites-available/citytravel.ro.conf`
- **Symlink**: `/etc/nginx/sites-enabled/citytravel.ro.conf`
- **Why separate?**: 
  - Proiect complet diferit (FacturaPro - sistem de facturare)
  - Adăugat ulterior pe server
  - Are configurații specifice (upstream, gzip, cache headers, security headers)
  - Procese PM2 separate (facturapro-web, facturapro-api)
  - Necesită izolare completă pentru a nu afecta celelalte proiecte

## 🔒 PROJECT ISOLATION

### **Directory Structure:**
```
/opt/
├── anyway-flight-schedule/    # anyway.ro (port 3000)
├── victoriaocara/              # victoriaocara.com (port 3001)
└── (citytravel.ro handled separately)
```

### **PM2 Process Names:**
- `anyway-ro` → Port 3000
- `victoriaocara` → Port 3001
- `facturapro-web` → Port 3002 (citytravel.ro)
- `facturapro-api` → Port 3003

## 🚫 FORBIDDEN ACTIONS

1. **NEVER** modify port assignments
2. **NEVER** change project directories
3. **NEVER** mix configurations between projects
4. **NEVER** use same port for multiple projects
5. **NEVER** modify master-config to include citytravel.ro (it has separate config)

## ✅ SAFE DEPLOYMENT WORKFLOW

### **For anyway.ro:**
```bash
cd /opt/anyway-flight-schedule
git pull origin main
npm install
npm run build
pm2 restart anyway-ro
```

### **For victoriaocara.com:**
```bash
cd /opt/victoriaocara
git pull origin main
npm install
npm run build
pm2 restart victoriaocara
```

### **For citytravel.ro:**
```bash
# Check facturapro-web process
pm2 restart facturapro-web
```

## 🔍 VERIFICATION COMMANDS

### **Check All Sites:**
```bash
curl -I https://anyway.ro
curl -I https://victoriaocara.com
curl -I https://citytravel.ro
```

### **Check Ports:**
```bash
netstat -tulpn | grep -E ':(3000|3001|3002|3003)' | grep LISTEN
```

### **Check PM2:**
```bash
pm2 list
pm2 logs --lines 20
```

## 📝 NGINX CONFIGURATION TEMPLATE

### **master-config structure:**
```nginx
# anyway.ro - Port 3000
server {
    listen 443 ssl http2;
    server_name anyway.ro www.anyway.ro;
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

# victoriaocara.com - Port 3001
server {
    listen 443 ssl http2;
    server_name victoriaocara.com www.victoriaocara.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

## 🧹 CLEANUP RULES

### **Old Projects to Remove:**
- `/opt/anyway-backup-advanced-*` (backup directories)
- `/opt/flight-schedule-backup-*` (backup directories)
- Keep: `/opt/anyway-backup-*.tar.gz` (compressed backups - safe to keep)

### **Before Removing:**
1. Verify backup exists
2. Check if directory is referenced anywhere
3. Test all sites after removal

## ⚠️ EMERGENCY RECOVERY

### **If nginx breaks:**
```bash
# Restore from backup
cp /etc/nginx/sites-available/master-config.backup.* /etc/nginx/sites-available/master-config
nginx -t
systemctl reload nginx
```

### **If PM2 processes down:**
```bash
pm2 restart all
pm2 save
```

### **If port conflicts:**
```bash
# Check what's using the port
netstat -tulpn | grep :3000
# Kill conflicting process (if needed)
pm2 delete <process-name>
pm2 restart <process-name>
```

---
**CRITICAL**: Always maintain strict isolation. Each project must have its own port, directory, and PM2 process.
