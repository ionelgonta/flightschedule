#!/usr/bin/env pwsh

# Script pentru deploy AdSense Admin pe serverul live
Write-Host "🚀 Deploy AdSense Admin pe serverul live" -ForegroundColor Green

# Verifică dacă există configurația de deploy
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Nu s-a găsit docker-compose.yml. Asigură-te că ești în directorul corect." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Fișiere noi/modificate pentru AdSense Admin:" -ForegroundColor Cyan
Write-Host "• app/api/admin/adsense/route.ts (NOU)" -ForegroundColor Green
Write-Host "• app/admin/page.tsx (MODIFICAT)" -ForegroundColor Yellow
Write-Host "• lib/adConfig.ts (Publisher ID: ca-pub-2305349540791838)" -ForegroundColor Blue

# Verifică dacă serverul rulează
Write-Host "`n🔍 Verifică statusul serverului..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Serverul local rulează pe localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Serverul local nu rulează. Pornesc serverul..." -ForegroundColor Yellow
    
    # Pornește serverul local pentru testare
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
    Start-Sleep -Seconds 8
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Serverul local pornit cu succes!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Nu pot porni serverul local. Verifică configurația." -ForegroundColor Red
        exit 1
    }
}

# Testează API-ul AdSense local
Write-Host "`n🧪 Testez API-ul AdSense local..." -ForegroundColor Cyan
try {
    $localTest = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method GET -TimeoutSec 10
    if ($localTest.success) {
        Write-Host "✅ API AdSense funcționează local!" -ForegroundColor Green
        Write-Host "   Publisher ID: $($localTest.publisherId)" -ForegroundColor Blue
    } else {
        Write-Host "❌ API AdSense nu funcționează local!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Eroare la testarea API-ului local: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Build pentru producție
Write-Host "`n🔨 Build pentru producție..." -ForegroundColor Yellow
try {
    $buildResult = & npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completat cu succes!" -ForegroundColor Green
    } else {
        Write-Host "❌ Eroare la build:" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Eroare la build: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy cu Docker
Write-Host "`n🐳 Deploy cu Docker..." -ForegroundColor Yellow
try {
    # Oprește containerele existente
    Write-Host "Opresc containerele existente..." -ForegroundColor Gray
    & docker-compose down 2>$null
    
    # Rebuild și pornește containerele
    Write-Host "Rebuild și pornesc containerele..." -ForegroundColor Gray
    $dockerResult = & docker-compose up -d --build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker deploy completat!" -ForegroundColor Green
    } else {
        Write-Host "❌ Eroare la Docker deploy:" -ForegroundColor Red
        Write-Host $dockerResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Eroare la Docker deploy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Așteaptă ca serverul să pornească
Write-Host "`n⏳ Aștept ca serverul să pornească..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verifică serverul live
Write-Host "`n🌐 Verifică serverul live..." -ForegroundColor Cyan

# Încearcă să detecteze portul live
$livePorts = @(3000, 80, 8080, 3001)
$liveUrl = $null

foreach ($port in $livePorts) {
    try {
        $testUrl = "http://localhost:$port"
        $response = Invoke-WebRequest -Uri $testUrl -TimeoutSec 5 -ErrorAction Stop
        $liveUrl = $testUrl
        Write-Host "✅ Serverul live găsit pe portul $port" -ForegroundColor Green
        break
    } catch {
        # Continuă să caute
    }
}

if (-not $liveUrl) {
    Write-Host "❌ Nu pot găsi serverul live. Verifică manual porturile." -ForegroundColor Red
    Write-Host "Porturile verificate: $($livePorts -join ', ')" -ForegroundColor Yellow
    exit 1
}

# Testează API-ul AdSense pe live
Write-Host "`n🧪 Testez API-ul AdSense pe live..." -ForegroundColor Cyan
try {
    $liveApiUrl = "$liveUrl/api/admin/adsense"
    $liveTest = Invoke-RestMethod -Uri $liveApiUrl -Method GET -TimeoutSec 10
    
    if ($liveTest.success) {
        Write-Host "✅ API AdSense funcționează pe live!" -ForegroundColor Green
        Write-Host "   Publisher ID: $($liveTest.publisherId)" -ForegroundColor Blue
        Write-Host "   URL API: $liveApiUrl" -ForegroundColor Gray
    } else {
        Write-Host "❌ API AdSense nu funcționează pe live!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Eroare la testarea API-ului live: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifică manual: $liveUrl/api/admin/adsense" -ForegroundColor Yellow
}

# Testează pagina de admin pe live
Write-Host "`n🎯 Testez pagina de admin pe live..." -ForegroundColor Cyan
try {
    $adminUrl = "$liveUrl/admin"
    $adminResponse = Invoke-WebRequest -Uri $adminUrl -TimeoutSec 10 -ErrorAction Stop
    
    if ($adminResponse.StatusCode -eq 200) {
        Write-Host "✅ Pagina de admin funcționează pe live!" -ForegroundColor Green
        Write-Host "   URL Admin: $adminUrl" -ForegroundColor Blue
    } else {
        Write-Host "❌ Pagina de admin nu răspunde corect!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Eroare la accesarea paginii de admin: $($_.Exception.Message)" -ForegroundColor Red
}

# Rezumat final
Write-Host "`n🎉 Deploy AdSense Admin completat!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n📋 URL-uri pentru verificare:" -ForegroundColor Magenta
Write-Host "🌐 Site Live: $liveUrl" -ForegroundColor Cyan
Write-Host "🎯 Admin Panel: $liveUrl/admin" -ForegroundColor Cyan
Write-Host "🔧 API AdSense: $liveUrl/api/admin/adsense" -ForegroundColor Cyan

Write-Host "`n🔍 Cum să verifici funcționalitatea:" -ForegroundColor Magenta
Write-Host "1. Accesează: $liveUrl/admin" -ForegroundColor White
Write-Host "2. Selectează tab-ul 'Google AdSense'" -ForegroundColor White
Write-Host "3. Verifică Publisher ID curent: ca-pub-2305349540791838" -ForegroundColor White
Write-Host "4. Testează modificarea Publisher ID-ului" -ForegroundColor White
Write-Host "5. Verifică salvarea și validarea" -ForegroundColor White

Write-Host "`n📱 Test rapid din browser:" -ForegroundColor Magenta
Write-Host "• Deschide: $liveUrl/admin" -ForegroundColor White
Write-Host "• Caută secțiunea 'Configurare Google AdSense Publisher ID'" -ForegroundColor White
Write-Host "• Testează cu un Publisher ID nou (ex: ca-pub-1234567890123456)" -ForegroundColor White

Write-Host "`n🛠️ Comenzi utile pentru debugging:" -ForegroundColor Magenta
Write-Host "• docker-compose logs -f (vezi log-urile)" -ForegroundColor Gray
Write-Host "• docker-compose ps (vezi statusul containerelor)" -ForegroundColor Gray
Write-Host "• curl $liveUrl/api/admin/adsense (testează API direct)" -ForegroundColor Gray

# Oprește serverul local de dezvoltare dacă rulează
Write-Host "`n🧹 Curăț procesele locale..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ Gata! Funcționalitatea AdSense Admin este live!" -ForegroundColor Green