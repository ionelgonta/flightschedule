# Simple PowerShell deployment script for Historical Flight Data System

Write-Host "=== DEPLOYING HISTORICAL FLIGHT DATA SYSTEM ===" -ForegroundColor Green

# Upload the corrected cache manager
Write-Host "Uploading corrected cacheManager.ts..." -ForegroundColor Yellow
scp lib/cacheManager.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/

# Try to build
Write-Host "Building application..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Restarting PM2..." -ForegroundColor Green
    ssh root@anyway.ro "pm2 restart anyway-ro"
    
    Write-Host "Testing application..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    $response = curl -s -o $null -w "%{http_code}" https://anyway.ro
    if ($response -eq "200") {
        Write-Host "✅ Application is running successfully" -ForegroundColor Green
        Write-Host "✅ Historical Flight Data System deployed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Application test failed (HTTP $response)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed. Check the error above." -ForegroundColor Red
    Write-Host "The application is still running with the previous version." -ForegroundColor Yellow
}

Write-Host "`n📊 New Features Available:" -ForegroundColor Cyan
Write-Host "- Historical flight data storage with SQLite" -ForegroundColor White
Write-Host "- Advanced statistics and analytics" -ForegroundColor White
Write-Host "- REST API endpoints for data access" -ForegroundColor White
Write-Host "- Property-based testing framework" -ForegroundColor White

Write-Host "`n🔗 New API Endpoints:" -ForegroundColor Cyan
Write-Host "- GET /api/stats/daily?airport=OTP&date=YYYY-MM-DD" -ForegroundColor White
Write-Host "- GET /api/stats/range?airport=OTP&from=YYYY-MM-DD&to=YYYY-MM-DD" -ForegroundColor White
Write-Host "- GET /api/stats/trends?airport=OTP&period=7d" -ForegroundColor White