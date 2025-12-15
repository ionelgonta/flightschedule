# Test live site flight data

Write-Host "=== TESTING LIVE SITE FLIGHT DATA ===" -ForegroundColor Green

# Test main site
Write-Host "1. Testing main site..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro" -TimeoutSec 10
    Write-Host "✅ Main site accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Main site error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API endpoints
Write-Host ""
Write-Host "2. Testing API endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "https://anyway.ro/api/flights/OTP/arrivals",
    "https://anyway.ro/api/flights/OTP/departures"
)

foreach ($endpoint in $endpoints) {
    try {
        Write-Host "Testing: $endpoint" -ForegroundColor Gray
        $apiResponse = Invoke-RestMethod -Uri $endpoint -TimeoutSec 15
        
        if ($apiResponse.success) {
            Write-Host "  ✅ Success - $($apiResponse.data.Count) flights" -ForegroundColor Green
            
            if ($apiResponse.data -and $apiResponse.data.Count -gt 0) {
                $flight = $apiResponse.data[0]
                Write-Host "  Sample: $($flight.flight_number) - $($flight.airline.name)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "  ❌ API Error: $($apiResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test specific airport page
Write-Host ""
Write-Host "3. Testing airport page..." -ForegroundColor Yellow
try {
    $pageResponse = Invoke-WebRequest -Uri "https://anyway.ro/airport/OTP/arrivals" -TimeoutSec 10
    Write-Host "✅ Airport page accessible (Status: $($pageResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Airport page error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Blue