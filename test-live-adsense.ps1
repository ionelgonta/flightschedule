#!/usr/bin/env pwsh

# Script pentru testarea rapidă a funcționalității AdSense pe live
param(
    [string]$ServerUrl = "http://localhost:3000"
)

Write-Host "🧪 Test rapid AdSense Admin pe live" -ForegroundColor Green
Write-Host "Server: $ServerUrl" -ForegroundColor Cyan

# Test 1: Verifică dacă serverul răspunde
Write-Host "`n1. Verifică serverul..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ServerUrl -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Serverul răspunde (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Serverul nu răspunde: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Verifică API-ul AdSense
Write-Host "`n2. Testez API AdSense..." -ForegroundColor Yellow
try {
    $apiUrl = "$ServerUrl/api/admin/adsense"
    $apiResponse = Invoke-RestMethod -Uri $apiUrl -Method GET -TimeoutSec 10
    
    if ($apiResponse.success) {
        Write-Host "✅ API AdSense funcționează!" -ForegroundColor Green
        Write-Host "   Publisher ID: $($apiResponse.publisherId)" -ForegroundColor Blue
        Write-Host "   Has Publisher ID: $($apiResponse.hasPublisherId)" -ForegroundColor Blue
    } else {
        Write-Host "❌ API AdSense returnează eroare!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Eroare API AdSense: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Testează validarea Publisher ID
Write-Host "`n3. Testez validarea Publisher ID..." -ForegroundColor Yellow
try {
    $testBody = @{
        publisherId = "ca-pub-2305349540791838"
        action = "test"
    } | ConvertTo-Json
    
    $validationResponse = Invoke-RestMethod -Uri "$ServerUrl/api/admin/adsense" -Method POST -Body $testBody -ContentType "application/json" -TimeoutSec 10
    
    if ($validationResponse.success -and $validationResponse.valid) {
        Write-Host "✅ Validarea Publisher ID funcționează!" -ForegroundColor Green
    } else {
        Write-Host "❌ Validarea Publisher ID nu funcționează!" -ForegroundColor Red
        Write-Host "   Eroare: $($validationResponse.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Eroare la validare: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Verifică pagina de admin
Write-Host "`n4. Verifică pagina de admin..." -ForegroundColor Yellow
try {
    $adminUrl = "$ServerUrl/admin"
    $adminResponse = Invoke-WebRequest -Uri $adminUrl -TimeoutSec 10 -ErrorAction Stop
    
    if ($adminResponse.StatusCode -eq 200) {
        Write-Host "✅ Pagina de admin este accesibilă!" -ForegroundColor Green
        
        # Verifică dacă conține elementele AdSense
        $content = $adminResponse.Content
        if ($content -match "Google AdSense" -and $content -match "Publisher ID") {
            Write-Host "✅ Interface AdSense găsită în pagină!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Interface AdSense nu a fost găsită în pagină!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Pagina de admin nu răspunde corect!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Eroare la accesarea paginii de admin: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Testează cu Publisher ID invalid
Write-Host "`n5. Testez cu Publisher ID invalid..." -ForegroundColor Yellow
try {
    $invalidTestBody = @{
        publisherId = "invalid-publisher-id"
        action = "test"
    } | ConvertTo-Json
    
    $invalidResponse = Invoke-RestMethod -Uri "$ServerUrl/api/admin/adsense" -Method POST -Body $invalidTestBody -ContentType "application/json" -TimeoutSec 10
    
    if ($invalidResponse.success -eq $false -and $invalidResponse.valid -eq $false) {
        Write-Host "✅ Validarea pentru ID-uri invalide funcționează!" -ForegroundColor Green
        Write-Host "   Mesaj eroare: $($invalidResponse.error)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Validarea pentru ID-uri invalide nu funcționează!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Eroare la testarea ID-ului invalid: $($_.Exception.Message)" -ForegroundColor Red
}

# Rezumat
Write-Host "`n📊 Rezumat testare:" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n🌐 URL-uri testate:" -ForegroundColor Cyan
Write-Host "• Server: $ServerUrl" -ForegroundColor White
Write-Host "• Admin: $ServerUrl/admin" -ForegroundColor White
Write-Host "• API: $ServerUrl/api/admin/adsense" -ForegroundColor White

Write-Host "`n🎯 Pentru testare manuală:" -ForegroundColor Cyan
Write-Host "1. Deschide în browser: $ServerUrl/admin" -ForegroundColor White
Write-Host "2. Selectează tab-ul 'Google AdSense'" -ForegroundColor White
Write-Host "3. Verifică Publisher ID curent" -ForegroundColor White
Write-Host "4. Încearcă să modifici Publisher ID-ul" -ForegroundColor White
Write-Host "5. Testează validarea și salvarea" -ForegroundColor White

Write-Host "`n✅ Test completat!" -ForegroundColor Green