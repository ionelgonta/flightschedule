#!/bin/bash

# Update API Key Script - Actualizează API key-ul cu cel nou funcțional
# Înlocuiește cmj2m39qs0001k00404cmwu75 cu cmj2k38yg0004jy04yemilnaq

echo "🔑 Update API Key - anyway.ro Flight Schedule"
echo "============================================"
echo "Date: $(date)"
echo ""

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server"
    echo "Run this script on server 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

OLD_API_KEY="cmj2m39qs0001k00404cmwu75"
NEW_API_KEY="cmj2k38yg0004jy04yemilnaq"

echo "🔄 Step 1: Test new API key..."
echo "============================="

echo "Testing new API key: $NEW_API_KEY"
API_TEST_URL="https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $NEW_API_KEY" \
  -H "Content-Type: application/json" \
  "$API_TEST_URL")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

echo "HTTP Status: $http_code"

case $http_code in
    200)
        echo "✅ New API key is working!"
        flight_count=$(echo "$response" | sed '/HTTP_CODE:/d' | grep -o '"number"' | wc -l)
        echo "Found $flight_count flights for OTP"
        API_WORKING=true
        ;;
    401)
        echo "❌ New API key is invalid (HTTP 401)"
        API_WORKING=false
        ;;
    404)
        echo "❌ New API key not found (HTTP 404)"
        API_WORKING=false
        ;;
    *)
        echo "⚠️ Unexpected response: HTTP $http_code"
        API_WORKING=false
        ;;
esac

if [ "$API_WORKING" != true ]; then
    echo ""
    echo "❌ STOPPING: New API key is not working"
    echo "Please verify the API key in API.Market dashboard"
    exit 1
fi

echo ""
echo "📦 Step 2: Backup current configuration..."
echo "========================================="

if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "✅ .env.local backed up"
else
    echo "⚠️ .env.local not found"
fi

echo ""
echo "🔧 Step 3: Update API key in configuration..."
echo "============================================="

# Actualizează .env.local cu noul API key
cat > .env.local << EOF
# Flight API Configuration - Updated API Key
NEXT_PUBLIC_FLIGHT_API_KEY=$NEW_API_KEY
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox

# Cache and Performance
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3

# Priority Airports (Romanian + Moldova)
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY

# Advanced Features
NEXT_PUBLIC_ENABLE_FLIGHT_SEARCH=true
NEXT_PUBLIC_ENABLE_ROUTE_INFO=true
NEXT_PUBLIC_ENABLE_AIRPORT_STATS=true

# Debug and Monitoring
NEXT_PUBLIC_DEBUG_FLIGHTS=false
NEXT_PUBLIC_SCHEDULER_ENABLED=true

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Google AdSense (placeholder)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX

# Analytics (placeholder)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
EOF

echo "✅ API key updated in .env.local"
echo ""
echo "📄 New configuration:"
echo "OLD API KEY: ${OLD_API_KEY:0:10}...${OLD_API_KEY: -10}"
echo "NEW API KEY: ${NEW_API_KEY:0:10}...${NEW_API_KEY: -10}"

echo ""
echo "🔄 Step 4: Restart application..."
echo "==============================="

# Restart doar aplicația (nu nginx)
echo "Restarting flight schedule application..."
docker-compose restart flight-schedule

if [ $? -eq 0 ]; then
    echo "✅ Application restarted successfully"
else
    echo "❌ Failed to restart application"
    exit 1
fi

echo ""
echo "⏳ Step 5: Wait for application to initialize..."
echo "==============================================="

sleep 15

echo "Container status:"
docker-compose ps

echo ""
echo "🧪 Step 6: Test API integration..."
echo "==============================="

# Test local API endpoints cu noul key
endpoints=(
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/api/flights/CLJ/departures"
    "http://localhost:3000/api/flights/search?flight=RO123"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 15)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    case $http_code in
        200)
            echo "  ✅ Working (HTTP 200)"
            if echo "$response" | grep -q '"success":true'; then
                echo "  ✅ API response successful - NEW KEY WORKING!"
            elif echo "$response" | grep -q '"success":false'; then
                echo "  ⚠️ API returned success:false"
                error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
                echo "  Error: $error_msg"
            fi
            ;;
        404)
            echo "  ❌ Endpoint not found (HTTP 404)"
            ;;
        500)
            echo "  ❌ Internal server error (HTTP 500)"
            ;;
        *)
            echo "  ⚠️ Unexpected response: HTTP $http_code"
            ;;
    esac
done

echo ""
echo "🌐 Step 7: Test external website..."
echo "================================="

# Test external URLs
external_urls=(
    "https://anyway.ro/airport/OTP/arrivals"
    "https://anyway.ro/airport/CLJ/departures"
    "https://anyway.ro/search"
)

for url in "${external_urls[@]}"; do
    echo "Testing: $url"
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 15)
    
    case $http_code in
        200)
            echo "  ✅ Accessible (HTTP 200)"
            ;;
        404)
            echo "  ❌ Not found (HTTP 404)"
            ;;
        502|503)
            echo "  ❌ Server error (HTTP $http_code)"
            ;;
        *)
            echo "  ⚠️ Response: HTTP $http_code"
            ;;
    esac
done

echo ""
echo "📊 Step 8: Show recent logs..."
echo "============================"

echo "Recent application logs:"
docker-compose logs flight-schedule --tail=15

echo ""
echo "✅ API KEY UPDATE COMPLETED!"
echo "============================"

echo ""
echo "🎯 SUMMARY:"
echo "==========="
echo "✅ Old API key: ${OLD_API_KEY:0:15}... (REMOVED)"
echo "✅ New API key: ${NEW_API_KEY:0:15}... (ACTIVE)"
echo "✅ Configuration updated"
echo "✅ Application restarted"
echo "✅ API integration tested"
echo ""

echo "🌐 TEST URLS:"
echo "============"
echo "Flight Schedule:"
echo "- OTP Arrivals: https://anyway.ro/airport/OTP/arrivals"
echo "- CLJ Departures: https://anyway.ro/airport/CLJ/departures"
echo "- TSR Flights: https://anyway.ro/airport/TSR"
echo ""
echo "Advanced Features:"
echo "- Flight Search: https://anyway.ro/search"
echo "- API Search: https://anyway.ro/api/flights/search?flight=RO123"
echo "- Route Info: https://anyway.ro/api/flights/route/OTP/LHR"
echo ""
echo "Admin:"
echo "- Admin Panel: https://anyway.ro/admin (password: admin123)"
echo ""

echo "📊 MONITORING:"
echo "============="
echo "- Real-time logs: docker-compose logs flight-schedule -f"
echo "- Container status: docker-compose ps"
echo "- API test: curl https://anyway.ro/api/flights/OTP/arrivals"
echo ""

if [ "$API_WORKING" = true ]; then
    echo "🎉 SUCCESS: New API key is active and working!"
    echo "Flight data should now load correctly on the website."
else
    echo "⚠️ WARNING: Check API integration manually"
fi

echo ""
echo "API key update completed at $(date)"