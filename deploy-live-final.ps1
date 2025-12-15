#!/usr/bin/env pwsh

Write-Host "🚀 Deploying URL structure changes to anyway.ro..." -ForegroundColor Green

# Deploy built files
Write-Host "📦 Copying build files..." -ForegroundColor Yellow
scp -r .next root@anyway.ro:/var/www/anyway.ro/

# Deploy source files
Write-Host "📁 Copying source files..." -ForegroundColor Yellow
scp -r app root@anyway.ro:/var/www/anyway.ro/
scp -r components root@anyway.ro:/var/www/anyway.ro/
scp -r lib root@anyway.ro:/var/www/anyway.ro/

# Restart application
Write-Host "🔄 Restarting application..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /var/www/anyway.ro && pm2 restart anyway-app"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌍 URL structure updated at https://anyway.ro" -ForegroundColor Cyan
Write-Host "📋 New URLs:" -ForegroundColor Yellow
Write-Host "  • https://anyway.ro/airport/bucuresti-henri-coanda" -ForegroundColor Green
Write-Host "  • https://anyway.ro/airport/cluj-napoca-cluj-napoca" -ForegroundColor Green
Write-Host "  • https://anyway.ro/airport/timisoara-timisoara-traian-vuia" -ForegroundColor Green