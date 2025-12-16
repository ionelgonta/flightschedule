#!/usr/bin/env pwsh

Write-Host "🌐 Deploying to server anyway.ro..." -ForegroundColor Green

# Server details
$serverUser = "root"
$serverHost = "anyway.ro"
$serverPath = "/var/www/anyway.ro"

Write-Host "📁 Copying files to server..." -ForegroundColor Yellow

# Use rsync for better file transfer
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' ./ ${serverUser}@${serverHost}:${serverPath}/

Write-Host "⚙️ Installing dependencies and building..." -ForegroundColor Yellow

# SSH commands for server setup
ssh ${serverUser}@${serverHost} "cd ${serverPath} && npm install --production && npm run build && mkdir -p data && chmod 755 data && pm2 restart anyway-ro && pm2 save"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Site: https://anyway.ro" -ForegroundColor Cyan
Write-Host "🔗 Admin: https://anyway.ro/admin" -ForegroundColor Cyan