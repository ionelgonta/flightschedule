#!/usr/bin/env pwsh

# Test API Key Validation Fix
# Tests both MCP endpoint and admin panel validation

Write-Host "🧪 Testing API Key Validation Fix..." -ForegroundColor Cyan

$API_KEY = "cmj2peefi0001la04p5rkbbcc"
$SERVER_URL = "https://anyway.ro"

Write-Host "🔑 Testing API Key: $($API_KEY.Substring(0,8))...$($API_KEY.Substring($API_KEY.Length-8))" -ForegroundColor Yellow

# Test 1: Direct MCP endpoint
Write-Host "`n1️⃣ Testing MCP Endpoint directly..." -ForegroundColor Blue

$mcpBody = @{
    "jsonrpc" = "2.0"
    "id" = 1
    "method" = "initialize"
    "params" = @{
        "protocolVersion" = "2024-11-05"
        "capabilities" = @{"tools" = @{}}
        "clientInfo" = @{"name" = "test-script"; "version" = "1.0.0"}
    }
} | ConvertTo-Json -Depth 10

try {
    $mcpResponse = Invoke-RestMethod -Uri "https://prod.api.market/api/mcp/aedbx/aerodatabox" `
        -Method POST `
        -Headers @{
            "x-api-market-key" = $API_KEY
            "Content-Type" = "application/json"
        } `
        -Body $mcpBody

    if ($mcpResponse.jsonrpc -eq "2.0" -and $mcpResponse.result) {
        Write-Host "✅ MCP Endpoint: SUCCESS" -ForegroundColor Green
        Write-Host "   Response: $($mcpResponse.result | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "❌ MCP Endpoint: Invalid response" -ForegroundColor Red
        Write-Host "   Response: $($mcpResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ MCP Endpoint: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Admin panel API validation
Write-Host "`n2️⃣ Testing Admin Panel API Validation..." -ForegroundColor Blue

$adminBody = @{
    "apiKey" = $API_KEY
    "action" = "test"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-RestMethod -Uri "$SERVER_URL/api/admin/api-key" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $adminBody

    if ($adminResponse.success -and $adminResponse.valid) {
        Write-Host "✅ Admin Panel: SUCCESS" -ForegroundColor Green
        Write-Host "   API Key is valid!" -ForegroundColor Gray
    } else {
        Write-Host "❌ Admin Panel: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($adminResponse.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Admin Panel: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check current API key status
Write-Host "`n3️⃣ Checking Current API Key Status..." -ForegroundColor Blue

try {
    $statusResponse = Invoke-RestMethod -Uri "$SERVER_URL/api/admin/api-key" -Method GET

    if ($statusResponse.success) {
        Write-Host "✅ Current API Key: $($statusResponse.apiKey)" -ForegroundColor Green
        Write-Host "   Has Key: $($statusResponse.hasKey)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to get API key status" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Status Check: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test flight data endpoint
Write-Host "`n4️⃣ Testing Flight Data Endpoint..." -ForegroundColor Blue

try {
    $flightResponse = Invoke-RestMethod -Uri "$SERVER_URL/api/flights/OTP/arrivals" -Method GET

    if ($flightResponse.success) {
        Write-Host "✅ Flight Data: SUCCESS" -ForegroundColor Green
        Write-Host "   Flights found: $($flightResponse.data.Count)" -ForegroundColor Gray
        Write-Host "   Cached: $($flightResponse.cached)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Flight Data: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($flightResponse.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Flight Data: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏁 Test Complete!" -ForegroundColor Cyan
Write-Host "📊 Visit admin panel: $SERVER_URL/admin" -ForegroundColor Yellow
Write-Host "🔑 Password: admin123" -ForegroundColor Yellow