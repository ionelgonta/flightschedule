#!/usr/bin/env pwsh

# Script rapid pentru deploy AdSense Admin
Write-Host "⚡ Deploy rapid AdSense Admin" -ForegroundColor Green

# Build rapid
Write-Host "🔨 Build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy cu Docker
Write-Host "🐳 Docker deploy..." -ForegroundColor Yellow
docker-compose down
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker deploy failed!" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Aștept 10 secunde..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test rapid
Write-Host "🧪 Test rapid..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method GET -TimeoutSec 5
    if ($response.success) {
        Write-Host "✅ Deploy reușit!" -ForegroundColor Green
        Write-Host "🎯 Admin: http://localhost:3000/admin" -ForegroundColor Cyan
        Write-Host "📝 Publisher ID: $($response.publisherId)" -ForegroundColor Blue
    } else {
        Write-Host "⚠️ API nu răspunde corect" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Nu pot testa API-ul, dar deploy-ul poate fi reușit" -ForegroundColor Yellow
    Write-Host "🎯 Verifică manual: http://localhost:3000/admin" -ForegroundColor Cyan
}

Write-Host "`n🎉 Gata! Verifică: http://localhost:3000/admin" -ForegroundColor Green