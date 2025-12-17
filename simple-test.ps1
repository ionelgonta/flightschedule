#!/usr/bin/env pwsh

Write-Host "=== TEST LOCALHOST ===" -ForegroundColor Cyan

# Test homepage
Write-Host "Testing homepage..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    Write-Host "Homepage OK: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Homepage failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Check API tracker
if (Test-Path "data/api-tracker.json") {
    $tracker = Get-Content "data/api-tracker.json" | ConvertFrom-Json
    Write-Host "API requests so far: $($tracker.stats.totalRequests)" -ForegroundColor Yellow
} else {
    Write-Host "No API requests yet" -ForegroundColor Green
}

Write-Host "Test complete" -ForegroundColor Cyan