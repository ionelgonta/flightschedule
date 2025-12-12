#!/usr/bin/env pwsh

# Test MCP Endpoint Direct
Write-Host "Testing MCP Endpoint..." -ForegroundColor Green

$API_KEY = "cmj2peefi0001la04p5rkbbcc"
$MCP_URL = "https://prod.api.market/api/mcp/aedbx/aerodatabox"

# Test 1: List available tools
Write-Host "1. Listing available tools..." -ForegroundColor Blue
try {
    $toolsRequest = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/list"
        params = @{}
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri $MCP_URL -Method POST -Body $toolsRequest -ContentType "application/json" -Headers @{
        "x-api-market-key" = $API_KEY
    } -TimeoutSec 30 -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($response.StatusCode)" -ForegroundColor Green
    
    if ($data.result -and $data.result.tools) {
        Write-Host "Available tools:" -ForegroundColor Cyan
        foreach ($tool in $data.result.tools) {
            Write-Host "  - $($tool.name)" -ForegroundColor White
        }
    } else {
        Write-Host "No tools found or error:" -ForegroundColor Yellow
        Write-Host $response.Content -ForegroundColor Gray
    }
} catch {
    Write-Host "Tools list failed: $_" -ForegroundColor Red
}

# Test 2: Try to get flights
Write-Host "`n2. Testing flight data..." -ForegroundColor Blue
try {
    $flightRequest = @{
        jsonrpc = "2.0"
        id = 2
        method = "tools/call"
        params = @{
            name = "get_airport_flights"
            arguments = @{
                airport = "OTP"
                type = "arrivals"
            }
        }
    } | ConvertTo-Json -Depth 5

    Write-Host "Request: $flightRequest" -ForegroundColor Gray

    $response = Invoke-WebRequest -Uri $MCP_URL -Method POST -Body $flightRequest -ContentType "application/json" -Headers @{
        "x-api-market-key" = $API_KEY
    } -TimeoutSec 30 -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Full response:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor Gray

} catch {
    Write-Host "Flight request failed: $_" -ForegroundColor Red
}

Write-Host "`nTest complete." -ForegroundColor Green