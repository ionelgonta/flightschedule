#!/usr/bin/env pwsh

Write-Host "=== TESTING FLIGHT ANALYTICS SYSTEM ===" -ForegroundColor Green

$baseUrl = "https://anyway.ro"
$testResults = @()

# Test URLs
$testUrls = @(
    @{ Name = "Flight Schedules"; Url = "$baseUrl/aeroport/bucuresti-henri-coanda/program-zboruri" }
    @{ Name = "Airport Statistics"; Url = "$baseUrl/aeroport/bucuresti-henri-coanda/statistici" }
    @{ Name = "Historical Analysis"; Url = "$baseUrl/aeroport/bucuresti-henri-coanda/istoric-zboruri" }
    @{ Name = "Flight Analytics"; Url = "$baseUrl/aeroport/bucuresti-henri-coanda/analize-zboruri" }
    @{ Name = "Aircraft Catalog"; Url = "$baseUrl/aeronave" }
    @{ Name = "API - Flight Schedules"; Url = "$baseUrl/api/aeroport/OTP/program-zboruri?type=departures&from=2024-12-15&to=2024-12-15" }
    @{ Name = "API - Statistics"; Url = "$baseUrl/api/aeroport/OTP/statistici?period=monthly" }
    @{ Name = "API - Historical"; Url = "$baseUrl/api/aeroport/OTP/istoric-zboruri?from=2024-11-15&to=2024-12-15" }
    @{ Name = "API - Analytics"; Url = "$baseUrl/api/aeroport/OTP/analize-zboruri?period=month" }
    @{ Name = "API - Aircraft Search"; Url = "$baseUrl/api/aeronave?q=YR-ABC&type=registration" }
)

Write-Host "Testing analytics pages and APIs..." -ForegroundColor Yellow
Write-Host ""

foreach ($test in $testUrls) {
    Write-Host "Testing: $($test.Name)" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method GET -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
            $testResults += @{ Name = $test.Name; Status = "PASS"; Code = $response.StatusCode }
        } else {
            Write-Host "  ✗ FAILED - Status: $($response.StatusCode)" -ForegroundColor Red
            $testResults += @{ Name = $test.Name; Status = "FAIL"; Code = $response.StatusCode }
        }
    }
    catch {
        Write-Host "  ✗ ERROR - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Name = $test.Name; Status = "ERROR"; Code = "N/A" }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== TEST RESULTS SUMMARY ===" -ForegroundColor Green

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -ne "PASS" }).Count

Write-Host "Total Tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED! Analytics system is working correctly." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Check the results above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Manual testing recommended:" -ForegroundColor Yellow
Write-Host "1. Visit https://anyway.ro/aeroport/bucuresti-henri-coanda/statistici" -ForegroundColor Cyan
Write-Host "2. Test the period toggles (daily/weekly/monthly)" -ForegroundColor Cyan
Write-Host "3. Check the flight schedules calendar view" -ForegroundColor Cyan
Write-Host "4. Search for aircraft in the catalog" -ForegroundColor Cyan