#!/bin/bash

# Final Deployment Script - Complete fix for anyway.ro flight schedule
# Addresses API key, Docker, and deployment issues

set -e

echo "🚀 FINAL DEPLOYMENT - anyway.ro Flight Schedule"
echo "=============================================="
echo "Server: 23.88.113.154"
echo "Domain: anyway.ro"
echo "Date: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Verify we're on the correct server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    print_status "ERROR" "Not on production server. Run this on 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule
print_status "OK" "Running on production server"

# Step 1: Backup current deployment
echo ""
echo "📦 STEP 1: BACKUP CURRENT DEPLOYMENT"
echo "===================================="

BACKUP_DIR="../anyway-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
print_status "OK" "Backup created: $BACKUP_DIR"

# Step 2: Stop all services
echo ""
echo "🛑 STEP 2: STOP CURRENT SERVICES"
echo "================================"

docker-compose down --remove-orphans
print_status "OK" "All containers stopped"

# Step 3: Pull latest code
echo ""
echo "🔄 STEP 3: UPDATE CODE"
echo "====================="

git pull origin main
if [ $? -eq 0 ]; then
    print_status "OK" "Code updated from Git"
else
    print_status "WARNING" "Git pull failed, continuing with current code"
fi

# Step 4: Configure environment
echo ""
echo "🔧 STEP 4: CONFIGURE ENVIRONMENT"
echo "==============================="

# Create comprehensive .env.local
cat > .env.local << 'EOF'
# Flight API Configuration - API.Market AeroDataBox
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2m39qs0001k00404cmwu75
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox

# Cache and Performance
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3

# Priority Airports (Romanian + Moldova)
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY

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

print_status "OK" "Environment configuration created"

# Step 5: Test API key before deployment
echo ""
echo "🧪 STEP 5: VALIDATE API KEY"
echo "==========================="

API_KEY="cmj2m39qs0001k00404cmwu75"
TEST_URL="https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"

print_status "INFO" "Testing API key: $API_KEY"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "x-magicapi-key: $API_KEY" \
  -H "Content-Type: application/json" \
  "$TEST_URL")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

case $http_code in
    200)
        print_status "OK" "API key is working! (HTTP 200)"
        flight_count=$(echo "$response" | sed '/HTTP_CODE:/d' | grep -o '"number"' | wc -l)
        print_status "INFO" "Found $flight_count flights for OTP"
        API_VALID=true
        ;;
    401)
        print_status "ERROR" "API key is invalid (HTTP 401)"
        API_VALID=false
        ;;
    404)
        print_status "ERROR" "API key not found (HTTP 404)"
        print_status "WARNING" "Continuing deployment - check API.Market dashboard"
        API_VALID=false
        ;;
    *)
        print_status "WARNING" "Unexpected API response: HTTP $http_code"
        API_VALID=false
        ;;
esac

# Step 6: Build application
echo ""
echo "🏗️ STEP 6: BUILD APPLICATION"
echo "============================"

print_status "INFO" "Building Docker images..."
docker-compose build --no-cache --parallel

if [ $? -eq 0 ]; then
    print_status "OK" "Build completed successfully"
else
    print_status "ERROR" "Build failed"
    exit 1
fi

# Step 7: Start services
echo ""
echo "🚀 STEP 7: START SERVICES"
echo "========================"

docker-compose up -d

if [ $? -eq 0 ]; then
    print_status "OK" "Services started"
else
    print_status "ERROR" "Failed to start services"
    exit 1
fi

# Step 8: Wait for services to initialize
echo ""
echo "⏳ STEP 8: INITIALIZE SERVICES"
echo "============================="

print_status "INFO" "Waiting for services to initialize..."
sleep 20

# Check container status
echo "Container status:"
docker-compose ps

# Step 9: Verify deployment
echo ""
echo "🔍 STEP 9: VERIFY DEPLOYMENT"
echo "============================"

# Test local endpoints
endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/api/flights/CLJ/departures"
    "http://localhost:3000/airport/OTP"
)

for endpoint in "${endpoints[@]}"; do
    print_status "INFO" "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 15)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    case $http_code in
        200)
            print_status "OK" "Endpoint working (HTTP 200)"
            if [[ "$endpoint" == *"/api/flights/"* ]]; then
                if echo "$response" | grep -q '"success":true'; then
                    print_status "OK" "Flight data loaded successfully"
                elif echo "$response" | grep -q '"success":false'; then
                    print_status "WARNING" "API returned success:false"
                fi
            fi
            ;;
        404)
            print_status "ERROR" "Endpoint not found (HTTP 404)"
            ;;
        500)
            print_status "ERROR" "Internal server error (HTTP 500)"
            ;;
        *)
            print_status "WARNING" "Unexpected response: HTTP $http_code"
            ;;
    esac
done

# Step 10: Test external access
echo ""
echo "🌐 STEP 10: TEST EXTERNAL ACCESS"
echo "==============================="

external_urls=(
    "https://anyway.ro"
    "https://anyway.ro/airport/OTP"
    "https://anyway.ro/airport/OTP/arrivals"
)

for url in "${external_urls[@]}"; do
    print_status "INFO" "Testing: $url"
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 15)
    
    case $http_code in
        200)
            print_status "OK" "Website accessible (HTTP 200)"
            ;;
        404)
            print_status "ERROR" "Page not found (HTTP 404)"
            ;;
        502|503)
            print_status "ERROR" "Server error (HTTP $http_code)"
            ;;
        *)
            print_status "WARNING" "Unexpected response: HTTP $http_code"
            ;;
    esac
done

# Step 11: Show application logs
echo ""
echo "📊 STEP 11: APPLICATION LOGS"
echo "============================"

print_status "INFO" "Recent application logs:"
docker-compose logs app --tail=20

# Final summary
echo ""
echo "✅ DEPLOYMENT SUMMARY"
echo "===================="

if [ "$API_VALID" = true ]; then
    print_status "OK" "API Key: Working correctly"
else
    print_status "WARNING" "API Key: Needs verification in API.Market dashboard"
fi

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    print_status "OK" "Docker Containers: Running"
else
    print_status "ERROR" "Docker Containers: Issues detected"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "============="

if [ "$API_VALID" != true ]; then
    echo "1. 🔑 Fix API Key:"
    echo "   - Visit: https://api.market/dashboard"
    echo "   - Check subscription status"
    echo "   - Generate new API key if needed"
    echo "   - Update .env.local and restart: docker-compose restart"
    echo ""
fi

echo "2. 🧪 Test Flight Data:"
echo "   - Visit: https://anyway.ro/airport/OTP/arrivals"
echo "   - Check browser console for errors"
echo "   - Verify flight data loads correctly"
echo ""

echo "3. 📊 Monitor System:"
echo "   - Logs: docker-compose logs app -f"
echo "   - Status: docker-compose ps"
echo "   - Restart if needed: docker-compose restart"
echo ""

echo "4. 🔧 Admin Panel:"
echo "   - URL: https://anyway.ro/admin"
echo "   - Password: admin123"
echo "   - Configure ads and banners"
echo ""

echo "🌐 LIVE URLS:"
echo "============"
echo "- Main Site: https://anyway.ro"
echo "- OTP Arrivals: https://anyway.ro/airport/OTP/arrivals"
echo "- CLJ Departures: https://anyway.ro/airport/CLJ/departures"
echo "- TSR Flights: https://anyway.ro/airport/TSR"
echo "- Admin Panel: https://anyway.ro/admin"
echo ""

if [ "$API_VALID" = true ]; then
    print_status "OK" "🎉 DEPLOYMENT SUCCESSFUL! Flight schedule is live on anyway.ro"
else
    print_status "WARNING" "⚠️ DEPLOYMENT COMPLETED - Verify API key to enable flight data"
fi

echo ""
print_status "INFO" "Deployment completed at $(date)"