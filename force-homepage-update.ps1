#!/usr/bin/env pwsh

Write-Host "Force updating homepage with cache clear..." -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

# Upload homepage again
Write-Host "Re-uploading homepage..." -ForegroundColor Yellow
scp "app/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/"

# Force rebuild with cache clear
Write-Host "Force rebuilding with cache clear..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" @"
cd ${REMOTE_PATH}
rm -rf .next
npm run build
pm2 restart anyway-ro
pm2 save
"@

Write-Host "Force update completed!" -ForegroundColor Green