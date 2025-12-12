# Debug actual flight data structure to fix conversion

$apiKey = "cmj2m39qs0001k00404cmwu75"
$baseUrl = "https://prod.api.market/api/v1/aedbx/aerodatabox"

Write-Host "Debugging actual flight data structure..." -ForegroundColor Green

$url = "$baseUrl/flights/airports/Icao/LROP"

try {
    $response = Invoke-RestMethod -Uri $url -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = $apiKey
    } -Method GET
    
    Write-Host "SUCCESS! Analyzing first arrival..." -ForegroundColor Green
    
    if ($response.arrivals -and $response.arrivals.Count -gt 0) {
        $flight = $response.arrivals[0]
        
        Write-Host ""
        Write-Host "=== ARRIVAL FLIGHT STRUCTURE ===" -ForegroundColor Yellow
        Write-Host "Raw flight object:" -ForegroundColor Cyan
        $flight | ConvertTo-Json -Depth 5 | Write-Host
        
        Write-Host ""
        Write-Host "Key analysis:" -ForegroundColor White
        Write-Host "Flight number: $($flight.number)" -ForegroundColor Gray
        Write-Host "Airline: $($flight.airline)" -ForegroundColor Gray
        Write-Host "Movement: $($flight.movement)" -ForegroundColor Gray
        Write-Host "Status: $($flight.status)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== DEPARTURE FLIGHT STRUCTURE ===" -ForegroundColor Yellow
    
    if ($response.departures -and $response.departures.Count -gt 0) {
        $flight = $response.departures[0]
        
        Write-Host "Raw flight object:" -ForegroundColor Cyan
        $flight | ConvertTo-Json -Depth 5 | Write-Host
    }
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Debug complete." -ForegroundColor Blue