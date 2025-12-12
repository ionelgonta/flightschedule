# Simple deployment for delay format fix
$SERVER = "23.88.113.154"
$USER = "root"

Write-Host "Deploying delay format fix..." -ForegroundColor Green

# Copy files directly and rebuild
ssh ${USER}@${SERVER} "cd /root/flight-schedule && git pull origin main && npm install && npm run build && docker-compose down && docker-compose up -d --build"

Write-Host "Deployment complete! Check https://anyway.ro" -ForegroundColor Green