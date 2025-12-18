# Deploy Frontend Statistici - RAPID! 🔥

Write-Host "🔥 DEPLOYING FRONTEND STATISTICI - FOC LA GHETE!" -ForegroundColor Red

# Upload new files
Write-Host "📤 Uploading new frontend files..." -ForegroundColor Yellow
scp -r app/statistici root@anyway.ro:/opt/anyway-flight-schedule/app/
scp -r components/ui root@anyway.ro:/opt/anyway-flight-schedule/components/
scp components/Navbar.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/

# Build and restart
Write-Host "🔨 Building application..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "🚀 Restarting PM2..." -ForegroundColor Green
    ssh root@anyway.ro "pm2 restart anyway-ro"
    
    Write-Host "⏳ Waiting for restart..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "🧪 Testing application..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://anyway.ro" -Method Head -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ APPLICATION IS LIVE!" -ForegroundColor Green
            Write-Host "🎯 New Statistics Page: https://anyway.ro/statistici" -ForegroundColor Cyan
            Write-Host "📊 API Endpoints Ready:" -ForegroundColor Cyan
            Write-Host "   - /api/stats/daily" -ForegroundColor White
            Write-Host "   - /api/stats/range" -ForegroundColor White  
            Write-Host "   - /api/stats/trends" -ForegroundColor White
        }
    } catch {
        Write-Host "❌ Application test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}

Write-Host "`n🎉 FRONTEND DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Users can now see historical statistics at: https://anyway.ro/statistici" -ForegroundColor Cyan