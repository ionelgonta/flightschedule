#!/usr/bin/env pwsh

Write-Host "=== TEST CORRECT API ENDPOINTS ===" -ForegroundColor Cyan
Write-Host ""

# Test API endpoints corecte
$endpoints = @(
    "http://localhost:3000/api/flights/LROP/arrivals",
    "http://localhost:3000/api/flights/LROP/departures",
    "http://localhost:3000/api/airports",
    "http://localhost:3000/api/debug"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $endpoint" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method GET -TimeoutSec 10
        Write-Host "  Status: OK" -ForegroundColor Green
        
        if ($response -is [array]) {
            Write-Host "  Response: Array cu $($response.Count) elemente" -ForegroundColor White
            if ($response.Count -gt 0) {
                Write-Host "  Primul element: $($response[0] | ConvertTo-Json -Depth 1 -Compress)" -ForegroundColor Gray
            }
        } elseif ($response -is [object]) {
            Write-Host "  Response: Object" -ForegroundColor White
            Write-Host "  Content: $($response | ConvertTo-Json -Depth 1 -Compress)" -ForegroundColor Gray
        } else {
            Write-Host "  Response: $($response)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "  Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== TEST COMPLET ===" -ForegroundColor Cyan