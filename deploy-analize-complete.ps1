#!/usr/bin/env pwsh

Write-Host "🚀 Deploying Complete Analytics Pages..." -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "🚀 Deploying to server..." -ForegroundColor Yellow

# Copy files to server
scp -r .next root@anyway.ro:/opt/anyway-flight-schedule/
scp -r app root@anyway.ro:/opt/anyway-flight-schedule/
scp -r components root@anyway.ro:/opt/anyway-flight-schedule/
scp -r lib root@anyway.ro:/opt/anyway-flight-schedule/
scp package.json root@anyway.ro:/opt/anyway-flight-schedule/
scp next.config.js root@anyway.ro:/opt/anyway-flight-schedule/

# Restart PM2 processes
Write-Host "🔄 Restarting PM2 processes..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; pm2 restart all"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Analytics pages available at:" -ForegroundColor Cyan
Write-Host "   - https://anyway.ro/statistici-aeroporturi" -ForegroundColor White
Write-Host "   - https://anyway.ro/program-zboruri" -ForegroundColor White
Write-Host "   - https://anyway.ro/analize-istorice" -ForegroundColor White
Write-Host "   - https://anyway.ro/analize-rute" -ForegroundColor White