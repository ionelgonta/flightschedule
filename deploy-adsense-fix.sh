#!/bin/bash
echo "=== DEPLOYING ADSENSE FIX ==="

# Upload fixed files
echo "Uploading fixed components..."
scp -r ./components root@anyway.ro:/opt/anyway-flight-schedule/

# Build application
echo "Building application..."
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

# Restart PM2
echo "Restarting application..."
ssh root@anyway.ro "pm2 restart anyway-ro"

echo "=== ADSENSE FIX DEPLOYED ==="