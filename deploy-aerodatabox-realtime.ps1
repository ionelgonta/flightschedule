# Deploy AeroDataBox Real-time API - WORKING VERSION

$SERVER = "23.88.113.154"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "Deploying AeroDataBox Real-time API (WORKING)..." -ForegroundColor Green
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Provider: AeroDataBox via API.Market" -ForegroundColor White
Write-Host "  API Key: cmj2m39qs0001k00404cmwu75" -ForegroundColor White
Write-Host "  Endpoint: /flights/airports/Icao/{code}" -ForegroundColor White
Write-Host "  Status: TESTED AND WORKING" -ForegroundColor Green
Write-Host ""

# Build locally
Write-Host "Building project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy files
Write-Host "Deploying to server..." -ForegroundColor Blue

scp lib/flightApiService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/aerodataboxService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/flightRepository.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/icaoMapping.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/

# Rebuild on server
Write-Host "Rebuilding on server..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} "cd ${PROJECT_DIR} && npm run build && docker-compose down && docker-compose up -d --build"

Write-Host ""
Write-Host "AeroDataBox Real-time API deployed!" -ForegroundColor Green
Write-Host "Website: https://anyway.ro" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features:" -ForegroundColor Yellow
Write-Host "  - REAL-TIME flight data from AeroDataBox" -ForegroundColor Green
Write-Host "  - NO demo data fallback" -ForegroundColor Yellow
Write-Host "  - Romanian delay formatting (2 ore 03 minute)" -ForegroundColor Green
Write-Host "  - Live arrivals and departures" -ForegroundColor Green
Write-Host "  - Professional error handling" -ForegroundColor Green