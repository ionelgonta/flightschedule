# Simple Deploy Script for Windows PowerShell
# Connects to server and runs the final deployment

Write-Host "🚀 Deploying Flight Schedule to anyway.ro" -ForegroundColor Green
Write-Host "=========================================="

$serverIP = "23.88.113.154"
$username = "root"
$password = "FlightSchedule2024!"
$projectPath = "/opt/anyway-flight-schedule"

Write-Host ""
Write-Host "📋 Deployment Details:" -ForegroundColor Blue
Write-Host "- Server: $serverIP"
Write-Host "- User: $username"
Write-Host "- Project: $projectPath"
Write-Host "- Domain: anyway.ro"
Write-Host ""

Write-Host "🔗 Connecting to server..." -ForegroundColor Yellow

# Create SSH command
$sshCommand = @"
cd $projectPath && 
chmod +x debug-api.sh deploy-final.sh && 
echo '🔍 Running debug first...' && 
./debug-api.sh && 
echo '' && 
echo '🚀 Starting deployment...' && 
./deploy-final.sh
"@

Write-Host "Commands to run on server:" -ForegroundColor Cyan
Write-Host $sshCommand
Write-Host ""

Write-Host "⚠️ MANUAL STEPS REQUIRED:" -ForegroundColor Red
Write-Host "1. Connect to server: ssh root@$serverIP"
Write-Host "2. Enter password: $password"
Write-Host "3. Navigate to project: cd $projectPath"
Write-Host "4. Make scripts executable: chmod +x debug-api.sh deploy-final.sh"
Write-Host "5. Run debug: ./debug-api.sh"
Write-Host "6. Run deployment: ./deploy-final.sh"
Write-Host ""

Write-Host "🌐 After deployment, test these URLs:" -ForegroundColor Green
Write-Host "- https://anyway.ro"
Write-Host "- https://anyway.ro/airport/OTP/arrivals"
Write-Host "- https://anyway.ro/airport/CLJ/departures"
Write-Host "- https://anyway.ro/admin (password: admin123)"
Write-Host ""

Write-Host "🔑 If API key issues persist:" -ForegroundColor Yellow
Write-Host "1. Visit: https://api.market/dashboard"
Write-Host "2. Check subscription status"
Write-Host "3. Generate new API key"
Write-Host "4. Update .env.local on server"
Write-Host "5. Restart: docker-compose restart"

Write-Host ""
Write-Host "✅ Instructions provided. Please connect to server manually." -ForegroundColor Green