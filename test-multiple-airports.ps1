#!/usr/bin/env pwsh

# Test multiple airports
Write-Host "🧪 Testing multiple airports..." -ForegroundColor Green

$airports = @("OTP", "CLJ", "TSR", "IAS")

foreach ($airport in $airports) {
    Write-Host "`nTesting $airport arrivals..." -ForegroundColor Blue
    try {
        $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/$airport/arrivals" -TimeoutSec 30 -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "  Success: $($data.success)" -ForegroundColor White
        Write-Host "  Flights: $($data.data.Count)" -ForegroundColor White
        
        if ($data.data.Count -gt 0) {
            $flight = $data.data[0]
            Write-Host "  Sample: $($flight.flight_number) - $($flight.airline.name)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Multi-airport test complete!" -ForegroundColor Green