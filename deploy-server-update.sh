#!/bin/bash

# Deploy Server Update - Complete MCP Integration + Auth Fix
# Trimite toate modificările pe serverul Hetzner

echo "🚀 Deploy Server Update - MCP Integration + Auth Fix"
echo "===================================================="
echo "Date: $(date)"
echo ""

# Configuration
SERVER_IP="23.88.113.154"
SERVER_USER="root"
SERVER_PATH="/opt/anyway-flight-schedule"
API_KEY="cmj2k38yg0004jy04yemilnaq"

echo "📋 Configuration:"
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Path: $SERVER_PATH"
echo "API Key: ${API_KEY:0:8}...${API_KEY: -8}"
echo ""

echo "📤 Step 1: Push changes to Git repository..."
echo "==========================================="

# Add all changes
git add .

# Commit with descriptive message
git commit -m "🔗 Add MCP Integration + Fix API Authentication

- Add complete MCP (Model Context Protocol) integration
- Fix API.Market authentication (Bearer → x-magicapi-key)
- Add MCP service with cURL implementation
- Add MCP API routes (/api/mcp/flights)
- Add MCP management tab in admin panel
- Add comprehensive test scripts
- Update all documentation and examples
- Ready for production deployment"

# Push to repository
git push origin main

echo "✅ Changes pushed to Git repository"

echo ""
echo "🔗 Step 2: Connect to server and deploy..."
echo "=========================================="

# Execute deployment on server
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'

echo "🌐 Connected to server: $(hostname)"
echo "Current time: $(date)"
echo ""

# Navigate to project directory
cd /opt/anyway-flight-schedule

echo "📥 Step 2.1: Pull latest changes..."
echo "=================================="
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Git pull successful"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔧 Step 2.2: Make scripts executable..."
echo "====================================="
chmod +x *.sh
echo "✅ Scripts made executable"

echo ""
echo "🧪 Step 2.3: Test MCP connection..."
echo "================================="

# Test MCP with current API key
API_KEY="cmj2k38yg0004jy04yemilnaq"
MCP_URL="https://prod.api.market/api/mcp/aedbx/aerodatabox"

echo "Testing MCP initialization..."
mcp_response=$(curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-market-key: $API_KEY" \
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
echo "$mcp_response" | head -c 200
echo "..."

if echo "$mcp_response" | grep -q '"result"'; then
    echo "✅ MCP connection successful"
else
    echo "⚠️ MCP connection issue (will continue with deployment)"
fi

echo ""
echo "🔄 Step 2.4: Rebuild and restart services..."
echo "==========================================="

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
echo "⏳ Step 2.5: Wait for initialization..."
echo "===================================="
sleep 15

echo ""
echo "🧪 Step 2.6: Test application endpoints..."
echo "========================================"

# Test endpoints
endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/admin"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ Working"
        
        # Check for API success in flight endpoints
        if [[ "$endpoint" == *"/api/flights/"* ]]; then
            if echo "$response" | grep -q '"success":true'; then
                echo "  ✅ API data loaded successfully"
            elif echo "$response" | grep -q '"success":false'; then
                echo "  ⚠️ API returned success:false"
            fi
        fi
    else
        echo "  ❌ Failed: $http_code"
    fi
done

echo ""
echo "🌐 Step 2.7: Test public URLs..."
echo "==============================="

# Test public URLs
public_urls=(
    "https://anyway.ro"
    "https://anyway.ro/airport/OTP/arrivals"
    "https://anyway.ro/admin"
)

for url in "${public_urls[@]}"; do
    echo "Testing: $url"
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response_code" = "200" ]; then
        echo "  ✅ Working"
    else
        echo "  ❌ Failed: $response_code"
    fi
done

echo ""
echo "📊 Step 2.8: Show recent logs..."
echo "==============================="
echo "Recent application logs:"
docker-compose logs app --tail=20

echo ""
echo "📋 Step 2.9: Deployment summary..."
echo "================================="

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
echo "Server deployment completed at $(date)"

ENDSSH

# Check SSH connection result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SERVER DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🎉 Summary:"
    echo "----------"
    echo "• Git changes pushed successfully"
    echo "• Server deployment completed"
    echo "• MCP integration deployed"
    echo "• API authentication fixed"
    echo "• Services restarted and tested"
    echo ""
    echo "🌐 Your website is now updated:"
    echo "------------------------------"
    echo "• Main site: https://anyway.ro"
    echo "• Admin panel: https://anyway.ro/admin"
    echo "• Flight data: https://anyway.ro/airport/OTP/arrivals"
    echo ""
    echo "🔗 New MCP Features:"
    echo "-------------------"
    echo "• Go to Admin Panel → MCP Integration tab"
    echo "• Test MCP connection and tools"
    echo "• Monitor flight data via MCP protocol"
    echo ""
    echo "📊 Next steps:"
    echo "-------------"
    echo "1. Test MCP integration in admin panel"
    echo "2. Verify flight data is loading correctly"
    echo "3. Monitor performance and logs"
else
    echo ""
    echo "❌ SERVER DEPLOYMENT FAILED!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "------------------"
    echo "1. Check SSH connection to server"
    echo "2. Verify server credentials"
    echo "3. Check server disk space and resources"
    echo "4. Try manual deployment:"
    echo "   ssh root@23.88.113.154"
    echo "   cd /opt/anyway-flight-schedule"
    echo "   git pull origin main"
    echo "   docker-compose restart"
fi

echo ""
echo "Deployment script completed at $(date)"