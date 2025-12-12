#!/usr/bin/env pwsh

# Test with different airport to bypass cache
Write-Host "Testing with CLJ airport (bypass cache)..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/CLJ/arrivals" -TimeoutSec 30 -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Success: $($data.success)" -ForegroundColor White
    Write-Host "Data Count: $($data.data.Count)" -ForegroundColor White
    Write-Host "Error: $($data.error)" -ForegroundColor White
    
    if ($data.data.Count -gt 0) {
        Write-Host "Flight Details:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(3, $data.data.Count); $i++) {
            $flight = $data.data[$i]
            Write-Host "  $($i+1). $($flight.flight_number) - $($flight.airline.name) - $($flight.status)" -ForegroundColor White
        }
        
        $firstFlight = $data.data[0]
        if ($firstFlight.flight_number -ne "N/A" -and $firstFlight.airline.name -ne "Unknown") {
            Write-Host "SUCCESS! Real flight data is working!" -ForegroundColor Green
        } else {
            Write-Host "Still showing dummy data" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "Test complete." -ForegroundColor Green