# IPv4/IPv6 CONNECTIVITY ISSUE - SUCCESSFULLY RESOLVED

## PROBLEM SUMMARY
- **Issue**: Both anyway.ro and victoriaocara.com were returning 502 Bad Gateway errors
- **Root Cause**: IPv4/IPv6 connectivity mismatch between nginx and Next.js application
- **Details**: Next.js was listening on IPv6 (:::3000) but nginx was configured to connect via IPv4

## SOLUTION IMPLEMENTED

### 1. Created Custom Server for IPv4 Binding
- **File**: `server.js` - Custom Next.js server that forces IPv4 binding
- **Configuration**: Listens on `0.0.0.0:3000` instead of default IPv6
- **Updated**: `package.json` to use `node server.js` instead of `next start`

### 2. Updated Next.js Configuration
- **File**: `next.config.js` - Removed `output: 'standalone'` configuration
- **Reason**: Allows custom server to work properly with Next.js

### 3. Fixed Nginx Proxy Configuration
- **File**: `/etc/nginx/sites-available/multi-https` (active configuration)
- **Change**: Updated `proxy_pass` from `http://127.0.0.1:8080` to `http://127.0.0.1:3000`
- **Impact**: Nginx now correctly proxies to the running Next.js application

## DEPLOYMENT PROCESS

1. **Uploaded Files**:
   - `server.js` - Custom IPv4 server
   - `package.json` - Updated start script
   - `next.config.js` - Removed standalone output

2. **Built Application**:
   ```bash
   cd /opt/anyway-flight-schedule
   npm run build
   ```

3. **Restarted Services**:
   ```bash
   pm2 restart anyway-ro
   nginx -s reload
   ```

## VERIFICATION RESULTS

### ✅ Local Connectivity Test
```bash
curl -I http://127.0.0.1:3000
# Result: HTTP/1.1 200 OK
```

### ✅ HTTPS Site Test
```bash
curl -I https://anyway.ro
# Result: HTTP/2 200 OK
```

### ✅ External Access Test
```powershell
Invoke-WebRequest -Uri "https://anyway.ro" -Method Head
# Result: StatusCode: 200 OK
```

### ✅ Victoria Ocara Site Test
```bash
curl -I https://victoriaocara.com
# Result: HTTP/2 200 OK
```

## CURRENT STATUS

- 🟢 **anyway.ro**: ONLINE - Flight schedule application working
- 🟢 **victoriaocara.com**: ONLINE - Art gallery site working
- 🟢 **PM2 Processes**: Both anyway-ro (ID: 19) and victoriaocara (ID: 9) online
- 🟢 **Nginx**: Running and properly configured
- 🟢 **SSL Certificates**: Valid and working for both domains

## TECHNICAL DETAILS

### Server Configuration
- **App Server**: Custom Node.js server listening on IPv4 (0.0.0.0:3000)
- **Process Manager**: PM2 managing both applications
- **Web Server**: Nginx proxying HTTPS traffic to local applications
- **SSL**: Let's Encrypt certificates for both domains

### Key Files Modified
1. `/opt/anyway-flight-schedule/server.js` - NEW: Custom IPv4 server
2. `/opt/anyway-flight-schedule/package.json` - UPDATED: Start script
3. `/opt/anyway-flight-schedule/next.config.js` - UPDATED: Removed standalone
4. `/etc/nginx/sites-available/multi-https` - UPDATED: Proxy port 8080→3000

## LESSONS LEARNED

1. **IPv6 vs IPv4**: Next.js default server binds to IPv6, which can cause proxy issues
2. **Nginx Configuration**: Always verify the active nginx configuration file
3. **Port Mapping**: Ensure nginx proxy_pass matches the actual application port
4. **Custom Servers**: Sometimes needed to override default Next.js behavior

## MONITORING

- **PM2 Status**: `pm2 list` - Both processes should show "online"
- **Nginx Status**: `systemctl status nginx` - Should be active (running)
- **Site Health**: Regular HTTP checks on both domains
- **Logs**: Monitor `/var/log/nginx/error.log` for any proxy issues

---

**Date**: December 15, 2024  
**Status**: ✅ RESOLVED  
**Both Sites**: FULLY OPERATIONAL