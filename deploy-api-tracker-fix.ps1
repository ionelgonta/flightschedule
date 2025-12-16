#!/usr/bin/env pwsh

# Deploy API Tracker Fix - Track ALL 16 airports (32 requests total)
Write-Host "Deploying API Tracker Fix - All 16 Airports..." -ForegroundColor Green

# Server connection details
$SERVER = "root@anyway.ro"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Changes being deployed:" -ForegroundColor Yellow
Write-Host "  - Removed hardcoded limitedDataAirports filter" -ForegroundColor White
Write-Host "  - Now attempts API requests for ALL 16 airports" -ForegroundColor White
Write-Host "  - Enhanced admin interface shows all airports" -ForegroundColor White
Write-Host "  - Expected: 16 airports x 2 requests = 32 total" -ForegroundColor White

# Copy updated files to server
Write-Host "Uploading updated files..." -ForegroundColor Blue

# Upload aerodatabox service with fixed airport filtering
scp "lib/aerodataboxService.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload aerodataboxService.ts"; exit 1 }

# Upload enhanced admin interface
scp "app/admin/page.tsx" "${SERVER}:${REMOTE_PATH}/app/admin/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload admin page"; exit 1 }

Write-Host "Restarting application..." -ForegroundColor Blue

# SSH to server and restart the application
ssh $SERVER @"
cd $REMOTE_PATH

# Build the application
echo "Building application..."
npm run build

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart anyway-flight-schedule
pm2 restart anyway-flight-schedule-server

# Show PM2 status
echo "PM2 Status:"
pm2 status

echo "API Tracker Fix deployed successfully!"
echo ""
echo "Expected Results:"
echo "  - All 16 airports will now be attempted for API requests"
echo "  - Total expected requests: 32 (16 airports x 2 types)"
echo "  - Admin interface shows detailed airport-by-airport status"
echo ""
echo "To verify:"
echo "  1. Go to Admin -> Cache Management"
echo "  2. Click refresh statistics button"
echo "  3. Check API Tracker section for all 16 airports"
echo "  4. Should see 32 total requests"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "API Tracker Fix deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was fixed:" -ForegroundColor Yellow
    Write-Host "  - Removed hardcoded airport filtering that skipped 8 airports" -ForegroundColor White
    Write-Host "  - Now ALL 16 airports are attempted for API requests" -ForegroundColor White
    Write-Host "  - Enhanced admin interface shows detailed status per airport" -ForegroundColor White
    Write-Host "  - Expected: 32 total requests for all airports" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Visit: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "  2. Go to Cache Management tab" -ForegroundColor White
    Write-Host "  3. Click refresh statistics button" -ForegroundColor White
    Write-Host "  4. Check API Tracker - should show all 16 airports" -ForegroundColor White
    Write-Host "  5. Total requests should be 32 for all airports" -ForegroundColor White
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}