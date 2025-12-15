#!/usr/bin/env pwsh

# Test AdSense functionality on anyway.ro live server
param(
    [string]$Domain = "anyway.ro"
)

Write-Host "🧪 Testing AdSense Admin on $Domain" -ForegroundColor Green
Write-Host "=========================================="

$baseUrl = "https://$Domain"
$adminUrl = "$baseUrl/admin"
$apiUrl = "$baseUrl/api/admin/adsense"

Write-Host ""
Write-Host "🌐 Testing URLs:" -ForegroundColor Cyan
Write-Host "• Base: $baseUrl"
Write-Host "• Admin: $adminUrl"
Write-Host "• API: $apiUrl"
Write-Host ""

# Test 1: Check if server is responding
Write-Host "1. 🔍 Checking server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Server responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   🔧 Check if server is running and domain is accessible" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check AdSense API
Write-Host ""
Write-Host "2. 🔧 Testing AdSense API..." -ForegroundColor Yellow
try {
    $apiResponse = Invoke-RestMethod -Uri $apiUrl -Method GET -TimeoutSec 15 -ErrorAction Stop
    
    if ($apiResponse.success) {
        Write-Host "   ✅ AdSense API working!" -ForegroundColor Green
        Write-Host "   📝 Publisher ID: $($apiResponse.publisherId)" -ForegroundColor Blue
        Write-Host "   📊 Has Publisher ID: $($apiResponse.hasPublisherId)" -ForegroundColor Blue
    } else {
        Write-Host "   ❌ AdSense API returned error!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ AdSense API error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   🔧 Check if app/api/admin/adsense/route.ts was deployed" -ForegroundColor Yellow
}

# Test 3: Test Publisher ID validation
Write-Host ""
Write-Host "3. 🧪 Testing Publisher ID validation..." -ForegroundColor Yellow
try {
    $testBody = @{
        publisherId = "ca-pub-2305349540791838"
        action = "test"
    } | ConvertTo-Json
    
    $validationResponse = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $testBody -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    if ($validationResponse.success -and $validationResponse.valid) {
        Write-Host "   ✅ Publisher ID validation working!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Publisher ID validation failed!" -ForegroundColor Red
        Write-Host "   📝 Error: $($validationResponse.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Validation test error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test invalid Publisher ID
Write-Host ""
Write-Host "4. 🚫 Testing invalid Publisher ID..." -ForegroundColor Yellow
try {
    $invalidTestBody = @{
        publisherId = "invalid-publisher-id"
        action = "test"
    } | ConvertTo-Json
    
    $invalidResponse = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $invalidTestBody -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    if ($invalidResponse.success -eq $false -and $invalidResponse.valid -eq $false) {
        Write-Host "   ✅ Invalid ID rejection working!" -ForegroundColor Green
        Write-Host "   📝 Error message: $($invalidResponse.error)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Invalid ID validation not working!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Invalid ID test error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check admin page
Write-Host ""
Write-Host "5. 🎯 Testing admin page..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-WebRequest -Uri $adminUrl -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    
    if ($adminResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Admin page accessible!" -ForegroundColor Green
        
        # Check for AdSense content
        $content = $adminResponse.Content
        if ($content -match "Google AdSense" -or $content -match "Publisher ID") {
            Write-Host "   ✅ AdSense content found in page!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ AdSense content not found in page!" -ForegroundColor Yellow
            Write-Host "   🔧 Check if app/admin/page.tsx was updated correctly" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Admin page not accessible!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Admin page error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Magenta
Write-Host "=========================================="
Write-Host ""

Write-Host "🌐 Live URLs to check manually:" -ForegroundColor Cyan
Write-Host "• Admin Panel: $adminUrl" -ForegroundColor White
Write-Host "• AdSense API: $apiUrl" -ForegroundColor White
Write-Host ""

Write-Host "🎯 What to verify in browser:" -ForegroundColor Yellow
Write-Host "1. Open: $adminUrl" -ForegroundColor White
Write-Host "2. Look for 'Google AdSense' tab (should be first tab)" -ForegroundColor White
Write-Host "3. Click on AdSense tab" -ForegroundColor White
Write-Host "4. Verify Publisher ID shows: ca-pub-2305349540791838" -ForegroundColor White
Write-Host "5. Test changing Publisher ID and validation" -ForegroundColor White
Write-Host ""

Write-Host "If something doesn't work:" -ForegroundColor Red
Write-Host "• Check server logs: docker-compose logs -f" -ForegroundColor White
Write-Host "• Verify files were deployed correctly" -ForegroundColor White
Write-Host "• Check browser console for JavaScript errors" -ForegroundColor White
Write-Host "• Ensure build completed successfully" -ForegroundColor White
Write-Host ""

Write-Host "Testing completed for $Domain!" -ForegroundColor Green