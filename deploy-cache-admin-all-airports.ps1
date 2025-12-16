#!/usr/bin/env pwsh

# Cache Admin Integration for ALL Airports - Deployment Script
# Fixes cache configuration to respect admin settings for ALL airports (sosiri/plecări)

Write-Host "🚀 Deploying Cache Admin Integration for ALL Airports..." -ForegroundColor Green

# Build the project
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to server
Write-Host "🚀 Deploying to server..." -ForegroundColor Yellow

# Copy files to server
scp -r .next root@anyway.ro:/opt/anyway-flight-schedule/
scp -r app root@anyway.ro:/opt/anyway-flight-schedule/
scp -r lib root@anyway.ro:/opt/anyway-flight-schedule/

# Restart services on server
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; pm2 restart anyway-ro"

Write-Host "✅ Cache Admin Integration deployed successfully for ALL airports!" -ForegroundColor Green
Write-Host "🔧 Fixed cache configuration for:" -ForegroundColor Cyan
Write-Host "   - ALL 16 Romanian and Moldovan airports" -ForegroundColor White
Write-Host "   - Both Romanian pages (/aeroport/[code]/plecari, /aeroport/[code]/sosiri)" -ForegroundColor White
Write-Host "   - Both English pages (/airport/[code]/departures, /airport/[code]/arrivals)" -ForegroundColor White
Write-Host "   - Auto-refresh now respects admin 'Real-time Cache' interval setting" -ForegroundColor White
Write-Host "   - FlightRepository cache duration updated from admin settings" -ForegroundColor White

Write-Host "🌐 Test any airport:" -ForegroundColor Blue
Write-Host "   - https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari" -ForegroundColor White
Write-Host "   - https://anyway.ro/aeroport/cluj-napoca/sosiri" -ForegroundColor White
Write-Host "   - https://anyway.ro/aeroport/timisoara-traian-vuia/plecari" -ForegroundColor White
Write-Host "   - https://anyway.ro/aeroport/chisinau-chisinau/sosiri" -ForegroundColor White