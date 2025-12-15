#!/usr/bin/env pwsh

# Deploy Live Analytics System - Simple version
$SERVER = "anyway.ro"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "Deploying Live Analytics System..." -ForegroundColor Green
Write-Host "Server: $SERVER" -ForegroundColor Cyan

# Test connection
Write-Host "Testing connection..." -ForegroundColor Yellow
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${USER}@${SERVER} "echo 'Connected'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Cannot connect to server" -ForegroundColor Red
    exit 1
}

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin/cache-config"
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin/cache-stats"
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin/cache-clear"

# Upload files
Write-Host "Uploading files..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no lib/flightAnalyticsService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp -o StrictHostKeyChecking=no app/admin/page.tsx ${USER}@${SERVER}:${PROJECT_DIR}/app/admin/
scp -o StrictHostKeyChecking=no app/api/admin/cache-config/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-config/
scp -o StrictHostKeyChecking=no app/api/admin/cache-stats/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-stats/
scp -o StrictHostKeyChecking=no app/api/admin/cache-clear/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-clear/

# Build and restart
Write-Host "Building and restarting..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "cd ${PROJECT_DIR} && npm run build && pm2 restart anyway-flight-schedule"

Write-Host "DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "  Admin: https://anyway.ro/admin" -ForegroundColor White
Write-Host "  Analytics: https://anyway.ro/analize" -ForegroundColor White