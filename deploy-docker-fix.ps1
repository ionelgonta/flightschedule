# Deploy Docker Configuration Fix
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "🐳 Deploying Docker Configuration Fix" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Commit changes
Write-Host "📤 Committing Docker configuration..." -ForegroundColor Yellow
git add .
git commit -m "Fix Docker environment variables for API key: cmj2peefi0001la04p5rkbbcc"
git push origin main
Write-Host "✅ Changes pushed to Git" -ForegroundColor Green

# Deploy to server
Write-Host ""
Write-Host "🚀 Deploying to server..." -ForegroundColor Yellow

$deployScript = @'
cd /opt/anyway-flight-schedule
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
sleep 20
echo "Testing API configuration:"
curl -s https://anyway.ro/api/admin/api-key
echo ""
echo "Testing flight endpoint:"
curl -s https://anyway.ro/api/flights/OTP/arrivals
'@

# Save script and execute
$deployScript | Out-File -FilePath "docker_deploy.sh" -Encoding UTF8
pscp -pw $ServerPassword "docker_deploy.sh" root@${ServerIP}:/tmp/
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "chmod +x /tmp/docker_deploy.sh && /tmp/docker_deploy.sh"

# Clean up
Remove-Item "docker_deploy.sh" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Docker deployment completed!" -ForegroundColor Green