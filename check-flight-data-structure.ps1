# Check what data the working flight endpoints return

$apiKey = "cmj2m39qs0001k00404cmwu75"
$baseUrl = "https://prod.api.market/api/v1/aedbx/aerodatabox"

Write-Host "Checking flight data structure..." -ForegroundColor Green

$url = "$baseUrl/flights/airports/Icao/LROP"
Write-Host "URL: $url" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = $apiKey
    } -Method GET
    
    Write-Host "SUCCESS! Data structure:" -ForegroundColor Green
    Write-Host "Response keys: $($response.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
    
    if ($response.arrivals) {
        Write-Host "Arrivals count: $($response.arrivals.Count)" -ForegroundColor Cyan
        if ($response.arrivals.Count -gt 0) {
            Write-Host "Sample arrival flight:" -ForegroundColor White
            $flight = $response.arrivals[0]
            Write-Host "  Flight keys: $($flight.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
    }
    
    if ($response.departures) {
        Write-Host "Departures count: $($response.departures.Count)" -ForegroundColor Cyan
        if ($response.departures.Count -gt 0) {
            Write-Host "Sample departure flight:" -ForegroundColor White
            $flight = $response.departures[0]
            Write-Host "  Flight keys: $($flight.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Check complete." -ForegroundColor Blue