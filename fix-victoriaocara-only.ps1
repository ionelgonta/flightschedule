#!/usr/bin/env pwsh

Write-Host "Fixing victoriaocara.com ONLY - NO network/port changes" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Restart only victoriaocara service
ssh "${USER}@${SERVER}" "pm2 restart victoriaocara"

Write-Host "victoriaocara.com service restarted!" -ForegroundColor Green