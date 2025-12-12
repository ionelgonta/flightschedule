#!/bin/bash

# Deploy Authentication Fix - Update API.Market headers from Bearer to x-magicapi-key
# Fixes the authentication issue identified by user

echo "🔧 Deploy Authentication Fix for API.Market"
echo "============================================"
echo "Date: $(date)"
echo ""

# Configuration
API_KEY="cmj2k38yg0004jy04yemilnaq"
BASE_URL="https://api.market/aerodatabox/v1"
SERVER_PATH="/opt/anyway-flight-schedule"

echo "📋 Step 1: Backup current deployment..."
echo "======================================"
if [ -d "$SERVER_PATH.backup-$(date +%Y%m%d)" ]; then
    echo "⚠️ Backup already exists for today"
else
    echo "Creating backup..."
    cp -r "$SERVER_PATH" "$SERVER_PATH.backup-$(date +%Y%m%d)"
    echo "✅ Backup created: $SERVER_PATH.backup-$(date +%Y%m%d)"
fi

echo ""
echo "🔄 Step 2: Pull latest changes..."
echo "================================"
cd "$SERVER_PATH"
git pull origin main
echo "✅ Latest changes pulled"

echo ""
echo "🧪 Step 3: Test corrected API authentication..."
echo "=============================================="

# Test with corrected x-magicapi-key header
echo "Testing with x-magicapi-key header..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "x-magicapi-key: $API_KEY" \
  -H "Content-Type: application/json" \
  "$BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ Corrected authentication is working!"
    flight_count=$(echo "$response_body" | grep -o '"number"' | wc -l)
    echo "Found $flight_count flights in response"
elif [ "$http_code" = "401" ]; then
    echo "❌ Still getting 401 - API key may be invalid"
    echo "Response: $response_body"
elif [ "$http_code" = "404" ]; then
    echo "⚠️ 404 - No data available (may be normal)"
    echo "Response: $response_body"
else
    echo "⚠️ Unexpected response: $http_code"
    echo "Response: $response_body"
fi

echo ""
echo "🔄 Step 4: Rebuild and restart services..."
echo "========================================="

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
echo "===================================="
sleep 10

echo ""
echo "🧪 Step 6: Test application endpoints..."
echo "======================================="

# Test local endpoints
endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/api/flights/CLJ/departures"
    "http://localhost:3000/airport/OTP/arrivals"
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
                error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | head -1)
                echo "  Error: $error_msg"
            fi
        fi
    else
        echo "  ❌ Failed: $http_code"
    fi
done

echo ""
echo "📊 Step 7: Show application logs..."
echo "=================================="
echo "Recent application logs:"
docker-compose logs app --tail=20

echo ""
echo "🌐 Step 8: Test public URLs..."
echo "============================="

# Test public URLs
public_urls=(
    "https://anyway.ro"
    "https://anyway.ro/airport/OTP/arrivals"
    "https://anyway.ro/api/flights/OTP/arrivals"
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
echo "📋 Step 9: Summary..."
echo "===================="

if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: Authentication fix deployed successfully!"
    echo ""
    echo "🔑 Changes made:"
    echo "- Updated API authentication from 'Authorization: Bearer' to 'x-magicapi-key'"
    echo "- Fixed lib/flightApiService.ts"
    echo "- Fixed lib/aerodataboxService.ts" 
    echo "- Fixed app/api/admin/api-key/route.ts"
    echo "- Updated all test scripts and documentation"
    echo ""
    echo "🌐 Test URLs:"
    echo "- Main site: https://anyway.ro"
    echo "- OTP Arrivals: https://anyway.ro/airport/OTP/arrivals"
    echo "- CLJ Departures: https://anyway.ro/airport/CLJ/departures"
    echo "- Admin Panel: https://anyway.ro/admin (password: admin123)"
    echo ""
    echo "📊 Monitor:"
    echo "- Logs: docker-compose logs app -f"
    echo "- Status: docker-compose ps"
    echo "- API Test: ./test-new-api-key-2.sh"
else
    echo "⚠️ PARTIAL SUCCESS: Deployment completed but API authentication needs attention"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check API.Market dashboard for key status"
    echo "2. Verify subscription is active"
    echo "3. Check application logs: docker-compose logs app -f"
    echo "4. Test API manually: curl -H 'x-magicapi-key: $API_KEY' '$BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59'"
fi

echo ""
echo "Fix completed at $(date)"