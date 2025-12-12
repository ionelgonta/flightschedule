# Deploy API Update Script pentru anyway.ro (PowerShell)
# Actualizează codul cu noua implementare API și ICAO mapping

Write-Host "🚀 Starting API update deployment for anyway.ro..." -ForegroundColor Green

# Verifică dacă suntem pe server (adaptează pentru Windows dacă e necesar)
if (-not (Test-Path "C:\opt\anyway-flight-schedule" -ErrorAction SilentlyContinue)) {
    if (-not (Test-Path "/opt/anyway-flight-schedule" -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: Not on production server. Run this script on 23.88.113.154" -ForegroundColor Red
        exit 1
    }
    $projectPath = "/opt/anyway-flight-schedule"
} else {
    $projectPath = "C:\opt\anyway-flight-schedule"
}

Set-Location $projectPath

Write-Host "📦 Backing up current deployment..." -ForegroundColor Yellow
$backupName = "anyway-flight-schedule-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
try {
    Copy-Item -Path "." -Destination "../$backupName" -Recurse -ErrorAction SilentlyContinue
    Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backup failed, continuing..." -ForegroundColor Yellow
}

Write-Host "🔄 Pulling latest code..." -ForegroundColor Cyan
git pull origin main

Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local with API configuration..." -ForegroundColor Yellow
    
    $envContent = @"
# API.Market Configuration
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2m39qs0001k00404cmwu75
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_DEBUG_FLIGHTS=false
"@
    
    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✅ Created .env.local with API configuration" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host "🏗️ Building application with new API integration..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host "🔄 Restarting services..." -ForegroundColor Cyan
docker-compose down
docker-compose up -d

Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🔍 Checking service status..." -ForegroundColor Cyan
docker-compose ps

Write-Host "📊 Checking application logs..." -ForegroundColor Cyan
docker-compose logs app --tail=20

Write-Host "🧪 Testing API integration..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Test API endpoint
Write-Host "Testing OTP arrivals endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/flights/OTP/arrivals" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API endpoint test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ API endpoint returned: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application should be available at:" -ForegroundColor Cyan
Write-Host "   - https://anyway.ro" -ForegroundColor White
Write-Host "   - https://anyway.ro/airport/OTP/arrivals" -ForegroundColor White
Write-Host "   - https://anyway.ro/airport/CLJ/departures" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test flight data loading on website" -ForegroundColor White
Write-Host "2. Check browser console for any errors" -ForegroundColor White
Write-Host "3. Verify API key is working (check for 404 errors)" -ForegroundColor White
Write-Host "4. Monitor logs: docker-compose logs app -f" -ForegroundColor White
Write-Host ""
Write-Host "🔑 If API key returns 404 errors:" -ForegroundColor Yellow
Write-Host "1. Check API.Market dashboard for key validity" -ForegroundColor White
Write-Host "2. Verify credits/subscription status" -ForegroundColor White
Write-Host "3. Update API key in .env.local if needed" -ForegroundColor White
Write-Host "4. Restart: docker-compose restart" -ForegroundColor White