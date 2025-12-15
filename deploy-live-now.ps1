#!/usr/bin/env pwsh

Write-Host "Deploying Demo Ads to Live Server..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Server details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/var/www/zbor.md"

Write-Host "`nStep 1: Creating deployment package..." -ForegroundColor Yellow

# Create a temporary deployment directory
$deployDir = "deploy-temp"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy essential files
Write-Host "Copying files..." -ForegroundColor White
Copy-Item "app/admin/page.tsx" "$deployDir/" -Force
Copy-Item "components/ads/AdBanner.tsx" "$deployDir/" -Force  
Copy-Item "lib/adConfig.ts" "$deployDir/" -Force
Copy-Item ".next" "$deployDir/" -Recurse -Force

Write-Host "`nStep 2: Uploading to server..." -ForegroundColor Yellow

# Upload admin page
scp "app/admin/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/admin/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Admin page uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to upload admin page" -ForegroundColor Red
}

# Upload AdBanner component
scp "components/ads/AdBanner.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/ads/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "AdBanner component uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to upload AdBanner component" -ForegroundColor Red
}

# Upload adConfig
scp "lib/adConfig.ts" "${USER}@${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "AdConfig uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to upload adConfig" -ForegroundColor Red
}

Write-Host "`nStep 3: Building on server..." -ForegroundColor Yellow

# SSH to server and rebuild
$buildCommands = @"
cd $REMOTE_PATH
npm run build
pm2 restart zbor-md
"@

ssh "${USER}@${SERVER}" $buildCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "Server build and restart successful" -ForegroundColor Green
} else {
    Write-Host "Server build failed" -ForegroundColor Red
}

# Cleanup
Remove-Item -Recurse -Force $deployDir -ErrorAction SilentlyContinue

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

Write-Host "`nDemo Ads are now LIVE on anyway.ro!" -ForegroundColor Cyan
Write-Host "Access: https://anyway.ro/admin" -ForegroundColor White
Write-Host "Look for: Demo Ads section" -ForegroundColor White
Write-Host "Toggle: Enable demo ads for Zbor.md, Zbor24.ro, Oozh.com" -ForegroundColor White

Write-Host "`nReady to test live!" -ForegroundColor Green