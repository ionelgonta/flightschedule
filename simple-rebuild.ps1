#!/usr/bin/env pwsh

Write-Host "Simple rebuild attempt..." -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Try to rebuild from the correct directory
ssh "${USER}@${SERVER}" "cd /opt/anyway-flight-schedule && rm -rf .next && npm run build && pm2 restart anyway-ro"

Write-Host "Simple rebuild completed!" -ForegroundColor Green