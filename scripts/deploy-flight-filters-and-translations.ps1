#!/usr/bin/env pwsh

# Deploy Flight Filters and Airport Translations to Production
# This script deploys all the updated components with time filtering and airport translations

Write-Host "=== Deploying Flight Filters and Airport Translations ===" -ForegroundColor Cyan
Write-Host ""

$SERVER = "root@anyway.ro"
$PROJECT_PATH = "/opt/anyway-flight-schedule"

# Step 1: Upload all updated components
Write-Host "Step 1: Uploading updated components..." -ForegroundColor Yellow

# Upload WeeklyScheduleView with airport translations
scp components/analytics/WeeklyScheduleView.tsx ${SERVER}:${PROJECT_PATH}/components/analytics/

# Upload FlightSchedulesView with time filtering
scp components/analytics/FlightSchedulesView.tsx ${SERVER}:${PROJECT_PATH}/components/analytics/

# Upload FlightList with time filtering
scp components/flights/FlightList.tsx ${SERVER}:${PROJECT_PATH}/components/flights/

# Upload FlightDisplay with time filtering
scp components/flights/FlightDisplay.tsx ${SERVER}:${PROJECT_PATH}/components/flights/

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to upload component files" -ForegroundColor Red
    exit 1
}

Write-Host "✓ All components uploaded successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Build the application on the server
Write-Host "Step 2: Building application on server..." -ForegroundColor Yellow
ssh $SERVER @"
cd $PROJECT_PATH
echo '=== Building Next.js application ==='
npm run build
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Restart PM2
Write-Host "Step 3: Restarting PM2 process..." -ForegroundColor Yellow
ssh $SERVER "pm2 restart anyway-ro"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host "✓ PM2 restarted successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Verify deployment
Write-Host "Step 4: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test weekly schedule page
$weeklyResponse = Invoke-WebRequest -Uri "https://anyway.ro/program-saptamanal" -Method Head -ErrorAction SilentlyContinue
if ($weeklyResponse.StatusCode -eq 200) {
    Write-Host "✓ Weekly schedule page is responding correctly" -ForegroundColor Green
} else {
    Write-Host "WARNING: Weekly schedule page returned status code $($weeklyResponse.StatusCode)" -ForegroundColor Yellow
}

# Test arrivals page
$arrivalsResponse = Invoke-WebRequest -Uri "https://anyway.ro/aeroport/OTP/sosiri" -Method Head -ErrorAction SilentlyContinue
if ($arrivalsResponse.StatusCode -eq 200) {
    Write-Host "✓ Arrivals page is responding correctly" -ForegroundColor Green
} else {
    Write-Host "WARNING: Arrivals page returned status code $($arrivalsResponse.StatusCode)" -ForegroundColor Yellow
}

# Test departures page
$departuresResponse = Invoke-WebRequest -Uri "https://anyway.ro/aeroport/OTP/plecari" -Method Head -ErrorAction SilentlyContinue
if ($departuresResponse.StatusCode -eq 200) {
    Write-Host "✓ Departures page is responding correctly" -ForegroundColor Green
} else {
    Write-Host "WARNING: Departures page returned status code $($departuresResponse.StatusCode)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ CHANGES DEPLOYED:" -ForegroundColor Green
Write-Host "• Airport translations: IATA codes now show as city names in Romanian" -ForegroundColor White
Write-Host "• Time filtering: Shows only flights from last 10 hours + all future flights" -ForegroundColor White
Write-Host "• Applied to: Weekly schedule, arrivals, departures, flight schedules" -ForegroundColor White
Write-Host ""
Write-Host "🌐 PAGES TO TEST:" -ForegroundColor Cyan
Write-Host "• Weekly Schedule: https://anyway.ro/program-saptamanal" -ForegroundColor White
Write-Host "• Arrivals: https://anyway.ro/aeroport/OTP/sosiri" -ForegroundColor White
Write-Host "• Departures: https://anyway.ro/aeroport/OTP/plecari" -ForegroundColor White
Write-Host ""
Write-Host "Note: Clear browser cache (Ctrl+F5) to see the changes immediately." -ForegroundColor Yellow