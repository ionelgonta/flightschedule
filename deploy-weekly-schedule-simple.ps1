#!/usr/bin/env pwsh

Write-Host "🚀 Deploying Weekly Schedule Analysis System..." -ForegroundColor Green

# Deploy core files one by one
Write-Host "📁 Deploying core system..." -ForegroundColor Yellow
scp "lib/weeklyScheduleAnalyzer.ts" "root@anyway.ro:/opt/anyway-flight-schedule/lib/"

Write-Host "📁 Deploying API endpoint..." -ForegroundColor Yellow  
ssh "root@anyway.ro" "mkdir -p /opt/anyway-flight-schedule/app/api/admin/weekly-schedule"
scp "app/api/admin/weekly-schedule/route.ts" "root@anyway.ro:/opt/anyway-flight-schedule/app/api/admin/weekly-schedule/"

Write-Host "📁 Deploying component..." -ForegroundColor Yellow
ssh "root@anyway.ro" "mkdir -p /opt/anyway-flight-schedule/components/analytics"
scp "components/analytics/WeeklyScheduleView.tsx" "root@anyway.ro:/opt/anyway-flight-schedule/components/analytics/"

Write-Host "📁 Deploying public page..." -ForegroundColor Yellow
ssh "root@anyway.ro" "mkdir -p /opt/anyway-flight-schedule/app/program-saptamanal"
scp "app/program-saptamanal/page.tsx" "root@anyway.ro:/opt/anyway-flight-schedule/app/program-saptamanal/"

Write-Host "📁 Deploying admin updates..." -ForegroundColor Yellow
scp "app/admin/page.tsx" "root@anyway.ro:/opt/anyway-flight-schedule/app/admin/"

Write-Host "📁 Deploying navbar updates..." -ForegroundColor Yellow
scp "components/Navbar.tsx" "root@anyway.ro:/opt/anyway-flight-schedule/components/"

Write-Host "📁 Deploying sitemap updates..." -ForegroundColor Yellow
scp "app/sitemap.ts" "root@anyway.ro:/opt/anyway-flight-schedule/app/"

Write-Host "🔧 Building on server..." -ForegroundColor Yellow
ssh "root@anyway.ro" "cd /opt/anyway-flight-schedule && npm run build"

Write-Host "🔄 Restarting services..." -ForegroundColor Yellow
ssh "root@anyway.ro" "cd /opt/anyway-flight-schedule && pm2 restart all"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Access at: https://anyway.ro/admin (Program Săptămânal tab)" -ForegroundColor Cyan
Write-Host "🔗 Public page: https://anyway.ro/program-saptamanal" -ForegroundColor Cyan