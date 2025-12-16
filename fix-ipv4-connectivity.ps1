#!/usr/bin/env pwsh

Write-Host "=== FIXING IPv4/IPv6 CONNECTIVITY ISSUE ===" -ForegroundColor Green

# Deploy the IPv4 fix to server
Write-Host "Deploying IPv4 connectivity fix..." -ForegroundColor Yellow

try {
    # Upload the custom server.js and updated package.json
    scp server.js root@anyway.ro:/opt/anyway-flight-schedule/
    scp package.json root@anyway.ro:/opt/anyway-flight-schedule/
    scp next.config.js root@anyway.ro:/opt/anyway-flight-schedule/
    
    Write-Host "Files uploaded successfully" -ForegroundColor Green
    
    # Build and restart the application
    ssh root@anyway.ro @"
        cd /opt/anyway-flight-schedule
        echo '=== Building application with IPv4 fix ==='
        npm run build
        echo '=== Restarting PM2 process ==='
        pm2 restart anyway-ro
        echo '=== Checking PM2 status ==='
        pm2 list
        echo '=== Testing local connectivity ==='
        sleep 5
        curl -I http://127.0.0.1:3000 || echo 'Local test failed'
        echo '=== IPv4 fix deployment complete ==='
"@
    
    Write-Host "IPv4 connectivity fix deployed successfully!" -ForegroundColor Green
    
    # Test the sites
    Write-Host "Testing sites..." -ForegroundColor Yellow
    
    $anyway = curl -I https://anyway.ro 2>$null
    $victoria = curl -I https://victoriaocara.com 2>$null
    
    if ($anyway -match "200 OK") {
        Write-Host "✅ anyway.ro is working" -ForegroundColor Green
    } else {
        Write-Host "❌ anyway.ro still has issues" -ForegroundColor Red
    }
    
    if ($victoria -match "200 OK") {
        Write-Host "✅ victoriaocara.com is working" -ForegroundColor Green
    } else {
        Write-Host "❌ victoriaocara.com still has issues" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error during deployment: $_" -ForegroundColor Red
    exit 1
}

Write-Host "=== IPv4 CONNECTIVITY FIX COMPLETE ===" -ForegroundColor Green