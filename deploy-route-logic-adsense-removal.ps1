#!/usr/bin/env pwsh

# Deploy Route Logic Fix and AdSense Removal
# Fixes duplicate routes issue and removes all AdSense code from admin

Write-Host "🚀 Deploying Route Logic Fix and AdSense Removal..." -ForegroundColor Green

# Server connection details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "📁 Uploading fixed files to server..." -ForegroundColor Yellow

# Upload the fixed admin page (AdSense removed)
scp "app/admin/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/admin/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload admin page" -ForegroundColor Red
    exit 1
}

# Upload the fixed flight analytics service (route logic fixed)
scp "lib/flightAnalyticsService.ts" "${USER}@${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload flight analytics service" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Building and restarting application on server..." -ForegroundColor Yellow

# Execute deployment commands on server
ssh "${USER}@${SERVER}" @"
cd ${REMOTE_PATH}

# Build the application
echo "Building Next.js application..."
npm run build
if [ \$? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart anyway-flight-schedule
pm2 restart anyway-flight-schedule-server

# Check PM2 status
pm2 status

echo "✅ Deployment completed successfully!"
echo ""
echo "🎯 Changes deployed:"
echo "  ✅ Removed all AdSense code from admin interface"
echo "  ✅ Fixed route analysis logic to prevent duplicate routes"
echo "  ✅ Admin interface now shows only API & MCP management"
echo ""
echo "🔗 Admin URL: https://anyway.ro/admin"
echo "🧪 Test Chișinău routes: https://anyway.ro/aeroport/chisinau-chisinau/statistici"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Route Logic Fix and AdSense Removal deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Summary of changes:" -ForegroundColor Cyan
    Write-Host "  ✅ Removed all AdSense code from admin interface" -ForegroundColor Green
    Write-Host "  ✅ Fixed route analysis logic to prevent duplicate routes" -ForegroundColor Green
    Write-Host "  ✅ Admin interface now shows only API & MCP management" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Test URLs:" -ForegroundColor Yellow
    Write-Host "  Admin: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "  Chișinău Routes: https://anyway.ro/aeroport/chisinau-chisinau/statistici" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}