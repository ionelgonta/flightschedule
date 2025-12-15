#!/usr/bin/env pwsh

Write-Host "Fixing homepage cache issue ONLY - NO network changes" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Clear Next.js cache and force rebuild
ssh "${USER}@${SERVER}" @"
cd /opt/anyway-flight-schedule
rm -rf .next/cache
rm -rf .next/static
npm run build
pm2 restart anyway-ro
"@

Write-Host "Homepage cache cleared and rebuilt!" -ForegroundColor Green