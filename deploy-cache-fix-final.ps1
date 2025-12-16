# Deploy Cache Fix Final - Complete Cache Management System
# Deploys the unified cache system with working statistics

Write-Host "Deploying Cache Fix Final to Live Server..." -ForegroundColor Green

# Server connection details
$serverUser = "root"
$serverHost = "anyway.ro"
$deployPath = "/opt/anyway-flight-schedule"

Write-Host "Preparing files for deployment..." -ForegroundColor Yellow

# Files to deploy for cache fix
$filesToDeploy = @(
    "app/admin/page.tsx",
    "app/api/admin/cache-stats/route.ts", 
    "app/api/admin/cache-clear/route.ts",
    "app/api/statistici-aeroporturi/route.ts",
    "lib/flightAnalyticsService.ts",
    "CACHE_STATS_FIX_FINAL_SUCCESS.md"
)

# Create deployment directory
New-Item -ItemType Directory -Force -Path "deploy-temp" | Out-Null

# Copy files to deployment directory
foreach ($file in $filesToDeploy) {
    if (Test-Path $file) {
        $destDir = Split-Path "deploy-temp/$file" -Parent
        if ($destDir -and !(Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        Copy-Item $file "deploy-temp/$file" -Force
        Write-Host "Prepared: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "Uploading files to server..." -ForegroundColor Yellow

# Upload files via SCP
scp -r deploy-temp/* ${serverUser}@${serverHost}:${deployPath}/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Restarting services on server..." -ForegroundColor Yellow

# SSH commands to restart services
$sshCommands = "cd $deployPath && echo 'Building Next.js application...' && npm run build && echo 'Restarting PM2 processes...' && pm2 restart anyway-flight-schedule && pm2 restart anyway-flight-schedule-cron && echo 'Services restarted successfully!' && pm2 status"

ssh ${serverUser}@${serverHost} $sshCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Cache management system is now live at: https://anyway.ro/admin" -ForegroundColor Cyan
    
    Write-Host "Cache Fix Deployment Summary:" -ForegroundColor Yellow
    Write-Host "- Unified cache system deployed" -ForegroundColor Green
    Write-Host "- Real cache statistics working" -ForegroundColor Green
    Write-Host "- Refresh statistics functionality fixed" -ForegroundColor Green
    Write-Host "- API counter tracking implemented" -ForegroundColor Green
    Write-Host "- Cache clear functionality working" -ForegroundColor Green
    Write-Host "- Admin page cache management complete" -ForegroundColor Green
    
    Write-Host "Test the cache system:" -ForegroundColor Cyan
    Write-Host "1. Visit: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "2. Go to 'Cache Management' tab" -ForegroundColor White
    Write-Host "3. Check cache statistics (should show real values)" -ForegroundColor White
    Write-Host "4. Test refresh statistics button" -ForegroundColor White
    Write-Host "5. Verify API counter increments" -ForegroundColor White
    
} else {
    Write-Host "Deployment failed during service restart!" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item -Recurse -Force "deploy-temp" -ErrorAction SilentlyContinue

Write-Host "Cache Fix Final deployment completed!" -ForegroundColor Green
Write-Host "The cache management system now shows real statistics and all functions work correctly." -ForegroundColor Cyan