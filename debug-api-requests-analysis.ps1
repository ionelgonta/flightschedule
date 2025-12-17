#!/usr/bin/env pwsh

# Script pentru analiza requesturilor API și identificarea problemelor

Write-Host "=== ANALIZA REQUESTURILOR API AERODATABOX ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verifică fișierul de tracking
if (Test-Path "data/api-tracker.json") {
    Write-Host "📊 Statistici API Tracker:" -ForegroundColor Green
    $tracker = Get-Content "data/api-tracker.json" | ConvertFrom-Json
    
    Write-Host "Total requesturi: $($tracker.stats.totalRequests)" -ForegroundColor Yellow
    Write-Host "Requesturi reușite: $($tracker.stats.successfulRequests)" -ForegroundColor Green
    Write-Host "Requesturi eșuate: $($tracker.stats.failedRequests)" -ForegroundColor Red
    Write-Host "Durata medie: $([math]::Round($tracker.stats.averageDuration, 2))ms" -ForegroundColor Cyan
    Write-Host ""
    
    # Analizează requesturile pe aeroport
    Write-Host "📍 Requesturi pe aeroport:" -ForegroundColor Green
    $tracker.stats.requestsByAirport.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value) requesturi" -ForegroundColor White
    }
    Write-Host ""
    
    # Analizează requesturile pe tip
    Write-Host "🛫 Requesturi pe tip:" -ForegroundColor Green
    $tracker.stats.requestsByType.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value) requesturi" -ForegroundColor White
    }
    Write-Host ""
    
    # Analizează ultimele 10 requesturi
    Write-Host "🕒 Ultimele 10 requesturi:" -ForegroundColor Green
    $recentRequests = $tracker.requests | Sort-Object timestamp -Descending | Select-Object -First 10
    
    foreach ($request in $recentRequests) {
        $time = [DateTime]::Parse($request.timestamp).ToString("HH:mm:ss")
        $status = if ($request.success) { "✅" } else { "❌" }
        Write-Host "  $time $status $($request.endpoint) ($($request.airportCode)) - $($request.duration)ms" -ForegroundColor White
    }
    Write-Host ""
    
    # Detectează requesturi duplicate în ultimele 5 minute
    Write-Host "🔍 Detectare requesturi duplicate (ultimele 5 minute):" -ForegroundColor Yellow
    $fiveMinutesAgo = (Get-Date).AddMinutes(-5)
    $recentRequests = $tracker.requests | Where-Object { 
        [DateTime]::Parse($_.timestamp) -gt $fiveMinutesAgo 
    }
    
    $duplicates = $recentRequests | Group-Object endpoint, airportCode | Where-Object { $_.Count -gt 1 }
    
    if ($duplicates) {
        foreach ($duplicate in $duplicates) {
            Write-Host "  ⚠️  $($duplicate.Name) - $($duplicate.Count) requesturi duplicate" -ForegroundColor Red
            $duplicate.Group | ForEach-Object {
                $time = [DateTime]::Parse($_.timestamp).ToString("HH:mm:ss.fff")
                Write-Host "    $time - $($_.duration)ms" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ✅ Nu s-au găsit requesturi duplicate în ultimele 5 minute" -ForegroundColor Green
    }
    Write-Host ""
    
} else {
    Write-Host "❌ Fișierul api-tracker.json nu există" -ForegroundColor Red
}

# 2. Verifică configurația cache
Write-Host "⚙️  Configurația Cache:" -ForegroundColor Green
if (Test-Path "data/cache-config.json") {
    $cacheConfig = Get-Content "data/cache-config.json" | ConvertFrom-Json
    Write-Host "  Flight Data Interval: $($cacheConfig.flightData.cronInterval) minute" -ForegroundColor White
    Write-Host "  Analytics Interval: $($cacheConfig.analytics.cronInterval) zile" -ForegroundColor White
    Write-Host "  Aircraft Interval: $($cacheConfig.aircraft.cronInterval) zile" -ForegroundColor White
} else {
    Write-Host "  WARNING: Nu exista configuratie cache, se folosesc valorile default" -ForegroundColor Yellow
}
Write-Host ""

# 3. Verifică cache-ul actual
Write-Host "💾 Cache Status:" -ForegroundColor Green
if (Test-Path "data/cache-data.json") {
    $cacheData = Get-Content "data/cache-data.json" | ConvertFrom-Json
    $flightDataEntries = $cacheData | Where-Object { $_.category -eq "flightData" }
    $analyticsEntries = $cacheData | Where-Object { $_.category -eq "analytics" }
    $aircraftEntries = $cacheData | Where-Object { $_.category -eq "aircraft" }
    
    Write-Host "  Flight Data: $($flightDataEntries.Count) intrări" -ForegroundColor White
    Write-Host "  Analytics: $($analyticsEntries.Count) intrări" -ForegroundColor White
    Write-Host "  Aircraft: $($aircraftEntries.Count) intrări" -ForegroundColor White
    
    # Verifică intrările recente
    $recentCache = $flightDataEntries | Where-Object {
        $createdAt = [DateTime]::Parse($_.createdAt)
        $createdAt -gt (Get-Date).AddHours(-1)
    }
    
    Write-Host "  Intrări flight data din ultima oră: $($recentCache.Count)" -ForegroundColor Cyan
    
    if ($recentCache.Count -gt 0) {
        Write-Host "  Ultimele intrări cache:" -ForegroundColor Gray
        $recentCache | Sort-Object createdAt -Descending | Select-Object -First 5 | ForEach-Object {
            $time = [DateTime]::Parse($_.createdAt).ToString("HH:mm:ss")
            Write-Host "    $time - $($_.key) ($($_.source))" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ❌ Nu există cache data" -ForegroundColor Red
}
Write-Host ""

# 4. Recomandări pentru optimizare
Write-Host "💡 RECOMANDĂRI PENTRU OPTIMIZARE:" -ForegroundColor Cyan
Write-Host ""

if ($tracker -and $tracker.stats.totalRequests -gt 100) {
    Write-Host "WARNING: Prea multe requesturi ($($tracker.stats.totalRequests))" -ForegroundColor Red
    Write-Host "   Soluții:" -ForegroundColor Yellow
    Write-Host "   1. Implementează debouncing în componente React" -ForegroundColor White
    Write-Host "   2. Verifică cache-ul înainte de a face requesturi noi" -ForegroundColor White
    Write-Host "   3. Folosește un singleton pentru gestionarea requesturilor" -ForegroundColor White
    Write-Host "   4. Implementează rate limiting pe client" -ForegroundColor White
    Write-Host ""
}

if ($duplicates -and $duplicates.Count -gt 0) {
    Write-Host "WARNING: Requesturi duplicate detectate" -ForegroundColor Red
    Write-Host "   Soluții:" -ForegroundColor Yellow
    Write-Host "   1. Implementează un cache local în browser" -ForegroundColor White
    Write-Host "   2. Folosește React Query sau SWR pentru cache automat" -ForegroundColor White
    Write-Host "   3. Adaugă verificări pentru requesturi în curs" -ForegroundColor White
    Write-Host ""
}

Write-Host "✅ SOLUȚII RECOMANDATE:" -ForegroundColor Green
Write-Host "1. Implementează un FlightDataManager singleton" -ForegroundColor White
Write-Host "2. Adaugă cache cu TTL în browser (localStorage/sessionStorage)" -ForegroundColor White
Write-Host "3. Folosește React Query pentru cache automat și deduplicare" -ForegroundColor White
Write-Host "4. Implementează rate limiting pe client (max 1 request/minut per endpoint)" -ForegroundColor White
Write-Host "5. Verifică cache-ul server înainte de a face requesturi noi" -ForegroundColor White
Write-Host ""

Write-Host "=== ANALIZA COMPLETA ===" -ForegroundColor Cyan