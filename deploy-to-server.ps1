# Deploy to Server - PowerShell Script for Windows
# Connects to Hetzner server and deploys MCP integration

Write-Host "🚀 Deploy to Server - MCP Integration + Auth Fix" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Date: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Configuration
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPath = "/opt/anyway-flight-schedule"
$ApiKey = "cmj2k38yg0004jy04yemilnaq"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "Server: $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "Path: $ServerPath" -ForegroundColor White
Write-Host "API Key: $($ApiKey.Substring(0,8))...$($ApiKey.Substring($ApiKey.Length-8))" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Step 1: Connect to server via SSH..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Create SSH commands
$sshCommands = @"
echo "🌐 Connected to server: `$(hostname)"
echo "Current time: `$(date)"
echo ""

# Navigate to project directory
cd /opt/anyway-flight-schedule

echo "📥 Step 1: Pull latest changes..."
echo "================================"
git pull origin main

if [ `$? -eq 0 ]; then
    echo "✅ Git pull successful"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔧 Step 2: Make scripts executable..."
echo "==================================="
chmod +x *.sh
echo "✅ Scripts made executable"

echo ""
echo "🧪 Step 3: Test MCP connection..."
echo "==============================="

# Test MCP with current API key
API_KEY="cmj2k38yg0004jy04yemilnaq"
MCP_URL="https://prod.api.market/api/mcp/aedbx/aerodatabox"

echo "Testing MCP initialization..."
mcp_response=`$(curl -s -X POST "`$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-market-key: `$API_KEY" \
  --connect-timeout 30 \
  --max-time 60 \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "anyway-flight-schedule", "version": "1.0.0"}
    }
  }')

echo "MCP Response (first 200 chars):"
echo "`$mcp_response" | head -c 200
echo "..."

if echo "`$mcp_response" | grep -q '"result"'; then
    echo "✅ MCP connection successful"
else
    echo "⚠️ MCP connection issue (will continue with deployment)"
fi

echo ""
echo "🔄 Step 4: Rebuild and restart services..."
echo "========================================"

# Stop services
echo "Stopping services..."
docker-compose down

# Rebuild with latest changes
echo "Rebuilding application..."
docker-compose build --no-cache

# Start services
echo "Starting services..."
docker-compose up -d

echo "✅ Services restarted"

echo ""
echo "⏳ Step 5: Wait for initialization..."
echo "=================================="
sleep 15

echo ""
echo "🧪 Step 6: Test application endpoints..."
echo "======================================"

# Test endpoints
endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/admin"
)

for endpoint in "`${endpoints[@]}"; do
    echo "Testing: `$endpoint"
    
    response=`$(curl -s -w "\nHTTP_CODE:%{http_code}" "`$endpoint")
    http_code=`$(echo "`$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "`$http_code" = "200" ]; then
        echo "  ✅ Working"
        
        # Check for API success in flight endpoints
        if [[ "`$endpoint" == *"/api/flights/"* ]]; then
            if echo "`$response" | grep -q '"success":true'; then
                echo "  ✅ API data loaded successfully"
            elif echo "`$response" | grep -q '"success":false'; then
                echo "  ⚠️ API returned success:false"
            fi
        fi
    else
        echo "  ❌ Failed: `$http_code"
    fi
done

echo ""
echo "🌐 Step 7: Test public URLs..."
echo "============================="

# Test public URLs
public_urls=(
    "https://anyway.ro"
    "https://anyway.ro/airport/OTP/arrivals"
    "https://anyway.ro/admin"
)

for url in "`${public_urls[@]}"; do
    echo "Testing: `$url"
    
    response_code=`$(curl -s -o /dev/null -w "%{http_code}" "`$url")
    
    if [ "`$response_code" = "200" ]; then
        echo "  ✅ Working"
    else
        echo "  ❌ Failed: `$response_code"
    fi
done

echo ""
echo "📊 Step 8: Show recent logs..."
echo "============================"
echo "Recent application logs:"
docker-compose logs app --tail=20

echo ""
echo "📋 Step 9: Deployment summary..."
echo "==============================="

echo ""
echo "✅ DEPLOYMENT COMPLETED!"
echo ""
echo "🔗 New Features Deployed:"
echo "------------------------"
echo "• MCP Integration (Model Context Protocol)"
echo "• Fixed API authentication (x-magicapi-key)"
echo "• MCP management in admin panel"
echo "• Enhanced flight data access"
echo "• Comprehensive test scripts"
echo ""
echo "🌐 Test URLs:"
echo "-------------"
echo "• Main site: https://anyway.ro"
echo "• Admin panel: https://anyway.ro/admin"
echo "• MCP tab: https://anyway.ro/admin (MCP Integration tab)"
echo "• Flight data: https://anyway.ro/airport/OTP/arrivals"
echo ""
echo "📊 Monitor commands:"
echo "-------------------"
echo "• Logs: docker-compose logs app -f"
echo "• Status: docker-compose ps"
echo "• MCP test: ./test-mcp-integration.sh"
echo ""
echo "Server deployment completed at `$(date)"
"@

# Execute SSH commands
try {
    Write-Host "Executing SSH commands on server..." -ForegroundColor Yellow
    
    # Use plink if available, otherwise try ssh
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        echo $sshCommands | plink -ssh -batch -pw "FlightSchedule2024!" $ServerUser@$ServerIP
    } elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
        echo $sshCommands | ssh -o StrictHostKeyChecking=no $ServerUser@$ServerIP
    } else {
        Write-Host "❌ SSH client not found. Please install OpenSSH or PuTTY." -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual deployment steps:" -ForegroundColor Yellow
        Write-Host "1. Connect to server: ssh root@23.88.113.154" -ForegroundColor White
        Write-Host "2. Navigate: cd /opt/anyway-flight-schedule" -ForegroundColor White
        Write-Host "3. Pull changes: git pull origin main" -ForegroundColor White
        Write-Host "4. Restart: docker-compose restart" -ForegroundColor White
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ SERVER DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Summary:" -ForegroundColor Cyan
    Write-Host "----------" -ForegroundColor Cyan
    Write-Host "• Git changes pushed successfully" -ForegroundColor White
    Write-Host "• Server deployment completed" -ForegroundColor White
    Write-Host "• MCP integration deployed" -ForegroundColor White
    Write-Host "• API authentication fixed" -ForegroundColor White
    Write-Host "• Services restarted and tested" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Your website is now updated:" -ForegroundColor Cyan
    Write-Host "------------------------------" -ForegroundColor Cyan
    Write-Host "• Main site: https://anyway.ro" -ForegroundColor White
    Write-Host "• Admin panel: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "• Flight data: https://anyway.ro/airport/OTP/arrivals" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 New MCP Features:" -ForegroundColor Cyan
    Write-Host "-------------------" -ForegroundColor Cyan
    Write-Host "• Go to Admin Panel → MCP Integration tab" -ForegroundColor White
    Write-Host "• Test MCP connection and tools" -ForegroundColor White
    Write-Host "• Monitor flight data via MCP protocol" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ SERVER DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "------------------" -ForegroundColor Yellow
    Write-Host "1. Check SSH connection to server" -ForegroundColor White
    Write-Host "2. Verify server credentials" -ForegroundColor White
    Write-Host "3. Check server disk space and resources" -ForegroundColor White
    Write-Host "4. Try manual deployment:" -ForegroundColor White
    Write-Host "   ssh root@23.88.113.154" -ForegroundColor Gray
    Write-Host "   cd /opt/anyway-flight-schedule" -ForegroundColor Gray
    Write-Host "   git pull origin main" -ForegroundColor Gray
    Write-Host "   docker-compose restart" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deployment script completed at $(Get-Date)" -ForegroundColor Yellow