#!/usr/bin/env pwsh

Write-Host "=== DEPLOY BUCHAREST & FAVICON FIX ===" -ForegroundColor Green
Write-Host "Fixing Bucharest and adding blue airplane favicon..." -ForegroundColor Yellow

# Build the project
Write-Host "Building project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Commit and push changes
Write-Host "Committing changes..." -ForegroundColor Blue
git add .
git commit -m "Fix Bucharest to Bucuresti and add blue airplane favicon"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed!" -ForegroundColor Red
    exit 1
}

# Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Blue

$deployCommand = @"
cd /root/flight-app && 
git reset --hard HEAD && 
git clean -fd && 
git pull origin main && 
docker-compose down && 
docker-compose up -d --build
"@

ssh root@anyway.ro $deployCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== DEPLOYMENT SUCCESSFUL ===" -ForegroundColor Green
    Write-Host "Fixes deployed to https://anyway.ro" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "FIXES APPLIED:" -ForegroundColor Yellow
    Write-Host "- Bucharest changed to Bucuresti" -ForegroundColor Green
    Write-Host "- Blue airplane favicon added" -ForegroundColor Green
    Write-Host "- Favicon visible in browser tabs" -ForegroundColor Green
    Write-Host ""
    Write-Host "LIVE SITE: https://anyway.ro" -ForegroundColor Cyan
} else {
    Write-Host "=== DEPLOYMENT FAILED ===" -ForegroundColor Red
    Write-Host "Please check server logs" -ForegroundColor Yellow
}