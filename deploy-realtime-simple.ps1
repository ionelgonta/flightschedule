# Deploy Real-time Flight API
$SERVER = "23.88.113.154"
$USER = "root"
$PROJECT_DIR = "/opt/anyway-flight-schedule"

Write-Host "Deploying real-time flight API..." -ForegroundColor Green

# Build locally
npm run build

# Copy files to server
scp lib/flightApiService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/aerodataboxService.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/
scp lib/icaoMapping.ts ${USER}@${SERVER}:${PROJECT_DIR}/lib/

# Rebuild on server
ssh ${USER}@${SERVER} "cd ${PROJECT_DIR} && npm run build && docker-compose down && docker-compose up -d --build"

Write-Host "Real-time API deployed! Check https://anyway.ro" -ForegroundColor Green