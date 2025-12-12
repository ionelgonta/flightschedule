# Deploy Correct API Key
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "🔑 Deploying Correct API Key" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "API Key: cmj2peefi0001la04p5rkbbcc" -ForegroundColor Yellow
Write-Host ""

# Commit changes
Write-Host "📤 Committing API key update..." -ForegroundColor Yellow
git add .
git commit -m "Update API Key to correct value: cmj2peefi0001la04p5rkbbcc"
git push origin main
Write-Host "✅ Changes pushed to Git" -ForegroundColor Green

# Deploy to server
Write-Host ""
Write-Host "🚀 Deploying to server..." -ForegroundColor Yellow

$deployCommands = @"
cd /opt/anyway-flight-schedule
git pull origin main
echo 'NEXT_PUBLIC_FLIGHT_API_KEY=cmj2peefi0001la04p5rkbbcc' > .env.local
echo 'NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox' >> .env.local
echo 'NEXT_PUBLIC_CACHE_DURATION=600000' >> .env.local
echo 'NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000' >> .env.local
echo 'NEXT_PUBLIC_API_RATE_LIMIT=150' >> .env.local
echo 'NEXT_PUBLIC_DEBUG_FLIGHTS=false' >> .env.local
echo 'NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY' >> .env.local
docker-compose restart
sleep 15
echo 'Testing API configuration:'
curl -s https://anyway.ro/api/admin/api-key
"@

plink -ssh -pw $ServerPassword $ServerUser@$ServerIP $deployCommands

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Testing API key..." -ForegroundColor Yellow