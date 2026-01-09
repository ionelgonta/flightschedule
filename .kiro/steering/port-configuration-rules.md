# Port Configuration Rules - anyway.ro Server

## 🚨 CRITICAL PORT RULES

### **ABSOLUTE PORT ASSIGNMENTS - NEVER CHANGE THESE:**
1. **anyway.ro** - Port 3000
2. **victoriaocara.com** - Port 3001  
3. **Boarding Pass Management System** - Port 3002
4. **nginx** - Ports 80/443 (system nginx)

## 📋 PORT MAPPING (NEVER MODIFY)

### **Application Ports:**
```
anyway.ro        → 127.0.0.1:3000
victoriaocara.com → 127.0.0.1:3001
OTA Module       → 127.0.0.1:3002
```

### **Nginx Proxy Configuration:**
```
https://anyway.ro/        → http://127.0.0.1:3000
https://anyway.ro/pass/    → http://127.0.0.1:3002
https://victoriaocara.com/ → http://127.0.0.1:3001
```

## 🔄 PM2 PROCESS MAPPING

### **PM2 Applications:**
```
anyway-ro        → Port 3000 (anyway.ro site)
victoriaocara    → Port 3001 (victoriaocara.com site)  
ota-agent-module → Port 3002 (OTA boarding pass system)
```

## �  PROJECT DIRECTORIES (CRITICAL - NEVER CHANGE)

### **Absolute Directory Paths:**
```
anyway.ro        → /opt/anyway-flight-schedule/ (Node.js app)
victoriaocara.com → /opt/victoriaocara/ (Next.js app)
OTA Module       → /opt/anyway-flight-schedule/ota-agent-module/ (Node.js app)
```

### **PM2 Ecosystem Configuration:**
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

## 🚫 FORBIDDEN CHANGES

1. **NEVER change port assignments**
2. **NEVER use same port for multiple apps**
3. **NEVER modify nginx system ports (80/443)**
4. **NEVER run Docker on ports 80/443**
5. **NEVER change project directories**
6. **NEVER run victoriaocara from anyway-flight-schedule directory**
7. **NEVER run anyway-ro from victoriaocara directory**

## ✅ CORRECT NGINX CONFIGURATION

### **anyway.ro Block:**
```nginx
location /pass/ {
    proxy_pass http://127.0.0.1:3002/;
}
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

### **victoriaocara.com Block:**
```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
}
```

## 🎯 DEBUGGING CHECKLIST

### **If sites don't work:**
1. ✅ Check PM2 processes: `pm2 list`
2. ✅ Check port usage: `netstat -tulpn | grep -E ':(3000|3001|3002)'`
3. ✅ Check nginx config: `nginx -t`
4. ✅ Check proxy_pass targets in nginx
5. ✅ Verify correct project directories in PM2 config

### **Port Verification:**
```bash
# Should show all three ports in use
netstat -tulpn | grep -E ':(3000|3001|3002)'

# Should show:
# :3000 - anyway-ro process
# :3001 - victoriaocara process  
# :3002 - ota-agent-module process
```

### **Project Verification:**
```bash
# Check PM2 processes are running from correct directories
pm2 list
# anyway-ro should show cwd: /opt/anyway-flight-schedule
# victoriaocara should show cwd: /opt/victoriaocara
# ota-agent-module should show cwd: /opt/anyway-flight-schedule/ota-agent-module
```

---

**REMEMBER**: anyway.ro=3000, victoriaocara.com=3001, OTA=3002. Never change these assignments.