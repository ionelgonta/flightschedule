#!/usr/bin/env pwsh

# Deploy Persistent API Tracker - Database Storage with Monthly Reset
Write-Host "Deploying Persistent API Tracker System..." -ForegroundColor Green

# Server connection details
$SERVER = "root@anyway.ro"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Changes being deployed:" -ForegroundColor Yellow
Write-Host "  - New persistent API tracker with database storage" -ForegroundColor White
Write-Host "  - Automatic monthly reset (1st day of month at 00:00)" -ForegroundColor White
Write-Host "  - Data survives deploys and restarts" -ForegroundColor White
Write-Host "  - Monthly history tracking" -ForegroundColor White
Write-Host "  - Enhanced admin interface with history" -ForegroundColor White

# Copy updated files to server
Write-Host "Uploading updated files..." -ForegroundColor Blue

# Upload new persistent tracker
scp "lib/persistentApiTracker.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload persistentApiTracker.ts"; exit 1 }

# Upload updated aerodatabox service
scp "lib/aerodataboxService.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload aerodataboxService.ts"; exit 1 }

# Upload updated API tracker route
scp "app/api/admin/api-tracker/route.ts" "${SERVER}:${REMOTE_PATH}/app/api/admin/api-tracker/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload api-tracker route"; exit 1 }

# Upload enhanced admin interface
scp "app/admin/page.tsx" "${SERVER}:${REMOTE_PATH}/app/admin/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload admin page"; exit 1 }

Write-Host "Creating data directory and restarting application..." -ForegroundColor Blue

# SSH to server and setup
ssh $SERVER @"
cd $REMOTE_PATH

# Create data directory for database
echo "Creating data directory..."
mkdir -p data
chmod 755 data

# Build the application
echo "Building application..."
npm run build

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart anyway-ro

# Show PM2 status
echo "PM2 Status:"
pm2 status

echo "Persistent API Tracker deployed successfully!"
echo ""
echo "Features:"
echo "  - Database storage in /data/api-tracker.json"
echo "  - Automatic monthly reset on 1st day of month"
echo "  - Data persists through deploys and restarts"
echo "  - Monthly history tracking"
echo "  - Enhanced admin interface"
echo ""
echo "Verification:"
echo "  1. Go to Admin -> Cache Management"
echo "  2. Trigger some API requests"
echo "  3. Check that counters increment and persist"
echo "  4. Restart server - counters should remain"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "Persistent API Tracker deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was implemented:" -ForegroundColor Yellow
    Write-Host "  - Database storage for API request tracking" -ForegroundColor White
    Write-Host "  - Automatic monthly reset system" -ForegroundColor White
    Write-Host "  - Data persistence through deploys/restarts" -ForegroundColor White
    Write-Host "  - Monthly history with reset dates" -ForegroundColor White
    Write-Host "  - Enhanced admin interface" -ForegroundColor White
    Write-Host ""
    Write-Host "Key Features:" -ForegroundColor Cyan
    Write-Host "  - Counters NO LONGER reset on deploy/restart" -ForegroundColor White
    Write-Host "  - Automatic reset: 1st day of each month at 00:00" -ForegroundColor White
    Write-Host "  - Monthly history preserved" -ForegroundColor White
    Write-Host "  - Incremental counting as requested" -ForegroundColor White
    Write-Host "  - Database file: /data/api-tracker.json" -ForegroundColor White
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}