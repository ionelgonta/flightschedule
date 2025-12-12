# Deploy flight data conversion fix to server

Write-Host "Deploying flight data fix to server..." -ForegroundColor Green

$serverIP = "23.88.113.154"
$username = "root"
$password = "FlightSchedule2024!"

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$files = @(
    "lib/aerodataboxService.ts",
    "lib/flightApiService.ts",
    "lib/airports.ts"
)

# Copy files to server
Write-Host "Copying files to server..." -ForegroundColor Yellow
foreach ($file in $files) {
    Write-Host "Copying $file..." -ForegroundColor Gray
    scp -o StrictHostKeyChecking=no $file "${username}@${serverIP}:/var/www/anyway.ro/$file"
}

# SSH to server and rebuild
Write-Host "Connecting to server to rebuild..." -ForegroundColor Yellow
$commands = @(
    "cd /var/www/anyway.ro",
    "npm run build",
    "docker-compose restart anyway-app",
    "docker-compose logs --tail=20 anyway-app"
)

$commandString = $commands -join " && "
ssh -o StrictHostKeyChecking=no "${username}@${serverIP}" $commandString

Write-Host ""
Write-Host "Deployment complete! Check https://anyway.ro for updated flight data." -ForegroundColor Green