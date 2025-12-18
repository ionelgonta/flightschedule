#!/bin/bash

echo "=== DEPLOYING DARK THEME FIXES ==="

# Upload fixed files
echo "Uploading theme-fixed files..."
scp app/statistici/page.tsx root@anyway.ro:/opt/anyway-flight-schedule/app/statistici/
scp select-simple.tsx root@anyway.ro:/opt/anyway-flight-schedule/
scp components/ui/card.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/ui/
scp components/ui/button.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/ui/

# Build and restart
echo "Building application..."
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

echo "Restarting PM2..."
ssh root@anyway.ro "pm2 restart anyway-ro"

# Verify deployment
echo "=== VERIFICATION ==="
ssh root@anyway.ro "pm2 list"
curl -I https://anyway.ro
curl -I https://anyway.ro/statistici

echo "=== THEME FIXES DEPLOYED ==="
echo "✅ Fixed hardcoded colors to use theme classes"
echo "✅ Fixed Select component import path"
echo "✅ Updated all color references for dark mode compatibility"
echo "✅ Statistics page should now work properly in both light and dark themes"