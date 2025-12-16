#!/usr/bin/env pwsh

# Deploy Parking Prices Update
# Updates parking page with current prices and new parking options

Write-Host "🚀 Deploying Parking Prices Update..." -ForegroundColor Green

# Server connection details
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "📁 Uploading updated parking files to server..." -ForegroundColor Yellow

# Upload the updated parking JSON data
scp "public/data/parking.json" "${USER}@${SERVER}:${REMOTE_PATH}/public/data/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload parking.json" -ForegroundColor Red
    exit 1
}

# Upload the updated parking page
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
pm2 restart anyway-flight-schedule
pm2 restart anyway-flight-schedule-server

# Check PM2 status
pm2 status

echo "✅ Deployment completed successfully!"
echo ""
echo "🎯 Parking prices updated:"
echo "  ✅ Parcare Aeroport Henri Coandă (oficial) - din ~10 lei/zi + tarife aeroport"
echo "  ✅ Park4Fly - ~27‑52 lei/zi, oferte long term ~9.9 lei/zi"
echo "  ✅ Parcare Otopeni - ~40‑140 lei/interval"
echo "  ✅ SafeParking - ~20‑45 lei/zi"
echo "  ✅ AirParking - ~40‑50 lei/zi scurt / ~15‑23 lei/zi long"
echo "  ✅ OTP Parking - ~50 lei/zi"
echo "  ✅ RoParking Otopeni - ~55 lei/zi"
echo "  ✅ GoParking Otopeni - ~30‑90 lei/interval"
echo "  ✅ Parkado - ~14.4‑45 lei/zi"
echo ""
echo "🔗 Parking page: https://anyway.ro/parcari-otopeni"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Parking Prices Update deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Summary of changes:" -ForegroundColor Cyan
    Write-Host "  ✅ Updated parking.json with 9 parking options and current prices" -ForegroundColor Green
    Write-Host "  ✅ Added price display to parking cards" -ForegroundColor Green
    Write-Host "  ✅ Updated parking descriptions with current information" -ForegroundColor Green
    Write-Host "  ✅ Maintained existing design and functionality" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Test URL:" -ForegroundColor Yellow
    Write-Host "  Parking Page: https://anyway.ro/parcari-otopeni" -ForegroundColor White
    Write-Host ""
    Write-Host "💰 Price ranges:" -ForegroundColor Yellow
    Write-Host "  Official: ~10 lei/zi + airport fees" -ForegroundColor White
    Write-Host "  Private: ~14.4-90 lei/day (varies by duration)" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}