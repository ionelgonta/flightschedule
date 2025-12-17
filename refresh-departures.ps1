#!/usr/bin/env pwsh

Write-Host "=== REFRESH DEPARTURES CACHE ===" -ForegroundColor Cyan

try {
    $body = @{
        action = "manualRefresh"
        category = "flightData"
        identifier = "LROP_departures"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/cache-management" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    
    if ($response.success) {
        Write-Host "✅ Departures cache refresh SUCCESS" -ForegroundColor Green
        Write-Host "Message: $($response.message)" -ForegroundColor White
    } else {
        Write-Host "❌ Departures cache refresh FAILED" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Request FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== REFRESH COMPLET ===" -ForegroundColor Cyan