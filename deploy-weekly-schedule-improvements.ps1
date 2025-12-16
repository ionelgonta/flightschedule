#!/usr/bin/env pwsh

Write-Host "=== Weekly Schedule Improvements Deployment ===" -ForegroundColor Green

# Server configuration
$SERVER = "anyway.ro"
$USER = "root"
$DEPLOY_PATH = "/opt/anyway-flight-schedule"
$SERVICE_NAME = "anyway-ro"

Write-Host "Deploying weekly schedule improvements to $SERVER..." -ForegroundColor Yellow

try {
    # Deploy updated files
    Write-Host "Uploading updated files..." -ForegroundColor Cyan
    
    scp "components/analytics/WeeklyScheduleView.tsx" "${USER}@${SERVER}:${DEPLOY_PATH}/components/analytics/"
    scp "app/api/admin/weekly-schedule/route.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/app/api/admin/weekly-schedule/"
    scp "components/Navbar.tsx" "${USER}@${SERVER}:${DEPLOY_PATH}/components/"
    scp "app/aeroport/[code]/page.tsx" "${USER}@${SERVER}:${DEPLOY_PATH}/app/aeroport/[code]/"
    scp "app/program-saptamanal/page.tsx" "${USER}@${SERVER}:${DEPLOY_PATH}/app/program-saptamanal/"
    
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
    
    # Build and restart
    Write-Host "Building and restarting service..." -ForegroundColor Cyan
    ssh "${USER}@${SERVER}" "cd $DEPLOY_PATH && npm run build && pm2 restart $SERVICE_NAME"
    
    Write-Host "=== Deployment completed successfully! ===" -ForegroundColor Green
    Write-Host "Weekly schedule improvements:" -ForegroundColor Yellow
    Write-Host "✓ Airport codes replaced with city names and airport names" -ForegroundColor Green
    Write-Host "✓ Filters show only Romanian and Moldovan airports" -ForegroundColor Green
    Write-Host "✓ Separate filters for departures and arrivals" -ForegroundColor Green
    Write-Host "✓ Auto-update button removed" -ForegroundColor Green
    Write-Host "✓ Data range period information added" -ForegroundColor Green
    Write-Host "✓ Day abbreviations updated (Lun, Mar, Mie, Joi, Vin, Sam, Dum)" -ForegroundColor Green
    Write-Host "✓ Cache references removed from UI text" -ForegroundColor Green
    Write-Host "✓ Program Săptămânal removed from main navigation" -ForegroundColor Green
    Write-Host "✓ Links added from airport pages to weekly schedule with pre-filtering" -ForegroundColor Green
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}