#!/usr/bin/env pwsh

Write-Host "🎉 TESTING FINAL SITE UPDATE..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/aeroporturi" -UseBasicParsing
    $content = $response.Content
    
    Write-Host "✅ CHECKING UPDATED CONTENT..." -ForegroundColor Yellow
    
    # Test 1: Updated title
    if ($content -match "Aeroporturile din România și Moldova") {
        Write-Host "✅ SUCCESS: Found updated title 'Aeroporturile din România și Moldova'" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Updated title not found" -ForegroundColor Red
    }
    
    # Test 2: Updated description
    if ($content -match "toate aeroporturile din România și Moldova") {
        Write-Host "✅ SUCCESS: Found updated description" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Updated description not found" -ForegroundColor Red
    }
    
    # Test 3: Country count
    if ($content -match "2.*Țări") {
        Write-Host "✅ SUCCESS: Found updated country count (2)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Country count not updated" -ForegroundColor Red
    }
    
    # Test 4: Romanian airports present
    if ($content -match "București.*Henri Coandă" -and $content -match "Cluj-Napoca" -and $content -match "Timișoara") {
        Write-Host "✅ SUCCESS: Romanian airports present" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Romanian airports missing" -ForegroundColor Red
    }
    
    # Test 5: Moldova airport present
    if ($content -match "Chișinău.*Moldova") {
        Write-Host "✅ SUCCESS: Moldova airport present" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Moldova airport missing" -ForegroundColor Red
    }
    
    # Test 6: International airports removed
    if ($content -match "London Heathrow|Charles de Gaulle|Frankfurt|Dubai") {
        Write-Host "❌ FAIL: International airports still present" -ForegroundColor Red
    } else {
        Write-Host "✅ SUCCESS: International airports removed" -ForegroundColor Green
    }
    
    # Test 7: Metadata updated
    if ($content -match "Aeroporturi România și Moldova - Program Zboruri") {
        Write-Host "✅ SUCCESS: Page title updated" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Page title not updated" -ForegroundColor Red
    }
    
    Write-Host "🎉 FINAL TEST COMPLETED!" -ForegroundColor Cyan
    Write-Host "🌐 Site is live at: https://anyway.ro/aeroporturi" -ForegroundColor Blue
    
} catch {
    Write-Host "❌ Error testing site: $($_.Exception.Message)" -ForegroundColor Red
}