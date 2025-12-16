#!/usr/bin/env pwsh

# Deploy Cache Admin Integration
# Fixes flight cache to respect admin cache settings instead of using fixed 10 minutes

Write-Host "🚀 Deploying Cache Admin Integration..." -ForegroundColor Green

# Server connection details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "📁 Uploading cache integration files to server..." -ForegroundColor Yellow

# Upload the updated flight repository
scp "lib/flightRepository.ts" "${USER}@${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload flightRepository.ts" -ForegroundColor Red
    exit 1
}

# Upload the updated cache config API
scp "app/api/admin/cache-config/route.ts" "${USER}@${SERVER}:${REMOTE_PATH}/app/api/admin/cache-config/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload cache-config route" -ForegroundColor Red
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
pm2 restart anyway-ro

# Check PM2 status
pm2 status

echo "✅ Deployment completed successfully!"
echo ""
echo "🎯 Cache integration improvements:"
echo "  ✅ Flight cache now respects admin cache settings"
echo "  ✅ Real-time interval from admin controls departures/arrivals cache"
echo "  ✅ No more fixed 10-minute cache duration"
echo "  ✅ Dynamic cache configuration updates"
echo ""
echo "🔗 Test URLs:"
echo "  Admin Cache Settings: https://anyway.ro/admin (Cache Management tab)"
echo "  Departures Page: https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari"
echo ""
echo "📋 How to test:"
echo "  1. Go to admin and set realtime interval (e.g., 30 minutes)"
echo "  2. Visit departures page - should use 30-minute cache"
echo "  3. Check browser console for cache duration logs"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cache Admin Integration deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Summary of changes:" -ForegroundColor Cyan
    Write-Host "  ✅ Flight repository now reads cache settings from admin" -ForegroundColor Green
    Write-Host "  ✅ Real-time cache duration is configurable (not fixed 10 min)" -ForegroundColor Green
    Write-Host "  ✅ Cache config API updates both analytics and flight caches" -ForegroundColor Green
    Write-Host "  ✅ Dynamic cache updates without restart" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Test URLs:" -ForegroundColor Yellow
    Write-Host "  Admin: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "  Departures: https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari" -ForegroundColor White
    Write-Host ""
    Write-Host "⚙️ Configuration:" -ForegroundColor Yellow
    Write-Host "  Default: 60 minutes realtime cache" -ForegroundColor White
    Write-Host "  Configurable: 5-1440 minutes via admin" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}