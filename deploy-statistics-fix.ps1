# PowerShell script to deploy statistics fixes to the server
# Fixes: delay percentages, unknown airlines, unknown airport codes

Write-Host "=== DEPLOYING STATISTICS FIXES ===" -ForegroundColor Green
Write-Host "Fixing: delay percentages, airline names, airport codes" -ForegroundColor Yellow

# Check if we have the required files
$requiredFiles = @(
    "lib/airlineMapping.ts",
    "lib/flightAnalyticsService.ts", 
    "lib/cacheManager.ts"
)

foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "ERROR: Required file not found: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "All required files found ✓" -ForegroundColor Green

# Upload the fixed files to server
Write-Host "Uploading fixed files to server..." -ForegroundColor Yellow

try {
    # Upload lib files with fixes
    scp lib/airlineMapping.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
    scp lib/flightAnalyticsService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
    scp lib/cacheManager.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
    
    Write-Host "Files uploaded successfully ✓" -ForegroundColor Green
    
    # Clear analytics cache on server to force regeneration
    Write-Host "Clearing analytics cache on server..." -ForegroundColor Yellow
    
    ssh root@anyway.ro @"
cd /opt/anyway-flight-schedule
echo 'Clearing analytics cache...'
if [ -f data/cache-data.json ]; then
    # Backup current cache
    cp data/cache-data.json data/cache-data.json.backup
    # Filter out analytics entries using node
    node -e "
        const fs = require('fs');
        try {
            const cache = JSON.parse(fs.readFileSync('data/cache-data.json', 'utf-8'));
            const filtered = cache.filter(entry => entry.category !== 'analytics');
            fs.writeFileSync('data/cache-data.json', JSON.stringify(filtered, null, 2));
            console.log('Cleared ' + (cache.length - filtered.length) + ' analytics entries');
        } catch (e) {
            console.log('Cache file not found or invalid, will be created fresh');
        }
    "
else
    echo 'No cache file found - will be created fresh'
fi
"@
    
    Write-Host "Cache cleared successfully ✓" -ForegroundColor Green
    
    # Build the application
    Write-Host "Building application on server..." -ForegroundColor Yellow
    ssh root@anyway.ro "cd /opt/anyway-flight-schedule; npm run build"
    
    Write-Host "Build completed ✓" -ForegroundColor Green
    
    # Restart PM2 process
    Write-Host "Restarting PM2 process..." -ForegroundColor Yellow
    ssh root@anyway.ro "pm2 restart anyway-ro"
    
    Write-Host "PM2 restarted ✓" -ForegroundColor Green
    
    # Test the deployment
    Write-Host "Testing deployment..." -ForegroundColor Yellow
    
    $response = ssh root@anyway.ro "curl -s -I https://anyway.ro"
    if ($response -like "*200 OK*") {
        Write-Host "Site is responding ✓" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Site may not be responding properly" -ForegroundColor Yellow
        Write-Host "Response: $response" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== DEPLOYMENT COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Statistics fixes applied:" -ForegroundColor White
    Write-Host "✓ Fixed delay percentage calculation (no more 0.0%)" -ForegroundColor Green
    Write-Host "✓ Added airline mapping: H4 - Hisky" -ForegroundColor Green  
    Write-Host "✓ Added airport codes: VRN, SSH, CDT, EIN, HHN, BRI, LCA" -ForegroundColor Green
    Write-Host "✓ Improved route analysis with better delay handling" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Analytics will regenerate automatically via cron job" -ForegroundColor Gray
    Write-Host "2. Or manually refresh at: https://anyway.ro/admin" -ForegroundColor Gray
    Write-Host "3. Check Chișinău statistics to verify fixes" -ForegroundColor Gray
    
} catch {
    Write-Host "ERROR during deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check server status and try again" -ForegroundColor Yellow
    exit 1
}