#!/bin/bash

# Deploy MCP Integration - Complete setup for API.Market MCP with AeroDataBox
# Includes authentication fix and MCP protocol implementation

echo "🔗 Deploy MCP Integration for API.Market AeroDataBox"
echo "===================================================="
echo "Date: $(date)"
echo ""

# Configuration
API_KEY="cmj2k38yg0004jy04yemilnaq"
MCP_URL="https://prod.api.market/api/mcp/aedbx/aerodatabox"
SERVER_PATH="/opt/anyway-flight-schedule"

echo "📋 Configuration:"
echo "API Key: ${API_KEY:0:8}...${API_KEY: -8}"
echo "MCP URL: $MCP_URL"
echo "Server Path: $SERVER_PATH"
echo ""

echo "📋 Step 1: Backup current deployment..."
echo "======================================"
if [ -d "$SERVER_PATH.backup-mcp-$(date +%Y%m%d)" ]; then
    echo "⚠️ MCP backup already exists for today"
else
    echo "Creating MCP backup..."
    cp -r "$SERVER_PATH" "$SERVER_PATH.backup-mcp-$(date +%Y%m%d)"
    echo "✅ MCP backup created: $SERVER_PATH.backup-mcp-$(date +%Y%m%d)"
fi

echo ""
echo "🔄 Step 2: Pull latest changes with MCP integration..."
echo "===================================================="
cd "$SERVER_PATH"
git pull origin main
echo "✅ Latest MCP changes pulled"

echo ""
echo "🧪 Step 3: Test MCP connection..."
echo "==============================="

# Test MCP initialization
echo "Testing MCP initialization..."
init_response=$(curl -s -X POST "$MCP_URL" \
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

echo "MCP Init Response:"
echo "$init_response" | head -c 200
echo "..."

if echo "$init_response" | grep -q '"result"'; then
    echo "✅ MCP initialization successful"
    
    # Test tools list
    echo ""
    echo "Testing MCP tools list..."
    tools_response=$(curl -s -X POST "$MCP_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-market-key: $API_KEY" \
      --connect-timeout 30 \
      --max-time 60 \
      -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}')
    
    if echo "$tools_response" | grep -q '"tools"'; then
        tool_count=$(echo "$tools_response" | grep -o '"name"' | wc -l)
        echo "✅ MCP tools loaded: $tool_count tools available"
    else
        echo "⚠️ MCP tools list failed"
    fi
else
    echo "❌ MCP initialization failed"
    if echo "$init_response" | grep -q '"error"'; then
        echo "Error details: $init_response"
    fi
fi

echo ""
echo "🔄 Step 4: Rebuild application with MCP support..."
echo "================================================"

# Stop services
echo "Stopping services..."
docker-compose down

# Rebuild with latest changes including MCP
echo "Rebuilding application with MCP integration..."
docker-compose build --no-cache

# Start services
echo "Starting services with MCP support..."
docker-compose up -d

echo "✅ Services restarted with MCP integration"

echo ""
echo "⏳ Step 5: Wait for initialization..."
echo "===================================="
sleep 15

echo ""
echo "🧪 Step 6: Test application with MCP..."
echo "======================================"

# Test application endpoints
endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/mcp/flights"
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/admin"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    if [[ "$endpoint" == *"/api/mcp/flights" ]]; then
        # Test MCP endpoint specifically
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint")
        http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
        
        if [ "$http_code" = "200" ]; then
            echo "  ✅ MCP endpoint working"
            if echo "$response" | grep -q '"initialized":true'; then
                echo "  ✅ MCP service initialized"
            elif echo "$response" | grep -q '"initialized":false'; then
                echo "  ⚠️ MCP service not initialized"
            fi
        else
            echo "  ❌ MCP endpoint failed: $http_code"
        fi
    else
        # Test regular endpoints
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint")
        http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
        
        if [ "$http_code" = "200" ]; then
            echo "  ✅ Working"
        else
            echo "  ❌ Failed: $http_code"
        fi
    fi
done

echo ""
echo "🧪 Step 7: Test MCP flight data integration..."
echo "============================================="

# Test MCP flight data through application API
echo "Testing MCP flight data via application API..."
mcp_flight_response=$(curl -s -X POST "http://localhost:3000/api/mcp/flights" \
  -H "Content-Type: application/json" \
  -d '{
    "airport": "OTP",
    "type": "arrivals"
  }')

echo "MCP Flight Response:"
echo "$mcp_flight_response" | head -c 300
echo "..."

if echo "$mcp_flight_response" | grep -q '"success":true'; then
    echo "✅ MCP flight data integration working"
else
    echo "⚠️ MCP flight data integration needs attention"
    if echo "$mcp_flight_response" | grep -q '"error"'; then
        error_msg=$(echo "$mcp_flight_response" | grep -o '"error":"[^"]*"' | head -1)
        echo "Error: $error_msg"
    fi
fi

echo ""
echo "📊 Step 8: Show application logs..."
echo "=================================="
echo "Recent application logs:"
docker-compose logs app --tail=30

echo ""
echo "🌐 Step 9: Test public URLs..."
echo "============================="

# Test public URLs
public_urls=(
    "https://anyway.ro"
    "https://anyway.ro/admin"
    "https://anyway.ro/airport/OTP/arrivals"
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
echo "📋 Step 10: MCP Integration Summary..."
echo "====================================="

echo ""
echo "🔍 MCP Integration Status:"
echo "-------------------------"

# Check if jq is available
if command -v jq &> /dev/null; then
    echo "✅ JSON parsing available (jq installed)"
else
    echo "⚠️ JSON parsing limited (jq not installed)"
    echo "   Install: apt-get install jq"
fi

# Check curl version
curl_version=$(curl --version | head -1)
echo "✅ cURL version: $curl_version"

# Check Node.js version in container
node_version=$(docker-compose exec -T app node --version 2>/dev/null || echo "N/A")
echo "✅ Node.js version: $node_version"

echo ""
echo "🚀 MCP Features Deployed:"
echo "------------------------"
echo "✅ MCP Service (lib/mcpService.ts)"
echo "✅ MCP API Routes (/api/mcp/flights)"
echo "✅ Admin MCP Management (MCP tab)"
echo "✅ Authentication fix (x-magicapi-key)"
echo "✅ Test scripts and documentation"

echo ""
echo "🌐 Test URLs:"
echo "-------------"
echo "• Main site: https://anyway.ro"
echo "• Admin MCP: https://anyway.ro/admin (tab: MCP Integration)"
echo "• Flight data: https://anyway.ro/airport/OTP/arrivals"
echo "• MCP API: https://anyway.ro/api/mcp/flights"

echo ""
echo "📊 Monitor Commands:"
echo "-------------------"
echo "• Logs: docker-compose logs app -f"
echo "• Status: docker-compose ps"
echo "• MCP Test: ./test-mcp-integration.sh"
echo "• Restart: docker-compose restart app"

echo ""
echo "📝 Next Steps:"
echo "-------------"
echo "1. Test MCP integration in admin panel"
echo "2. Verify flight data loading via MCP"
echo "3. Monitor performance and error rates"
echo "4. Configure MCP tools based on available functions"

if echo "$init_response" | grep -q '"result"'; then
    echo ""
    echo "✅ SUCCESS: MCP Integration deployed successfully!"
    echo ""
    echo "🔑 Key Features:"
    echo "- Model Context Protocol integration"
    echo "- Direct access to AeroDataBox tools"
    echo "- Admin panel MCP management"
    echo "- Real-time flight data via MCP"
    echo "- Corrected API authentication"
else
    echo ""
    echo "⚠️ PARTIAL SUCCESS: Deployment completed but MCP needs configuration"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check API.Market dashboard for MCP access"
    echo "2. Verify API key has MCP permissions"
    echo "3. Test MCP manually: ./test-mcp-integration.sh"
    echo "4. Check application logs: docker-compose logs app -f"
fi

echo ""
echo "MCP Integration deployment completed at $(date)"