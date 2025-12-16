#!/usr/bin/env pwsh

# Deploy Enhanced Parking Details
# Updates parking page with comprehensive information including address, facilities, contact, etc.

Write-Host "🚀 Deploying Enhanced Parking Details..." -ForegroundColor Green

# Server connection details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "📁 Uploading enhanced parking files to server..." -ForegroundColor Yellow

# Upload the enhanced parking JSON data
scp "public/data/parking.json" "${USER}@${SERVER}:${REMOTE_PATH}/public/data/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload parking.json" -ForegroundColor Red
    exit 1
}

# Upload the enhanced parking page
scp "app/parcari-otopeni/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/parcari-otopeni/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload parking page" -ForegroundColor Red
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
echo "🎯 Enhanced parking details now live:"
echo "  ✅ Complete address information for all parking options"
echo "  ✅ Distance to terminal with shuttle times"
echo "  ✅ Parking type and facilities details"
echo "  ✅ Contact information and cancellation policies"
echo "  ✅ Customer reviews and ratings"
echo "  ✅ Payment methods and operating hours"
echo ""
echo "🔗 Enhanced parking page: https://anyway.ro/parcari-otopeni"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Enhanced Parking Details deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Summary of enhancements:" -ForegroundColor Cyan
    Write-Host "  ✅ Added complete address information" -ForegroundColor Green
    Write-Host "  ✅ Added shuttle distance and timing details" -ForegroundColor Green
    Write-Host "  ✅ Added parking type and facilities information" -ForegroundColor Green
    Write-Host "  ✅ Added contact details and cancellation policies" -ForegroundColor Green
    Write-Host "  ✅ Added customer reviews and ratings display" -ForegroundColor Green
    Write-Host "  ✅ Enhanced card layout with detailed information grid" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Test URL:" -ForegroundColor Yellow
    Write-Host "  Enhanced Parking Page: https://anyway.ro/parcari-otopeni" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 New information displayed:" -ForegroundColor Yellow
    Write-Host "  📍 Address, 🚌 Distance, 🅿️ Type, ⚡ Facilities" -ForegroundColor White
    Write-Host "  🕒 Hours, 💳 Payment, 📞 Contact, ❌ Cancellation" -ForegroundColor White
    Write-Host "  ⭐ Reviews and ratings for each parking option" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}