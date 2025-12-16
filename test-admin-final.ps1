#!/usr/bin/env pwsh

Write-Host "Testing admin page at https://anyway.ro/admin..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/admin" -UseBasicParsing
    $content = $response.Content
    
    Write-Host "`nChecking for updated content..." -ForegroundColor Yellow
    
    if ($content -match "Admin Dashboard") {
        Write-Host "✅ Found 'Admin Dashboard' - UPDATED!" -ForegroundColor Green
    } elseif ($content -match "Admin Publicitate") {
        Write-Host "❌ Still showing 'Admin Publicitate' - OLD VERSION" -ForegroundColor Red
    }
    
    if ($content -match "Introduceți parola") {
        Write-Host "✅ Found 'Introduceți parola' - UPDATED!" -ForegroundColor Green
    } elseif ($content -match "Introdu parola") {
        Write-Host "❌ Still showing 'Introdu parola' - OLD VERSION" -ForegroundColor Red
    }
    
    if ($content -match "admin123") {
        Write-Host "❌ Still showing demo password 'admin123' - OLD VERSION" -ForegroundColor Red
    } else {
        Write-Host "✅ Demo password removed - UPDATED!" -ForegroundColor Green
    }
    
    if ($content -match "Securitate") {
        Write-Host "✅ Found security section - UPDATED!" -ForegroundColor Green
    } else {
        Write-Host "❌ Security section not found - OLD VERSION" -ForegroundColor Red
    }
    
    Write-Host "`nAdmin page test completed." -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error testing admin page: $($_.Exception.Message)" -ForegroundColor Red
}