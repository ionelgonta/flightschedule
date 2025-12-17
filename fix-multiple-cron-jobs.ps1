#!/usr/bin/env pwsh

# Script pentru a fixa problema cu multiple cron jobs

Write-Host "=== FIX MULTIPLE CRON JOBS ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Oprind toate procesele Node.js..." -ForegroundColor Yellow

# Oprește toate procesele Node.js locale
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ Procese locale oprite" -ForegroundColor Green

# Oprește procesele pe server
Write-Host "🔧 Oprind procesele pe server..." -ForegroundColor Yellow

ssh -i ~/.ssh/hetzner_key root@anyway.ro "pm2 stop all && pm2 delete all"

Write-Host "✅ Procese server oprite" -ForegroundColor Green

# Curăță fișierele de tracking
Write-Host "🔧 Curățând fișierele de tracking..." -ForegroundColor Yellow

if (Test-Path "data/api-tracker.json") {
    $backup = "data/api-tracker-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Copy-Item "data/api-tracker.json" $backup
    Write-Host "  📋 Backup creat: $backup" -ForegroundColor Gray
    
    # Resetează tracker-ul
    $resetData = @{
        requests = @()
        stats = @{
            totalRequests = 0
            successfulRequests = 0
            failedRequests = 0
            requestsByType = @{}
            requestsByAirport = @{}
            lastRequest = $null
            firstRequest = $null
            totalDuration = 0
            averageDuration = 0
            currentMonth = (Get-Date -Format "yyyy-MM")
            monthlyStats = @{}
        }
        lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    $resetData | ConvertTo-Json -Depth 10 | Set-Content "data/api-tracker.json"
    
    Write-Host "  🗑️  API tracker resetat" -ForegroundColor Gray
}

if (Test-Path "data/request-counter.json") {
    Remove-Item "data/request-counter.json"
    Write-Host "  🗑️  Request counter șters" -ForegroundColor Gray
}

Write-Host "✅ Fișiere curățate" -ForegroundColor Green

# Build și deploy fix-ul
Write-Host "🔧 Building și deploying fix-ul..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build reușit" -ForegroundColor Green
    
    # Deploy pe server
    Write-Host "🚀 Deploying pe server..." -ForegroundColor Yellow
    
    # Copiază fișierele fixate
    scp -i ~/.ssh/hetzner_key lib/cacheManager.ts root@anyway.ro:/var/www/anyway.ro/lib/
    scp -i ~/.ssh/hetzner_key lib/flightAnalyticsService.ts root@anyway.ro:/var/www/anyway.ro/lib/
    scp -i ~/.ssh/hetzner_key lib/flightRepository.ts root@anyway.ro:/var/www/anyway.ro/lib/
    
    # Rebuild și restart pe server
    ssh -i ~/.ssh/hetzner_key root@anyway.ro "cd /var/www/anyway.ro; npm run build; pm2 start ecosystem.config.js"
    
    Write-Host "✅ Deploy complet" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 FIX APLICAT CU SUCCES!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Modificări aplicate:" -ForegroundColor Cyan
Write-Host "  • Cache Manager se inițializează doar o dată" -ForegroundColor White
Write-Host "  • Prevenit cron jobs duplicate" -ForegroundColor White
Write-Host "  • API tracker resetat" -ForegroundColor White
Write-Host "  • Procese restart cu configurație curată" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Pentru monitorizare:" -ForegroundColor Yellow
Write-Host "  • Verifică data/api-tracker.json pentru requesturi noi" -ForegroundColor White
Write-Host "  • Ar trebui sa vezi max 34 requesturi per ora (17 aeroporturi x 2)" -ForegroundColor White
Write-Host ""