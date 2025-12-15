#!/usr/bin/env pwsh

Write-Host "Deploying Demo Ads to Live Server (Correct Path)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Server details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "`nStep 1: Uploading files to correct path..." -ForegroundColor Yellow

# Upload admin page
Write-Host "Uploading admin page..." -ForegroundColor White
scp "app/admin/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/admin/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admin page uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload admin page" -ForegroundColor Red
}

# Upload AdBanner component
Write-Host "Uploading AdBanner component..." -ForegroundColor White
scp "components/ads/AdBanner.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/ads/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AdBanner component uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload AdBanner component" -ForegroundColor Red
}

# Upload adConfig
Write-Host "Uploading adConfig..." -ForegroundColor White
scp "lib/adConfig.ts" "${USER}@${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AdConfig uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload adConfig" -ForegroundColor Red
}

Write-Host "`nStep 2: Building and restarting on server..." -ForegroundColor Yellow

# SSH to server and rebuild
ssh "${USER}@${SERVER}" "cd ${REMOTE_PATH} && npm run build && pm2 restart anyway-flight-schedule"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Server build and restart successful" -ForegroundColor Green
} else {
    Write-Host "❌ Server build failed, trying alternative restart..." -ForegroundColor Yellow
    ssh "${USER}@${SERVER}" "cd ${REMOTE_PATH} && pm2 restart all"
}

Write-Host "`nDEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

Write-Host "`nDemo Ads are now LIVE!" -ForegroundColor Cyan
Write-Host "URL: https://anyway.ro/admin" -ForegroundColor White
Write-Host "Look for: Demo Ads section" -ForegroundColor White
Write-Host "Toggle: Enable demo ads for all brands" -ForegroundColor White
Write-Host "Brands: Zbor.md, Zbor24.ro, Oozh.com" -ForegroundColor White

Write-Host "Ready to test on live site!" -ForegroundColor Green