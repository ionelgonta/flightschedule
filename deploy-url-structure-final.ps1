#!/usr/bin/env pwsh

Write-Host "=== DEPLOY URL STRUCTURE FINAL ===" -ForegroundColor Green
Write-Host "Deploying final URL structure fixes and English text removal..." -ForegroundColor Yellow

# Build the project
Write-Host "Building project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Blue

$deployCommand = @"
cd /root/flight-app && 
git pull origin main && 
docker-compose down && 
docker-compose up -d --build && 
docker ps
"@

ssh root@anyway.ro $deployCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== DEPLOYMENT SUCCESSFUL ===" -ForegroundColor Green
    Write-Host "Changes deployed to https://anyway.ro" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "FIXED ISSUES:" -ForegroundColor Yellow
    Write-Host "✓ Updated all airport links to use city-airport slugs instead of codes" -ForegroundColor Green
    Write-Host "✓ Fixed arrivals/departures URLs to use slug format" -ForegroundColor Green
    Write-Host "✓ Translated all remaining English text to Romanian" -ForegroundColor Green
    Write-Host "✓ Updated metadata descriptions to Romanian" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL EXAMPLES:" -ForegroundColor Yellow
    Write-Host "• https://anyway.ro/airport/bucuresti-henri-coanda" -ForegroundColor Cyan
    Write-Host "• https://anyway.ro/airport/bucuresti-henri-coanda/arrivals" -ForegroundColor Cyan
    Write-Host "• https://anyway.ro/airport/bucuresti-henri-coanda/departures" -ForegroundColor Cyan
} else {
    Write-Host "=== DEPLOYMENT FAILED ===" -ForegroundColor Red
    Write-Host "Please check server logs for details" -ForegroundColor Yellow
}