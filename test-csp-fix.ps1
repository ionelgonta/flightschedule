#!/usr/bin/env pwsh

# Test CSP Fix - Verifies that the CSP fix is working correctly
# Tests both server API endpoints and client-side functionality

Write-Host "🧪 Testing CSP Fix Implementation..." -ForegroundColor Green

$BASE_URL = "https://anyway.ro"
$API_KEY = "cmj2peefi0001la04p5rkbbcc"

Write-Host "📋 Test Plan:" -ForegroundColor Yellow
Write-Host "1. Test server API endpoints directly" -ForegroundColor White
Write-Host "2. Test admin panel API key validation" -ForegroundColor White
Write-Host "3. Check CSP headers in responses" -ForegroundColor White
Write-Host "4. Verify client-side functionality" -ForegroundColor White

# Test 1: Server API Endpoints
Write-Host "`n🔍 Test 1: Server API Endpoints" -ForegroundColor Blue

$testAirports = @("OTP", "CLJ", "TSR")
$testResults = @()

foreach ($airport in $testAirports) {
    Write-Host "Testing $airport..." -ForegroundColor Gray
    
    # Test arrivals
    try {
        $arrivalsUrl = "$BASE_URL/api/flights/$airport/arrivals"
        $arrivalsResponse = Invoke-WebRequest -Uri $arrivalsUrl -TimeoutSec 30 -UseBasicParsing
        $arrivalsData = $arrivalsResponse.Content | ConvertFrom-Json
        
        $testResults += [PSCustomObject]@{
            Airport = $airport
            Type = "Arrivals"
            Status = $arrivalsResponse.StatusCode
            Success = $arrivalsData.success
            DataCount = $arrivalsData.data.Count
            Cached = $arrivalsData.cached
            Error = $arrivalsData.error
        }
        
        if ($arrivalsData.success) {
            Write-Host "  ✅ Arrivals: $($arrivalsData.data.Count) flights" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Arrivals: $($arrivalsData.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Arrivals failed: $_" -ForegroundColor Red
        $testResults += [PSCustomObject]@{
            Airport = $airport
            Type = "Arrivals"
            Status = "Error"
            Success = $false
            DataCount = 0
            Cached = $false
            Error = $_.Exception.Message
        }
    }
    
    # Test departures
    try {
        $departuresUrl = "$BASE_URL/api/flights/$airport/departures"
        $departuresResponse = Invoke-WebRequest -Uri $departuresUrl -TimeoutSec 30 -UseBasicParsing
        $departuresData = $departuresResponse.Content | ConvertFrom-Json
        
        $testResults += [PSCustomObject]@{
            Airport = $airport
            Type = "Departures"
            Status = $departuresResponse.StatusCode
            Success = $departuresData.success
            DataCount = $departuresData.data.Count
            Cached = $departuresData.cached
            Error = $departuresData.error
        }
        
        if ($departuresData.success) {
            Write-Host "  ✅ Departures: $($departuresData.data.Count) flights" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Departures: $($departuresData.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Departures failed: $_" -ForegroundColor Red
        $testResults += [PSCustomObject]@{
            Airport = $airport
            Type = "Departures"
            Status = "Error"
            Success = $false
            DataCount = 0
            Cached = $false
            Error = $_.Exception.Message
        }
    }
}

# Test 2: Admin Panel API Key Validation
Write-Host "`n🔍 Test 2: Admin Panel API Key Validation" -ForegroundColor Blue

try {
    $adminApiUrl = "$BASE_URL/api/admin/api-key"
    $adminBody = @{
        apiKey = $API_KEY
    } | ConvertTo-Json
    
    $adminResponse = Invoke-WebRequest -Uri $adminApiUrl -Method POST -Body $adminBody -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing
    $adminData = $adminResponse.Content | ConvertFrom-Json
    
    if ($adminData.valid) {
        Write-Host "✅ API key validation: Valid" -ForegroundColor Green
        Write-Host "  Message: $($adminData.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ API key validation: Invalid" -ForegroundColor Red
        Write-Host "  Error: $($adminData.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Admin API test failed: $_" -ForegroundColor Red
}

# Test 3: CSP Headers
Write-Host "`n🔍 Test 3: CSP Headers" -ForegroundColor Blue

try {
    $mainPageResponse = Invoke-WebRequest -Uri $BASE_URL -TimeoutSec 30 -UseBasicParsing
    $cspHeader = $mainPageResponse.Headers['Content-Security-Policy']
    
    if ($cspHeader) {
        Write-Host "✅ CSP header found" -ForegroundColor Green
        
        # Check if API.Market domain is allowed
        if ($cspHeader -like "*prod.api.market*") {
            Write-Host "✅ API.Market domain allowed in CSP" -ForegroundColor Green
        } else {
            Write-Host "❌ API.Market domain NOT found in CSP" -ForegroundColor Red
        }
        
        Write-Host "CSP Policy: $cspHeader" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ No CSP header found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ CSP header test failed: $_" -ForegroundColor Red
}

# Test 4: Client-side Pages
Write-Host "`n🔍 Test 4: Client-side Pages" -ForegroundColor Blue

$clientPages = @(
    "$BASE_URL/airport/OTP",
    "$BASE_URL/airport/OTP/arrivals",
    "$BASE_URL/airport/OTP/departures",
    "$BASE_URL/admin"
)

foreach ($page in $clientPages) {
    try {
        $pageResponse = Invoke-WebRequest -Uri $page -TimeoutSec 30 -UseBasicParsing
        if ($pageResponse.StatusCode -eq 200) {
            Write-Host "✅ $page - Accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $page - Status: $($pageResponse.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $page - Failed: $_" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$successfulTests = ($testResults | Where-Object { $_.Success -eq $true }).Count
$totalTests = $testResults.Count

Write-Host "API Endpoint Tests: $successfulTests/$totalTests successful" -ForegroundColor White

if ($successfulTests -eq $totalTests) {
    Write-Host "🎉 All API tests passed!" -ForegroundColor Green
} elseif ($successfulTests -gt 0) {
    Write-Host "⚠️ Some API tests failed - check configuration" -ForegroundColor Yellow
} else {
    Write-Host "❌ All API tests failed - check server and API key" -ForegroundColor Red
}

# Detailed results
Write-Host "`n📋 Detailed Results:" -ForegroundColor Yellow
$testResults | Format-Table -AutoSize

Write-Host "`n🔧 Next Steps:" -ForegroundColor Yellow
if ($successfulTests -lt $totalTests) {
    Write-Host "1. Check server logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "2. Verify API key configuration in admin panel" -ForegroundColor White
    Write-Host "3. Test MCP endpoint directly with curl" -ForegroundColor White
    Write-Host "4. Check network connectivity to API.Market" -ForegroundColor White
} else {
    Write-Host "1. Test flight data loading in browser" -ForegroundColor White
    Write-Host "2. Check browser console for CSP errors (should be none)" -ForegroundColor White
    Write-Host "3. Verify real-time updates are working" -ForegroundColor White
    Write-Host "4. Monitor performance and caching" -ForegroundColor White
}

Write-Host "`n✅ CSP Fix Testing Complete!" -ForegroundColor Green