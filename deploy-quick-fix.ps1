#!/usr/bin/env pwsh

# Quick Deploy - Updates server with CSP fix and client service
Write-Host "🚀 Quick CSP Fix Deployment..." -ForegroundColor Green

# Build locally first
Write-Host "🔨 Building project..." -ForegroundColor Blue
npm run build

# Create simple deployment script
$deployScript = @'
#!/bin/bash
cd /root/flight-schedule

# Pull latest changes
git add .
git commit -m "CSP fix and client service updates" || true
git push origin main || true

# Rebuild and restart
docker-compose down
docker-compose up -d --build

echo "✅ Deployment complete"
'@

# Execute on server
Write-Host "🚀 Deploying to server..." -ForegroundColor Blue
$deployScript | ssh -o StrictHostKeyChecking=no root@23.88.113.154 'bash -s'

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Test at: https://anyway.ro/airport/OTP/arrivals" -ForegroundColor Cyan