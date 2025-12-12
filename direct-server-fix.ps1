# Direct Server Fix for API Key
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "🔧 Direct Server API Key Fix" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Create simple fix script
$fixScript = @'
#!/bin/bash
echo "🔧 Fixing API Key Configuration on Server"
echo "========================================"

cd /opt/anyway-flight-schedule

echo "📝 Creating .env.local with API key..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2k38yg0004jy04yemilnaq
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_DEBUG_FLIGHTS=false
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
EOF

echo "✅ .env.local created"

echo "🔄 Restarting services..."
docker-compose restart

echo "⏳ Waiting for restart..."
sleep 15

echo "🧪 Testing API configuration..."
curl -s https://anyway.ro/api/admin/api-key | head -200

echo ""
echo "✅ API Key fix completed!"
'@

# Save and execute
$fixScript | Out-File -FilePath "server_fix.sh" -Encoding UTF8
pscp -pw $ServerPassword "server_fix.sh" root@${ServerIP}:/tmp/
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "chmod +x /tmp/server_fix.sh; /tmp/server_fix.sh"

# Clean up
Remove-Item "server_fix.sh" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Direct server fix completed!" -ForegroundColor Green
Write-Host "Now test: https://anyway.ro/admin" -ForegroundColor Yellow