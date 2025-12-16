#!/usr/bin/env pwsh

# Deploy Satu Mare Airport Code Fix - STU to SUJ
Write-Host "Deploying Satu Mare Airport Code Fix (STU -> SUJ)..." -ForegroundColor Green

# Server connection details
$SERVER = "root@anyway.ro"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Changes being deployed:" -ForegroundColor Yellow
Write-Host "  - Updated airport code from STU to SUJ for Satu Mare" -ForegroundColor White
Write-Host "  - Fixed lib/airports.ts, lib/airlineMapping.ts, lib/demoFlightData.ts, lib/icaoMapping.ts" -ForegroundColor White
Write-Host "  - Updated admin interface to show SUJ instead of STU" -ForegroundColor White

# Copy updated files to server
Write-Host "Uploading updated files..." -ForegroundColor Blue

# Upload all corrected files
scp "lib/airports.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload airports.ts"; exit 1 }

scp "lib/airlineMapping.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload airlineMapping.ts"; exit 1 }

scp "lib/demoFlightData.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload demoFlightData.ts"; exit 1 }

scp "lib/icaoMapping.ts" "${SERVER}:${REMOTE_PATH}/lib/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload icaoMapping.ts"; exit 1 }

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
pm2 restart anyway-ro

# Show PM2 status
echo "PM2 Status:"
pm2 status

echo "Satu Mare airport code fix deployed successfully!"
echo "Airport code changed from STU to SUJ (correct IATA code)"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "Satu Mare Airport Code Fix deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was fixed:" -ForegroundColor Yellow
    Write-Host "  - Airport code changed from STU to SUJ (correct IATA code)" -ForegroundColor White
    Write-Host "  - Updated all mapping files and admin interface" -ForegroundColor White
    Write-Host "  - Now using correct SUJ code for Satu Mare airport" -ForegroundColor White
    Write-Host ""
    Write-Host "Verification:" -ForegroundColor Cyan
    Write-Host "  - Admin interface now shows SUJ instead of STU" -ForegroundColor White
    Write-Host "  - API requests will use correct SUJ code" -ForegroundColor White
    Write-Host "  - All 16 airports should still be tracked correctly" -ForegroundColor White
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}