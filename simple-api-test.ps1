#!/usr/bin/env pwsh

# Simple API Test
Write-Host "Testing API Response..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals" -TimeoutSec 30 -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Success: $($data.success)" -ForegroundColor White
    Write-Host "Data Count: $($data.data.Count)" -ForegroundColor White
    Write-Host "Error: $($data.error)" -ForegroundColor White
    
    if ($data.data.Count -gt 0) {
        Write-Host "First Flight Details:" -ForegroundColor Cyan
        $flight = $data.data[0]
        Write-Host "  Flight: $($flight.flight_number)" -ForegroundColor White
        Write-Host "  Airline: $($flight.airline.name)" -ForegroundColor White
        Write-Host "  From: $($flight.origin.city)" -ForegroundColor White
        Write-Host "  Status: $($flight.status)" -ForegroundColor White
    }
    
    Write-Host "Raw Response (first 500 chars):" -ForegroundColor Gray
    Write-Host $response.Content.Substring(0, [Math]::Min(500, $response.Content.Length)) -ForegroundColor Gray
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "Test complete." -ForegroundColor Green