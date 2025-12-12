#!/usr/bin/env pwsh

# Test with both headers
Write-Host "Testing with both API headers..." -ForegroundColor Green

$API_KEY = "cmj2peefi0001la04p5rkbbcc"
$MCP_URL = "https://prod.api.market/api/mcp/aedbx/aerodatabox"

Write-Host "Testing with both x-api-market-key and x-magicapi-key headers..." -ForegroundColor Blue
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

    Write-Host "Using both headers" -ForegroundColor Cyan

    $response = Invoke-WebRequest -Uri $MCP_URL -Method POST -Body $flightRequest -ContentType "application/json" -Headers @{
        "x-api-market-key" = $API_KEY
        "x-magicapi-key" = $API_KEY
        "Authorization" = "Bearer $API_KEY"
    } -TimeoutSec 30 -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    
    if ($data.error) {
        Write-Host "Error: $($data.error.message)" -ForegroundColor Red
    } else {
        Write-Host "Success!" -ForegroundColor Green
        
        if ($data.result -and $data.result.content) {
            $content = $data.result.content[0].text
            Write-Host "Content length: $($content.Length)" -ForegroundColor Cyan
            
            # Check if it's an error message
            if ($content.StartsWith("Error")) {
                Write-Host "API returned error: $content" -ForegroundColor Red
            } else {
                # Try to parse as JSON
                try {
                    $flightData = $content | ConvertFrom-Json
                    if ($flightData.arrivals) {
                        Write-Host "Found $($flightData.arrivals.Count) arrivals!" -ForegroundColor Green
                        
                        # Show first few flights
                        for ($i = 0; $i -lt [Math]::Min(5, $flightData.arrivals.Count); $i++) {
                            $flight = $flightData.arrivals[$i]
                            Write-Host "  $($i+1). $($flight.number.iata) - $($flight.airline.name) from $($flight.departure.airport.municipalityName)" -ForegroundColor White
                        }
                    } else {
                        Write-Host "No arrivals in response" -ForegroundColor Yellow
                        Write-Host "Response structure: $($flightData | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
                    }
                } catch {
                    Write-Host "Content: $content" -ForegroundColor Gray
                }
            }
        }
    }

} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nTest complete." -ForegroundColor Green