Write-Host "=== Weekly Schedule Improvements Deployment ===" -ForegroundColor Green

# Server configuration
$SERVER = "anyway.ro"
$USER = "root"
$DEPLOY_PATH = "/opt/anyway-flight-schedule"
$SERVICE_NAME = "anyway-ro"

Write-Host "Deploying weekly schedule improvements to $SERVER..." -ForegroundColor Yellow

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