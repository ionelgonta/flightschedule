#!/usr/bin/env pwsh

# Deploy Weekly Schedule City Names Fix to Production
# This script deploys the updated WeeklyScheduleView component

Write-Host "=== Deploying Weekly Schedule City Names Fix ===" -ForegroundColor Cyan
Write-Host ""

$SERVER = "root@anyway.ro"
$PROJECT_PATH = "/opt/anyway-flight-schedule"

# Step 1: Upload the updated component
Write-Host "Step 1: Uploading updated WeeklyScheduleView component..." -ForegroundColor Yellow
scp components/analytics/WeeklyScheduleView.tsx ${SERVER}:${PROJECT_PATH}/components/analytics/

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to upload component file" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Component uploaded successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Build the application on the server
Write-Host "Step 2: Building application on server..." -ForegroundColor Yellow
ssh $SERVER @"
cd $PROJECT_PATH
echo '=== Building Next.js application ==='
npm run build
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Restart PM2
Write-Host "Step 3: Restarting PM2 process..." -ForegroundColor Yellow
ssh $SERVER "pm2 restart anyway-ro"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host "✓ PM2 restarted successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Verify deployment
Write-Host "Step 4: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$response = Invoke-WebRequest -Uri "https://anyway.ro/program-saptamanal" -Method Head -ErrorAction SilentlyContinue

if ($response.StatusCode -eq 200) {
    Write-Host "✓ Site is responding correctly" -ForegroundColor Green
} else {
    Write-Host "WARNING: Site returned status code $($response.StatusCode)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "The weekly schedule page should now display city names instead of IATA codes." -ForegroundColor Green
Write-Host "Visit: https://anyway.ro/program-saptamanal" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: You may need to clear your browser cache to see the changes." -ForegroundColor Yellow
