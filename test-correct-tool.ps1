#!/usr/bin/env pwsh

# Test Correct MCP Tool
Write-Host "Testing correct MCP tool..." -ForegroundColor Green

$API_KEY = "cmj2peefi0001la04p5rkbbcc"
$MCP_URL = "https://prod.api.market/api/mcp/aedbx/aerodatabox"

Write-Host "Testing getairportflights tool..." -ForegroundColor Blue
try {
    $flightRequest = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = "getairportflights"
            arguments = @{
                airport = "OTP"
                type = "arrivals"
                date = (Get-Date -Format "yyyy-MM-dd")
            }
        }
    } | ConvertTo-Json -Depth 5

    Write-Host "Request: $flightRequest" -ForegroundColor Gray

    $response = Invoke-WebRequest -Uri $MCP_URL -Method POST -Body $flightRequest -ContentType "application/json" -Headers @{
        "x-api-market-key" = $API_KEY
    } -TimeoutSec 30 -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    
    if ($data.error) {
        Write-Host "Error: $($data.error.message)" -ForegroundColor Red
        Write-Host "Error Code: $($data.error.code)" -ForegroundColor Red
    }
    
    if ($data.result) {
        Write-Host "Success! Result type: $($data.result.GetType().Name)" -ForegroundColor Green
        
        if ($data.result.content) {
            Write-Host "Content available" -ForegroundColor Cyan
            $content = $data.result.content
            if ($content -is [string]) {
                # Try to parse as JSON
                try {
                    $flightData = $content | ConvertFrom-Json
                    if ($flightData.arrivals) {
                        Write-Host "Found $($flightData.arrivals.Count) arrivals" -ForegroundColor Green
                        if ($flightData.arrivals.Count -gt 0) {
                            $firstFlight = $flightData.arrivals[0]
                            Write-Host "First flight: $($firstFlight.number.iata) - $($firstFlight.airline.name)" -ForegroundColor White
                        }
                    } else {
                        Write-Host "No arrivals found in response" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "Content (first 500 chars): $($content.Substring(0, [Math]::Min(500, $content.Length)))" -ForegroundColor Gray
                }
            } else {
                Write-Host "Content: $content" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "`nFull response:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor Gray

} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nTest complete." -ForegroundColor Green