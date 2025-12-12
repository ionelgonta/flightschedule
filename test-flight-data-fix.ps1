# Test flight data conversion fix

Write-Host "Testing flight data conversion fix..." -ForegroundColor Green

# Build the project first
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Testing API endpoint..." -ForegroundColor Green
    
    # Test the API endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/flights/OTP/arrivals" -Method GET
        
        Write-Host "API Response received!" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Cyan
        Write-Host "Flight count: $($response.data.Count)" -ForegroundColor Cyan
        
        if ($response.data -and $response.data.Count -gt 0) {
            $flight = $response.data[0]
            Write-Host ""
            Write-Host "=== FIRST FLIGHT DATA ===" -ForegroundColor Yellow
            Write-Host "Flight Number: $($flight.flight_number)" -ForegroundColor White
            Write-Host "Airline: $($flight.airline.name) ($($flight.airline.code))" -ForegroundColor White
            Write-Host "Origin: $($flight.origin.airport) ($($flight.origin.code))" -ForegroundColor White
            Write-Host "Destination: $($flight.destination.airport) ($($flight.destination.code))" -ForegroundColor White
            Write-Host "Status: $($flight.status)" -ForegroundColor White
            Write-Host "Scheduled: $($flight.scheduled_time)" -ForegroundColor White
            if ($flight.delay) {
                Write-Host "Delay: $($flight.delay) minutes" -ForegroundColor Orange
            }
        }
        
    } catch {
        Write-Host "API test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test complete." -ForegroundColor Blue