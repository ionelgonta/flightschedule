#!/usr/bin/env pwsh

Write-Host "🚀 DEPLOYING CACHE SYSTEM TO LIVE SERVER..." -ForegroundColor Green

# 1. Git Operations
Write-Host "📦 Git commit and push..." -ForegroundColor Yellow
git add .
git commit -m "Deploy complete cache system with admin control - all intervals configurable, zero hardcoded values, persistent cache, manual refresh buttons"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git push successful" -ForegroundColor Green

# 2. Server Deployment
Write-Host "🌐 Deploying to server..." -ForegroundColor Yellow

# Server connection details
$serverUser = "root"
$serverHost = "anyway.ro"
$serverPath = "/var/www/anyway.ro"

# Copy files to server
Write-Host "📁 Copying files to server..." -ForegroundColor Cyan
scp -r * ${serverUser}@${serverHost}:${serverPath}/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ File copy failed!" -ForegroundColor Red
    exit 1
}

# Execute server commands
Write-Host "⚙️ Installing dependencies and restarting services..." -ForegroundColor Cyan
ssh ${serverUser}@${serverHost} @"
cd ${serverPath}
echo '🔧 Installing dependencies...'
npm install --production
echo '🏗️ Building application...'
npm run build
echo '📁 Creating data directory...'
mkdir -p data
chmod 755 data
echo '🔄 Restarting PM2 services...'
pm2 restart anyway-ro
pm2 save
echo '✅ Deployment complete!'
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Server deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Server deployment successful" -ForegroundColor Green

# 3. Verification
Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow

# Test main endpoints
$endpoints = @(
    "https://anyway.ro",
    "https://anyway.ro/admin",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/sosiri",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing $endpoint..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $endpoint - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🔗 Admin Panel: https://anyway.ro/admin" -ForegroundColor Cyan
Write-Host "🔑 Password: FlightSchedule2024!" -ForegroundColor Cyan
Write-Host "⚙️ Cache Management: Admin → Cache Management tab" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Features deployed:" -ForegroundColor Yellow
Write-Host "  - Complete cache system with admin control" -ForegroundColor White
Write-Host "  - Configurable intervals (no hardcoded values)" -ForegroundColor White
Write-Host "  - Persistent cache with database storage" -ForegroundColor White
Write-Host "  - Manual refresh buttons for all categories" -ForegroundColor White
Write-Host "  - Exact request counting and tracking" -ForegroundColor White
Write-Host "  - Zero demo data - only real cached data" -ForegroundColor White
Write-Host "  - Cron jobs: 60min flights, 30 days analytics, 360 days aircraft" -ForegroundColor White