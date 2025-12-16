#!/usr/bin/env pwsh

Write-Host "=== FIXING ADBANNER HYDRATION ERROR ===" -ForegroundColor Green
Write-Host "Fixing AdBanner className hydration mismatch between server and client" -ForegroundColor Yellow

try {
    # Upload the fixed AdBanner component
    Write-Host "Uploading fixed AdBanner component..." -ForegroundColor Yellow
    scp components/ads/AdBanner.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/ads/
    
    Write-Host "AdBanner component uploaded successfully" -ForegroundColor Green
    
    # Build and restart the application
    ssh root@anyway.ro @"
        cd /opt/anyway-flight-schedule
        echo '=== Building application with AdBanner hydration fix ==='
        npm run build
        echo '=== Restarting PM2 process ==='
        pm2 restart anyway-ro
        echo '=== Checking PM2 status ==='
        pm2 list
        echo '=== Testing local connectivity ==='
        sleep 3
        curl -I http://127.0.0.1:3000 | head -1
        echo '=== AdBanner hydration fix deployment complete ==='
"@
    
    Write-Host "AdBanner hydration error fix deployed successfully!" -ForegroundColor Green
    
    # Test the site
    Write-Host "Testing site..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "https://anyway.ro" -Method Head -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ anyway.ro is working (HTTP $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "❌ anyway.ro returned HTTP $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ anyway.ro test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error during AdBanner hydration fix deployment: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== ADBANNER HYDRATION ERROR FIX COMPLETE ===" -ForegroundColor Green
Write-Host "AdBanner components should now render consistently without hydration errors" -ForegroundColor Yellow
Write-Host "Check browser console to verify no more className mismatch warnings" -ForegroundColor Cyan