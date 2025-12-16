#!/usr/bin/env pwsh

Write-Host "=== EMERGENCY FIX SCRIPT - FLIGHT SCHEDULE APPLICATION ===" -ForegroundColor Green
Write-Host "This script fixes common issues: 502 errors, IPv4/IPv6 connectivity, API errors" -ForegroundColor Yellow

param(
    [switch]$FullFix,
    [switch]$ConnectivityOnly,
    [switch]$ApiOnly,
    [switch]$DiagnosticOnly
)

function Test-SiteConnectivity {
    Write-Host "Testing site connectivity..." -ForegroundColor Yellow
    
    try {
        $anyway = Invoke-WebRequest -Uri "https://anyway.ro" -Method Head -UseBasicParsing -TimeoutSec 10
        if ($anyway.StatusCode -eq 200) {
            Write-Host "✅ anyway.ro is working (HTTP $($anyway.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "❌ anyway.ro returned HTTP $($anyway.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ anyway.ro is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $victoria = Invoke-WebRequest -Uri "https://victoriaocara.com" -Method Head -UseBasicParsing -TimeoutSec 10
        if ($victoria.StatusCode -eq 200) {
            Write-Host "✅ victoriaocara.com is working (HTTP $($victoria.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "❌ victoriaocara.com returned HTTP $($victoria.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ victoriaocara.com is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Fix-IPv4Connectivity {
    Write-Host "=== FIXING IPv4/IPv6 CONNECTIVITY ISSUE ===" -ForegroundColor Green
    
    try {
        # Upload IPv4 fix files
        Write-Host "Uploading IPv4 connectivity fix files..." -ForegroundColor Yellow
        scp server.js root@anyway.ro:/opt/anyway-flight-schedule/
        scp package.json root@anyway.ro:/opt/anyway-flight-schedule/
        scp next.config.js root@anyway.ro:/opt/anyway-flight-schedule/
        
        # Build and restart
        Write-Host "Building application and restarting services..." -ForegroundColor Yellow
        ssh root@anyway.ro @"
            cd /opt/anyway-flight-schedule
            echo '=== Building application ==='
            npm run build
            echo '=== Checking nginx configuration ==='
            grep -n 'proxy_pass' /etc/nginx/sites-available/multi-https
            echo '=== Fixing nginx proxy port if needed ==='
            sed -i 's|proxy_pass http://127.0.0.1:8080;|proxy_pass http://127.0.0.1:3000;|' /etc/nginx/sites-available/multi-https
            echo '=== Testing nginx configuration ==='
            nginx -t
            echo '=== Restarting services ==='
            pm2 restart anyway-ro
            nginx -s reload
            echo '=== Testing local connectivity ==='
            curl -I http://127.0.0.1:3000 | head -1
            echo '=== IPv4 fix complete ==='
"@
        
        Write-Host "IPv4 connectivity fix applied successfully!" -ForegroundColor Green
        
    } catch {
        Write-Host "Error during IPv4 fix: $_" -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Fix-ApiErrors {
    Write-Host "=== FIXING API ERROR HANDLING ===" -ForegroundColor Green
    
    try {
        # Upload enhanced API service files
        Write-Host "Uploading enhanced API error handling..." -ForegroundColor Yellow
        scp lib/aerodataboxService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
        scp lib/flightAnalyticsService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
        
        # Build and restart
        ssh root@anyway.ro @"
            cd /opt/anyway-flight-schedule
            echo '=== Building with API fixes ==='
            npm run build
            echo '=== Restarting application ==='
            pm2 restart anyway-ro
            echo '=== API fixes applied ==='
"@
        
        Write-Host "API error handling fixes applied successfully!" -ForegroundColor Green
        
    } catch {
        Write-Host "Error during API fix: $_" -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Run-Diagnostics {
    Write-Host "=== RUNNING SYSTEM DIAGNOSTICS ===" -ForegroundColor Green
    
    ssh root@anyway.ro @"
        echo '=== PM2 Process Status ==='
        pm2 list
        echo ''
        echo '=== Nginx Status ==='
        systemctl status nginx --no-pager -l
        echo ''
        echo '=== Port Usage ==='
        netstat -tulpn | grep -E ':(80|443|3000|3001) '
        echo ''
        echo '=== Nginx Configuration ==='
        grep -n 'proxy_pass' /etc/nginx/sites-available/multi-https
        echo ''
        echo '=== Recent Nginx Errors ==='
        tail -5 /var/log/nginx/error.log
        echo ''
        echo '=== Local Connectivity Test ==='
        curl -I http://127.0.0.1:3000 | head -1
        echo ''
        echo '=== Disk Space ==='
        df -h /opt/anyway-flight-schedule
        echo ''
        echo '=== Memory Usage ==='
        free -h
"@
}

function Emergency-ServerFix {
    Write-Host "=== EMERGENCY SERVER RESTORATION ===" -ForegroundColor Red
    
    ssh root@anyway.ro @"
        echo '=== Stopping conflicting Docker containers ==='
        docker stop \$(docker ps -q) 2>/dev/null || echo 'No Docker containers to stop'
        echo '=== Starting nginx ==='
        systemctl start nginx
        echo '=== Restarting PM2 processes ==='
        pm2 restart anyway-ro
        pm2 restart victoriaocara
        echo '=== Checking status ==='
        systemctl status nginx --no-pager
        pm2 list
        echo '=== Testing sites ==='
        curl -I https://anyway.ro | head -1
        curl -I https://victoriaocara.com | head -1
        echo '=== Emergency fix complete ==='
"@
}

# Main execution logic
if ($DiagnosticOnly) {
    Run-Diagnostics
    Test-SiteConnectivity
    exit 0
}

if ($ConnectivityOnly) {
    $success = Fix-IPv4Connectivity
    if ($success) {
        Start-Sleep -Seconds 5
        Test-SiteConnectivity
    }
    exit 0
}

if ($ApiOnly) {
    $success = Fix-ApiErrors
    if ($success) {
        Start-Sleep -Seconds 5
        Test-SiteConnectivity
    }
    exit 0
}

if ($FullFix) {
    Write-Host "Running complete fix procedure..." -ForegroundColor Yellow
    
    # Run diagnostics first
    Run-Diagnostics
    
    # Fix connectivity
    $connectivityFixed = Fix-IPv4Connectivity
    
    # Fix API errors
    $apiFixed = Fix-ApiErrors
    
    # Test final result
    Start-Sleep -Seconds 5
    Test-SiteConnectivity
    
    if ($connectivityFixed -and $apiFixed) {
        Write-Host "=== ALL FIXES APPLIED SUCCESSFULLY ===" -ForegroundColor Green
    } else {
        Write-Host "=== SOME FIXES FAILED - CHECK LOGS ===" -ForegroundColor Red
    }
    
    exit 0
}

# Default: Show usage and run emergency fix
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  -FullFix         : Apply all fixes (connectivity + API)" -ForegroundColor White
Write-Host "  -ConnectivityOnly: Fix IPv4/IPv6 connectivity issues only" -ForegroundColor White
Write-Host "  -ApiOnly         : Fix API error handling only" -ForegroundColor White
Write-Host "  -DiagnosticOnly  : Run diagnostics and test connectivity" -ForegroundColor White
Write-Host ""
Write-Host "Running emergency server fix..." -ForegroundColor Yellow

Emergency-ServerFix
Start-Sleep -Seconds 5
Test-SiteConnectivity

Write-Host ""
Write-Host "=== EMERGENCY FIX COMPLETE ===" -ForegroundColor Green
Write-Host "If issues persist, run with -DiagnosticOnly to investigate further" -ForegroundColor Yellow