#!/usr/bin/env pwsh

$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Uploading homepage with 'Vezi toate aeroporturile' card..." -ForegroundColor Yellow

# Upload homepage
scp "app/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/"
Write-Host "Homepage uploaded" -ForegroundColor Green

Write-Host "Building and restarting..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "cd ${REMOTE_PATH} && npm run build && pm2 restart anyway-ro"

Write-Host "HOMEPAGE WITH 'VEZI TOATE AEROPORTURILE' DEPLOYED!" -ForegroundColor Green
Write-Host "Check: https://anyway.ro - look for the new card in airports section" -ForegroundColor Cyan