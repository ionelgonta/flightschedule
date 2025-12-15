#!/usr/bin/env pwsh

# Deploy Live Analytics System with Cache Management

$SERVER = "anyway.ro"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "Deploying Live Analytics System..." -ForegroundColor Green

# Files to deploy
$files = @(
    "lib/flightAnalyticsService.ts",
    "app/admin/page.tsx",
    "app/api/admin/cache-config/route.ts",
    "app/api/admin/cache-stats/route.ts", 
    "app/api/admin/cache-clear/route.ts"
)

Write-Host "Uploading files..." -ForegroundColor Yellow

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Uploading $file" -ForegroundColor Green
        scp -o StrictHostKeyChecking=no $file ${USER}@${SERVER}:${PROJECT_DIR}/$file
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "Building and restarting on server..." -ForegroundColor Blue

ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} @"
cd ${PROJECT_DIR}

echo "Building Next.js application..."
npm run build

echo "Restarting PM2 processes..."
pm2 restart anyway-flight-schedule

echo "Checking process status..."
pm2 status

echo "Live Analytics System deployed successfully!"
"@

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Live site: https://anyway.ro" -ForegroundColor Cyan
Write-Host "Admin panel: https://anyway.ro/admin" -ForegroundColor Cyan