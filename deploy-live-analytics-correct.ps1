#!/usr/bin/env pwsh

# Deploy Live Analytics System - Using correct hostname
$SERVER = "anyway.ro"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "🚀 Deploying Live Analytics System with Cache Management..." -ForegroundColor Green
Write-Host "📡 Server: $SERVER" -ForegroundColor Cyan
Write-Host "📂 Project: $PROJECT_DIR" -ForegroundColor Cyan

# Test connection first
Write-Host "`n🔍 Testing server connection..." -ForegroundColor Yellow
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${USER}@${SERVER} "echo 'Connection successful'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to server $SERVER" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  - Server is online" -ForegroundColor White
    Write-Host "  - SSH access is available" -ForegroundColor White
    Write-Host "  - DNS resolution for anyway.ro works" -ForegroundColor White
    exit 1
}

# Create API directories
Write-Host "`n📁 Creating API directories..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin/cache-config"
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin/cache-stats"
ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "mkdir -p ${PROJECT_DIR}/app/api/admin/cache-clear"

# Upload files
Write-Host "`n📤 Uploading files..." -ForegroundColor Blue

Write-Host "  → Analytics service..." -ForegroundColor Gray
scp -o StrictHostKeyChecking=no lib/flightAnalyticsService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/

Write-Host "  → Admin panel..." -ForegroundColor Gray
scp -o StrictHostKeyChecking=no app/admin/page.tsx ${USER}@${SERVER}:${PROJECT_DIR}/app/admin/

Write-Host "  → Cache APIs..." -ForegroundColor Gray
scp -o StrictHostKeyChecking=no app/api/admin/cache-config/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-config/
scp -o StrictHostKeyChecking=no app/api/admin/cache-stats/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-stats/
scp -o StrictHostKeyChecking=no app/api/admin/cache-clear/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/admin/cache-clear/

# Build and restart
Write-Host "`n🔧 Building and restarting..." -ForegroundColor Cyan

ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} @"
cd ${PROJECT_DIR}
echo "Building Next.js application..."
npm run build
echo "Restarting PM2 process..."
pm2 restart anyway-flight-schedule
echo "Checking status..."
pm2 list | grep anyway
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`n🔗 Test URLs:" -ForegroundColor Cyan
    Write-Host "  • Main site: https://anyway.ro" -ForegroundColor White
    Write-Host "  • Admin panel: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "  • Analytics: https://anyway.ro/analize" -ForegroundColor White
    Write-Host "  • Statistics: https://anyway.ro/aeroport/bucuresti-henri-coanda/statistici" -ForegroundColor White
    
    Write-Host "`n🎯 LIVE ANALYTICS FEATURES:" -ForegroundColor Magenta
    Write-Host "  ✓ Live AeroDataBox API integration (NO demo data)" -ForegroundColor Green
    Write-Host "  ✓ Cache management system with admin controls" -ForegroundColor Green
    Write-Host "  ✓ Configurable cache intervals (30 days analytics, 60 min realtime)" -ForegroundColor Green
    Write-Host "  ✓ Automatic cache refresh system" -ForegroundColor Green
} else {
    Write-Host "`n❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "Check server logs for details" -ForegroundColor Yellow
}