#!/usr/bin/env pwsh

Write-Host "🚀 Deploying URL structure update and English text removal..." -ForegroundColor Green

# Build the project
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "🌐 Deploying to anyway.ro..." -ForegroundColor Yellow

# Copy files to server
scp -r .next/* root@anyway.ro:/var/www/anyway.ro/.next/
scp -r app/* root@anyway.ro:/var/www/anyway.ro/app/
scp -r components/* root@anyway.ro:/var/www/anyway.ro/components/
scp -r lib/* root@anyway.ro:/var/www/anyway.ro/lib/
scp package.json root@anyway.ro:/var/www/anyway.ro/
scp next.config.js root@anyway.ro:/var/www/anyway.ro/

# Restart the application
ssh root@anyway.ro "cd /var/www/anyway.ro; pm2 restart anyway-app"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌍 Site updated at https://anyway.ro" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Changes deployed:" -ForegroundColor Yellow
Write-Host "  ✓ URL structure changed from /airport/OTP to /airport/bucuresti-henri-coanda" -ForegroundColor Green
Write-Host "  ✓ All English text translated to Romanian" -ForegroundColor Green
Write-Host "  ✓ Airport links updated to use city-airport name format" -ForegroundColor Green
Write-Host "  ✓ Slug generation and routing implemented" -ForegroundColor Green
Write-Host "  ✓ Backward compatibility maintained for old URLs" -ForegroundColor Green