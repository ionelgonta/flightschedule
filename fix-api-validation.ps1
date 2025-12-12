#!/usr/bin/env pwsh

# Fix API Key Validation - Deploy to Hetzner Server
# Fixes the API key validation in admin panel to use correct MCP endpoint

Write-Host "Fixing API Key Validation..." -ForegroundColor Cyan

# Server details
$SERVER_IP = "23.88.113.154"
$SERVER_USER = "root"
$SERVER_PASSWORD = "FlightSchedule2024!"

Write-Host "Building and deploying fixes..." -ForegroundColor Yellow

# Create deployment package
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$deployDir = "deploy_api_fix_$timestamp"

# Build the project locally first
Write-Host "Building project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server using SCP and SSH
Write-Host "Deploying to server..." -ForegroundColor Blue

# Copy files to server
scp -o StrictHostKeyChecking=no -r . ${SERVER_USER}@${SERVER_IP}:/tmp/flight-schedule-update/

# Execute deployment on server
$deployScript = @"
cd /tmp/flight-schedule-update
echo "Stopping services..."
docker-compose down

echo "Backing up current version..."
cp -r /root/flight-schedule /root/flight-schedule-backup-$timestamp

echo "Updating files..."
cp -r . /root/flight-schedule/

cd /root/flight-schedule

echo "Rebuilding containers..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

echo "Cleaning up..."
rm -rf /tmp/flight-schedule-update

echo "Deployment complete!"
echo "Website: https://anyway.ro"
echo "Admin: https://anyway.ro/admin"

echo "Checking services..."
docker-compose ps
"@

ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "Website: https://anyway.ro" -ForegroundColor Cyan
    Write-Host "Admin Panel: https://anyway.ro/admin" -ForegroundColor Cyan
    Write-Host "Admin Password: admin123" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "API Key Validation Fixed:" -ForegroundColor Green
    Write-Host "  Using correct MCP endpoint: https://prod.api.market/api/mcp/aedbx/aerodatabox" -ForegroundColor White
    Write-Host "  Using correct header: x-api-market-key" -ForegroundColor White
    Write-Host "  API Key: cmj2peefi0001la04p5rkbbcc" -ForegroundColor White
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}