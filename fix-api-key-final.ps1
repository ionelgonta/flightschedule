# Fix API Key Final
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "🔧 Fixing API Key Configuration" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Correct API Key: cmj2peefi0001la04p5rkbbcc" -ForegroundColor Yellow
Write-Host ""

# Update Docker configuration with correct API key
Write-Host "📝 Updating Docker configuration..." -ForegroundColor Yellow

# Create deployment script with correct API key
$deployScript = @'
#!/bin/bash
echo "🔧 Fixing API Key Configuration"
echo "==============================="

cd /opt/anyway-flight-schedule

# Pull latest changes
git pull origin main

# Update docker-compose.yml with correct API key
sed -i 's/NEXT_PUBLIC_FLIGHT_API_KEY=.*/NEXT_PUBLIC_FLIGHT_API_KEY=cmj2peefi0001la04p5rkbbcc/' docker-compose.yml

# Verify the change
echo "Verifying API key in docker-compose.yml:"
grep "NEXT_PUBLIC_FLIGHT_API_KEY" docker-compose.yml

# Rebuild containers with new configuration
echo ""
echo "🔄 Rebuilding containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "⏳ Waiting for startup..."
sleep 20

echo ""
echo "🧪 Testing API key configuration..."
curl -s https://anyway.ro/api/admin/api-key | jq '.'

echo ""
echo "✅ API Key fix completed!"
'@

# Save and execute script
$deployScript | Out-File -FilePath "api_fix.sh" -Encoding UTF8
pscp -pw $ServerPassword "api_fix.sh" root@${ServerIP}:/tmp/
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "chmod +x /tmp/api_fix.sh; /tmp/api_fix.sh"

# Clean up
Remove-Item "api_fix.sh" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ API Key fix deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Testing from local..." -ForegroundColor Yellow

try {
    $apiTest = Invoke-WebRequest -Uri "https://anyway.ro/api/admin/api-key" -UseBasicParsing
    $result = $apiTest.Content | ConvertFrom-Json
    
    Write-Host "API Key Status:" -ForegroundColor Cyan
    Write-Host "- Has Key: $($result.hasKey)" -ForegroundColor $(if($result.hasKey){'Green'}else{'Red'})
    Write-Host "- Displayed: $($result.apiKey)" -ForegroundColor White
    
    if ($result.hasKey) {
        Write-Host "✅ API Key is now configured!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://anyway.ro/admin" -ForegroundColor White
        Write-Host "2. Tab 'API Management'" -ForegroundColor White
        Write-Host "3. Test the API key" -ForegroundColor White
        Write-Host "4. If valid, flight data should work" -ForegroundColor White
    } else {
        Write-Host "❌ API Key still not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to test API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deployment completed at $(Get-Date)" -ForegroundColor Cyan