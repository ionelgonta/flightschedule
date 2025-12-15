#!/usr/bin/env pwsh

Write-Host "Deploying Romanian Language Updates" -ForegroundColor Cyan

$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Uploading updated files..." -ForegroundColor Yellow

# Upload flight components
scp "components/flights/FlightDisplay.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/flights/"
scp "components/flights/FlightCard.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/flights/"
scp "components/flights/FlightStatusBadge.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/flights/"

# Upload page files
scp "app/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/"
scp "app/airports/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/airports/"
scp "app/airport/[code]/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/airport/[code]/"
scp "app/airport/[code]/arrivals/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/airport/[code]/arrivals/"
scp "app/airport/[code]/departures/page.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/app/airport/[code]/departures/"

Write-Host "Building and restarting..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "cd ${REMOTE_PATH} && npm run build && pm2 restart anyway-ro"

Write-Host "ROMANIAN UPDATES DEPLOYED!" -ForegroundColor Green
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "- Airport codes replaced with City - Airport Name" -ForegroundColor White
Write-Host "- All English text translated to Romanian" -ForegroundColor White
Write-Host "- Flight statuses in Romanian" -ForegroundColor White