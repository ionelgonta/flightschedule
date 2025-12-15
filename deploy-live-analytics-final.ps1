#!/usr/bin/env pwsh

# Deploy Live Analytics System - Final Version
$SERVER = "anyway.ro"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "🚀 Deploying Live Analytics System with Cache Management..." -ForegroundColor Green

# Create API directories first
Write-Host "📁 Creating API directories..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin"

# Upload core files
Write-Host "📤 Uploading analytics service..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no lib/flightAnalyticsService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/

Write-Host "📤 Uploading admin panel..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no app/admin/page.tsx ${USER}@${SERVER}:${PROJECT_DIR}/app/admin/

Write-Host "📤 Uploading cache management APIs..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no app/api/admin/cache-config/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-config/
scp -o StrictHostKeyChecking=no app/api/admin/cache-stats/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-stats/
scp -o StrictHostKeyChecking=no app/api/admin/cache-clear/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-clear/

Write-Host "🔧 Building and restarting on server..." -ForegroundColor Cyan

ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "cd ${PROJECT_DIR} && npm run build && pm2 restart anyway-flight-schedule && pm2 status && echo 'LIVE ANALYTICS SYSTEM DEPLOYED SUCCESSFULLY'"

Write-Host "DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "Live site: https://anyway.ro" -ForegroundColor Cyan
Write-Host "Admin panel: https://anyway.ro/admin" -ForegroundColor Cyan
Write-Host "Analytics: https://anyway.ro/analize" -ForegroundColor Cyan