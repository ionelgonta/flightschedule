#!/usr/bin/env pwsh

# Fix MCP Service - Repară serviciul MCP pentru a returna date reale
Write-Host "🔧 Fixing MCP Service Configuration..." -ForegroundColor Green

$SERVER_IP = "23.88.113.154"
$API_KEY = "cmj2peefi0001la04p5rkbbcc"

Write-Host "📋 Issues identified:" -ForegroundColor Yellow
Write-Host "1. MCP service returns only dummy data (N/A, Unknown)" -ForegroundColor White
Write-Host "2. API key validation fails for MCP endpoint" -ForegroundColor White
Write-Host "3. Need to fix service configuration and data mapping" -ForegroundColor White

# Create fix script for server
$fixScript = @'
#!/bin/bash
set -e

echo "🔧 Fixing MCP Service Configuration..."

cd /opt/anyway-flight-schedule

# Check current API configuration
echo "📋 Current API configuration:"
grep -r "NEXT_PUBLIC_FLIGHT_API" .env.local || echo "No API config found"

# Update environment variables
echo "🔄 Updating environment variables..."
cat > .env.local << EOF
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2peefi0001la04p5rkbbcc
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3
NEXT_PUBLIC_SCHEDULER_ENABLED=true
EOF

# Test direct AeroDataBox API (without MCP)
echo "🧪 Testing direct AeroDataBox API..."
curl -s -X GET "https://aerodatabox.p.rapidapi.com/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59" \
  -H "X-RapidAPI-Key: $API_KEY" \
  -H "X-RapidAPI-Host: aerodatabox.p.rapidapi.com" || echo "Direct API test failed"

# Rebuild with new configuration
echo "🔨 Rebuilding application..."
npm run build

# Restart services
echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d --build

echo "✅ MCP Service fix completed"
'@

# Execute fix on server
Write-Host "🚀 Executing fix on server..." -ForegroundColor Blue
try {
    $fixScript | ssh -o StrictHostKeyChecking=no root@$SERVER_IP 'bash -s'
    Write-Host "✅ Server fix completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Server fix failed: $_" -ForegroundColor Red
}

# Test the fix
Write-Host "🧪 Testing the fix..." -ForegroundColor Blue
Start-Sleep -Seconds 30  # Wait for services to restart

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals" -TimeoutSec 30 -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "📊 Test Results:" -ForegroundColor Cyan
    Write-Host "  Success: $($data.success)" -ForegroundColor White
    Write-Host "  Data Count: $($data.data.Count)" -ForegroundColor White
    Write-Host "  Error: $($data.error)" -ForegroundColor White
    
    if ($data.data.Count -gt 0) {
        $flight = $data.data[0]
        Write-Host "  First Flight:" -ForegroundColor White
        Write-Host "    Number: $($flight.flight_number)" -ForegroundColor Gray
        Write-Host "    Airline: $($flight.airline.name)" -ForegroundColor Gray
        Write-Host "    Status: $($flight.status)" -ForegroundColor Gray
        
        if ($flight.flight_number -ne "N/A" -and $flight.airline.name -ne "Unknown") {
            Write-Host "✅ Real data is now being returned!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Still returning dummy data" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Test failed: $_" -ForegroundColor Red
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. If still showing dummy data, check API key permissions" -ForegroundColor White
Write-Host "2. Consider switching to direct AeroDataBox API instead of MCP" -ForegroundColor White
Write-Host "3. Verify ICAO code mapping for Romanian airports" -ForegroundColor White
Write-Host "4. Check server logs for detailed error messages" -ForegroundColor White

Write-Host "`n✅ MCP Service Fix Complete!" -ForegroundColor Green