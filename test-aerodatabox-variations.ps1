# Test various AeroDataBox endpoint variations

$apiKey = "cmj2m39qs0001k00404cmwu75"
$baseUrl = "https://prod.api.market/api/v1/aedbx/aerodatabox"

Write-Host "Testing AeroDataBox endpoint variations..." -ForegroundColor Green

# Test 1: Try different airport code formats
Write-Host "1. Testing different airport formats..." -ForegroundColor Blue

$airportTests = @(
    "/airports/Icao/LROP",
    "/airports/Iata/OTP", 
    "/airports/icao/LROP",
    "/airports/iata/OTP"
)

foreach ($test in $airportTests) {
    $url = "$baseUrl$test"
    Write-Host "Testing: $test" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $url -Headers @{
            "accept" = "application/json"
            "x-api-market-key" = $apiKey
        } -Method GET -TimeoutSec 10
        
        Write-Host "SUCCESS: Airport $($response.icao) - $($response.name)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 2: Try to find available flight endpoints
Write-Host ""
Write-Host "2. Testing flight endpoint patterns..." -ForegroundColor Blue

$today = Get-Date -Format "yyyy-MM-dd"
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")

$flightTests = @(
    "/flights/airports/Icao/LROP",
    "/flights/airports/Iata/OTP", 
    "/flights/Icao/LROP/arrivals",
    "/flights/Iata/OTP/arrivals",
    "/flights/airports/Icao/LROP/arrivals",
    "/flights/airports/Iata/OTP/arrivals"
)

foreach ($test in $flightTests) {
    $url = "$baseUrl$test"
    Write-Host "Testing: $test" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $url -Headers @{
            "accept" = "application/json"
            "x-api-market-key" = $apiKey
        } -Method GET -TimeoutSec 10
        
        Write-Host "SUCCESS: $test" -ForegroundColor Green
        Write-Host "Response type: $($response.GetType().Name)" -ForegroundColor Cyan
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing complete. Check which endpoints work." -ForegroundColor Blue