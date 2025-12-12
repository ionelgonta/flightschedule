# Debug data issue - test actual API response

Write-Host "=== DEBUGGING FLIGHT DATA ISSUE ===" -ForegroundColor Green

# Test API direct
Write-Host "1. Testing API directly..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://prod.api.market/api/v1/aedbx/aerodatabox/flights/airports/Icao/LROP" -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = "cmj2m39qs0001k00404cmwu75"
    } -Method GET
    
    Write-Host "✅ API Response OK" -ForegroundColor Green
    Write-Host "Arrivals: $($response.arrivals.Count)" -ForegroundColor Cyan
    Write-Host "Departures: $($response.departures.Count)" -ForegroundColor Cyan
    
    if ($response.arrivals -and $response.arrivals.Count -gt 0) {
        $flight = $response.arrivals[0]
        Write-Host ""
        Write-Host "Sample arrival flight:" -ForegroundColor White
        Write-Host "  Number: '$($flight.number)'" -ForegroundColor Gray
        Write-Host "  Airline: '$($flight.airline.name)' ($($flight.airline.iata))" -ForegroundColor Gray
        Write-Host "  Status: '$($flight.status)'" -ForegroundColor Gray
        Write-Host "  Movement Airport: '$($flight.movement.airport.name)' ($($flight.movement.airport.iata))" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test our API endpoint
Write-Host ""
Write-Host "2. Testing our API endpoint..." -ForegroundColor Yellow
try {
    # Build first
    npm run build | Out-Null
    
    # Start server in background if not running
    $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
    if (-not $process) {
        Write-Host "Starting dev server..." -ForegroundColor Gray
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        Start-Sleep -Seconds 10
    }
    
    $ourResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/flights/OTP/arrivals" -Method GET
    
    Write-Host "✅ Our API Response OK" -ForegroundColor Green
    Write-Host "Success: $($ourResponse.success)" -ForegroundColor Cyan
    Write-Host "Data count: $($ourResponse.data.Count)" -ForegroundColor Cyan
    
    if ($ourResponse.data -and $ourResponse.data.Count -gt 0) {
        $ourFlight = $ourResponse.data[0]
        Write-Host ""
        Write-Host "Our converted flight:" -ForegroundColor White
        Write-Host "  Flight Number: '$($ourFlight.flight_number)'" -ForegroundColor Gray
        Write-Host "  Airline: '$($ourFlight.airline.name)' ($($ourFlight.airline.code))" -ForegroundColor Gray
        Write-Host "  Origin: '$($ourFlight.origin.airport)' ($($ourFlight.origin.code))" -ForegroundColor Gray
        Write-Host "  Destination: '$($ourFlight.destination.airport)' ($($ourFlight.destination.code))" -ForegroundColor Gray
        Write-Host "  Status: '$($ourFlight.status)'" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Our API Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DEBUG COMPLETE ===" -ForegroundColor Blue