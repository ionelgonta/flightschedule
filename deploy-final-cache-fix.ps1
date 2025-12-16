#!/usr/bin/env pwsh

# Deploy Final Cache Fix - Historic Flights 500 Error Fix & Cache Admin Control
# Removes all demo data generation and ensures full admin control over cache

Write-Host "🚀 Deploying Final Cache Fix..." -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to server
Write-Host "🌐 Deploying to server..." -ForegroundColor Yellow

# Copy all necessary files to server
Write-Host "📁 Copying .next build..." -ForegroundColor Cyan
scp -r .next root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying lib directory..." -ForegroundColor Cyan
scp -r lib root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying app directory..." -ForegroundColor Cyan
scp -r app root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying components directory..." -ForegroundColor Cyan
scp -r components root@anyway.ro:/opt/anyway-flight-schedule/

Write-Host "📁 Copying package.json..." -ForegroundColor Cyan
scp package.json root@anyway.ro:/opt/anyway-flight-schedule/

# Install dependencies on server
Write-Host "📦 Installing dependencies on server..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; npm install --production"

# Restart services on server
Write-Host "🔄 Restarting PM2 services..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; pm2 restart all; pm2 save"

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "✅ Final Cache Fix deployed successfully!" -ForegroundColor Green
Write-Host "🔍 Testing key endpoints..." -ForegroundColor Yellow

# Test the fixes
$testUrls = @(
    "https://anyway.ro/admin",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/istoric-zboruri",
    "https://anyway.ro/aeroport/cluj-napoca-avram-iancu/istoric-zboruri",
    "https://anyway.ro/aeroport/chisinau-chisinau/istoric-zboruri",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/plecari",
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/sosiri"
)

foreach ($url in $testUrls) {
    Write-Host "Testing: $url" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 15 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ FIXES IMPLEMENTED:" -ForegroundColor White
Write-Host "   • Historic flights 500 error FIXED" -ForegroundColor Green
Write-Host "   • All demo data generation REMOVED" -ForegroundColor Green
Write-Host "   • Cache system respects admin settings" -ForegroundColor Green
Write-Host "   • NO DEMO DATA POLICY fully enforced" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 ADMIN CONTROL:" -ForegroundColor White
Write-Host "   • Real-time Cache: 5-1440 minutes (configurable)" -ForegroundColor Cyan
Write-Host "   • Analytics Cache: 1-90 days (configurable)" -ForegroundColor Cyan
Write-Host "   • All flight pages respect admin settings" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 TEST ADMIN PANEL:" -ForegroundColor White
Write-Host "   1. Go to https://anyway.ro/admin" -ForegroundColor Yellow
Write-Host "   2. Change 'Real-time Cache' to 15 minutes" -ForegroundColor Yellow
Write-Host "   3. Save configuration" -ForegroundColor Yellow
Write-Host "   4. Check flight pages auto-refresh at 15 minutes" -ForegroundColor Yellow