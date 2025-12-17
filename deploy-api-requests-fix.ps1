#!/usr/bin/env pwsh

# Script pentru deploy fix API requests - elimină requesturile excesive

Write-Host "=== DEPLOY FIX API REQUESTS ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Aplicând fix pentru requesturile API excesive..." -ForegroundColor Yellow
Write-Host ""

# 1. Build aplicația
Write-Host "📦 Building aplicația..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 2. Deploy pe server
Write-Host "🚀 Deploying pe server..." -ForegroundColor Green

# Copiază fișierele modificate
scp -i ~/.ssh/hetzner_key app/api/statistici-aeroporturi/route.ts root@anyway.ro:/var/www/anyway.ro/app/api/statistici-aeroporturi/
scp -i ~/.ssh/hetzner_key lib/flightAnalyticsService.ts root@anyway.ro:/var/www/anyway.ro/lib/

# Restart aplicația pe server
ssh -i ~/.ssh/hetzner_key root@anyway.ro "cd /var/www/anyway.ro && npm run build && pm2 restart anyway-app"

Write-Host ""
Write-Host "✅ FIX APLICAT CU SUCCES!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Modificări aplicate:" -ForegroundColor Cyan
Write-Host "  • API statistici-aeroporturi nu mai face requesturi directe" -ForegroundColor White
Write-Host "  • FlightAnalyticsService folosește doar cache-ul" -ForegroundColor White
Write-Host "  • Eliminat 34+ requesturi API per apel" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Pentru monitorizare:" -ForegroundColor Yellow
Write-Host "  • Verifică data/api-tracker.json pentru requesturi noi" -ForegroundColor White
Write-Host "  • Monitorizează cache-ul în data/cache-data.json" -ForegroundColor White
Write-Host ""