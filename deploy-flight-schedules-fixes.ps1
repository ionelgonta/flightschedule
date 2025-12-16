#!/usr/bin/env pwsh

# Flight Schedules Display Fixes Deployment Script
# Fixes: compact design, airport mapping, airline names, smart status detection

Write-Host "🚀 Deploying Flight Schedules Display Fixes..." -ForegroundColor Green

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
scp -r components root@anyway.ro:/opt/anyway-flight-schedule/
scp -r lib root@anyway.ro:/opt/anyway-flight-schedule/
scp package.json root@anyway.ro:/opt/anyway-flight-schedule/

# Restart services on server
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; pm2 restart anyway-flight-schedule"

Write-Host "✅ Flight Schedules Display Fixes deployed successfully!" -ForegroundColor Green
Write-Host "🔧 Fixed issues:" -ForegroundColor Cyan
Write-Host "   - Made design more compact (reduced padding)" -ForegroundColor White
Write-Host "   - Fixed airport city mapping (added KTW=Katowice, etc.)" -ForegroundColor White
Write-Host "   - Fixed airline name display (added 5F=FlyOne, etc.)" -ForegroundColor White
Write-Host "   - Added smart status detection (Decolat/Aterizat for past flights)" -ForegroundColor White
Write-Host "   - Improved unknown airport handling" -ForegroundColor White

Write-Host "🌐 Live site: https://anyway.ro/program-zboruri" -ForegroundColor Blue