#!/usr/bin/env pwsh

Write-Host "🚀 Deploying homepage with 'Vezi toate aeroporturile' card..." -ForegroundColor Green

# Build and deploy with Docker
Write-Host "📦 Building and deploying with Docker..." -ForegroundColor Yellow
docker-compose down
docker-compose build --no-cache
docker-compose up -d

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Site available at: https://anyway.ro" -ForegroundColor Cyan
Write-Host "📋 Check homepage airports section for the new 'Vezi toate aeroporturile' card" -ForegroundColor Cyan