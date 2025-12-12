# Simple Docker Deploy
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "Deploying Docker fix..." -ForegroundColor Cyan

# Step by step deployment
Write-Host "Step 1: Pull changes..." -ForegroundColor Yellow
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "cd /opt/anyway-flight-schedule && git pull origin main"

Write-Host "Step 2: Rebuild containers..." -ForegroundColor Yellow  
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "cd /opt/anyway-flight-schedule && docker-compose down"
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "cd /opt/anyway-flight-schedule && docker-compose build --no-cache"
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "cd /opt/anyway-flight-schedule && docker-compose up -d"

Write-Host "Step 3: Wait for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 25

Write-Host "Step 4: Test API..." -ForegroundColor Yellow
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "curl -s https://anyway.ro/api/admin/api-key"

Write-Host "Deployment completed!" -ForegroundColor Green