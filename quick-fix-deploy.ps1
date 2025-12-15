#!/usr/bin/env pwsh

Write-Host "Quick Fix Deploy - Demo Ads Persistence" -ForegroundColor Cyan

$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Uploading fixed files..." -ForegroundColor Yellow

# Upload admin page
scp "app/admin/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/admin/"
Write-Host "Admin page uploaded" -ForegroundColor Green

# Upload AdBanner
scp "components/ads/AdBanner.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/ads/"  
Write-Host "AdBanner uploaded" -ForegroundColor Green

Write-Host "Building and restarting..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "cd ${REMOTE_PATH} && npm run build && pm2 restart anyway-ro"

Write-Host "DEMO ADS FIX DEPLOYED!" -ForegroundColor Green
Write-Host "Now the toggle should:" -ForegroundColor Cyan
Write-Host "1. Save state on refresh" -ForegroundColor White
Write-Host "2. Show demo banners when enabled" -ForegroundColor White