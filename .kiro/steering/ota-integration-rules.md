# OTA Integration Rules - Complete System Knowledge

## 🚨 CRITICAL OTA INTEGRATION RULES

### **ABSOLUTE OTA CONFIGURATION - NEVER CHANGE THESE:**
1. **OTA Module Location**: `/opt/anyway-flight-schedule/ota-agent-module/`
2. **OTA Port**: 3002 (NEVER change)
3. **OTA URL**: `https://anyway.ro/pass/`
4. **Admin Credentials**: Same as anyway.ro (admin/FlightSchedule2024!)

## 📋 OTA SYSTEM ARCHITECTURE (COMPLETE)

### **Directory Structure:**
```
/opt/anyway-flight-schedule/ota-agent-module/
├── src/                    # TypeScript source (if exists)
├── dist/                   # Compiled JavaScript (if TypeScript)
├── server.js               # Main server file
├── package.json            # Dependencies
├── .env                    # Environment configuration
├── data/                   # Data storage
├── uploads/                # File uploads
└── logs/                   # Application logs
```

### **Server Types (Handle Both):**
1. **Full TypeScript Implementation**: Uses `dist/server.js` after `npm run build`
2. **Simple Node.js Server**: Uses `server.js` directly
3. **Fallback**: Copy from `ota-server-simple.js` if needed

## 🔧 OTA DEPLOYMENT WORKFLOW (NEVER DEVIATE)

### **Step-by-Step Deployment:**
1. **Check existing structure**: `ls -la /opt/anyway-flight-schedule/ota-agent-module/`
2. **Determine server type**: TypeScript (src/ exists) or Simple (server.js only)
3. **Install dependencies**: `npm install` (if package.json exists)
4. **Build if TypeScript**: `npx tsc` (if src/ and tsconfig.json exist)
5. **Create environment**: Copy .env configuration
6. **Update PM2 config**: Add OTA process to ecosystem.config.js
7. **Update nginx**: Ensure /pass/ routes exist in master-config
8. **Test and restart**: PM2 restart, nginx reload, verify all endpoints

### **PM2 Configuration for OTA:**
```javascript
{
  name: 'ota-agent-module',
  script: 'server.js',  // or 'dist/server.js' for TypeScript
  cwd: '/opt/anyway-flight-schedule/ota-agent-module',
  env: {
    NODE_ENV: 'production',
    OTA_PORT: 3002
  },
  instances: 1,
  exec_mode: 'fork'
}
```

### **Environment Configuration (.env):**
```bash
# Required for basic functionality
OTA_PORT=3002
OTA_HOST=0.0.0.0
NODE_ENV=production
OTA_JWT_SECRET=FlightSchedule2024-OTA-JWT-Secret-anyway.ro-production

# Optional for full functionality
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_WALLET_ISSUER_ID=your-issuer-id
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@anyway.ro
```

## 🎯 OTA FUNCTIONALITY LEVELS

### **Level 1: Basic Server (Always Works)**
- ✅ Health check endpoint: `/api/health`
- ✅ Admin panel: `/admin`
- ✅ Basic HTTP server on port 3002
- ✅ CORS enabled for anyway.ro

### **Level 2: Full OTA System (Requires Configuration)**
- ✅ JWT Authentication
- ✅ Boarding pass upload and processing
- ✅ Barcode detection and IATA BCBP parsing
- ✅ Google Wallet integration (needs credentials)
- ✅ Email delivery system (needs SMTP)
- ✅ Audit logging and compliance

### **Level 3: Production Ready (Complete Setup)**
- ✅ Google Wallet credentials configured
- ✅ Email SMTP configured and tested
- ✅ SSL certificates and HTTPS
- ✅ Rate limiting and security
- ✅ Monitoring and alerting

## 🚫 FORBIDDEN OTA ACTIONS

1. **NEVER change OTA port from 3002**
2. **NEVER run OTA on different domain than anyway.ro**
3. **NEVER modify nginx /pass/ routes**
4. **NEVER use different admin credentials**
5. **NEVER delete OTA data without explicit permission**
6. **NEVER create mock boarding pass data**
7. **NEVER bypass authentication for production**

## ✅ ALLOWED OTA ACTIONS

1. **DO** configure Google Wallet credentials when available
2. **DO** configure email SMTP when available
3. **DO** use real boarding pass data only
4. **DO** maintain audit logs for compliance
5. **DO** test functionality after configuration changes
6. **DO** monitor system health and performance

## 🔍 OTA TROUBLESHOOTING GUIDE

### **Problem: OTA not accessible**
**Solution:**
1. Check PM2 process: `pm2 list | grep ota`
2. Check port: `netstat -tulpn | grep 3002`
3. Check nginx routes: `grep -A 5 "location /pass/" /etc/nginx/sites-available/master-config`
4. Restart if needed: `pm2 restart ota-agent-module`

### **Problem: OTA server won't start**
**Solution:**
1. Check server.js exists: `ls -la /opt/anyway-flight-schedule/ota-agent-module/server.js`
2. Check syntax: `node -c /opt/anyway-flight-schedule/ota-agent-module/server.js`
3. Check logs: `pm2 logs ota-agent-module`
4. Fallback to simple server if needed

### **Problem: Package.json issues**
**Solution:**
1. Remove problematic package.json: `rm package.json`
2. Use simple server without dependencies
3. Copy from ota-server-simple.js if needed

### **Problem: TypeScript build fails**
**Solution:**
1. Check if TypeScript is needed: `ls -la src/`
2. Install dependencies: `npm install`
3. Build: `npx tsc`
4. Fallback to simple server if build fails

## 📊 OTA MONITORING & MAINTENANCE

### **Health Check Commands:**
```bash
# Basic connectivity
curl -I https://anyway.ro/pass/api/health

# Full API test
curl -s https://anyway.ro/pass/api/health | jq .

# Admin panel test
curl -I https://anyway.ro/pass/admin
```

### **Log Monitoring:**
```bash
# PM2 logs
pm2 logs ota-agent-module --lines 50

# Application logs (if exists)
tail -f /opt/anyway-flight-schedule/ota-agent-module/logs/ota-combined.log
```

### **Performance Monitoring:**
```bash
# Memory usage
pm2 monit

# Process status
pm2 show ota-agent-module
```

## 🔐 OTA SECURITY & COMPLIANCE

### **Authentication:**
- **Admin Access**: Same credentials as anyway.ro admin
- **API Access**: JWT tokens for programmatic access
- **Rate Limiting**: 100 requests per 15 minutes per IP

### **Data Protection:**
- **Audit Logging**: All actions tracked with IP and timestamp
- **File Validation**: Upload size and type restrictions
- **Data Retention**: 90-day audit log retention
- **No Mock Data**: Only real boarding pass data allowed

### **Compliance Features:**
- **IATA BCBP**: Full Resolution 792 compliance
- **Google Wallet**: Official API integration
- **GDPR**: Data protection and consent handling
- **Security**: Comprehensive input validation

## 🎯 OTA SUCCESS VERIFICATION

### **Deployment Success Checklist:**
1. ✅ `curl -I https://anyway.ro/pass/api/health` returns 200
2. ✅ `curl -I https://anyway.ro/pass/admin` returns 200
3. ✅ PM2 shows ota-agent-module as online
4. ✅ Port 3002 is listening
5. ✅ Nginx /pass/ routes are active
6. ✅ Admin panel accessible with correct credentials

### **Full Functionality Checklist:**
1. ✅ Basic server functionality working
2. ✅ Google Wallet credentials configured (optional)
3. ✅ Email SMTP configured (optional)
4. ✅ File upload functionality tested
5. ✅ Authentication system working
6. ✅ Audit logging active

---

**CRITICAL**: OTA system is designed to work at multiple levels. Basic functionality should always work, with advanced features requiring additional configuration.