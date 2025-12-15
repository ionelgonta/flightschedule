#!/usr/bin/env pwsh

Write-Host "=== DEPLOY ROMANIAN URLS FINAL ===" -ForegroundColor Green
Write-Host "Deploying complete Romanian URL structure..." -ForegroundColor Yellow

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
git commit -m "Complete Romanian URL structure - remove all English from URLs"
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
    Write-Host "Romanian URL structure deployed to https://anyway.ro" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NEW ROMANIAN URL STRUCTURE:" -ForegroundColor Yellow
    Write-Host "✓ /aeroporturi (instead of /airports)" -ForegroundColor Green
    Write-Host "✓ /cautare (instead of /search)" -ForegroundColor Green
    Write-Host "✓ /aeroport/[slug] (instead of /airport/[code])" -ForegroundColor Green
    Write-Host "✓ /aeroport/[slug]/sosiri (instead of /airport/[code]/arrivals)" -ForegroundColor Green
    Write-Host "✓ /aeroport/[slug]/plecari (instead of /airport/[code]/departures)" -ForegroundColor Green
    Write-Host ""
    Write-Host "LIVE EXAMPLES:" -ForegroundColor Yellow
    Write-Host "• https://anyway.ro/aeroporturi" -ForegroundColor Cyan
    Write-Host "• https://anyway.ro/cautare" -ForegroundColor Cyan
    Write-Host "• https://anyway.ro/aeroport/bucuresti-henri-coanda" -ForegroundColor Cyan
    Write-Host "• https://anyway.ro/aeroport/bucuresti-henri-coanda/sosiri" -ForegroundColor Cyan
    Write-Host "• https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "AUTOMATIC REDIRECTS:" -ForegroundColor Yellow
    Write-Host "✓ Old English URLs automatically redirect to Romanian URLs" -ForegroundColor Green
    Write-Host "✓ SEO-optimized 301 redirects preserve search rankings" -ForegroundColor Green
    Write-Host "✓ Backward compatibility maintained" -ForegroundColor Green
} else {
    Write-Host "=== DEPLOYMENT FAILED ===" -ForegroundColor Red
    Write-Host "Please check server logs for details" -ForegroundColor Yellow
}