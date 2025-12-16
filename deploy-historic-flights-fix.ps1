#!/usr/bin/env pwsh

# Deploy Historic Flights 500 Error Fix
# Removes all demo data generation and ensures cache-only operation

Write-Host "🚀 Deploying Historic Flights 500 Error Fix..." -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to server
Write-Host "🌐 Deploying to server..." -ForegroundColor Yellow

# Copy files to server
scp -r .next root@anyway.ro:/opt/anyway-flight-schedule/
scp -r lib root@anyway.ro:/opt/anyway-flight-schedule/
scp -r app root@anyway.ro:/opt/anyway-flight-schedule/
scp -r components root@anyway.ro:/opt/anyway-flight-schedule/
scp package.json root@anyway.ro:/opt/anyway-flight-schedule/

# Restart services on server
Write-Host "🔄 Restarting services..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /opt/anyway-flight-schedule; pm2 restart all; pm2 save"

Write-Host "✅ Historic Flights Fix deployed successfully!" -ForegroundColor Green
Write-Host "🔍 Testing historic flights pages..." -ForegroundColor Yellow

# Test the fix
$testUrls = @(
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/istoric-zboruri",
    "https://anyway.ro/aeroport/cluj-napoca-avram-iancu/istoric-zboruri",
    "https://anyway.ro/aeroport/timisoara-traian-vuia/istoric-zboruri"
)

foreach ($url in $testUrls) {
    Write-Host "Testing: $url" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "🎉 Historic Flights 500 Error Fix deployment complete!" -ForegroundColor Green