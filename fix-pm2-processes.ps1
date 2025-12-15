#!/usr/bin/env pwsh

Write-Host "Fixing PM2 processes..." -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Clean up all processes and restart correctly
ssh "${USER}@${SERVER}" @"
cd /opt/anyway-flight-schedule
pm2 stop all
pm2 delete all
pm2 start 'npm run start' --name anyway-ro
pm2 save
pm2 list
"@

Write-Host "PM2 processes fixed!" -ForegroundColor Green