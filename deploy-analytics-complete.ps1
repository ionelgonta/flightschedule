#!/usr/bin/env pwsh

Write-Host "=== DEPLOYING FLIGHT ANALYTICS SYSTEM ===" -ForegroundColor Green

# Build the project
Write-Host "Building Next.js project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Yellow

# Upload files to server
scp -r .next package.json package-lock.json root@anyway.ro:/opt/anyway-flight-schedule/

# Install dependencies and restart on server
ssh root@anyway.ro @"
cd /opt/anyway-flight-schedule
npm ci --production
pm2 restart anyway-ro
pm2 save
"@

Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Analytics system deployed successfully!" -ForegroundColor Cyan
Write-Host ""
Write-Host "New pages available:" -ForegroundColor Yellow
Write-Host "- /aeroport/[code]/program-zboruri - Flight Schedules" -ForegroundColor White
Write-Host "- /aeroport/[code]/statistici - Airport Statistics" -ForegroundColor White  
Write-Host "- /aeroport/[code]/istoric-zboruri - Historical Analysis" -ForegroundColor White
Write-Host "- /aeroport/[code]/analize-zboruri - Flight Analytics" -ForegroundColor White
Write-Host "- /aeronave - Aircraft Catalog" -ForegroundColor White
Write-Host "- /aeronave/[icao24] - Aircraft Details" -ForegroundColor White
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor Yellow
Write-Host "- https://anyway.ro/aeroport/bucuresti-henri-coanda/statistici" -ForegroundColor Cyan
Write-Host "- https://anyway.ro/aeroport/bucuresti-henri-coanda/program-zboruri" -ForegroundColor Cyan
Write-Host "- https://anyway.ro/aeronave" -ForegroundColor Cyan