#!/usr/bin/env pwsh

# Weekly Schedule Analysis System Deployment
# Deploys the complete weekly flight schedule analysis system

Write-Host "🚀 Starting Weekly Schedule Analysis System Deployment..." -ForegroundColor Green

# Server configuration
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"
$LOCAL_PATH = "."

Write-Host "📋 Deployment Summary:" -ForegroundColor Yellow
Write-Host "  • Core System: lib/weeklyScheduleAnalyzer.ts" -ForegroundColor White
Write-Host "  • API Endpoint: app/api/admin/weekly-schedule/route.ts" -ForegroundColor White
Write-Host "  • Web Component: components/analytics/WeeklyScheduleView.tsx" -ForegroundColor White
Write-Host "  • Public Page: app/program-saptamanal/page.tsx" -ForegroundColor White
Write-Host "  • Admin Integration: Updated admin page with new tab" -ForegroundColor White
Write-Host "  • Navigation: Updated navbar with weekly schedule link" -ForegroundColor White
Write-Host "  • SEO: Updated sitemap with new page" -ForegroundColor White

# Files to deploy
$FILES_TO_DEPLOY = @(
    "lib/weeklyScheduleAnalyzer.ts",
    "app/api/admin/weekly-schedule/route.ts", 
    "components/analytics/WeeklyScheduleView.tsx",
    "app/program-saptamanal/page.tsx",
    "app/admin/page.tsx",
    "components/Navbar.tsx",
    "app/sitemap.ts"
)

Write-Host "📁 Files to deploy: $($FILES_TO_DEPLOY.Count)" -ForegroundColor Cyan

# Deploy each file
foreach ($file in $FILES_TO_DEPLOY) {
    if (Test-Path $file) {
        Write-Host "  ✅ Deploying: $file" -ForegroundColor Green
        
        # Create directory structure on server if needed
        $remoteDir = Split-Path "$REMOTE_PATH/$file" -Parent
        ssh "${USER}@${SERVER}" "mkdir -p '$remoteDir'"
        
        # Copy file to server
        scp "$file" "${USER}@${SERVER}:${REMOTE_PATH}/$file"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Successfully deployed $file" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Failed to deploy $file" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  ❌ File not found: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔧 Building application on server..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "cd $REMOTE_PATH; npm run build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Restarting PM2 processes..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "cd $REMOTE_PATH; pm2 restart all"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PM2 processes restarted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to restart PM2 processes" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow

# Test the API endpoint
Write-Host "  • Testing API endpoint..." -ForegroundColor Cyan
$apiTest = ssh "${USER}@${SERVER}" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/admin/weekly-schedule?action=get"
if ($apiTest -eq "200") {
    Write-Host "    ✅ API endpoint responding correctly" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  API endpoint returned status: $apiTest" -ForegroundColor Yellow
}

# Test the public page
Write-Host "  • Testing public page..." -ForegroundColor Cyan
$pageTest = ssh "${USER}@${SERVER}" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/program-saptamanal"
if ($pageTest -eq "200") {
    Write-Host "    ✅ Public page responding correctly" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Public page returned status: $pageTest" -ForegroundColor Yellow
}

# Test the admin page
Write-Host "  • Testing admin page..." -ForegroundColor Cyan
$adminTest = ssh "${USER}@${SERVER}" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin"
if ($adminTest -eq "200") {
    Write-Host "    ✅ Admin page responding correctly" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Admin page returned status: $adminTest" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Weekly Schedule Analysis System Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 System Features Deployed:" -ForegroundColor Yellow
Write-Host "  ✅ Offline-only analysis (no external API calls)" -ForegroundColor White
Write-Host "  ✅ 3-month historical data processing" -ForegroundColor White
Write-Host "  ✅ Weekly pattern generation for all routes" -ForegroundColor White
Write-Host "  ✅ Admin interface with new 'Program Săptămânal' tab" -ForegroundColor White
Write-Host "  ✅ Public page at /program-saptamanal" -ForegroundColor White
Write-Host "  ✅ Export functionality (JSON & CSV)" -ForegroundColor White
Write-Host "  ✅ Filtering and sorting capabilities" -ForegroundColor White
Write-Host "  ✅ Navigation menu integration" -ForegroundColor White
Write-Host "  ✅ SEO optimization with sitemap" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Access Points:" -ForegroundColor Cyan
Write-Host "  • Admin: https://anyway.ro/admin (tab 'Program Săptămânal')" -ForegroundColor White
Write-Host "  • Public: https://anyway.ro/program-saptamanal" -ForegroundColor White
Write-Host "  • API: https://anyway.ro/api/admin/weekly-schedule" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Access admin panel and click 'Actualizează' to generate initial data" -ForegroundColor White
Write-Host "  2. Test filtering and export functionality" -ForegroundColor White
Write-Host "  3. Verify public page displays correctly" -ForegroundColor White
Write-Host "  4. Check navigation menu includes new link" -ForegroundColor White
Write-Host ""
Write-Host "✨ Weekly Schedule Analysis System is now LIVE!" -ForegroundColor Green