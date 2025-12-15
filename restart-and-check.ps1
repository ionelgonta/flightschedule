#!/usr/bin/env pwsh

Write-Host "Restarting PM2 and checking..." -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Stop, delete, and restart the process completely
ssh "${USER}@${SERVER}" @"
cd /opt/anyway-flight-schedule
pm2 stop anyway-ro
pm2 delete anyway-ro
pm2 start npm --name anyway-ro -- start
pm2 save
pm2 logs anyway-ro --lines 10
"@

Write-Host "PM2 restart completed!" -ForegroundColor Green