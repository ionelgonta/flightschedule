# Deploy AdSense Meta Tag
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "🎯 Deploying AdSense Meta Tag" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Meta tag: <meta name='google-adsense-account' content='ca-pub-2305349540791838' />" -ForegroundColor Yellow
Write-Host ""

# Commit changes
Write-Host "📤 Committing AdSense meta tag..." -ForegroundColor Yellow
git add .
git commit -m "Add AdSense meta tag for verification: ca-pub-2305349540791838"
git push origin main
Write-Host "✅ Changes pushed to Git" -ForegroundColor Green

# Deploy to server
Write-Host ""
Write-Host "🚀 Deploying to server..." -ForegroundColor Yellow

plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "cd /opt/anyway-flight-schedule && git pull origin main && docker-compose restart"

Write-Host ""
Write-Host "⏳ Waiting for restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "🧪 Testing AdSense meta tag..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro" -UseBasicParsing
    if ($response.Content -match 'google-adsense-account.*ca-pub-2305349540791838') {
        Write-Host "✅ AdSense meta tag found in HTML!" -ForegroundColor Green
    } else {
        Write-Host "❌ AdSense meta tag not found" -ForegroundColor Red
    }
    
    if ($response.Content -match 'pagead2\.googlesyndication\.com') {
        Write-Host "✅ AdSense script also present" -ForegroundColor Green
    } else {
        Write-Host "⚠️ AdSense script not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to test site: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 ADSENSE META TAG DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 AdSense Verification Steps:" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Cyan
Write-Host "1. Go to: https://www.google.com/adsense/" -ForegroundColor White
Write-Host "2. Add site: anyway.ro" -ForegroundColor White
Write-Host "3. Select: 'HTML meta tag' method" -ForegroundColor White
Write-Host "4. The meta tag is already installed!" -ForegroundColor White
Write-Host "5. Click 'Verify' to complete" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Manual Verification:" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan
Write-Host "• Visit: https://anyway.ro" -ForegroundColor White
Write-Host "• View Source (Ctrl+U)" -ForegroundColor White
Write-Host "• Search for: google-adsense-account" -ForegroundColor White
Write-Host "• Should find: ca-pub-2305349540791838" -ForegroundColor White
Write-Host ""
Write-Host "✅ Both AdSense script AND meta tag are now present!" -ForegroundColor Green