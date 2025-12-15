#!/usr/bin/env pwsh

Write-Host "Deploying homepage with 'Vezi toate aeroporturile' card..." -ForegroundColor Green

# Create deployment package
$deployDir = "deploy-temp"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy homepage
Copy-Item "app/page.tsx" "$deployDir/" -Force

# Create deployment archive
tar -czf deploy.tar.gz -C $deployDir .

# Server details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/var/www/anyway.ro"

# Upload and deploy
Write-Host "Uploading to server..." -ForegroundColor Yellow
scp deploy.tar.gz ${USER}@${SERVER}:${REMOTE_PATH}/

Write-Host "Extracting and restarting services..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} @"
cd ${REMOTE_PATH}
tar -xzf deploy.tar.gz
rm deploy.tar.gz
cp page.tsx app/
rm page.tsx
npm run build
pm2 restart all
"@

# Cleanup
Remove-Item -Recurse -Force $deployDir -ErrorAction SilentlyContinue
Remove-Item deploy.tar.gz -ErrorAction SilentlyContinue

Write-Host "HOMEPAGE DEPLOYED!" -ForegroundColor Green
Write-Host "Check: https://anyway.ro" -ForegroundColor Cyan