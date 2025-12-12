# Deploy working flight data fix to server

Write-Host "=== DEPLOYING WORKING FIX TO SERVER ===" -ForegroundColor Green

# Step 1: Commit and push changes
Write-Host "1. Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Flight data conversion fix - working locally"
git push

# Step 2: Deploy to server via SSH
Write-Host ""
Write-Host "2. Deploying to server..." -ForegroundColor Yellow

$serverCommands = @'
# Find the correct directory
cd /root || cd /home/root || cd /var/www || cd /opt
if [ -d "flightschedule" ]; then
    cd flightschedule
elif [ -d "flight-schedule" ]; then
    cd flight-schedule
elif [ -d "anyway.ro" ]; then
    cd anyway.ro
else
    echo "Project directory not found, cloning..."
    git clone https://github.com/ionelgonta/flightschedule.git
    cd flightschedule
fi

echo "Current directory: $(pwd)"
echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Restarting services..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
    docker-compose up -d --build
    echo "Docker services restarted"
elif command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "PM2 services restarted"
else
    echo "No process manager found, manual restart needed"
fi

echo "Deployment complete!"
'@

# Execute on server
ssh -o StrictHostKeyChecking=no root@23.88.113.154 $serverCommands

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Check https://anyway.ro to verify flight data is working" -ForegroundColor Yellow