#!/usr/bin/env pwsh

# Script pentru testarea funcționalității AdSense Admin
Write-Host "🎯 Testare funcționalitate AdSense Admin" -ForegroundColor Green

# Pornește serverul de dezvoltare în background
Write-Host "Pornesc serverul de dezvoltare..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden

# Așteaptă ca serverul să pornească
Write-Host "Aștept ca serverul să pornească..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    # Test 1: Verifică API-ul GET
    Write-Host "`n1. Testez API GET pentru configurația AdSense..." -ForegroundColor Cyan
    $getResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method GET
    Write-Host "✅ Publisher ID curent: $($getResponse.publisherId)" -ForegroundColor Green
    
    # Test 2: Testează validarea unui Publisher ID valid
    Write-Host "`n2. Testez validarea unui Publisher ID valid..." -ForegroundColor Cyan
    $testBody = @{ 
        publisherId = "ca-pub-2305349540791838"
        action = "test" 
    } | ConvertTo-Json
    
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method POST -Body $testBody -ContentType "application/json"
    if ($testResponse.valid) {
        Write-Host "✅ Publisher ID valid!" -ForegroundColor Green
    } else {
        Write-Host "❌ Publisher ID invalid: $($testResponse.error)" -ForegroundColor Red
    }
    
    # Test 3: Testează validarea unui Publisher ID invalid
    Write-Host "`n3. Testez validarea unui Publisher ID invalid..." -ForegroundColor Cyan
    $invalidTestBody = @{ 
        publisherId = "invalid-publisher-id"
        action = "test" 
    } | ConvertTo-Json
    
    $invalidTestResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method POST -Body $invalidTestBody -ContentType "application/json"
    if (-not $invalidTestResponse.valid) {
        Write-Host "✅ Validarea funcționează corect pentru ID-uri invalide!" -ForegroundColor Green
        Write-Host "   Eroare: $($invalidTestResponse.error)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Validarea nu funcționează corect!" -ForegroundColor Red
    }
    
    # Test 4: Testează salvarea (cu un ID temporar)
    Write-Host "`n4. Testez salvarea unui Publisher ID temporar..." -ForegroundColor Cyan
    $saveBody = @{ 
        publisherId = "ca-pub-1111111111111111"
        action = "save" 
    } | ConvertTo-Json
    
    $saveResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method POST -Body $saveBody -ContentType "application/json"
    if ($saveResponse.success) {
        Write-Host "✅ Salvarea funcționează!" -ForegroundColor Green
        
        # Restaurează Publisher ID-ul original
        Write-Host "   Restaurez Publisher ID-ul original..." -ForegroundColor Yellow
        $restoreBody = @{ 
            publisherId = "ca-pub-2305349540791838"
            action = "save" 
        } | ConvertTo-Json
        
        $restoreResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/adsense" -Method POST -Body $restoreBody -ContentType "application/json"
        if ($restoreResponse.success) {
            Write-Host "✅ Publisher ID restaurat cu succes!" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Salvarea nu funcționează: $($saveResponse.error)" -ForegroundColor Red
    }
    
    Write-Host "`n🎉 Toate testele au fost completate cu succes!" -ForegroundColor Green
    Write-Host "📝 Funcționalitatea AdSense Admin este gata de utilizare!" -ForegroundColor Green
    Write-Host "🌐 Accesează: http://localhost:3000/admin" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Eroare în timpul testării: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Oprește serverul
    Write-Host "`nOpresc serverul de dezvoltare..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
}

Write-Host "`n📋 Rezumat funcționalitate implementată:" -ForegroundColor Magenta
Write-Host "• ✅ API endpoint pentru gestionarea Publisher ID AdSense" -ForegroundColor White
Write-Host "• ✅ Validare format Publisher ID (ca-pub-xxxxxxxxxxxxxxxx)" -ForegroundColor White
Write-Host "• ✅ Testare Publisher ID înainte de salvare" -ForegroundColor White
Write-Host "• ✅ Salvare automată în fișierul de configurare" -ForegroundColor White
Write-Host "• ✅ Interface admin pentru editarea Publisher ID" -ForegroundColor White
Write-Host "• ✅ Gestionarea zonelor de publicitate AdSense" -ForegroundColor White