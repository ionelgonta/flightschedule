# CRITICAL SERVER INSTRUCTIONS - DO NOT MODIFY PORTS

## ⚠️ ABSOLUTE RULES:
1. **NEVER MODIFY PORT CONFIGURATIONS** - This breaks both anyway.ro and victoriaocara.com
2. **NEVER TOUCH NETWORK SETTINGS** - Ports 80, 443, and other network configs are OFF-LIMITS
3. **ALWAYS CHECK NGINX STATUS** before making changes

## 🚨 EMERGENCY RESTORATION PROCEDURES

### If both sites are down (403 errors, not responding):

#### Step 1: Check nginx status
```bash
ssh root@anyway.ro "systemctl status nginx"
```

#### Step 2: If nginx is failed/stopped - Check port conflicts
```bash
ssh root@anyway.ro "netstat -tulpn | grep :80"
ssh root@anyway.ro "netstat -tulpn | grep :443"
```

#### Step 3: If Docker containers are using ports 80/443 - Stop them
```bash
ssh root@anyway.ro "docker ps"
ssh root@anyway.ro "docker stop flight-schedule-nginx"
ssh root@anyway.ro "docker stop flight-schedule-app"
```

#### Step 4: Start nginx
```bash
ssh root@anyway.ro "systemctl start nginx"
ssh root@anyway.ro "systemctl status nginx"
```

#### Step 5: Verify both sites work
```bash
curl -I https://anyway.ro
curl -I https://victoriaocara.com
```

## 📋 WORKING SERVER CONFIGURATION

### Current PM2 Processes:
- **anyway-ro** (ID: 5) - Main flight schedule app
- **victoriaocara** (ID: 9) - Victoria Ocara site

### Current Docker Setup:
- Docker containers should NOT be running on ports 80/443
- If they are, they conflict with nginx

### Nginx Configuration:
- System nginx handles both domains
- Ports 80 and 443 must be free for nginx
- Never modify nginx port configurations

## 🔧 SAFE DEPLOYMENT PROCEDURES

### For anyway.ro updates:
1. Upload files to `/opt/anyway-flight-schedule/`
2. Build: `cd /opt/anyway-flight-schedule && npm run build`
3. Restart PM2: `pm2 restart anyway-ro`
4. **NEVER restart nginx unless it's broken**

### For victoriaocara.com issues:
1. Only restart PM2: `pm2 restart victoriaocara`
2. **NEVER touch ports or nginx unless absolutely necessary**

## 🚫 WHAT NOT TO DO:
- ❌ Don't modify docker-compose.yml port mappings
- ❌ Don't change nginx port configurations
- ❌ Don't run Docker containers on ports 80/443
- ❌ Don't modify systemd service ports
- ❌ Don't change firewall port rules

## ✅ WHAT TO DO:
- ✅ Only restart PM2 processes for app updates
- ✅ Only restart nginx if it's actually broken
- ✅ Check Docker conflicts before starting nginx
- ✅ Use `/opt/anyway-flight-schedule/` for anyway.ro files
- ✅ Test both sites after any changes

## 📞 EMERGENCY QUICK FIX SCRIPT:
```bash
# Save this as emergency-fix.sh
#!/bin/bash
echo "=== EMERGENCY SERVER FIX ==="
echo "Stopping conflicting Docker containers..."
docker stop $(docker ps -q) 2>/dev/null
echo "Starting nginx..."
systemctl start nginx
echo "Restarting PM2 processes..."
pm2 restart anyway-ro
pm2 restart victoriaocara
echo "=== STATUS CHECK ==="
systemctl status nginx --no-pager
pm2 list
echo "=== TESTING SITES ==="
curl -I https://anyway.ro
curl -I https://victoriaocara.com
echo "=== FIX COMPLETE ==="
```

## 📝 LAST WORKING STATE (December 15, 2024):
- ✅ nginx: active (running) - ports 80, 443
- ✅ anyway-ro: PM2 process ID 5 - online
- ✅ victoriaocara: PM2 process ID 9 - online  
- ✅ Docker containers: stopped (not using ports 80/443)
- ✅ Both sites responding with HTTP 200

## 🎯 KEY LESSON:
**The main issue is always Docker containers conflicting with nginx on ports 80/443. Stop Docker containers, start nginx, restart PM2 processes. NEVER modify port configurations.**