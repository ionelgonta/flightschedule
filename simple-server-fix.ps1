# Simple Server Fix for API Key
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "Fixing API Key on Server..." -ForegroundColor Cyan

# Create fix commands
$commands = @"
cd /opt/anyway-flight-schedule
echo 'NEXT_PUBLIC_FLIGHT_API_KEY=cmj2k38yg0004jy04yemilnaq' > .env.local
echo 'NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox' >> .env.local
docker-compose restart
sleep 10
curl -s https://anyway.ro/api/admin/api-key
"@

# Execute on server
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $commands

Write-Host "Fix completed! Test at: https://anyway.ro/admin" -ForegroundColor Green