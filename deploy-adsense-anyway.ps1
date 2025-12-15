#!/usr/bin/env pwsh

# Deploy AdSense Admin functionality to anyway.ro
Write-Host "🎯 Deploy AdSense Admin to anyway.ro" -ForegroundColor Green
Write-Host "=========================================="

$serverIP = "23.88.113.154"
$username = "root"
$password = "FlightSchedule2024!"
$projectPath = "/opt/anyway-flight-schedule"
$domain = "anyway.ro"

Write-Host ""
Write-Host "📋 AdSense Deployment Details:" -ForegroundColor Blue
Write-Host "- Server: $serverIP ($domain)"
Write-Host "- User: $username"
Write-Host "- Project: $projectPath"
Write-Host "- New Files: app/api/admin/adsense/route.ts"
Write-Host "- Modified: app/admin/page.tsx, lib/adConfig.ts"
Write-Host "- Publisher ID: ca-pub-2305349540791838"
Write-Host ""

# Build local pentru a verifica că totul funcționează
Write-Host "🔨 Building locally first..." -ForegroundColor Yellow
try {
    $buildResult = & npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Local build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Local build failed:" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️ Fix build errors before deploying to server!" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📁 Files to deploy:" -ForegroundColor Cyan
Write-Host "NEW FILES:"
Write-Host "- app/api/admin/adsense/route.ts (AdSense API endpoint)"
Write-Host ""
Write-Host "MODIFIED FILES:"
Write-Host "- app/admin/page.tsx (Added AdSense tab and functionality)"
Write-Host "- lib/adConfig.ts (Publisher ID: ca-pub-2305349540791838)"
Write-Host ""

Write-Host "🚀 DEPLOYMENT COMMANDS FOR SERVER:" -ForegroundColor Green
Write-Host "=========================================="
Write-Host ""

$deployCommands = @"
# Connect to server
ssh root@$serverIP

# Navigate to project
cd $projectPath

# Pull latest changes (if using git)
git pull origin main

# Or manually copy the new/modified files:
# - Copy app/api/admin/adsense/route.ts
# - Copy updated app/admin/page.tsx  
# - Copy updated lib/adConfig.ts

# Build and restart
npm run build
docker-compose down
docker-compose up -d --build

# Wait for startup
sleep 15

# Test the deployment
curl -s https://anyway.ro/api/admin/adsense | jq .
"@

Write-Host $deployCommands -ForegroundColor White

Write-Host ""
Write-Host "🧪 TESTING COMMANDS AFTER DEPLOYMENT:" -ForegroundColor Magenta
Write-Host "=========================================="

$testCommands = @"
# Test AdSense API
curl -s https://anyway.ro/api/admin/adsense

# Test AdSense validation
curl -X POST https://anyway.ro/api/admin/adsense \
  -H "Content-Type: application/json" \
  -d '{"publisherId":"ca-pub-2305349540791838","action":"test"}'

# Test admin page
curl -s https://anyway.ro/admin | grep -i "google adsense"
"@

Write-Host $testCommands -ForegroundColor White

Write-Host ""
Write-Host "🌐 URLs TO TEST IN BROWSER:" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "• Admin Panel: https://anyway.ro/admin" -ForegroundColor Cyan
Write-Host "• AdSense API: https://anyway.ro/api/admin/adsense" -ForegroundColor Cyan
Write-Host "• Main Site: https://anyway.ro" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 WHAT TO LOOK FOR:" -ForegroundColor Yellow
Write-Host "=========================================="
Write-Host "1. In Admin Panel (https://anyway.ro/admin):"
Write-Host "   ✅ Tab 'Google AdSense' should be visible and first"
Write-Host "   ✅ Publisher ID should show: ca-pub-2305349540791838"
Write-Host "   ✅ Test and Save buttons should work"
Write-Host ""
Write-Host "2. In API Response (https://anyway.ro/api/admin/adsense):"
Write-Host "   ✅ Should return: {\"success\":true,\"publisherId\":\"ca-pub-2305349540791838\",\"hasPublisherId\":true}"
Write-Host ""

Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Red
Write-Host "=========================================="
Write-Host "If AdSense tab doesn't appear:"
Write-Host "• Check browser console for JavaScript errors"
Write-Host "• Verify build completed successfully"
Write-Host "• Check if app/admin/page.tsx was updated correctly"
Write-Host ""
Write-Host "If API doesn't work:"
Write-Host "• Check if app/api/admin/adsense/route.ts exists"
Write-Host "• Verify file permissions on server"
Write-Host "• Check Docker logs: docker-compose logs -f"
Write-Host ""

Write-Host "📋 QUICK DEPLOY CHECKLIST:" -ForegroundColor Magenta
Write-Host "=========================================="
Write-Host "□ Connect to server: ssh root@$serverIP"
Write-Host "□ Navigate to project: cd $projectPath"
Write-Host "□ Copy new files (or git pull)"
Write-Host "□ Build: npm run build"
Write-Host "□ Restart: docker-compose down && docker-compose up -d --build"
Write-Host "□ Test API: curl https://anyway.ro/api/admin/adsense"
Write-Host "□ Test Admin: Open https://anyway.ro/admin in browser"
Write-Host "□ Verify AdSense tab is visible and functional"
Write-Host ""

Write-Host "✅ Ready for deployment to anyway.ro!" -ForegroundColor Green
Write-Host "Connect to server and run the commands above." -ForegroundColor Green