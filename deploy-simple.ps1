# Simple Deploy to Server - PowerShell Script
# Connects to Hetzner server and deploys updates

Write-Host "🚀 Deploy to Server - MCP Integration" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Configuration
$ServerIP = "23.88.113.154"
$ServerUser = "root"

Write-Host "📋 Connecting to: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host ""

# SSH command to execute on server
$deployCommand = @"
cd /opt/anyway-flight-schedule && 
echo '📥 Pulling latest changes...' && 
git pull origin main && 
echo '🔧 Making scripts executable...' && 
chmod +x *.sh && 
echo '🔄 Restarting services...' && 
docker-compose down && 
docker-compose build --no-cache && 
docker-compose up -d && 
echo '⏳ Waiting for startup...' && 
sleep 15 && 
echo '🧪 Testing endpoints...' && 
curl -s -o /dev/null -w 'Main site: %{http_code}\n' https://anyway.ro && 
curl -s -o /dev/null -w 'Admin panel: %{http_code}\n' https://anyway.ro/admin && 
curl -s -o /dev/null -w 'Flight data: %{http_code}\n' https://anyway.ro/airport/OTP/arrivals && 
echo '✅ Deployment completed!'
"@

Write-Host "Executing deployment commands..." -ForegroundColor Yellow

# Try different SSH methods
if (Get-Command ssh -ErrorAction SilentlyContinue) {
    Write-Host "Using OpenSSH..." -ForegroundColor Gray
    ssh -o StrictHostKeyChecking=no $ServerUser@$ServerIP $deployCommand
} elseif (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "Using PuTTY plink..." -ForegroundColor Gray
    echo $deployCommand | plink -ssh -batch -pw "FlightSchedule2024!" $ServerUser@$ServerIP
} else {
    Write-Host "❌ No SSH client found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment steps:" -ForegroundColor Yellow
    Write-Host "1. Open SSH client (PuTTY, Windows Terminal, etc.)" -ForegroundColor White
    Write-Host "2. Connect: ssh root@23.88.113.154" -ForegroundColor White
    Write-Host "3. Password: FlightSchedule2024!" -ForegroundColor White
    Write-Host "4. Run commands:" -ForegroundColor White
    Write-Host "   cd /opt/anyway-flight-schedule" -ForegroundColor Gray
    Write-Host "   git pull origin main" -ForegroundColor Gray
    Write-Host "   chmod +x *.sh" -ForegroundColor Gray
    Write-Host "   docker-compose restart" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use Windows Subsystem for Linux (WSL)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 After deployment, test these URLs:" -ForegroundColor Cyan
Write-Host "• Main site: https://anyway.ro" -ForegroundColor White
Write-Host "• Admin panel: https://anyway.ro/admin" -ForegroundColor White
Write-Host "• Flight data: https://anyway.ro/airport/OTP/arrivals" -ForegroundColor White
Write-Host ""
Write-Host "🔗 New MCP features in Admin Panel:" -ForegroundColor Cyan
Write-Host "• Go to Admin → MCP Integration tab" -ForegroundColor White
Write-Host "• Test MCP connection and tools" -ForegroundColor White