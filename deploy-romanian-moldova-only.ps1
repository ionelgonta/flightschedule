#!/usr/bin/env pwsh

Write-Host "Deploying Romanian and Moldova airports only update..." -ForegroundColor Green

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Yellow

# SSH connection details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/var/www/anyway.ro"

# Create deployment archive
Write-Host "Creating deployment archive..." -ForegroundColor Yellow
tar -czf deploy.tar.gz .next package.json package-lock.json public lib app components types middleware.ts next.config.js

# Upload and deploy
Write-Host "Uploading to server..." -ForegroundColor Yellow
scp deploy.tar.gz ${USER}@${SERVER}:${REMOTE_PATH}/

Write-Host "Extracting and restarting services..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} @"
cd ${REMOTE_PATH}
tar -xzf deploy.tar.gz
rm deploy.tar.gz
npm install --production
pm2 restart anyway-ro
pm2 save
"@

# Cleanup
Remove-Item deploy.tar.gz -ErrorAction SilentlyContinue

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Site updated: https://anyway.ro" -ForegroundColor Cyan
Write-Host "Changes deployed:" -ForegroundColor Yellow
Write-Host "  - Removed all international airports" -ForegroundColor White
Write-Host "  - Kept only Romanian and Moldovan airports" -ForegroundColor White
Write-Host "  - Updated demo flight data" -ForegroundColor White
Write-Host "  - Updated airports page content and SEO" -ForegroundColor White