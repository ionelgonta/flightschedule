#!/usr/bin/env pwsh

# EMERGENCY SERVER FIX SCRIPT
# Use this when both anyway.ro and victoriaocara.com are down

Write-Host "=== EMERGENCY SERVER FIX ===" -ForegroundColor Red
Write-Host "RULE: NEVER MODIFY PORT CONFIGURATIONS!" -ForegroundColor Yellow

$SERVER = "anyway.ro"
$USER = "root"

Write-Host "`n1. Stopping conflicting Docker containers..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "docker stop \$(docker ps -q) 2>/dev/null || echo 'No containers to stop'"

Write-Host "`n2. Starting nginx..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "systemctl start nginx"

Write-Host "`n3. Restarting PM2 processes..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "pm2 restart anyway-ro"
ssh "${USER}@${SERVER}" "pm2 restart victoriaocara"

Write-Host "`n4. STATUS CHECK:" -ForegroundColor Green
ssh "${USER}@${SERVER}" "systemctl status nginx --no-pager"
ssh "${USER}@${SERVER}" "pm2 list"

Write-Host "`n5. TESTING SITES:" -ForegroundColor Green
try {
    $response1 = Invoke-WebRequest -Uri "https://anyway.ro" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ anyway.ro: HTTP $($response1.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ anyway.ro: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response2 = Invoke-WebRequest -Uri "https://victoriaocara.com" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ victoriaocara.com: HTTP $($response2.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ victoriaocara.com: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== EMERGENCY FIX COMPLETE ===" -ForegroundColor Green
Write-Host "Remember: NEVER modify port configurations!" -ForegroundColor Yellow