#!/usr/bin/env pwsh

Write-Host "🚀 Deploying homepage with 'Vezi toate aeroporturile' card - FULL REBUILD..." -ForegroundColor Green

# Stop containers
Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Remove containers and images to force full rebuild
Write-Host "🗑️ Cleaning up containers and images..." -ForegroundColor Yellow
docker system prune -f
docker-compose rm -f

# Build with no cache and deploy
Write-Host "📦 Building with no cache..." -ForegroundColor Yellow
docker-compose build --no-cache --pull

Write-Host "🚀 Starting containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait a moment for containers to start
Start-Sleep -Seconds 10

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Site available at: https://anyway.ro" -ForegroundColor Cyan
Write-Host "📋 Check homepage airports section for the new 'Vezi toate aeroporturile' card" -ForegroundColor Cyan

# Test the homepage
Write-Host "🧪 Testing homepage..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Homepage is responding correctly!" -ForegroundColor Green
        if ($response.Content -like "*Vezi toate aeroporturile*") {
            Write-Host "✅ 'Vezi toate aeroporturile' card is present on homepage!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 'Vezi toate aeroporturile' card not found in homepage content" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Error testing homepage: $($_.Exception.Message)" -ForegroundColor Red
}