#!/usr/bin/env pwsh

# Test API Direct Debug - Testează direct API-ul pentru a vedea ce date returnează
Write-Host "🔍 Testing API Direct Response..." -ForegroundColor Green

$API_KEY = "cmj2peefi0001la04p5rkbbcc"
$BASE_URL = "https://anyway.ro"

Write-Host "📋 Testing both server API and direct MCP endpoint" -ForegroundColor Yellow

# Test 1: Server API endpoint
Write-Host "`n🔍 Test 1: Server API Endpoint" -ForegroundColor Blue
try {
    $serverUrl = "$BASE_URL/api/flights/OTP/arrivals"
    Write-Host "Testing: $serverUrl" -ForegroundColor Gray
    
    $serverResponse = Invoke-WebRequest -Uri $serverUrl -TimeoutSec 30 -UseBasicParsing
    $serverData = $serverResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Server API Response:" -ForegroundColor Green
    Write-Host "  Success: $($serverData.success)" -ForegroundColor White
    Write-Host "  Data Count: $($serverData.data.Count)" -ForegroundColor White
    Write-Host "  Cached: $($serverData.cached)" -ForegroundColor White
    Write-Host "  Error: $($serverData.error)" -ForegroundColor White
    
    if ($serverData.data.Count -gt 0) {
        Write-Host "  First Flight:" -ForegroundColor Cyan
        $firstFlight = $serverData.data[0]
        Write-Host "    Flight Number: $($firstFlight.flight_number)" -ForegroundColor White
        Write-Host "    Airline: $($firstFlight.airline.name) ($($firstFlight.airline.code))" -ForegroundColor White
        Write-Host "    Origin: $($firstFlight.origin.city) ($($firstFlight.origin.code))" -ForegroundColor White
        Write-Host "    Destination: $($firstFlight.destination.city) ($($firstFlight.destination.code))" -ForegroundColor White
        Write-Host "    Status: $($firstFlight.status)" -ForegroundColor White
        Write-Host "    Scheduled: $($firstFlight.scheduled_time)" -ForegroundColor White
    }
    
    # Show all flights if more than one
    if ($serverData.data.Count -gt 1) {
        Write-Host "`n  All Flights:" -ForegroundColor Cyan
        for ($i = 0; $i -lt $serverData.data.Count; $i++) {
            $flight = $serverData.data[$i]
            Write-Host "    $($i+1). $($flight.flight_number) - $($flight.airline.name) - $($flight.status)" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "❌ Server API failed: $_" -ForegroundColor Red
}

# Test 2: Direct MCP endpoint test
Write-Host "`n🔍 Test 2: Direct MCP Endpoint" -ForegroundColor Blue
try {
    $mcpUrl = "https://prod.api.market/api/mcp/aedbx/aerodatabox"
    Write-Host "Testing: $mcpUrl" -ForegroundColor Gray
    
    # MCP request body for getting flights
    $mcpRequest = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = "get_airport_flights"
            arguments = @{
                airport = "OTP"
                type = "arrivals"
                date = (Get-Date -Format "yyyy-MM-dd")
                timeFrom = (Get-Date -Format "yyyy-MM-dd") + "T00:00"
                timeTo = (Get-Date -Format "yyyy-MM-dd") + "T23:59"
            }
        }
    } | ConvertTo-Json -Depth 10
    
    $mcpResponse = Invoke-WebRequest -Uri $mcpUrl -Method POST -Body $mcpRequest -ContentType "application/json" -Headers @{
        "x-api-market-key" = $API_KEY
    } -TimeoutSec 30 -UseBasicParsing
    
    $mcpData = $mcpResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ MCP Response:" -ForegroundColor Green
    Write-Host "  Status Code: $($mcpResponse.StatusCode)" -ForegroundColor White
    Write-Host "  JSONRPC ID: $($mcpData.id)" -ForegroundColor White
    
    if ($mcpData.error) {
        Write-Host "  Error: $($mcpData.error.message)" -ForegroundColor Red
        Write-Host "  Error Code: $($mcpData.error.code)" -ForegroundColor Red
    }
    
    if ($mcpData.result) {
        Write-Host "  Result Type: $($mcpData.result.GetType().Name)" -ForegroundColor White
        
        # Try to parse the result
        if ($mcpData.result.content) {
            Write-Host "  Content Available: Yes" -ForegroundColor Green
            $content = $mcpData.result.content
            if ($content -is [array]) {
                Write-Host "  Content Count: $($content.Count)" -ForegroundColor White
            } else {
                Write-Host "  Content: $content" -ForegroundColor White
            }
        } else {
            Write-Host "  Raw Result: $($mcpData.result | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ MCP API failed: $_" -ForegroundColor Red
    Write-Host "  Error Details: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test 3: Check available MCP tools
Write-Host "`n🔍 Test 3: Available MCP Tools" -ForegroundColor Blue
try {
    $toolsRequest = @{
        jsonrpc = "2.0"
        id = 2
        method = "tools/list"
        params = @{}
    } | ConvertTo-Json
    
    $toolsResponse = Invoke-WebRequest -Uri $mcpUrl -Method POST -Body $toolsRequest -ContentType "application/json" -Headers @{
        "x-api-market-key" = $API_KEY
    } -TimeoutSec 30 -UseBasicParsing
    
    $toolsData = $toolsResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Available Tools:" -ForegroundColor Green
    if ($toolsData.result -and $toolsData.result.tools) {
        foreach ($tool in $toolsData.result.tools) {
            Write-Host "  - $($tool.name): $($tool.description)" -ForegroundColor White
        }
    } else {
        Write-Host "  No tools found or unexpected format" -ForegroundColor Yellow
        Write-Host "  Raw response: $($toolsData | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Tools list failed: $_" -ForegroundColor Red
}

# Test 4: Test AeroDataBox direct API (if MCP fails)
Write-Host "`n🔍 Test 4: Direct AeroDataBox API" -ForegroundColor Blue
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $aeroUrl = "https://aerodatabox.p.rapidapi.com/flights/airports/icao/LROP/arrivals/${today}T00:00/${today}T23:59"
    Write-Host "Testing: $aeroUrl" -ForegroundColor Gray
    
    # Note: This would need RapidAPI key, but let's see the structure
    Write-Host "⚠️ Would need RapidAPI key for direct AeroDataBox access" -ForegroundColor Yellow
    Write-Host "  URL structure: $aeroUrl" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Direct AeroDataBox test failed: $_" -ForegroundColor Red
}

Write-Host "`n📊 Debug Summary" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "1. Check server API response data count and content" -ForegroundColor White
Write-Host "2. Verify MCP endpoint is returning proper flight data" -ForegroundColor White
Write-Host "3. Ensure data mapping is working correctly" -ForegroundColor White
Write-Host "4. Check if API key has proper permissions" -ForegroundColor White

Write-Host "`n✅ API Debug Testing Complete!" -ForegroundColor Green