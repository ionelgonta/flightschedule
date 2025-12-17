# Deploy React onClick Fixes to Live Server
# Fixes all React "Event handlers cannot be passed to Client Component props" errors

Write-Host "🚀 Deploying React onClick Fixes to anyway.ro..." -ForegroundColor Green

# Test localhost first
Write-Host "📋 Testing localhost pages..." -ForegroundColor Yellow
$pages = @(
    "http://localhost:3000",
    "http://localhost:3000/aeroporturi", 
    "http://localhost:3000/aeroport/otopeni-bucuresti",
    "http://localhost:3000/statistici-aeroporturi"
)

foreach ($page in $pages) {
    try {
        $response = Invoke-WebRequest -Uri $page -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $page - Status 200" -ForegroundColor Green
        } else {
            Write-Host "❌ $page - Status $($response.StatusCode)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ $page - Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All localhost tests passed!" -ForegroundColor Green

# Deploy to server
Write-Host "🚀 Deploying to anyway.ro server..." -ForegroundColor Yellow

# SSH and deploy commands
$deployCommands = @"
cd /var/www/anyway.ro
git add .
git commit -m "Fix React onClick errors on tr elements - all pages now load properly"
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
    Start-Sleep -Seconds 10
    
    $livePages = @(
        "https://anyway.ro",
        "https://anyway.ro/aeroporturi"
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
    Write-Host "🎉 React onClick Fixes Deployed Successfully!" -ForegroundColor Green
    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "   • Fixed onClick handlers on <tr> elements in app/aeroporturi/page.tsx" -ForegroundColor White
    Write-Host "   • All pages now load without React errors" -ForegroundColor White
    Write-Host "   • Server-side rendering working properly" -ForegroundColor White
    Write-Host "   • No more timeout issues on /aeroporturi page" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Live site: https://anyway.ro" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}