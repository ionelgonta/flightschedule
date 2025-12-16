Write-Host "=== Weekly Schedule Auto-Update System Deployment ===" -ForegroundColor Green

# Server configuration
$SERVER = "anyway.ro"
$USER = "root"
$DEPLOY_PATH = "/opt/anyway-flight-schedule"
$SERVICE_NAME = "anyway-flight-schedule"

Write-Host "Deploying weekly schedule auto-update fixes to $SERVER..." -ForegroundColor Yellow

# Deploy updated files
Write-Host "Uploading updated files..." -ForegroundColor Cyan

scp "lib/weeklyScheduleAnalyzer.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/lib/"
scp "components/analytics/WeeklyScheduleView.tsx" "${USER}@${SERVER}:${DEPLOY_PATH}/components/analytics/"
scp "app/api/admin/weekly-schedule/route.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/app/api/admin/weekly-schedule/"
scp "app/api/debug/cache-data/route.ts" "${USER}@${SERVER}:${DEPLOY_PATH}/app/api/debug/"

Write-Host "Files uploaded successfully!" -ForegroundColor Green

# Build and restart
Write-Host "Building and restarting service..." -ForegroundColor Cyan
ssh "${USER}@${SERVER}" "cd $DEPLOY_PATH && npm run build && pm2 restart $SERVICE_NAME"

Write-Host "=== Deployment completed successfully! ===" -ForegroundColor Green