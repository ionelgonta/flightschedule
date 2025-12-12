# Fix 500 Error - Deploy corrected API routes and flight service
$SERVER = "23.88.113.154"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "Fixing 500 errors and deploying..." -ForegroundColor Green

# Copy fixed files
scp lib/flightApiService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp app/api/flights/[airport]/arrivals/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/flights/[airport]/arrivals/
scp app/api/flights/[airport]/departures/route.ts ${USER}@${SERVER}:${PROJECT_DIR}/app/api/flights/[airport]/departures/

# Rebuild and restart
ssh ${USER}@${SERVER} "cd ${PROJECT_DIR} && npm run build && docker-compose down && docker-compose up -d --build"

Write-Host "500 errors fixed! Website should work now at https://anyway.ro" -ForegroundColor Green