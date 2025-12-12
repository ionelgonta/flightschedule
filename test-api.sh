#!/bin/bash

# Test API.Market Integration Script
# Testează integrarea cu AeroDataBox prin API.Market

echo "🧪 Testing API.Market Integration..."
echo ""

API_KEY="cmj2k3c1p000djy044wbqprap"
BASE_URL="https://api.market/aerodatabox/v1"

# Test direct API call
echo "1. Testing direct API call to AeroDataBox..."
echo "URL: $BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"
echo ""

curl -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     "$BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59" \
     -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
     -s | head -20

echo ""
echo "2. Testing departures..."
curl -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     "$BASE_URL/flights/airports/icao/LROP/departures/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59" \
     -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
     -s | head -20

echo ""
echo "3. Testing other Romanian airports..."

# Test Cluj (LRCL)
echo "Testing Cluj (LRCL)..."
curl -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     "$BASE_URL/flights/airports/icao/LRCL/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59" \
     -w "\nHTTP Status: %{http_code}\n" \
     -s -o /dev/null

# Test Timișoara (LRTR)
echo "Testing Timișoara (LRTR)..."
curl -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     "$BASE_URL/flights/airports/icao/LRTR/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59" \
     -w "\nHTTP Status: %{http_code}\n" \
     -s -o /dev/null

echo ""
echo "✅ API Test completed!"
echo ""
echo "📋 Notes:"
echo "- HTTP 200: Success"
echo "- HTTP 401: Invalid API key"
echo "- HTTP 429: Rate limit exceeded"
echo "- HTTP 404: Airport not found or no data"
echo ""