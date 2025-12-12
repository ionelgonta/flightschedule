# Test API.Market direct access to see what services are available

$apiKey = "cmj2peefi0001la04p5rkbbcc"
$headers = @{
    "x-api-market-key" = $apiKey
    "Content-Type" = "application/json"
}

Write-Host "Testing API.Market access..." -ForegroundColor Green

# Test 1: Check if API key works at all
Write-Host "1. Testing API key validity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://prod.api.market/" -Headers $headers -Method GET
    Write-Host "API Key works!" -ForegroundColor Green
} catch {
    Write-Host "API Key test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Try different AeroDataBox endpoints
Write-Host "2. Testing AeroDataBox endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "https://prod.api.market/aerodatabox/airports/icao/LROP",
    "https://prod.api.market/aerodatabox/flights/airports/icao/LROP/arrivals/2025-12-12T00:00/2025-12-12T23:59",
    "https://api.market/aerodatabox/airports/icao/LROP",
    "https://prod.api.market/aero-databox/airports/icao/LROP"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $endpoint" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method GET -TimeoutSec 10
        Write-Host "SUCCESS: $endpoint" -ForegroundColor Green
        break
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Test complete. If all failed, AeroDataBox might not be available via API.Market" -ForegroundColor Yellow