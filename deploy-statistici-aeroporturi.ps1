#!/usr/bin/env pwsh

Write-Host "Deploying Airport Statistics with Real AeroDataBox Data..." -ForegroundColor Green

# Build the application
Write-Host "Building application with new statistics features..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "Deploying to production server..." -ForegroundColor Yellow

# Copy files to server
scp -r .next package.json package-lock.json root@anyway.ro:/opt/anyway-flight-schedule/
scp -r app components lib public root@anyway.ro:/opt/anyway-flight-schedule/
scp next.config.js tailwind.config.js postcss.config.js tsconfig.json root@anyway.ro:/opt/anyway-flight-schedule/

# Install dependencies and restart on server
ssh root@anyway.ro "
    cd /opt/anyway-flight-schedule
    npm ci --production
    pm2 restart anyway-flight-schedule
    pm2 save
"

Write-Host "Airport Statistics deployed successfully!" -ForegroundColor Green

# Test the new endpoints
Write-Host "Testing new statistics features..." -ForegroundColor Yellow

$testUrls = @(
    "https://anyway.ro/statistici-aeroporturi",
    "https://anyway.ro/program-zboruri", 
    "https://anyway.ro/api/statistici-aeroporturi",
    "https://anyway.ro/sitemap.xml"
)

foreach ($url in $testUrls) {
    Write-Host "Testing $url..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "$url - OK" -ForegroundColor Green
        } else {
            Write-Host "$url - Failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "$url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Airport Statistics Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "New Features Deployed:" -ForegroundColor Yellow
Write-Host "- Real AeroDataBox API statistics with 30-day cache" -ForegroundColor White
Write-Host "- Airport Statistics page with live performance data" -ForegroundColor White  
Write-Host "- Program Zboruri page with calendar functionality" -ForegroundColor White
Write-Host "- Updated navigation menu with separate pages" -ForegroundColor White
Write-Host "- Enhanced sitemap with new pages" -ForegroundColor White
Write-Host "- API endpoint for airport statistics" -ForegroundColor White
Write-Host ""
Write-Host "Statistics Features:" -ForegroundColor Yellow
Write-Host "- On-time performance percentages" -ForegroundColor White
Write-Host "- Average delay calculations" -ForegroundColor White
Write-Host "- Daily flight counts" -ForegroundColor White
Write-Host "- Cancelled and delayed flight tracking" -ForegroundColor White
Write-Host "- 30-day cache for optimal performance" -ForegroundColor White
Write-Host "- Fallback demo data for airports with limited API data" -ForegroundColor White