# Complete fix and deployment for flight data issue

Write-Host "=== FLIGHT DATA FIX DEPLOYMENT ===" -ForegroundColor Green
Write-Host "Fixing flight data conversion and deploying to server" -ForegroundColor Yellow

# Step 1: Build locally to verify fix
Write-Host ""
Write-Host "Step 1: Building project locally..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Local build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "Local build successful!" -ForegroundColor Green

# Step 2: Create deployment archive
Write-Host ""
Write-Host "Step 2: Creating deployment archive..." -ForegroundColor Cyan

# Create a tar archive with the entire project
tar -czf flight-fix-deployment.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .

Write-Host "Archive created: flight-fix-deployment.tar.gz" -ForegroundColor Green

# Step 3: Upload and deploy to server
Write-Host ""
Write-Host "Step 3: Uploading to server..." -ForegroundColor Cyan

# Upload the archive
scp -o StrictHostKeyChecking=no flight-fix-deployment.tar.gz root@23.88.113.154:/tmp/

# Step 4: Deploy on server
Write-Host ""
Write-Host "Step 4: Deploying on server..." -ForegroundColor Cyan

$deployCommands = @'
cd /tmp
tar -xzf flight-fix-deployment.tar.gz -C /tmp/anyway-update/
cd /tmp/anyway-update
npm install
npm run build
docker-compose down
docker-compose up -d --build
docker-compose logs --tail=30 anyway-app
'@

ssh -o StrictHostKeyChecking=no root@23.88.113.154 "mkdir -p /tmp/anyway-update && $deployCommands"

# Cleanup
Remove-Item flight-fix-deployment.tar.gz -Force

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Flight data fix deployed to https://anyway.ro" -ForegroundColor Yellow
Write-Host "Check the website to verify flight data is now displaying correctly." -ForegroundColor White