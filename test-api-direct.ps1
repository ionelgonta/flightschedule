# Test API Key Direct
Write-Host "Testing API Key Configuration..." -ForegroundColor Cyan

# Test API endpoint
try {
    $apiTest = Invoke-WebRequest -Uri "https://anyway.ro/api/admin/api-key" -UseBasicParsing
    Write-Host "API endpoint status: $($apiTest.StatusCode)" -ForegroundColor Green
    
    # Parse response
    $apiResponse = $apiTest.Content | ConvertFrom-Json
    if ($apiResponse.success) {
        Write-Host "✅ API endpoint working" -ForegroundColor Green
        if ($apiResponse.hasKey) {
            Write-Host "✅ API key is configured" -ForegroundColor Green
        } else {
            Write-Host "⚠️ API key not found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ API endpoint error: $($apiResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to test API endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Test a flight endpoint
Write-Host ""
Write-Host "Testing flight data endpoint..." -ForegroundColor Cyan
try {
    $flightTest = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals" -UseBasicParsing
    Write-Host "Flight endpoint status: $($flightTest.StatusCode)" -ForegroundColor Green
    
    $flightResponse = $flightTest.Content | ConvertFrom-Json
    if ($flightResponse.success) {
        Write-Host "✅ Flight data endpoint working" -ForegroundColor Green
        Write-Host "Flights found: $($flightResponse.flights.Count)" -ForegroundColor White
    } else {
        Write-Host "❌ Flight endpoint error: $($flightResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to test flight endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://anyway.ro/admin" -ForegroundColor White
Write-Host "2. Go to 'API Management' tab" -ForegroundColor White
Write-Host "3. Test the API key manually" -ForegroundColor White
Write-Host "4. Check MCP Integration tab" -ForegroundColor White