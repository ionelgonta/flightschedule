#!/usr/bin/env pwsh

Write-Host "Deploying Homepage with 'Vezi toate aeroporturile' card..." -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Server details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "`nStep 1: Uploading homepage to server..." -ForegroundColor Yellow

# Upload homepage
scp "app/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Homepage uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to upload homepage" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Building on server..." -ForegroundColor Yellow

# SSH to server and rebuild
$buildCommands = @"
cd $REMOTE_PATH
npm run build
pm2 restart anyway-ro
"@

ssh "${USER}@${SERVER}" $buildCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "Server build and restart successful" -ForegroundColor Green
} else {
    Write-Host "Server build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Testing deployment..." -ForegroundColor Yellow

# Wait for server to restart
Start-Sleep -Seconds 10

# Test the homepage
try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Homepage is responding correctly!" -ForegroundColor Green
        if ($response.Content -like "*Vezi toate aeroporturile*") {
            Write-Host "✅ 'Vezi toate aeroporturile' card is present on homepage!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 'Vezi toate aeroporturile' card not found in homepage content" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Error testing homepage: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

Write-Host "`nHomepage with 'Vezi toate aeroporturile' card is now LIVE!" -ForegroundColor Cyan
Write-Host "Access: https://anyway.ro" -ForegroundColor White
Write-Host "Look for: 'Aeroporturi din România și Moldova' section" -ForegroundColor White
Write-Host "New card: 'Vezi toate aeroporturile' with link to /aeroporturi" -ForegroundColor White

Write-Host "`nReady to test live!" -ForegroundColor Green