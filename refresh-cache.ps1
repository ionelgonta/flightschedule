#!/usr/bin/env pwsh

Write-Host "=== REFRESH CACHE PENTRU FLIGHT DATA ===" -ForegroundColor Cyan
Write-Host ""

# Manual refresh pentru flight data
Write-Host "Triggering manual refresh pentru flight data..." -ForegroundColor Yellow

try {
    $body = @{
        action = "manualRefresh"
        category = "flightData"
        identifier = "LROP"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cache-management" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    
    if ($response.success) {
        Write-Host "  ✅ Cache refresh SUCCESS" -ForegroundColor Green
        Write-Host "  Message: $($response.message)" -ForegroundColor White
    } else {
        Write-Host "  ❌ Cache refresh FAILED" -ForegroundColor Red
        Write-Host "  Error: $($response.error)" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ❌ Request FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Verifică cache stats după refresh
Write-Host "Checking cache stats..." -ForegroundColor Yellow

try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cache-management" -Method GET -TimeoutSec 15
    
    if ($stats.success) {
        Write-Host "  ✅ Cache stats retrieved" -ForegroundColor Green
        Write-Host "  Flight Data entries: $($stats.data.flightData.count)" -ForegroundColor White
        Write-Host "  Analytics entries: $($stats.data.analytics.count)" -ForegroundColor White
        Write-Host "  Aircraft entries: $($stats.data.aircraft.count)" -ForegroundColor White
    } else {
        Write-Host "  ❌ Failed to get cache stats" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ❌ Stats request FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== REFRESH COMPLET ===" -ForegroundColor Cyan