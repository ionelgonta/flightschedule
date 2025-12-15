#!/usr/bin/env pwsh

# Deploy Live Analytics System with Cache Management
# Replaces ALL demo data with live AeroDataBox API integration

$SERVER = "anyway.ro"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "🚀 Deploying Live Analytics System..." -ForegroundColor Green
Write-Host "📊 Features: Live AeroDataBox API + Cache Management + Admin Controls" -ForegroundColor Cyan

# Files to deploy
$files = @(
    "lib/flightAnalyticsService.ts",
    "app/admin/page.tsx",
    "app/api/admin/cache-config/route.ts",
    "app/api/admin/cache-stats/route.ts", 
    "app/api/admin/cache-clear/route.ts"
)

Write-Host "`n📤 Uploading files..." -ForegroundColor Yellow

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
        scp -o StrictHostKeyChecking=no $file ${USER}@${SERVER}:${PROJECT_DIR}/$file
    } else {
        Write-Host "  ❌ $file (not found)" -ForegroundColor Red
    }
}

Write-Host "`n🔧 Building and restarting on server..." -ForegroundColor Blue

ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} @"
cd ${PROJECT_DIR}

echo "🏗️ Building Next.js application..."
npm run build

echo "🔄 Restarting PM2 processes..."
pm2 restart anyway-flight-schedule

echo "📊 Checking process status..."
pm2 status

echo "✅ Live Analytics System deployed successfully!"
echo "🎯 Features enabled:"
echo "  - Live AeroDataBox API integration (NO demo data)"
echo "  - Configurable cache intervals (admin panel)"
echo "  - Cache management system"
echo "  - Automatic cronjob refresh"
echo ""
echo "🔗 Access admin panel: https://anyway.ro/admin"
echo "📈 Test analytics: https://anyway.ro/analize"
"@

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Live site: https://anyway.ro" -ForegroundColor Cyan
Write-Host "⚙️ Admin panel: https://anyway.ro/admin" -ForegroundColor Cyan
Write-Host "📊 Analytics: https://anyway.ro/analize" -ForegroundColor Cyan

Write-Host "`nLIVE DATA INTEGRATION COMPLETE:" -ForegroundColor Magenta
Write-Host "  - Replaced ALL demo data with live AeroDataBox API" -ForegroundColor Green
Write-Host "  - Added cache management with configurable intervals" -ForegroundColor Green
Write-Host "  - Added admin cache controls (30 days analytics, 60 min realtime)" -ForegroundColor Green
Write-Host "  - Implemented automatic cache refresh system" -ForegroundColor Green
Write-Host "  - All analytics pages now use LIVE flight data" -ForegroundColor Green