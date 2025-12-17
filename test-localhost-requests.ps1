#!/usr/bin/env pwsh

# Script pentru testarea requesturilor pe localhost

Write-Host "=== TEST LOCALHOST REQUESTS ===" -ForegroundColor Cyan
Write-Host ""

# Funcție pentru a afișa statistici API
function Show-ApiStats {
    if (Test-Path "data/api-tracker.json") {
        $tracker = Get-Content "data/api-tracker.json" | ConvertFrom-Json
        $totalRequests = $tracker.stats.totalRequests
        $recentRequests = $tracker.requests | Where-Object { 
            [DateTime]::Parse($_.timestamp) -gt (Get-Date).AddMinutes(-5) 
        }
        
        Write-Host "📊 API Stats:" -ForegroundColor Green
        Write-Host "  Total requests: $totalRequests" -ForegroundColor White
        Write-Host "  Last 5 minutes: $($recentRequests.Count)" -ForegroundColor White
        
        if ($recentRequests.Count -gt 0) {
            Write-Host "  Recent requests:" -ForegroundColor Yellow
            $recentRequests | ForEach-Object {
                $time = [DateTime]::Parse($_.timestamp).ToString("HH:mm:ss")
                Write-Host "    $time - $($_.airportCode) $($_.requestType)" -ForegroundColor Gray
            }
        }
        Write-Host ""
    } else {
        Write-Host "📊 No API tracker file found" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Test 1: Verifică starea inițială
Write-Host "🔍 Test 1: Starea inițială" -ForegroundColor Cyan
Show-ApiStats

# Test 2: Accesează pagina principală
Write-Host "🔍 Test 2: Accesez pagina principală..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    Write-Host "✅ Homepage loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Homepage failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

# Test 3: Accesează pagina aeroporturi
Write-Host "🔍 Test 3: Accesez pagina aeroporturi..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/aeroporturi" -TimeoutSec 10
    Write-Host "✅ Airports page loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Airports page failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

# Test 4: Accesează pagina OTP sosiri
Write-Host "🔍 Test 4: Accesez OTP sosiri..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/aeroport/otopeni/sosiri" -TimeoutSec 15
    Write-Host "✅ OTP arrivals loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ OTP arrivals failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

# Test 5: Accesează din nou OTP sosiri (pentru cache test)
Write-Host "🔍 Test 5: Accesez din nou OTP sosiri (cache test)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/aeroport/otopeni/sosiri" -TimeoutSec 10
    Write-Host "✅ OTP arrivals (2nd time) loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ OTP arrivals (2nd time) failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

# Test 6: Accesează OTP plecări
Write-Host "🔍 Test 6: Accesez OTP plecări..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/aeroport/otopeni/plecari" -TimeoutSec 15
    Write-Host "✅ OTP departures loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ OTP departures failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

# Test 7: Accesează API direct pentru statistici
Write-Host "🔍 Test 7: Accesez API statistici aeroporturi..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/statistici-aeroporturi" -TimeoutSec 15
    Write-Host "✅ Airport statistics API loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Airport statistics API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

# Test 8: Accesează din nou API statistici (cache test)
Write-Host "🔍 Test 8: Accesez din nou API statistici (cache test)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/statistici-aeroporturi" -TimeoutSec 10
    Write-Host "✅ Airport statistics API (2nd time) loaded (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Airport statistics API (2nd time) failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2
Show-ApiStats

Write-Host "🎯 REZULTATE FINALE:" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "data/api-tracker.json") {
    $tracker = Get-Content "data/api-tracker.json" | ConvertFrom-Json
    $totalRequests = $tracker.stats.totalRequests
    
    Write-Host "📊 Total requesturi API: $totalRequests" -ForegroundColor Yellow
    
    if ($totalRequests -eq 0) {
        Write-Host "✅ PERFECT! Nu s-au făcut requesturi API - cache-ul funcționează!" -ForegroundColor Green
    } elseif ($totalRequests -le 34) {
        Write-Host "✅ BINE! Requesturi în limita normală (max 34 pentru cron)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ATENȚIE! Prea multe requesturi - verifică cache-ul" -ForegroundColor Red
    }
    
    # Analizează tipurile de requesturi
    Write-Host ""
    Write-Host "📋 Breakdown pe tip:" -ForegroundColor Cyan
    $tracker.stats.requestsByType.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📋 Breakdown pe aeroport:" -ForegroundColor Cyan
    $tracker.stats.requestsByAirport.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor White
    }
} else {
    Write-Host "✅ PERFECT! Nu s-au făcut requesturi API!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== TEST COMPLET ===" -ForegroundColor Cyan