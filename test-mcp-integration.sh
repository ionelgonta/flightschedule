#!/bin/bash

# Test MCP Integration - API.Market AeroDataBox
# Testează funcționalitatea MCP folosind cURL

echo "🔗 Testing MCP Integration for API.Market AeroDataBox"
echo "===================================================="

# Configuration
API_KEY="cmj2k38yg0004jy04yemilnaq"
MCP_URL="https://prod.api.market/api/mcp/aedbx/aerodatabox"

echo ""
echo "📋 Configuration:"
echo "API Key: ${API_KEY:0:8}...${API_KEY: -8}"
echo "MCP URL: $MCP_URL"
echo ""

echo "🔄 Step 1: Initialize MCP Connection..."
echo "======================================"

# Initialize MCP connection
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
      "capabilities": {
        "tools": {}
      },
      "clientInfo": {
        "name": "anyway-flight-schedule",
        "version": "1.0.0"
      }
    }
  }')

echo "Initialize Response:"
echo "$init_response" | jq '.' 2>/dev/null || echo "$init_response"

# Check if initialization was successful
if echo "$init_response" | grep -q '"result"'; then
    echo "✅ MCP initialization successful"
else
    echo "❌ MCP initialization failed"
    if echo "$init_response" | grep -q '"error"'; then
        error_msg=$(echo "$init_response" | jq -r '.error.message' 2>/dev/null)
        echo "Error: $error_msg"
    fi
fi

echo ""
echo "🛠️ Step 2: List Available Tools..."
echo "=================================="

# List available tools
tools_response=$(curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-market-key: $API_KEY" \
  --connect-timeout 30 \
  --max-time 60 \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }')

echo "Tools Response:"
echo "$tools_response" | jq '.' 2>/dev/null || echo "$tools_response"

# Extract and display tools
if echo "$tools_response" | grep -q '"tools"'; then
    echo ""
    echo "Available Tools:"
    echo "$tools_response" | jq -r '.result.tools[]? | "- \(.name): \(.description)"' 2>/dev/null || echo "Could not parse tools"
    
    # Count tools
    tool_count=$(echo "$tools_response" | jq '.result.tools | length' 2>/dev/null || echo "0")
    echo "Total tools available: $tool_count"
else
    echo "❌ No tools found or error occurred"
fi

echo ""
echo "🧪 Step 3: Test Flight Data Tool..."
echo "=================================="

# Try to call a flight-related tool (we'll need to adapt based on actual available tools)
# This is a generic example - adjust based on actual tool names from step 2

flight_response=$(curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-market-key: $API_KEY" \
  --connect-timeout 30 \
  --max-time 60 \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_flights",
      "arguments": {
        "airport": "LROP",
        "type": "arrivals",
        "date": "'$(date +%Y-%m-%d)'",
        "timeFrom": "'$(date +%Y-%m-%d)'T00:00",
        "timeTo": "'$(date +%Y-%m-%d)'T23:59"
      }
    }
  }')

echo "Flight Tool Response:"
echo "$flight_response" | jq '.' 2>/dev/null || echo "$flight_response"

if echo "$flight_response" | grep -q '"result"'; then
    echo "✅ Flight tool call successful"
    
    # Try to count flights if possible
    flight_count=$(echo "$flight_response" | jq '.result.content[]? | length' 2>/dev/null || echo "unknown")
    echo "Flights found: $flight_count"
else
    echo "⚠️ Flight tool call failed or no data"
    if echo "$flight_response" | grep -q '"error"'; then
        error_msg=$(echo "$flight_response" | jq -r '.error.message' 2>/dev/null)
        echo "Error: $error_msg"
    fi
fi

echo ""
echo "🏢 Step 4: Test Airport Search Tool..."
echo "====================================="

# Try airport search tool
search_response=$(curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-market-key: $API_KEY" \
  --connect-timeout 30 \
  --max-time 60 \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "search_airports",
      "arguments": {
        "query": "Bucharest",
        "limit": 5
      }
    }
  }')

echo "Airport Search Response:"
echo "$search_response" | jq '.' 2>/dev/null || echo "$search_response"

if echo "$search_response" | grep -q '"result"'; then
    echo "✅ Airport search successful"
else
    echo "⚠️ Airport search failed"
    if echo "$search_response" | grep -q '"error"'; then
        error_msg=$(echo "$search_response" | jq -r '.error.message' 2>/dev/null)
        echo "Error: $error_msg"
    fi
fi

echo ""
echo "📊 Step 5: Performance Test..."
echo "============================="

# Test response times
echo "Testing response times for multiple requests..."

start_time=$(date +%s%N)

for i in {1..3}; do
    echo "Request $i..."
    response=$(curl -s -X POST "$MCP_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-market-key: $API_KEY" \
      --connect-timeout 10 \
      --max-time 30 \
      -w "Time: %{time_total}s\n" \
      -d '{
        "jsonrpc": "2.0",
        "id": '$((4+i))',
        "method": "tools/list",
        "params": {}
      }' 2>&1)
    
    # Extract timing info
    time_info=$(echo "$response" | grep "Time:" | tail -1)
    echo "  $time_info"
done

end_time=$(date +%s%N)
total_time=$(( (end_time - start_time) / 1000000 ))
echo "Total test time: ${total_time}ms"

echo ""
echo "📋 Step 6: Integration Summary..."
echo "================================"

echo ""
echo "🔍 MCP Integration Status:"
echo "-------------------------"

# Check if jq is available for better JSON parsing
if command -v jq &> /dev/null; then
    echo "✅ JSON parsing available (jq installed)"
else
    echo "⚠️ JSON parsing limited (jq not installed)"
    echo "   Install jq for better output: apt-get install jq"
fi

# Check curl version
curl_version=$(curl --version | head -1)
echo "✅ cURL version: $curl_version"

echo ""
echo "🚀 Next Steps:"
echo "-------------"
echo "1. Review available tools from Step 2"
echo "2. Update MCPService.ts with correct tool names"
echo "3. Integrate MCP calls in flight API service"
echo "4. Test with actual flight data requests"
echo "5. Deploy to production server"

echo ""
echo "📝 Integration Notes:"
echo "-------------------"
echo "• MCP endpoint: $MCP_URL"
echo "• Authentication: x-api-market-key header"
echo "• Protocol: JSON-RPC 2.0"
echo "• Timeout: 30s connection, 60s total"
echo "• Client: anyway-flight-schedule v1.0.0"

echo ""
echo "🌐 Test URLs after integration:"
echo "------------------------------"
echo "• Flight data: https://anyway.ro/airport/OTP/arrivals"
echo "• Search: https://anyway.ro/search"
echo "• Admin: https://anyway.ro/admin"

echo ""
echo "Test completed at $(date)"