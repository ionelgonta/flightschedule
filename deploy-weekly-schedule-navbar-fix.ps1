#!/usr/bin/env pwsh

Write-Host "🚀 Deploying Weekly Schedule Navbar Fix..." -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to server
Write-Host "🌐 Deploying to server..." -ForegroundColor Yellow
scp -r .next root@anyway.ro:/opt/anyway-flight-schedule/
scp components/Navbar.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/
scp components/Footer.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/

# Restart PM2 processes
Write-Host "🔄 Restarting PM2 processes..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && pm2 restart all"

Write-Host "✅ Weekly Schedule Navbar Fix deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Live at: https://anyway.ro/program-saptamanal" -ForegroundColor Cyan