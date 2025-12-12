# Debug actual flight data structure from AeroDataBox

$apiKey = "cmj2m39qs0001k00404cmwu75"
$baseUrl = "https://prod.api.market/api/v1/aedbx/aerodatabox"

Write-Host "Debugging flight data structure..." -ForegroundColor Green

$url = "$baseUrl/flights/airports/Icao/LROP"

try {
    $response = Invoke-RestMethod -Uri $url -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = $apiKey
    } -Method GET
    
    Write-Host "SUCCESS! Analyzing structure..." -ForegroundColor Green
    
    if ($response.arrivals -and $response.arrivals.Count -gt 0) {
        Write-Host ""
        Write-Host "ARRIVAL FLIGHT STRUCTURE:" -ForegroundColor Yellow
        $arrival = $response.arrivals[0]
        
        Write-Host "Top-level keys: $($arrival.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
        
        if ($arrival.movement) {
            Write-Host "Movement keys: $($arrival.movement.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
        
        if ($arrival.number) {
            Write-Host "Number keys: $($arrival.number.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
        
        if ($arrival.airline) {
            Write-Host "Airline keys: $($arrival.airline.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
        
        if ($arrival.aircraft) {
            Write-Host "Aircraft keys: $($arrival.aircraft.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Sample arrival data:" -ForegroundColor White
        Write-Host "Flight: $($arrival.number.iata)" -ForegroundColor White
        Write-Host "Airline: $($arrival.airline.name)" -ForegroundColor White
        Write-Host "Status: $($arrival.status.text)" -ForegroundColor White
    }
    
    if ($response.departures -and $response.departures.Count -gt 0) {
        Write-Host ""
        Write-Host "DEPARTURE FLIGHT STRUCTURE:" -ForegroundColor Yellow
        $departure = $response.departures[0]
        
        Write-Host "Top-level keys: $($departure.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Sample departure data:" -ForegroundColor White
        Write-Host "Flight: $($departure.number.iata)" -ForegroundColor White
        Write-Host "Airline: $($departure.airline.name)" -ForegroundColor White
        Write-Host "Status: $($departure.status.text)" -ForegroundColor White
    }
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Debug complete." -ForegroundColor Blue