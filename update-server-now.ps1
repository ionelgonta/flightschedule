# Update Server Script - Pull latest files and deploy
# Conectează la server și rulează deployment-ul complet

Write-Host "🚀 Updating anyway.ro server with latest files..." -ForegroundColor Green
Write-Host "================================================="

$serverIP = "23.88.113.154"
$username = "root"
$password = "FlightSchedule2024!"
$projectPath = "/opt/anyway-flight-schedule"

Write-Host ""
Write-Host "📋 Server Details:" -ForegroundColor Blue
Write-Host "- IP: $serverIP"
Write-Host "- User: $username"
Write-Host "- Project: $projectPath"
Write-Host "- Files pushed to Git: ✅"
Write-Host ""

Write-Host "🔗 Commands to run on server:" -ForegroundColor Yellow
Write-Host ""

$commands = @"
# Connect to server
ssh root@$serverIP

# Navigate to project
cd $projectPath

# Pull latest files from Git
git pull origin main

# Make scripts executable
chmod +x debug-api.sh deploy-final.sh server-update.sh test-new-api-key.sh

# Run comprehensive debug first
echo "🔍 Running diagnostic..."
./debug-api.sh

# Run complete deployment
echo "🚀 Starting deployment..."
./deploy-final.sh
"@

Write-Host $commands -ForegroundColor Cyan

Write-Host ""
Write-Host "⚡ QUICK COPY-PASTE COMMANDS:" -ForegroundColor Red
Write-Host "ssh root@$serverIP" -ForegroundColor White
Write-Host "cd $projectPath && git pull origin main" -ForegroundColor White
Write-Host "chmod +x *.sh && ./debug-api.sh && ./deploy-final.sh" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Expected Results:" -ForegroundColor Green
Write-Host "1. ✅ Latest files pulled from Git"
Write-Host "2. 🔍 Debug script identifies issues"
Write-Host "3. 🚀 Deploy script fixes containers and API"
Write-Host "4. 🌐 Website accessible at https://anyway.ro"
Write-Host "5. 📊 Flight data loading correctly"

Write-Host ""
Write-Host "🔑 If API key issues persist:" -ForegroundColor Yellow
Write-Host "- Visit: https://api.market/dashboard"
Write-Host "- Check subscription status"
Write-Host "- Generate new API key"
Write-Host "- Update .env.local on server"

Write-Host ""
Write-Host "📞 Server Access:" -ForegroundColor Magenta
Write-Host "SSH: ssh root@$serverIP"
Write-Host "Password: $password"
Write-Host ""

Write-Host "✅ Files are ready on Git. Connect to server and run the commands above." -ForegroundColor Green