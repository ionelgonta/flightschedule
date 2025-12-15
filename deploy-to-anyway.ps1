#!/usr/bin/env pwsh

# Deploy AdSense functionality to anyway.ro
Write-Host "🚀 Deploy AdSense to anyway.ro" -ForegroundColor Green

# Build first
Write-Host "🔨 Building..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 MANUAL DEPLOYMENT STEPS:" -ForegroundColor Cyan
Write-Host "=========================================="
Write-Host ""

Write-Host "1. Connect to server:" -ForegroundColor Yellow
Write-Host "   ssh root@23.88.113.154" -ForegroundColor White
Write-Host "   Password: FlightSchedule2024!" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Navigate to project:" -ForegroundColor Yellow
Write-Host "   cd /opt/anyway-flight-schedule" -ForegroundColor White
Write-Host ""

Write-Host "3. Copy new files (create directory first):" -ForegroundColor Yellow
Write-Host "   mkdir -p app/api/admin/adsense" -ForegroundColor White
Write-Host ""
Write-Host "   Then copy these files from local to server:" -ForegroundColor Gray
Write-Host "   • app/api/admin/adsense/route.ts (NEW FILE)" -ForegroundColor Green
Write-Host "   • app/admin/page.tsx (UPDATED)" -ForegroundColor Yellow
Write-Host "   • lib/adConfig.ts (UPDATED)" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. Build and restart on server:" -ForegroundColor Yellow
Write-Host "   npm run build" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host "   docker-compose up -d --build" -ForegroundColor White
Write-Host ""

Write-Host "5. Test deployment:" -ForegroundColor Yellow
Write-Host "   curl https://anyway.ro/api/admin/adsense" -ForegroundColor White
Write-Host ""

Write-Host "🌐 After deployment, test:" -ForegroundColor Green
Write-Host "• https://anyway.ro/admin (look for AdSense tab)" -ForegroundColor Cyan
Write-Host "• https://anyway.ro/api/admin/adsense (should return JSON)" -ForegroundColor Cyan
Write-Host ""

Write-Host "Files ready for deployment in current directory!" -ForegroundColor Green