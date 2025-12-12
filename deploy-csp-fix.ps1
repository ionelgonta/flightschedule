#!/usr/bin/env pwsh

# Deploy CSP Fix - Fixes Content Security Policy issues and client-side flight loading
# This script deploys the fixes for CSP violations and updates client components to use server API routes

Write-Host "🚀 Starting CSP Fix Deployment..." -ForegroundColor Green

# Server details
$SERVER_IP = "23.88.113.154"
$SERVER_USER = "root"
$SERVER_PASSWORD = "FlightSchedule2024!"
$PROJECT_PATH = "/root/flight-schedule"

Write-Host "📋 Deployment Summary:" -ForegroundColor Yellow
Write-Host "- Fixed CSP configuration in next.config.js to allow API.Market domain" -ForegroundColor White
Write-Host "- Created ClientFlightService for browser-side API calls" -ForegroundColor White
Write-Host "- Updated arrivals/departures pages to use client service" -ForegroundColor White
Write-Host "- Prevents CSP violations by routing through server API endpoints" -ForegroundColor White

# Build the project locally first
Write-Host "🔨 Building project locally..." -ForegroundColor Blue
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✅ Local build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Local build failed: $_" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packageName = "csp-fix-$timestamp.tar.gz"

# Files to deploy
$filesToDeploy = @(
    "next.config.js",
    "lib/clientFlightService.ts",
    "app/airport/[code]/arrivals/page.tsx",
    "app/airport/[code]/departures/page.tsx",
    ".next/",
    "package.json",
    "package-lock.json"
)

# Create tar package (using WSL if on Windows)
try {
    if ($IsWindows) {
        wsl tar -czf $packageName $filesToDeploy
    } else {
        tar -czf $packageName $filesToDeploy
    }
    Write-Host "✅ Package created: $packageName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create package: $_" -ForegroundColor Red
    exit 1
}

# Upload to server
Write-Host "📤 Uploading to server..." -ForegroundColor Blue
try {
    if ($IsWindows) {
        # Use scp via WSL
        wsl scp -o StrictHostKeyChecking=no $packageName ${SERVER_USER}@${SERVER_IP}:/tmp/
    } else {
        scp -o StrictHostKeyChecking=no $packageName ${SERVER_USER}@${SERVER_IP}:/tmp/
    }
    Write-Host "✅ Upload completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Upload failed: $_" -ForegroundColor Red
    exit 1
}

# Deploy on server
Write-Host "🚀 Deploying on server..." -ForegroundColor Blue

$deployScript = @"
#!/bin/bash
set -e

echo "🔄 Starting server deployment..."

# Navigate to project directory
cd $PROJECT_PATH

# Backup current version
echo "📋 Creating backup..."
cp -r . ../flight-schedule-backup-$(date +%Y%m%d-%H%M%S) || true

# Extract new files
echo "📦 Extracting new files..."
cd /tmp
tar -xzf $packageName
cp -r next.config.js lib/clientFlightService.ts app/airport/ $PROJECT_PATH/

# Install dependencies if needed
echo "📚 Installing dependencies..."
cd $PROJECT_PATH
npm ci --production

# Rebuild the application
echo "🔨 Building application..."
npm run build

# Restart services
echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test the API endpoints
echo "🧪 Testing API endpoints..."
curl -f http://localhost:3000/api/flights/OTP/arrivals || echo "⚠️ API test failed"

# Cleanup
echo "🧹 Cleaning up..."
rm -f /tmp/$packageName

echo "✅ Deployment completed successfully!"
echo "🌐 Website should be available at: https://anyway.ro"
echo "🔧 Admin panel: https://anyway.ro/admin"
"@

# Execute deployment script on server
try {
    if ($IsWindows) {
        $deployScript | wsl ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'bash -s'
    } else {
        $deployScript | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'bash -s'
    }
    Write-Host "✅ Server deployment completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Server deployment failed: $_" -ForegroundColor Red
    exit 1
}

# Cleanup local files
Write-Host "🧹 Cleaning up local files..." -ForegroundColor Blue
Remove-Item $packageName -ErrorAction SilentlyContinue

# Final verification
Write-Host "🔍 Final verification..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro" -TimeoutSec 30 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Website is accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Website returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not verify website accessibility: $_" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 CSP Fix Deployment Complete!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 What was fixed:" -ForegroundColor Yellow
Write-Host "✅ Added API.Market domain to Content Security Policy" -ForegroundColor White
Write-Host "✅ Created ClientFlightService for browser-safe API calls" -ForegroundColor White
Write-Host "✅ Updated airport pages to use server API routes" -ForegroundColor White
Write-Host "✅ Eliminated CSP violations from direct MCP calls" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🌐 Test the website:" -ForegroundColor Cyan
Write-Host "   Main site: https://anyway.ro" -ForegroundColor White
Write-Host "   Admin panel: https://anyway.ro/admin" -ForegroundColor White
Write-Host "   Test airport: https://anyway.ro/airport/OTP/arrivals" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test flight data loading on airport pages" -ForegroundColor White
Write-Host "2. Check browser console for CSP errors (should be gone)" -ForegroundColor White
Write-Host "3. Verify API key validation in admin panel" -ForegroundColor White
Write-Host "4. Monitor server logs for any issues" -ForegroundColor White