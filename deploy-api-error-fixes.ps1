# Deploy API Error Fixes to anyway.ro
# Fixes AeroDataBox API JSON parsing errors and improves error handling

Write-Host "Deploying API Error Fixes to anyway.ro..." -ForegroundColor Green

# Build the project first
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Upload fixed files to server
Write-Host "Uploading fixed files to server..." -ForegroundColor Yellow

# Upload the fixed analytics service
scp lib/flightAnalyticsService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/

# Upload the fixed AeroDataBox service  
scp lib/aerodataboxService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/

# Upload the fixed flight API service
scp lib/flightApiService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/

# Upload the entire .next build directory
Write-Host "Uploading build files..." -ForegroundColor Yellow
scp -r .next/* root@anyway.ro:/opt/anyway-flight-schedule/.next/

# Upload package.json and other necessary files
scp package.json root@anyway.ro:/opt/anyway-flight-schedule/
scp next.config.js root@anyway.ro:/opt/anyway-flight-schedule/

# Connect to server and restart services
Write-Host "Restarting services on server..." -ForegroundColor Yellow

ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm install --production && pm2 restart anyway-ro && pm2 status && curl -I http://localhost:3000 && systemctl status nginx --no-pager -l"

Write-Host "API Error Fixes deployed successfully!" -ForegroundColor Green
Write-Host "Testing site: https://anyway.ro" -ForegroundColor Cyan

# Test the deployed site
Write-Host "Testing analytics pages..." -ForegroundColor Yellow
$testUrls = @(
    "https://anyway.ro/aeroport/bucuresti-henri-coanda/statistici",
    "https://anyway.ro/aeroport/chisinau-chisinau/statistici", 
    "https://anyway.ro/aeroport/cluj-napoca-cluj-napoca/statistici",
    "https://anyway.ro/aeroport/baia-mare-baia-mare/statistici"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
        Write-Host "SUCCESS: $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $url - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Deployment complete! API error handling improved." -ForegroundColor Green