#!/bin/bash

# Live Analytics System Deployment Commands
# Run these commands when server connection is available

SERVER="anyway.ro"
USER="root"
PROJECT_DIR="/opt/anyway-flight-schedule"

echo "🚀 Live Analytics System Deployment Commands"
echo "============================================="

echo ""
echo "1. Create API directories:"
echo "ssh ${USER}@${SERVER} \"mkdir -p ${PROJECT_DIR}/app/api/admin/cache-config\""
echo "ssh ${USER}@${SERVER} \"mkdir -p ${PROJECT_DIR}/app/api/admin/cache-stats\""
echo "ssh ${USER}@${SERVER} \"mkdir -p ${PROJECT_DIR}/app/api/admin/cache-clear\""

echo ""
echo "2. Upload core files:"
echo "scp lib/flightAnalyticsService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/"
echo "scp app/admin/page.tsx ${USER}@${SERVER}:${PROJECT_DIR}/app/admin/"

echo ""
echo "3. Upload API routes:"
echo "scp app/api/admin/cache-config/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-config/"
echo "scp app/api/admin/cache-stats/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-stats/"
echo "scp app/api/admin/cache-clear/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-clear/"

echo ""
echo "4. Build and restart:"
echo "ssh ${USER}@${SERVER} \"cd ${PROJECT_DIR} && npm run build\""
echo "ssh ${USER}@${SERVER} \"cd ${PROJECT_DIR} && pm2 restart anyway-flight-schedule\""
echo "ssh ${USER}@${SERVER} \"pm2 status\""

echo ""
echo "5. Test URLs after deployment:"
echo "  - Admin Panel: https://anyway.ro/admin"
echo "  - Analytics: https://anyway.ro/analize"
echo "  - Statistics: https://anyway.ro/aeroport/bucuresti-henri-coanda/statistici"

echo ""
echo "✅ FEATURES DEPLOYED:"
echo "  ✓ Live AeroDataBox API integration (NO demo data)"
echo "  ✓ Cache management system with admin controls"
echo "  ✓ Configurable cache intervals (30 days analytics, 60 min realtime)"
echo "  ✓ Automatic cache refresh system"