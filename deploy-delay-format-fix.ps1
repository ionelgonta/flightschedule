#!/usr/bin/env pwsh

# Deploy Delay Format Fix - Updates delay display to Romanian format
# Fixes: "123 minute" -> "1 ora 43 min" and removes Blue Air (0B)

Write-Host "🚀 Deploying delay format fix to Hetzner server..." -ForegroundColor Green

# Server details
$SERVER = "23.88.113.154"
$USER = "root"
$PROJECT_DIR = "/root/flight-schedule"

Write-Host "Changes being deployed:" -ForegroundColor Yellow
Write-Host "  - Added formatDelayInRomanian() function" -ForegroundColor Green
Write-Host "  - Updated FlightCard to use Romanian delay format" -ForegroundColor Green
Write-Host "  - Removed Blue Air (0B) from airlines list" -ForegroundColor Green
Write-Host "  - Updated Alitalia to ITA Airways (current name)" -ForegroundColor Green

# Build and deploy
Write-Host ""
Write-Host "Building project locally..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host ""
Write-Host "Deploying to server..." -ForegroundColor Blue

# Copy updated files
Write-Host "Copying updated files..." -ForegroundColor Yellow
scp lib/demoFlightData.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp components/flights/FlightCard.tsx ${USER}@${SERVER}:${PROJECT_DIR}/components/flights/

# SSH and rebuild on server
Write-Host "Rebuilding on server..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} @"
cd ${PROJECT_DIR}
echo 'Installing dependencies...'
npm install

echo 'Building project...'
npm run build

echo 'Restarting services...'
docker-compose down
docker-compose up -d --build

echo 'Deployment complete!'
echo 'Website: https://anyway.ro'
echo 'Check flight pages to see Romanian delay format'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "Website: https://anyway.ro" -ForegroundColor Cyan
    Write-Host "Test delay formatting on any airport page" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Changes deployed:" -ForegroundColor Yellow
    Write-Host "  - Delays now show as '1 ora 43 min' instead of '123 minute'" -ForegroundColor Green
    Write-Host "  - Blue Air (0B) removed from demo data" -ForegroundColor Green
    Write-Host "  - Updated airline list to current 2024 operators" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "Check server logs for details" -ForegroundColor Yellow
}