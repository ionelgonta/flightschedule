#!/usr/bin/env pwsh

Write-Host "=== TEST SIMPLE API ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    Write-Host "Health endpoint: OK" -ForegroundColor Green
    Write-Host $response
}
catch {
    Write-Host "Health endpoint: FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/flights" -Method GET -TimeoutSec 5
    Write-Host "Flights endpoint: OK" -ForegroundColor Green
}
catch {
    Write-Host "Flights endpoint: FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== TEST COMPLET ===" -ForegroundColor Cyan