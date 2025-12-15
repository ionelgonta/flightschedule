# Deploy flight data fix to server NOW

Write-Host "=== DEPLOYING TO SERVER ===" -ForegroundColor Green

# Connect to server and deploy
$deployScript = @'
echo "=== FLIGHT DATA FIX DEPLOYMENT ==="

# Find project directory
if [ -d "/root/flight-schedule" ]; then
    PROJECT_DIR="/root/flight-schedule"
elif [ -d "/root/flightschedule" ]; then
    PROJECT_DIR="/root/flightschedule"
elif [ -d "/var/www/anyway.ro" ]; then
    PROJECT_DIR="/var/www/anyway.ro"
else
    echo "Searching for project directory..."
    PROJECT_DIR=$(find /root /var/www /opt -name "package.json" -path "*flight*" 2>/dev/null | head -1 | xargs dirname)
fi

if [ -z "$PROJECT_DIR" ]; then
    echo "Project not found, cloning..."
    cd /root
    git clone https://github.com/ionelgonta/flightschedule.git
    PROJECT_DIR="/root/flightschedule"
fi

echo "Using project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "Current git status:"
git status

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Checking for Docker..."
if command -v docker-compose &> /dev/null; then
    echo "Restarting Docker services..."
    docker-compose down
    docker-compose up -d --build
    echo "Waiting for services to start..."
    sleep 10
    docker-compose logs --tail=20
elif command -v pm2 &> /dev/null; then
    echo "Restarting PM2 services..."
    pm2 restart all
    pm2 list
else
    echo "No process manager found"
    echo "Checking if Next.js is running..."
    pkill -f "next"
    nohup npm run start > /tmp/nextjs.log 2>&1 &
    echo "Started Next.js in background"
fi

echo "=== DEPLOYMENT COMPLETE ==="
echo "Testing API..."
curl -s "http://localhost:3000/api/flights/OTP/arrivals" | head -200
'@

Write-Host "Connecting to server and deploying..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no root@23.88.113.154 "$deployScript"

Write-Host ""
Write-Host "=== TESTING DEPLOYED VERSION ===" -ForegroundColor Green
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "https://anyway.ro/api/flights/OTP/arrivals" -TimeoutSec 20
    if ($response.success -and $response.data.Count -gt 0) {
        $flight = $response.data[0]
        Write-Host "✅ DEPLOYMENT SUCCESS!" -ForegroundColor Green
        Write-Host "Flight Number: '$($flight.flight_number)'" -ForegroundColor Cyan
        Write-Host "Airline: '$($flight.airline.name)' ($($flight.airline.code))" -ForegroundColor Cyan
        Write-Host "Origin: '$($flight.origin.airport)' ($($flight.origin.code))" -ForegroundColor Cyan
        Write-Host "Destination: '$($flight.destination.airport)' ($($flight.destination.code))" -ForegroundColor Cyan
        Write-Host "Status: '$($flight.status)'" -ForegroundColor Cyan
        
        if ($flight.flight_number -ne "N/A" -and $flight.origin.code -ne "XXX") {
            Write-Host ""
            Write-Host "🎉 FLIGHT DATA FIX SUCCESSFUL!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "⚠️  Still showing old data, may need more time..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ API Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check https://anyway.ro/airport/OTP/arrivals to verify" -ForegroundColor White