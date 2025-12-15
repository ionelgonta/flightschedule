#!/usr/bin/env pwsh

Write-Host "Testing site update..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/aeroporturi" -UseBasicParsing
    $content = $response.Content
    
    Write-Host "Checking for updated content..." -ForegroundColor Yellow
    
    if ($content -match "Aeroporturile din România și Moldova") {
        Write-Host "✅ SUCCESS: Found updated title 'Aeroporturile din România și Moldova'" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Updated title not found" -ForegroundColor Red
    }
    
    if ($content -match "toate aeroporturile din România și Moldova") {
        Write-Host "✅ SUCCESS: Found updated description" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Updated description not found" -ForegroundColor Red
    }
    
    if ($content -match "2.*Țări") {
        Write-Host "✅ SUCCESS: Found updated country count (2)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Country count not updated" -ForegroundColor Red
    }
    
    # Check if international airports are removed
    if ($content -match "London Heathrow|Charles de Gaulle|Frankfurt") {
        Write-Host "❌ FAIL: International airports still present" -ForegroundColor Red
    } else {
        Write-Host "✅ SUCCESS: International airports removed" -ForegroundColor Green
    }
    
    Write-Host "Test completed!" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error testing site: $($_.Exception.Message)" -ForegroundColor Red
}