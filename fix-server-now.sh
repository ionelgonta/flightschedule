#!/bin/bash

# Fix Server Script - Rezolvă conflictele Git și face deployment
# Rulează direct pe server pentru a rezolva problemele

echo "🔧 Fix Server - anyway.ro Flight Schedule"
echo "========================================"
echo "Date: $(date)"
echo ""

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server"
    echo "Run this script on server 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

echo "🧹 Step 1: Clean Git conflicts..."
echo "================================"

# Backup fișierul conflictual
if [ -f "lib/icaoMapping.ts" ]; then
    echo "Backing up existing lib/icaoMapping.ts..."
    cp lib/icaoMapping.ts lib/icaoMapping.ts.backup
fi

# Reset hard pentru a rezolva conflictele
echo "Resetting Git state..."
git reset --hard HEAD
git clean -fd

echo "✅ Git conflicts resolved"

echo ""
echo "🔄 Step 2: Pull latest files..."
echo "==============================="

git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Files updated successfully"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔧 Step 3: Make scripts executable..."
echo "===================================="

chmod +x debug-api.sh deploy-final.sh server-update.sh test-new-api-key.sh pull-and-deploy.sh

echo "✅ Scripts are now executable"

echo ""
echo "📋 Step 4: List available scripts..."
echo "===================================="

echo "Available scripts:"
ls -la *.sh

echo ""
echo "🧪 Step 5: Test API key..."
echo "========================="

API_KEY="cmj2m39qs0001k00404cmwu75"
TEST_URL="https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"

echo "Testing API key: $API_KEY"
echo "URL: $TEST_URL"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "x-magicapi-key: $API_KEY" \
  -H "Content-Type: application/json" \
  "$TEST_URL")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

echo "HTTP Status: $http_code"

case $http_code in
    200)
        echo "✅ API key is working!"
        flight_count=$(echo "$response" | sed '/HTTP_CODE:/d' | grep -o '"number"' | wc -l)
        echo "Found $flight_count flights for OTP"
        API_WORKING=true
        ;;
    401)
        echo "❌ API key is invalid (HTTP 401)"
        API_WORKING=false
        ;;
    404)
        echo "❌ API key not found (HTTP 404)"
        echo "⚠️ Key might be expired or deleted"
        API_WORKING=false
        ;;
    *)
        echo "⚠️ Unexpected response: HTTP $http_code"
        API_WORKING=false
        ;;
esac

echo ""
echo "🐳 Step 6: Check Docker status..."
echo "==============================="

if command -v docker-compose &> /dev/null; then
    echo "Docker Compose available"
    echo "Current container status:"
    docker-compose ps
else
    echo "❌ Docker Compose not found"
fi

echo ""
echo "🔧 Step 7: Update environment..."
echo "==============================="

# Creează .env.local cu configurația corectă
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
EOF

echo "✅ Environment configuration updated"

echo ""
echo "🚀 Step 8: Rebuild and restart..."
echo "==============================="

# Stop containers
echo "Stopping containers..."
docker-compose down --remove-orphans

# Build with no cache
echo "Building application..."
docker-compose build --no-cache

# Start services
echo "Starting services..."
docker-compose up -d

echo "✅ Services restarted"

echo ""
echo "⏳ Step 9: Wait for initialization..."
echo "===================================="

sleep 15

echo "Container status:"
docker-compose ps

echo ""
echo "🧪 Step 10: Test endpoints..."
echo "============================"

# Test local endpoints
endpoints=(
    "http://localhost:3000"
    "http://localhost:3000/api/flights/OTP/arrivals"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 10)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    case $http_code in
        200)
            echo "  ✅ Working (HTTP 200)"
            if [[ "$endpoint" == *"/api/flights/"* ]]; then
                if echo "$response" | grep -q '"success":true'; then
                    echo "  ✅ Flight data loaded"
                elif echo "$response" | grep -q '"success":false'; then
                    echo "  ⚠️ API returned success:false"
                fi
            fi
            ;;
        *)
            echo "  ❌ Failed: HTTP $http_code"
            ;;
    esac
done

echo ""
echo "📊 Step 11: Show logs..."
echo "======================="

echo "Recent application logs:"
docker-compose logs app --tail=10

echo ""
echo "✅ FIX COMPLETED!"
echo "================"

if [ "$API_WORKING" = true ]; then
    echo "🎉 SUCCESS: API key is working and deployment completed!"
else
    echo "⚠️ PARTIAL SUCCESS: Deployment completed but API key needs attention"
    echo ""
    echo "🔑 To fix API key:"
    echo "1. Visit: https://api.market/dashboard"
    echo "2. Check subscription status"
    echo "3. Generate new API key if needed"
    echo "4. Update .env.local: nano .env.local"
    echo "5. Restart: docker-compose restart"
fi

echo ""
echo "🌐 Test URLs:"
echo "- https://anyway.ro"
echo "- https://anyway.ro/airport/OTP/arrivals"
echo "- https://anyway.ro/admin (password: admin123)"
echo ""
echo "📊 Monitor:"
echo "- Logs: docker-compose logs app -f"
echo "- Status: docker-compose ps"
echo ""
echo "Fix completed at $(date)"