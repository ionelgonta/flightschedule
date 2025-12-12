#!/bin/bash

# Test API Integration Script
# Verifică dacă API-ul funcționează corect cu noua implementare

echo "🧪 Testing API Integration for anyway.ro Flight Schedule"
echo "=================================================="

API_KEY="cmj2m39qs0001k00404cmwu75"
BASE_URL="https://api.market/aerodatabox/v1"

echo ""
echo "1. Testing API.Market Bearer Token Authentication..."
echo "---------------------------------------------------"

# Test direct API call
echo "Testing direct API call to AeroDataBox..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "$BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ API Key is working!"
    echo "Sample response (first 200 chars):"
    echo "$response_body" | head -c 200
    echo "..."
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
echo "2. Testing ICAO Code Mapping..."
echo "------------------------------"

# Test different airport codes
airports=("OTP:LROP" "CLJ:LRCL" "TSR:LRTR" "KIV:LUKK")

for airport in "${airports[@]}"; do
    iata=$(echo $airport | cut -d: -f1)
    icao=$(echo $airport | cut -d: -f2)
    
    echo "Testing $iata → $icao mapping..."
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
      -H "Authorization: Bearer $API_KEY" \
      "$BASE_URL/flights/airports/icao/$icao/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ $iata ($icao) - Data available"
    elif [ "$http_code" = "404" ]; then
        echo "  ⚠️ $iata ($icao) - No data or invalid code"
    else
        echo "  ❌ $iata ($icao) - Error: $http_code"
    fi
done

echo ""
echo "3. Testing Local Application API..."
echo "----------------------------------"

if command -v docker-compose &> /dev/null; then
    # Check if application is running
    if docker-compose ps | grep -q "Up"; then
        echo "Application is running, testing endpoints..."
        
        # Test local API endpoints
        local_endpoints=(
            "http://localhost:3000/api/flights/OTP/arrivals"
            "http://localhost:3000/api/flights/CLJ/departures"
            "http://localhost:3000/api/flights/TSR/arrivals"
        )
        
        for endpoint in "${local_endpoints[@]}"; do
            echo "Testing: $endpoint"
            
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint")
            http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
            
            if [ "$http_code" = "200" ]; then
                echo "  ✅ Endpoint working"
                # Check if response contains flight data
                if echo "$response" | grep -q '"success":true'; then
                    echo "  ✅ Flight data loaded successfully"
                elif echo "$response" | grep -q '"success":false'; then
                    echo "  ⚠️ API returned success:false (check error message)"
                fi
            else
                echo "  ❌ Endpoint failed: $http_code"
            fi
        done
    else
        echo "❌ Application is not running. Start with: docker-compose up -d"
    fi
else
    echo "⚠️ Docker Compose not available, skipping local tests"
fi

echo ""
echo "4. Testing Website Accessibility..."
echo "----------------------------------"

# Test if website is accessible
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200"; then
    echo "✅ Website is accessible at http://localhost:3000"
    
    # Test specific flight pages
    flight_pages=(
        "http://localhost:3000/airport/OTP"
        "http://localhost:3000/airport/OTP/arrivals"
        "http://localhost:3000/airport/CLJ/departures"
    )
    
    for page in "${flight_pages[@]}"; do
        if curl -s -o /dev/null -w "%{http_code}" "$page" | grep -q "200"; then
            echo "  ✅ $(basename $page) page accessible"
        else
            echo "  ❌ $(basename $page) page not accessible"
        fi
    done
else
    echo "❌ Website not accessible at http://localhost:3000"
fi

echo ""
echo "5. Summary and Recommendations..."
echo "================================"

echo ""
echo "🔍 Troubleshooting Tips:"
echo "------------------------"
echo "• If API returns 404: Check API.Market dashboard for key validity"
echo "• If API returns 401: API key is expired or invalid"
echo "• If API returns 429: Rate limit exceeded, wait or upgrade plan"
echo "• If local endpoints fail: Check docker-compose logs app"
echo "• If no flight data: Some airports may have limited data"
echo ""
echo "📊 Monitoring Commands:"
echo "----------------------"
echo "• Check logs: docker-compose logs app -f"
echo "• Check status: docker-compose ps"
echo "• Restart app: docker-compose restart app"
echo "• View cache stats: Check browser console on flight pages"
echo ""
echo "🌐 Test URLs:"
echo "-------------"
echo "• Main site: https://anyway.ro"
echo "• OTP Arrivals: https://anyway.ro/airport/OTP/arrivals"
echo "• CLJ Departures: https://anyway.ro/airport/CLJ/departures"
echo "• Admin Panel: https://anyway.ro/admin (password: admin123)"