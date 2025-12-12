#!/bin/bash

# Debug API Script - Comprehensive troubleshooting for anyway.ro flight schedule
# Identifies and fixes API key, Docker, and deployment issues

echo "🔍 Flight Schedule API Debug Tool"
echo "================================="
echo "Server: 23.88.113.154 (anyway.ro)"
echo "Project: /opt/anyway-flight-schedule"
echo "Date: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️ $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️ $message${NC}" ;;
    esac
}

# Check if we're on the correct server
echo "1. ENVIRONMENT CHECK"
echo "==================="

if [ ! -d "/opt/anyway-flight-schedule" ]; then
    print_status "ERROR" "Not on production server. Expected path: /opt/anyway-flight-schedule"
    echo ""
    echo "To connect to server:"
    echo "ssh root@23.88.113.154"
    echo "Password: FlightSchedule2024!"
    exit 1
fi

cd /opt/anyway-flight-schedule
print_status "OK" "Running on production server"
print_status "INFO" "Current directory: $(pwd)"

# Check current API key configuration
echo ""
echo "2. API KEY CONFIGURATION"
echo "======================="

if [ -f ".env.local" ]; then
    print_status "OK" ".env.local file exists"
    echo "Current API configuration:"
    grep "FLIGHT_API" .env.local || print_status "WARNING" "No FLIGHT_API variables found"
else
    print_status "WARNING" ".env.local file not found"
fi

# Test current API key
echo ""
echo "3. API KEY VALIDATION"
echo "===================="

API_KEY="cmj2m39qs0001k00404cmwu75"
BASE_URL="https://api.market/aerodatabox/v1"
TEST_ENDPOINT="$BASE_URL/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"

print_status "INFO" "Testing API key: $API_KEY"
print_status "INFO" "Endpoint: $TEST_ENDPOINT"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "$TEST_ENDPOINT")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $http_code"

case $http_code in
    200)
        print_status "OK" "API key is working!"
        flight_count=$(echo "$response_body" | grep -o '"number"' | wc -l)
        print_status "INFO" "Found $flight_count flights for OTP"
        API_WORKING=true
        ;;
    401)
        print_status "ERROR" "API key is invalid or expired (HTTP 401)"
        print_status "INFO" "Check API.Market dashboard: https://api.market/dashboard"
        API_WORKING=false
        ;;
    404)
        print_status "ERROR" "API key not found or endpoint invalid (HTTP 404)"
        print_status "INFO" "Key might be expired or deleted from API.Market"
        API_WORKING=false
        ;;
    429)
        print_status "WARNING" "Rate limit exceeded (HTTP 429)"
        API_WORKING=false
        ;;
    *)
        print_status "ERROR" "Unexpected response: HTTP $http_code"
        echo "Response: $response_body"
        API_WORKING=false
        ;;
esac

# Check Docker containers
echo ""
echo "4. DOCKER CONTAINER STATUS"
echo "========================="

if command -v docker-compose &> /dev/null; then
    print_status "OK" "Docker Compose is available"
    
    echo "Container status:"
    docker-compose ps
    
    # Check if flight-schedule-app is running
    if docker-compose ps | grep -q "flight-schedule-app.*Up"; then
        print_status "OK" "Flight schedule app container is running"
        APP_RUNNING=true
    else
        print_status "ERROR" "Flight schedule app container is not running"
        APP_RUNNING=false
    fi
    
    # Check if nginx is running
    if docker-compose ps | grep -q "flight-schedule-nginx.*Up"; then
        print_status "OK" "Nginx container is running"
        NGINX_RUNNING=true
    else
        print_status "ERROR" "Nginx container is not running"
        NGINX_RUNNING=false
    fi
else
    print_status "ERROR" "Docker Compose not found"
    APP_RUNNING=false
    NGINX_RUNNING=false
fi

# Check application logs
echo ""
echo "5. APPLICATION LOGS"
echo "=================="

if [ "$APP_RUNNING" = true ]; then
    print_status "INFO" "Recent application logs:"
    docker-compose logs app --tail=15
else
    print_status "WARNING" "Cannot check logs - app container not running"
fi

# Test local endpoints
echo ""
echo "6. LOCAL ENDPOINT TESTING"
echo "========================"

endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/api/flights/CLJ/departures"
)

for endpoint in "${endpoints[@]}"; do
    print_status "INFO" "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 10)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    case $http_code in
        200)
            print_status "OK" "Endpoint accessible (HTTP 200)"
            if echo "$response" | grep -q '"success":true'; then
                print_status "OK" "API response successful"
            elif echo "$response" | grep -q '"success":false'; then
                print_status "WARNING" "API response failed (check API key)"
            fi
            ;;
        404)
            print_status "ERROR" "Endpoint not found (HTTP 404)"
            ;;
        500)
            print_status "ERROR" "Internal server error (HTTP 500)"
            ;;
        *)
            print_status "ERROR" "Endpoint failed: HTTP $http_code"
            ;;
    esac
done

# Check external website access
echo ""
echo "7. EXTERNAL WEBSITE ACCESS"
echo "========================="

external_urls=(
    "https://anyway.ro"
    "https://anyway.ro/airport/OTP"
    "https://anyway.ro/airport/OTP/arrivals"
)

for url in "${external_urls[@]}"; do
    print_status "INFO" "Testing: $url"
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    case $http_code in
        200)
            print_status "OK" "Website accessible (HTTP 200)"
            ;;
        404)
            print_status "ERROR" "Page not found (HTTP 404)"
            ;;
        502|503)
            print_status "ERROR" "Server error (HTTP $http_code) - Check nginx/app"
            ;;
        *)
            print_status "WARNING" "Unexpected response: HTTP $http_code"
            ;;
    esac
done

# Check nginx configuration
echo ""
echo "8. NGINX CONFIGURATION"
echo "====================="

if [ -f "nginx.conf" ]; then
    print_status "OK" "nginx.conf exists"
    
    # Check if anyway.ro is configured
    if grep -q "anyway.ro" nginx.conf; then
        print_status "OK" "anyway.ro domain configured in nginx"
    else
        print_status "WARNING" "anyway.ro domain not found in nginx config"
    fi
    
    # Check port configuration
    if grep -q "proxy_pass.*3000" nginx.conf; then
        print_status "OK" "Nginx configured to proxy to port 3000"
    else
        print_status "WARNING" "Port 3000 proxy not found in nginx config"
    fi
else
    print_status "ERROR" "nginx.conf not found"
fi

# Summary and recommendations
echo ""
echo "9. DIAGNOSIS SUMMARY"
echo "==================="

echo ""
print_status "INFO" "ISSUES IDENTIFIED:"

if [ "$API_WORKING" != true ]; then
    print_status "ERROR" "API Key Issue: Key cmj2m39qs0001k00404cmwu75 is not working"
    echo "  → Check API.Market dashboard: https://api.market/dashboard"
    echo "  → Verify subscription is active and key is valid"
    echo "  → Generate new API key if needed"
fi

if [ "$APP_RUNNING" != true ]; then
    print_status "ERROR" "Docker Issue: Flight schedule app container not running"
    echo "  → Run: docker-compose up -d"
    echo "  → Check logs: docker-compose logs app"
fi

if [ "$NGINX_RUNNING" != true ]; then
    print_status "ERROR" "Nginx Issue: Nginx container not running"
    echo "  → Run: docker-compose up -d"
    echo "  → Check nginx logs: docker-compose logs nginx"
fi

echo ""
print_status "INFO" "RECOMMENDED ACTIONS:"

echo "1. Fix API Key (if needed):"
echo "   - Visit https://api.market/dashboard"
echo "   - Check subscription status"
echo "   - Generate new API key if current one is invalid"
echo "   - Update .env.local with new key"
echo ""

echo "2. Fix Docker Containers:"
echo "   docker-compose down"
echo "   docker-compose build --no-cache"
echo "   docker-compose up -d"
echo ""

echo "3. Monitor and Test:"
echo "   docker-compose logs app -f"
echo "   curl http://localhost:3000/api/flights/OTP/arrivals"
echo "   curl https://anyway.ro/airport/OTP/arrivals"
echo ""

echo "4. If Victoria Ocara site is loading instead:"
echo "   - Check nginx.conf for correct domain routing"
echo "   - Verify anyway.ro points to flight schedule app"
echo "   - Restart nginx: docker-compose restart nginx"
echo ""

print_status "INFO" "Debug completed at $(date)"