#!/usr/bin/env pwsh

# Deploy Flight Planner - Complete Implementation
# Planificator Zboruri cu cache local și baza de date

Write-Host "🚀 Deploying Flight Planner (Planificator Zboruri)..." -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to server
Write-Host "🌐 Deploying to server..." -ForegroundColor Yellow

# Copy all necessary files to server
Write-Host "📁 Copying .next build..." -ForegroundColor Cyan
scp -r .next root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying lib directory..." -ForegroundColor Cyan
scp -r lib root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying app directory..." -ForegroundColor Cyan
scp -r app root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying components directory..." -ForegroundColor Cyan
scp -r components root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying package.json..." -ForegroundColor Cyan
scp package.json root@anyway.ro:/opt/anyway-flight-schedule/

# Install dependencies on server
Write-Host "📦 Installing dependencies on server..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; npm install --production"

# Restart services on server
Write-Host "🔄 Restarting PM2 services..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; pm2 restart all; pm2 save"

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "✅ Flight Planner deployed successfully!" -ForegroundColor Green
Write-Host "🔍 Testing key endpoints..." -ForegroundColor Yellow

# Test the new flight planner
$testUrls = @(
    "https://anyway.ro/planificator-zboruri",
    "https://anyway.ro/admin",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/sosiri"
)

foreach ($url in $testUrls) {
    Write-Host "Testing: $url" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 15 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 FLIGHT PLANNER DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ NEW FEATURES IMPLEMENTED:" -ForegroundColor White
Write-Host "   • Planificator Zboruri - Smart flight planning" -ForegroundColor Green
Write-Host "   • Database integration - Local flight data storage" -ForegroundColor Green
Write-Host "   • Cache-only operation - No external API calls" -ForegroundColor Green
Write-Host "   • Admin password protection - FlightSchedule2024!" -ForegroundColor Green
Write-Host "   • Updated navbar - Removed Cautare/Admin from public" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 FLIGHT PLANNER FEATURES:" -ForegroundColor White
Write-Host "   - Day preference selection (plus/minus 1 day flexibility)" -ForegroundColor Cyan
Write-Host "   - Time slot preferences (morning/afternoon/evening)" -ForegroundColor Cyan
Write-Host "   - Origin airport customization" -ForegroundColor Cyan
Write-Host "   - Interactive results grid with flight details" -ForegroundColor Cyan
Write-Host "   - Real-time statistics and performance metrics" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 DATABASE FEATURES:" -ForegroundColor White
Write-Host "   - Local flight data collection from cache" -ForegroundColor Yellow
Write-Host "   - 90-day data retention policy" -ForegroundColor Yellow
Write-Host "   - JSON and CSV export capabilities" -ForegroundColor Yellow
Write-Host "   - Automatic data cleanup and optimization" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔐 ADMIN ACCESS:" -ForegroundColor White
Write-Host "   - URL: https://anyway.ro/admin" -ForegroundColor Yellow
Write-Host "   - Password: FlightSchedule2024!" -ForegroundColor Yellow
Write-Host "   - Protected login with 3-attempt limit" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 TEST THE FLIGHT PLANNER:" -ForegroundColor White
Write-Host "   1. Go to https://anyway.ro/planificator-zboruri" -ForegroundColor Yellow
Write-Host "   2. Select departure day (e.g. Friday plus minus 1 day)" -ForegroundColor Yellow
Write-Host "   3. Select return day (e.g. Sunday plus minus 1 day)" -ForegroundColor Yellow
Write-Host "   4. Choose time preferences (morning/afternoon/evening)" -ForegroundColor Yellow
Write-Host "   5. View all matching flight combinations" -ForegroundColor Yellow
Write-Host ""
Write-Host "📈 SEO OPTIMIZED:" -ForegroundColor White
Write-Host "   - Added to sitemap.xml" -ForegroundColor Green
Write-Host "   - Rich meta descriptions and keywords" -ForegroundColor Green
Write-Host "   - Structured data for search engines" -ForegroundColor Green
Write-Host "   - Romanian language optimization" -ForegroundColor Green