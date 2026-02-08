# Nginx & Deployment Rules - anyway.ro Server

## 🚨 CRITICAL NGINX RULES

### **ABSOLUTE NGINX CONFIGURATION - NEVER CHANGE THESE:**
1. **Only ONE active nginx config**: `master-config` (for anyway.ro + victoriaocara.com)
2. **Separate config**: `citytravel.ro.conf` (for citytravel.ro - DO NOT modify)
3. **Location**: `/etc/nginx/sites-available/master-config`
4. **Symlink**: `/etc/nginx/sites-enabled/master-config`
5. **ALL other configs**: DELETED and FORBIDDEN (except citytravel.ro.conf)

### **⚠️ PROJECT ISOLATION - READ FIRST:**
**See**: `.kiro/steering/project-isolation-rules.md` for complete isolation rules.

**CRITICAL PORT ASSIGNMENTS:**
- **anyway.ro** → Port 3000 → `/opt/anyway-flight-schedule/`
- **victoriaocara.com** → Port 3001 → `/opt/victoriaocara/`
- **citytravel.ro** → Port 3002 → (separate config, separate process)

## 📋 NGINX MASTER CONFIGURATION (NEVER MODIFY STRUCTURE)

### **File Location:**
```
/etc/nginx/sites-available/master-config (ONLY active config)
/etc/nginx/sites-enabled/master-config -> /etc/nginx/sites-available/master-config
```

### **Configuration Structure:**
```nginx
# anyway.ro - HTTP to HTTPS redirect
server {
    listen 80;
    server_name anyway.ro www.anyway.ro;
    return 301 https://$server_name$request_uri;
}

# anyway.ro - HTTPS with OTA support
server {
    listen 443 ssl http2;
    server_name anyway.ro www.anyway.ro;
    
    ssl_certificate /etc/letsencrypt/live/anyway.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anyway.ro/privkey.pem;
    
    # Boarding Pass Management System
    location /pass/ {
        proxy_pass http://127.0.0.1:3002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }
    
    # anyway.ro main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# victoriaocara.com - HTTP to HTTPS redirect
server {
    listen 80;
    server_name victoriaocara.com www.victoriaocara.com;
    return 301 https://$server_name$request_uri;
}

# victoriaocara.com - HTTPS
server {
    listen 443 ssl http2;
    server_name victoriaocara.com www.victoriaocara.com;
    
    ssl_certificate /etc/letsencrypt/live/victoriaocara.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/victoriaocara.com/privkey.pem;
    
    # victoriaocara.com application (port 3001)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚫 FORBIDDEN NGINX ACTIONS

1. **NEVER create multiple nginx configs**
2. **NEVER use anyway-ro-fixed, victoriaocara-fixed, multi-https, etc.**
3. **NEVER modify port assignments in nginx**
4. **NEVER add Docker containers on ports 80/443**
5. **NEVER change SSL certificate paths**
6. **NEVER modify proxy_pass targets without updating PM2**

## ✅ ALLOWED NGINX ACTIONS

1. **DO** use only `master-config`
2. **DO** test config before reload: `nginx -t`
3. **DO** reload (not restart) nginx: `systemctl reload nginx`
4. **DO** backup before changes
5. **DO** verify all sites work after changes

## 🔧 DEPLOYMENT WORKFLOW (NEVER DEVIATE)

### **OTA Module Deployment Steps:**
1. **Check existing structure**: Verify `/opt/anyway-flight-schedule/ota-agent-module/`
2. **Upload files**: Only to correct directories
3. **Update PM2 config**: Use correct paths and ports
4. **Test nginx config**: `nginx -t`
5. **Restart PM2**: `pm2 restart all`
6. **Reload nginx**: `systemctl reload nginx`
7. **Verify all sites**: Test all 3 endpoints

### **PM2 Ecosystem File Location:**
```
/opt/anyway-flight-schedule/ecosystem.config.js (ONLY location)
```

### **Correct PM2 Configuration:**
```javascript
module.exports = {
  apps: [
    {
      name: 'anyway-ro',
      script: 'server.js',
      cwd: '/opt/anyway-flight-schedule',
      env: { NODE_ENV: 'production', PORT: 3000 }
    },
    {
      name: 'victoriaocara',
      script: 'npm',
      args: 'start',
      cwd: '/opt/victoriaocara',
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'ota-agent-module',
      script: 'server.js',
      cwd: '/opt/anyway-flight-schedule/ota-agent-module',
      env: { NODE_ENV: 'production', OTA_PORT: 3002 }
    }
  ]
};
```

## 🎯 VERIFICATION CHECKLIST

### **After Any Deployment:**
1. ✅ `pm2 list` - All 3 processes online
2. ✅ `netstat -tulpn | grep -E ':(3000|3001|3002)'` - All ports active
3. ✅ `nginx -t` - Config syntax OK
4. ✅ `curl -I https://anyway.ro` - Main site OK
5. ✅ `curl -I https://victoriaocara.com` - Art gallery OK
6. ✅ `curl -I https://anyway.ro/pass/admin` - OTA admin OK
7. ✅ `curl -I https://anyway.ro/pass/api/health` - OTA API OK

### **Emergency Recovery Commands:**
```bash
# If sites are down
docker stop $(docker ps -q) 2>/dev/null
systemctl start nginx
pm2 restart all

# If nginx config broken
cp /etc/nginx/sites-available/master-config.backup /etc/nginx/sites-available/master-config
systemctl reload nginx

# If PM2 processes down
pm2 start /opt/anyway-flight-schedule/ecosystem.config.js
```

## 📊 MONITORING COMMANDS

### **Daily Health Check:**
```bash
pm2 status && systemctl status nginx && curl -I https://anyway.ro && curl -I https://victoriaocara.com && curl -I https://anyway.ro/pass/api/health
```

### **Log Monitoring:**
```bash
pm2 logs --lines 20
tail -20 /var/log/nginx/error.log
```

## 🔒 SECURITY RULES

### **SSL Certificates:**
- **anyway.ro**: `/etc/letsencrypt/live/anyway.ro/`
- **victoriaocara.com**: `/etc/letsencrypt/live/victoriaocara.com/`
- **NEVER modify certificate paths**
- **Auto-renewal handled by certbot**

### **Access Control:**
- **Admin panels**: Same credentials for both (admin/FlightSchedule2024!)
- **OTA API**: JWT authentication required
- **Rate limiting**: Built into OTA module

---

**CRITICAL**: Always follow this exact workflow. Any deviation can break all 3 sites simultaneously.