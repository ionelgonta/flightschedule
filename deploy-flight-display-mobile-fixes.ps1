#!/usr/bin/env pwsh

Write-Host "🚀 Deploying Flight Display Mobile Fixes..." -ForegroundColor Green

# Git operations
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add -A
git commit -m "Flight Display Mobile Fixes: Compact table layout, status translations, airport name deduplication"
git push origin main

# Server deployment
Write-Host "🌐 Deploying to server..." -ForegroundColor Yellow
scp -r components lib types root@anyway.ro:/var/www/anyway.ro/

Write-Host "🔧 Building on server..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /var/www/anyway.ro && npm run build && pm2 restart anyway-ro"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Site: https://anyway.ro" -ForegroundColor Cyan
Write-Host "📱 Mobile optimized flight tables now live!" -ForegroundColor Cyan