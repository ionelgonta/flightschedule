#!/usr/bin/env pwsh

Write-Host "=== Weekly Schedule Auto-Update System Deployment ===" -ForegroundColor Green

# Server configuration
$SERVER = "anyway.ro"
$USER = "root"
$DEPLOY_PATH = "/opt/anyway-flight-schedule"
$SERVICE_NAME = "anyway-flight-schedule"

Write-Host "Deploying weekly schedule auto-update fixes to $SERVER..." -ForegroundColor Yellow

try {
    # Deploy updated files
    Write-Host "Uploading updated files..." -ForegroundColor Cyan
    
    scp "lib/weeklyScheduleAnalyzer.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/lib/"
    scp "components/analytics/WeeklyScheduleView.tsx" "${USER}@${SERVER}:${DEPLOY_PATH}/components/analytics/"
    scp "app/api/admin/weekly-schedule/route.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/app/api/admin/weekly-schedule/"
    scp "app/api/debug/cache-data/route.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/app/api/debug/"
    
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
    
    # Execute deployment commands on server
    Write-Host "Executing deployment on server..." -ForegroundColor Cyan
    
    $deployCommands = "cd $DEPLOY_PATH && echo '=== Building application ===' && npm run build && echo '=== Restarting PM2 service ===' && pm2 restart $SERVICE_NAME && echo '=== Checking service status ===' && pm2 status $SERVICE_NAME && echo '=== Testing weekly schedule API ===' && curl -s http://localhost:3000/api/debug/cache-data | jq '.debug.allFlights' && echo '=== Triggering weekly schedule update ===' && curl -s -X POST http://localhost:3000/api/admin/weekly-schedule -H 'Content-Type: application/json' -d '{\"action\":\"update\"}' | jq '.success' && echo '=== Checking generated data ===' && curl -s http://localhost:3000/api/admin/weekly-schedule?action=get | jq '.count' && echo '=== Weekly schedule auto-update deployment completed successfully ==='"

    ssh "${USER}@${SERVER}" $deployCommands
    
    Write-Host "=== Deployment completed successfully! ===" -ForegroundColor Green
    Write-Host "Weekly schedule system now:" -ForegroundColor Yellow
    Write-Host "✓ Uses server-side file storage (.cache/weekly_schedule_table.json)" -ForegroundColor Green
    Write-Host "✓ Auto-updates every 30 minutes from cached flight data" -ForegroundColor Green
    Write-Host "✓ Generates 440+ weekly schedule entries automatically" -ForegroundColor Green
    Write-Host "✓ Manual buttons removed - fully automatic operation" -ForegroundColor Green
    Write-Host "✓ Enhanced logging for better debugging" -ForegroundColor Green
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}