#!/usr/bin/env pwsh

# Deploy Real-time Flight API - Implements AeroDataBox integration with demo fallback

Write-Host "🚀 Deploying Real-time Flight API..." -ForegroundColor Green

# Server details
$SERVER = "23.88.113.154"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "📝 Real-time API Implementation:" -ForegroundColor Yellow
Write-Host "  - AeroDataBox API integration via API.Market" -ForegroundColor Green
Write-Host "  - Automatic fallback to demo data if API fails" -ForegroundColor Green
Write-Host "  - ICAO code mapping for Romanian airports" -ForegroundColor Green
Write-Host "  - Rate limiting and error handling" -ForegroundColor Green
Write-Host "  - Real delay calculation from actual vs scheduled times" -ForegroundColor Green

# Build locally first
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
scp lib/flightApiService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/aerodataboxService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/icaoMapping.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/

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
echo 'Real-time API is now active with demo fallback'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Real-time API Deployment successful!" -ForegroundColor Green
    Write-Host "Website: https://anyway.ro" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "How it works:" -ForegroundColor Yellow
    Write-Host "  1. Tries to fetch real-time data from AeroDataBox API" -ForegroundColor White
    Write-Host "  2. If API succeeds: Shows live flight information" -ForegroundColor Green
    Write-Host "  3. If API fails: Automatically falls back to realistic demo data" -ForegroundColor Yellow
    Write-Host "  4. Users always see flight information (real or demo)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "API Status:" -ForegroundColor Yellow
    Write-Host "  - API Key: cmj2peefi0001la04p5rkbbcc" -ForegroundColor White
    Write-Host "  - Provider: AeroDataBox via API.Market" -ForegroundColor White
    Write-Host "  - Rate Limit: 150 requests/minute" -ForegroundColor White
    Write-Host "  - Fallback: Demo data with Romanian formatting" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "Check server logs for details" -ForegroundColor Yellow
}