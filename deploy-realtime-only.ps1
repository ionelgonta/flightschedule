#!/usr/bin/env pwsh

# Deploy Real-time ONLY Flight API - No demo data

Write-Host "🚀 Deploying REAL-TIME ONLY Flight API..." -ForegroundColor Green

$SERVER = "23.88.113.154"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host ""
Write-Host "⚠️  REAL-TIME ONLY MODE:" -ForegroundColor Red
Write-Host "• NO demo data fallback" -ForegroundColor Yellow
Write-Host "• If API fails, users see 'No flights available'" -ForegroundColor Yellow
Write-Host "• Requires valid API key for one of:" -ForegroundColor Yellow
Write-Host "  - AviationStack" -ForegroundColor White
Write-Host "  - FlightLabs" -ForegroundColor White
Write-Host "  - AirLabs" -ForegroundColor White
Write-Host ""

# Check if API key is configured
if (-not $env:AVIATIONSTACK_API_KEY -and -not $env:FLIGHTLABS_API_KEY -and -not $env:AIRLABS_API_KEY) {
    Write-Host "❌ ERROR: No API key found!" -ForegroundColor Red
    Write-Host "Please run: ./setup-realtime-api.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ API key found, proceeding with deployment..." -ForegroundColor Green

# Build locally
Write-Host ""
Write-Host "Building project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Copy files to server
Write-Host ""
Write-Host "Deploying to server..." -ForegroundColor Blue

scp lib/flightApiService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/realTimeFlightService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/flightRepository.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/

# Copy environment variables to server
Write-Host "Copying environment variables..." -ForegroundColor Yellow
if ($env:AVIATIONSTACK_API_KEY) {
    ssh ${USER}@${SERVER} "echo 'AVIATIONSTACK_API_KEY=${env:AVIATIONSTACK_API_KEY}' >> ${PROJECT_DIR}/.env.local"
    ssh ${USER}@${SERVER} "echo 'NEXT_PUBLIC_FLIGHT_API_PROVIDER=aviationstack' >> ${PROJECT_DIR}/.env.local"
}
if ($env:FLIGHTLABS_API_KEY) {
    ssh ${USER}@${SERVER} "echo 'FLIGHTLABS_API_KEY=${env:FLIGHTLABS_API_KEY}' >> ${PROJECT_DIR}/.env.local"
    ssh ${USER}@${SERVER} "echo 'NEXT_PUBLIC_FLIGHT_API_PROVIDER=flightlabs' >> ${PROJECT_DIR}/.env.local"
}
if ($env:AIRLABS_API_KEY) {
    ssh ${USER}@${SERVER} "echo 'AIRLABS_API_KEY=${env:AIRLABS_API_KEY}' >> ${PROJECT_DIR}/.env.local"
    ssh ${USER}@${SERVER} "echo 'NEXT_PUBLIC_FLIGHT_API_PROVIDER=airlabs' >> ${PROJECT_DIR}/.env.local"
}

# Rebuild on server
Write-Host "Rebuilding on server..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} "cd ${PROJECT_DIR} && npm run build && docker-compose down && docker-compose up -d --build"

Write-Host ""
Write-Host "✅ REAL-TIME ONLY deployment complete!" -ForegroundColor Green
Write-Host "🌐 Website: https://anyway.ro" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 What users will see:" -ForegroundColor Yellow
Write-Host "• Real-time flight data when API works" -ForegroundColor Green
Write-Host "• 'No flights available' when API fails" -ForegroundColor Red
Write-Host "• NO demo data ever" -ForegroundColor Yellow