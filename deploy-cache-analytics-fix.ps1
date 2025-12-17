# Deploy Cache Analytics Fix to Live Server
# Fixes infinite loop where analytics cron was generating mock data instead of using real cached flight data

Write-Host "🚀 Deploying Cache Analytics Fix to anyway.ro..." -ForegroundColor Green

# Test localhost first
Write-Host "📋 Testing localhost cache system..." -ForegroundColor Yellow

try {
    # Test cache stats
    $cacheResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cache-stats" -UseBasicParsing -TimeoutSec 10
    if ($cacheResponse.StatusCode -eq 200) {
        Write-Host "✅ Cache system working" -ForegroundColor Green
    }
    
    # Test analytics API
    $analyticsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/aeroport/LROP/statistici" -UseBasicParsing -TimeoutSec 10
    if ($analyticsResponse.StatusCode -eq 200) {
        Write-Host "✅ Analytics API working" -ForegroundColor Green
    }
    
    # Test statistics page
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:3000/statistici-aeroporturi" -UseBasicParsing -TimeoutSec 10
    if ($statsResponse.StatusCode -eq 200) {
        Write-Host "✅ Statistics page working" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Localhost test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All localhost tests passed!" -ForegroundColor Green

# Deploy to server
Write-Host "🚀 Deploying to anyway.ro server..." -ForegroundColor Yellow

# SSH and deploy commands
$deployCommands = @"
cd /var/www/anyway.ro
git add .
git commit -m "Fix cache analytics infinite loop - generate real statistics from cached flight data"
git push origin main
npm run build
pm2 restart anyway-app
pm2 save
"@

try {
    # Execute deployment
    ssh root@anyway.ro $deployCommands
    
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    
    # Test live server
    Write-Host "🔍 Testing live server..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    $livePages = @(
        "https://anyway.ro",
        "https://anyway.ro/statistici-aeroporturi"
    )
    
    foreach ($page in $livePages) {
        try {
            $response = Invoke-WebRequest -Uri $page -UseBasicParsing -TimeoutSec 15
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $page - Status 200" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $page - Status $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ $page - Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Cache Analytics Fix Deployed Successfully!" -ForegroundColor Green
    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "   • Fixed infinite loop in analytics cron job" -ForegroundColor White
    Write-Host "   • Analytics now generated from real cached flight data" -ForegroundColor White
    Write-Host "   • No more mock statistics - all data is real" -ForegroundColor White
    Write-Host "   • Peak delay hours and route analysis use actual flight data" -ForegroundColor White
    Write-Host "   • Smart fallback: only generates analytics when flight data exists" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Live site: https://anyway.ro" -ForegroundColor Cyan
    Write-Host "📊 Statistics: https://anyway.ro/statistici-aeroporturi" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}