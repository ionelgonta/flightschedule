#!/usr/bin/env pwsh

Write-Host "=== DEPLOY ROMANIAN TRANSLATIONS & DESPRE PAGE ===" -ForegroundColor Green
Write-Host "Translating International Airport, Romania to România, and adding About page..." -ForegroundColor Yellow

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
git commit -m "Complete Romanian translations and add Despre page with SEO content"
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
    Write-Host "Romanian translations and About page deployed to https://anyway.ro" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "CHANGES APPLIED:" -ForegroundColor Yellow
    Write-Host "- International Airport -> Aeroportul International" -ForegroundColor Green
    Write-Host "- Romania -> România (with diacritics)" -ForegroundColor Green
    Write-Host "- Added /despre page with SEO-optimized content" -ForegroundColor Green
    Write-Host "- Updated navigation with Despre link" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEW PAGES:" -ForegroundColor Yellow
    Write-Host "- https://anyway.ro/despre (About page in Romanian)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "LIVE SITE: https://anyway.ro" -ForegroundColor Cyan
} else {
    Write-Host "=== DEPLOYMENT FAILED ===" -ForegroundColor Red
    Write-Host "Please check server logs" -ForegroundColor Yellow
}