Write-Host "=== DEPLOYING DARK THEME FIXES ===" -ForegroundColor Green

# Upload fixed files
Write-Host "Uploading theme-fixed files..." -ForegroundColor Yellow
scp app/statistici/page.tsx root@anyway.ro:/opt/anyway-flight-schedule/app/statistici/
scp select-simple.tsx root@anyway.ro:/opt/anyway-flight-schedule/
scp components/ui/card.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/ui/
scp components/ui/button.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/ui/

# Build and restart
Write-Host "Building application..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

Write-Host "Restarting PM2..." -ForegroundColor Yellow
ssh root@anyway.ro "pm2 restart anyway-ro"

# Verify deployment
Write-Host "=== VERIFICATION ===" -ForegroundColor Green
ssh root@anyway.ro "pm2 list"
curl -I https://anyway.ro
curl -I https://anyway.ro/statistici

Write-Host "=== THEME FIXES DEPLOYED ===" -ForegroundColor Green
Write-Host "✅ Fixed hardcoded colors to use theme classes" -ForegroundColor Cyan
Write-Host "✅ Fixed Select component import path" -ForegroundColor Cyan
Write-Host "✅ Updated all color references for dark mode compatibility" -ForegroundColor Cyan
Write-Host "✅ Statistics page should now work properly in both light and dark themes" -ForegroundColor Cyan