# Simple deployment script for AdSense Toggle System
Write-Host "🎯 Deploying AdSense Toggle System to anyway.ro..." -ForegroundColor Green

# Check if files exist
$files = @("lib/adConfig.ts", "components/ads/AdBanner.tsx", "ADSENSE_TOGGLE_CONSOLE.md", "FINAL_ADSENSE_CONTROL.md")
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ File not found: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📤 Uploading files..." -ForegroundColor Yellow

# Upload files using scp
scp -o StrictHostKeyChecking=no "lib/adConfig.ts" "root@23.88.113.154:/root/flight-app/lib/"
scp -o StrictHostKeyChecking=no "components/ads/AdBanner.tsx" "root@23.88.113.154:/root/flight-app/components/ads/"
scp -o StrictHostKeyChecking=no "ADSENSE_TOGGLE_CONSOLE.md" "root@23.88.113.154:/root/flight-app/"
scp -o StrictHostKeyChecking=no "FINAL_ADSENSE_CONTROL.md" "root@23.88.113.154:/root/flight-app/"

Write-Host "🔨 Building on server..." -ForegroundColor Yellow

# Build and restart on server
ssh -o StrictHostKeyChecking=no "root@23.88.113.154" @"
cd /root/flight-app
npm run build
docker-compose down
docker-compose up -d --build
"@

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://anyway.ro/admin" -ForegroundColor White
Write-Host "2. Open browser console (F12)" -ForegroundColor White
Write-Host "3. Run the script from ADSENSE_TOGGLE_CONSOLE.md" -ForegroundColor White