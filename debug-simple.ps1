#!/usr/bin/env pwsh

Write-Host "=== ANALIZA API REQUESTS ===" -ForegroundColor Cyan
Write-Host ""

# Verifica API tracker
if (Test-Path "data/api-tracker.json") {
    Write-Host "API Tracker gasit:" -ForegroundColor Green
    $tracker = Get-Content "data/api-tracker.json" | ConvertFrom-Json
    
    Write-Host "Total requesturi: $($tracker.stats.totalRequests)" -ForegroundColor Yellow
    Write-Host "Requesturi reussite: $($tracker.stats.successfulRequests)" -ForegroundColor Green
    Write-Host "Requesturi esuate: $($tracker.stats.failedRequests)" -ForegroundColor Red
    Write-Host ""
    
    # Ultimele requesturi
    Write-Host "Ultimele 5 requesturi:" -ForegroundColor Green
    $recentRequests = $tracker.requests | Sort-Object timestamp -Descending | Select-Object -First 5
    
    foreach ($request in $recentRequests) {
        $time = [DateTime]::Parse($request.timestamp).ToString("HH:mm:ss")
        $status = if ($request.success) { "OK" } else { "FAIL" }
        Write-Host "  $time [$status] $($request.endpoint) ($($request.airportCode)) - $($request.duration)ms" -ForegroundColor White
    }
    Write-Host ""
} else {
    Write-Host "API Tracker nu exista" -ForegroundColor Red
}

# Verifica cache
if (Test-Path "data/cache-data.json") {
    Write-Host "Cache Data gasit:" -ForegroundColor Green
    $cacheData = Get-Content "data/cache-data.json" | ConvertFrom-Json
    $flightDataEntries = $cacheData | Where-Object { $_.category -eq "flightData" }
    
    Write-Host "Flight Data entries: $($flightDataEntries.Count)" -ForegroundColor White
    
    # Cache recent
    $recentCache = $flightDataEntries | Where-Object {
        $createdAt = [DateTime]::Parse($_.createdAt)
        $createdAt -gt (Get-Date).AddHours(-1)
    }
    
    Write-Host "Cache din ultima ora: $($recentCache.Count)" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Cache Data nu exista" -ForegroundColor Red
}

Write-Host "=== ANALIZA COMPLETA ===" -ForegroundColor Cyan