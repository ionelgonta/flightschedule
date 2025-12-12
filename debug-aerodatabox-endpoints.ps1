# Debug AeroDataBox endpoints to find correct format

$apiKey = "cmj2m39qs0001k00404cmwu75"
$baseUrl = "https://prod.api.market/api/v1/aedbx/aerodatabox"

Write-Host "Debugging AeroDataBox flight endpoints..." -ForegroundColor Green

# Test different date formats and endpoints
$today = Get-Date -Format "yyyy-MM-dd"
$now = Get-Date -Format "yyyy-MM-ddTHH:mm"

$endpoints = @(
    "/flights/airports/Icao/LROP/arrivals/$today",
    "/flights/airports/Icao/LROP/arrivals/${today}T00:00/${today}T23:59",
    "/flights/airports/icao/LROP/arrivals/$today",
    "/flights/airports/icao/LROP/arrivals/${today}T00:00/${today}T23:59",
    "/flights/airports/LROP/arrivals/$today",
    "/flights/airports/LROP/arrivals/${today}T00:00/${today}T23:59"
)

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "Testing: $endpoint" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $url -Headers @{
            "accept" = "application/json"
            "x-api-market-key" = $apiKey
        } -Method GET -TimeoutSec 10
        
        Write-Host "SUCCESS: $endpoint" -ForegroundColor Green
        Write-Host "Arrivals: $($response.arrivals.Count)" -ForegroundColor Cyan
        break
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Testing complete." -ForegroundColor Blue