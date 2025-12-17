#!/usr/bin/env pwsh

Write-Host "=== TEST OTP API ENDPOINTS ===" -ForegroundColor Cyan
Write-Host ""

# Test API endpoints cu OTP (3 caractere)
$endpoints = @(
    "http://localhost:3000/api/flights/OTP/arrivals",
    "http://localhost:3000/api/flights/OTP/departures"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $endpoint" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method GET -TimeoutSec 15
        Write-Host "  Status: OK" -ForegroundColor Green
        
        if ($response.success) {
            Write-Host "  Success: $($response.success)" -ForegroundColor Green
            Write-Host "  Cached: $($response.cached)" -ForegroundColor Cyan
            Write-Host "  Last Updated: $($response.last_updated)" -ForegroundColor Gray
            
            if ($response.data -and $response.data.Count -gt 0) {
                Write-Host "  Data: $($response.data.Count) flights" -ForegroundColor White
                Write-Host "  First flight: $($response.data[0].flight_number) - $($response.data[0].status)" -ForegroundColor Gray
            } else {
                Write-Host "  Data: No flights" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  Success: $($response.success)" -ForegroundColor Red
            Write-Host "  Error: $($response.error)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== TEST COMPLET ===" -ForegroundColor Cyan