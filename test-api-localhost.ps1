#!/usr/bin/env pwsh

Write-Host "=== TEST API LOCALHOST ===" -ForegroundColor Cyan
Write-Host ""

# Test API endpoints
$endpoints = @(
    "http://localhost:3000/api/flights/LROP/arrivals",
    "http://localhost:3000/api/flights/LROP/departures",
    "http://localhost:3000/api/cache/status",
    "http://localhost:3000/api/analytics/LROP"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $endpoint" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method GET -TimeoutSec 10
        Write-Host "  Status: OK" -ForegroundColor Green
        
        if ($response -is [array]) {
            Write-Host "  Response: Array cu $($response.Count) elemente" -ForegroundColor White
        } elseif ($response -is [object]) {
            Write-Host "  Response: Object cu proprietati" -ForegroundColor White
        } else {
            Write-Host "  Response: $($response.GetType().Name)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "  Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== TEST COMPLET ===" -ForegroundColor Cyan