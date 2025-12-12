# Final API Key Fix
$ServerIP = "23.88.113.154"
$ServerUser = "root" 
$ServerPassword = "FlightSchedule2024!"

Write-Host "Final API Key Deployment..." -ForegroundColor Cyan

# Simple commands
$cmd1 = "cd /opt/anyway-flight-schedule && git pull origin main"
$cmd2 = "cd /opt/anyway-flight-schedule && echo 'NEXT_PUBLIC_FLIGHT_API_KEY=cmj2peefi0001la04p5rkbbcc' > .env.local"
$cmd3 = "cd /opt/anyway-flight-schedule && echo 'NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox' >> .env.local"
$cmd4 = "cd /opt/anyway-flight-schedule && docker-compose restart"
$cmd5 = "sleep 15 && curl -s https://anyway.ro/api/admin/api-key"

Write-Host "Executing commands..." -ForegroundColor Yellow
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $cmd1
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $cmd2  
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $cmd3
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $cmd4
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $cmd5

Write-Host "Deployment completed!" -ForegroundColor Green