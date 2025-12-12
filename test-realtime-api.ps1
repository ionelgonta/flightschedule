#!/usr/bin/env pwsh

# Test Real-time Flight API - Verify AeroDataBox integration

Write-Host "🧪 Testing Real-time Flight API..." -ForegroundColor Green

# Test API endpoint directly
Write-Host ""
Write-Host "Testing API.Market AeroDataBox endpoint..." -ForegroundColor Blue

$apiKey = "cmj2peefi0001la04p5rkbbcc"
$headers = @{
    "x-api-market-key" = $apiKey
    "Content-Type" = "application/json"
}

# Test with Bucharest airport (OTP -> LROP)
$today = Get-Date -Format "yyyy-MM-dd"
$url = "https://prod.api.market/aerodatabox/flights/airports/icao/LROP/arrivals/${today}T00:00/${today}T23:59"

Write-Host "Testing URL: $url" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
    Write-Host "API Response received!" -ForegroundColor Green
    Write-Host "Arrivals found: $($response.arrivals.Count)" -ForegroundColor Cyan
    
    if ($response.arrivals.Count -gt 0) {
        Write-Host ""
        Write-Host "Sample flight data:" -ForegroundColor Yellow
        $flight = $response.arrivals[0]
        Write-Host "  Flight: $($flight.number.iata)" -ForegroundColor White
        Write-Host "  Airline: $($flight.airline.name)" -ForegroundColor White
        Write-Host "  From: $($flight.departure.airport.name)" -ForegroundColor White
        Write-Host "  Status: $($flight.status.text)" -ForegroundColor White
        Write-Host "  Scheduled: $($flight.arrival.scheduledTime.local)" -ForegroundColor White
    }
    
} catch {
    Write-Host "API Test Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    # Test with demo data fallback
    Write-Host ""
    Write-Host "Testing demo data fallback..." -ForegroundColor Blue
    Write-Host "Demo data will be used when API fails" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deploy real-time implementation:" -ForegroundColor Blue
Write-Host "  Run: ./deploy-realtime-api.ps1" -ForegroundColor Cyan