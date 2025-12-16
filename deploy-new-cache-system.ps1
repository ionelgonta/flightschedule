#!/usr/bin/env pwsh

Write-Host "🚀 Deploying New Cache Management System..." -ForegroundColor Green

# Verifică dacă suntem în directorul corect
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Eroare: Nu suntem în directorul proiectului!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Creează directorul data dacă nu există
Write-Host "📁 Creating data directory..." -ForegroundColor Yellow
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" -Force
    Write-Host "✅ Data directory created!" -ForegroundColor Green
} else {
    Write-Host "✅ Data directory already exists!" -ForegroundColor Green
}

# Verifică fișierele necesare
$requiredFiles = @(
    "lib/cacheManager.ts",
    "app/api/admin/cache-management/route.ts",
    "components/admin/CacheManagement.tsx"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔄 Deploying to server..." -ForegroundColor Yellow

# Deploy la server
scp -r .next package.json lib components app data root@anyway.ro:/var/www/anyway.ro/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Restarting services on server..." -ForegroundColor Yellow

# Restart servicii pe server
ssh root@anyway.ro @"
cd /var/www/anyway.ro
npm install --production
pm2 restart anyway-ro
pm2 restart anyway-ro-api
pm2 save
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Service restart failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ New Cache Management System deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 New Features:" -ForegroundColor Cyan
Write-Host "  • Cron jobs configurabile pentru toate categoriile" -ForegroundColor White
Write-Host "  • Cache persistent în baza de date" -ForegroundColor White
Write-Host "  • Contorizare exactă per categorie" -ForegroundColor White
Write-Host "  • Butoane refresh manual" -ForegroundColor White
Write-Host "  • Eliminare completă date demo" -ForegroundColor White
Write-Host "  • Toate intervalele configurabile din admin" -ForegroundColor White
Write-Host ""
Write-Host "📋 Cache Categories:" -ForegroundColor Cyan
Write-Host "  • Flight Data: Cron la 60 min (configurabil)" -ForegroundColor White
Write-Host "  • Analytics: Cron la 30 zile, cache 360 zile (configurabil)" -ForegroundColor White
Write-Host "  • Aircraft: Cron la 360 zile, cache 360 zile (configurabil)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Access: https://anyway.ro/admin" -ForegroundColor Cyan
Write-Host "Password: FlightSchedule2024!" -ForegroundColor Yellow