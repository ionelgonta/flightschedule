#!/bin/bash

# Test New API Key - cmj2m39qs0001k00404cmwu75
# Verifică dacă noul API key funcționează cu API.Market

echo "🔑 Testing New API Key: cmj2m39qs0001k00404cmwu75"
echo "=================================================="

API_KEY="cmj2m39qs0001k00404cmwu75"
BASE_URL="https://api.market/aerodatabox/v1"

echo ""
echo "1. Testing API.Market Authentication..."
echo "--------------------------------------"

# Test direct API call pentru OTP (București)
echo "Testing OTP (București) arrivals..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "x-magicapi-key: $API_KEY" \
  -H "Content-Type: application/json" \
  "$BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ New API Key is working!"
    echo "Sample response (first 300 chars):"
    echo "$response_body" | head -c 300
    echo "..."
    
    # Count flights if possible
    flight_count=$(echo "$response_body" | grep -o '"number"' | wc -l)
    echo "Found approximately $flight_count flights"
    
elif [ "$http_code" = "401" ]; then
    echo "❌ API Key is invalid or expired"
    echo "Response: $response_body"
elif [ "$http_code" = "404" ]; then
    echo "❌ API endpoint not found or no data available"
    echo "Response: $response_body"
elif [ "$http_code" = "429" ]; then
    echo "⚠️ Rate limit exceeded"
    echo "Response: $response_body"
else
    echo "⚠️ Unexpected response: $http_code"
    echo "Response: $response_body"
fi

echo ""
echo "2. Testing Multiple Airports..."
echo "------------------------------"

# Test different Romanian airports
airports=("LROP:OTP:București" "LRCL:CLJ:Cluj-Napoca" "LRTR:TSR:Timișoara" "LUKK:KIV:Chișinău")

for airport in "${airports[@]}"; do
    icao=$(echo $airport | cut -d: -f1)
    iata=$(echo $airport | cut -d: -f2)
    city=$(echo $airport | cut -d: -f3)
    
    echo "Testing $iata ($city) - ICAO: $icao..."
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
      -H "x-magicapi-key: $API_KEY" \
      "$BASE_URL/flights/airports/icao/$icao/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        flight_count=$(echo "$response" | sed '/HTTP_CODE:/d' | grep -o '"number"' | wc -l)
        echo "  ✅ $iata ($city) - $flight_count flights found"
    elif [ "$http_code" = "404" ]; then
        echo "  ⚠️ $iata ($city) - No data available"
    else
        echo "  ❌ $iata ($city) - Error: $http_code"
    fi
done

echo ""
echo "3. API Key Information..."
echo "------------------------"
echo "Old API Key: cmj2k3c1p000djy044wbqprap"
echo "New API Key: cmj2m39qs0001k00404cmwu75"
echo "Created: 12 Dec 2025 (from screenshot)"
echo "Expiry: NEVER EXPIRE (from screenshot)"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: New API key is working correctly!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy to server: ./deploy-api-update.sh"
    echo "2. Test on website: https://anyway.ro/airport/OTP/arrivals"
    echo "3. Monitor logs: docker-compose logs app -f"
else
    echo "❌ ISSUE: New API key is not working"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check API.Market dashboard for key status"
    echo "2. Verify subscription is active"
    echo "3. Check if key has proper permissions"
    echo "4. Try again in a few minutes (propagation delay)"
fi

echo ""
echo "🌐 Test URLs after deployment:"
echo "- https://anyway.ro/airport/OTP/arrivals"
echo "- https://anyway.ro/airport/CLJ/departures"
echo "- https://anyway.ro/airport/TSR/arrivals"