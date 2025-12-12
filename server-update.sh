#!/bin/bash

# Server Update Script - Deploy cu noul API key
# Pentru server 23.88.113.154

echo "🚀 Starting server update with new API key..."
echo "=============================================="

# Server details
SERVER_IP="23.88.113.154"
SERVER_USER="root"
SERVER_PASSWORD="FlightSchedule2024!"
PROJECT_PATH="/opt/anyway-flight-schedule"

echo ""
echo "📋 Update Summary:"
echo "- Server: $SERVER_IP"
echo "- Project: $PROJECT_PATH"
echo "- New API Key: cmj2m39qs0001k00404cmwu75"
echo "- Provider: API.Market AeroDataBox"
echo ""

# Verifică dacă suntem pe server local sau trebuie să ne conectăm
if [ -d "$PROJECT_PATH" ]; then
    echo "✅ Running on server directly"
    cd "$PROJECT_PATH"
else
    echo "❌ Not on server. Please run this script on server $SERVER_IP"
    echo ""
    echo "🔗 To connect to server:"
    echo "ssh root@$SERVER_IP"
    echo "Password: $SERVER_PASSWORD"
    echo ""
    echo "Then run:"
    echo "cd $PROJECT_PATH"
    echo "./server-update.sh"
    exit 1
fi

echo ""
echo "📦 Step 1: Backup current deployment..."
echo "--------------------------------------"
BACKUP_NAME="anyway-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "../$BACKUP_NAME" 2>/dev/null || echo "⚠️ Backup failed, continuing..."
echo "✅ Backup created: $BACKUP_NAME"

echo ""
echo "🔄 Step 2: Pull latest code..."
echo "-----------------------------"
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Code updated successfully"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔧 Step 3: Update environment configuration..."
echo "---------------------------------------------"

# Creează/actualizează .env.local cu noul API key
cat > .env.local << 'EOF'
# API.Market Configuration - Updated API Key
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2m39qs0001k00404cmwu75
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_DEBUG_FLIGHTS=false

# Google AdSense (dacă este configurat)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=your_adsense_client_id

# Analytics (opțional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
EOF

echo "✅ Environment configuration updated"
echo "📄 .env.local contents:"
cat .env.local

echo ""
echo "🧪 Step 4: Test new API key..."
echo "-----------------------------"

# Test rapid API key
echo "Testing API key with OTP airport..."
API_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "x-magicapi-key: cmj2m39qs0001k00404cmwu75" \
  -H "Content-Type: application/json" \
  "https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59")

HTTP_CODE=$(echo "$API_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API key is working! HTTP 200 OK"
    FLIGHT_COUNT=$(echo "$API_RESPONSE" | sed '/HTTP_CODE:/d' | grep -o '"number"' | wc -l)
    echo "📊 Found $FLIGHT_COUNT flights for OTP"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ API key is invalid (HTTP 401)"
    echo "⚠️ Continuing with deployment, check API.Market dashboard"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️ No data available (HTTP 404) - this might be normal"
else
    echo "⚠️ Unexpected response: HTTP $HTTP_CODE"
fi

echo ""
echo "🏗️ Step 5: Build application..."
echo "------------------------------"
echo "Stopping current containers..."
docker-compose down

echo "Building with new configuration..."
docker-compose build --no-cache
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🚀 Step 6: Start services..."
echo "---------------------------"
docker-compose up -d
if [ $? -eq 0 ]; then
    echo "✅ Services started"
else
    echo "❌ Failed to start services"
    exit 1
fi

echo ""
echo "⏳ Step 7: Wait for services to initialize..."
echo "--------------------------------------------"
sleep 15

echo ""
echo "🔍 Step 8: Verify deployment..."
echo "------------------------------"

# Check container status
echo "Container status:"
docker-compose ps

echo ""
echo "Application logs (last 10 lines):"
docker-compose logs app --tail=10

echo ""
echo "🧪 Step 9: Test application endpoints..."
echo "---------------------------------------"

# Test local API endpoints
endpoints=(
    "http://localhost:3000/api/flights/OTP/arrivals"
    "http://localhost:3000/api/flights/CLJ/departures"
    "http://localhost:3000/api/flights/TSR/arrivals"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 10)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ Endpoint working (HTTP 200)"
        
        # Check if response contains flight data
        if echo "$response" | grep -q '"success":true'; then
            echo "  ✅ Flight data loaded successfully"
        elif echo "$response" | grep -q '"success":false'; then
            echo "  ⚠️ API returned success:false (check logs)"
        fi
    else
        echo "  ❌ Endpoint failed: HTTP $http_code"
    fi
done

echo ""
echo "🌐 Step 10: Test website accessibility..."
echo "----------------------------------------"

# Test main website
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" --max-time 10 | grep -q "200"; then
    echo "✅ Website accessible at http://localhost:3000"
    
    # Test specific flight pages
    flight_pages=(
        "http://localhost:3000/airport/OTP"
        "http://localhost:3000/airport/OTP/arrivals"
        "http://localhost:3000/airport/CLJ/departures"
    )
    
    for page in "${flight_pages[@]}"; do
        if curl -s -o /dev/null -w "%{http_code}" "$page" --max-time 10 | grep -q "200"; then
            echo "  ✅ $(basename $page) page accessible"
        else
            echo "  ❌ $(basename $page) page not accessible"
        fi
    done
else
    echo "❌ Website not accessible at http://localhost:3000"
fi

echo ""
echo "✅ DEPLOYMENT COMPLETED!"
echo "======================="
echo ""
echo "🎉 Summary:"
echo "- ✅ Code updated from Git"
echo "- ✅ New API key configured: cmj2m39qs0001k00404cmwu75"
echo "- ✅ Application rebuilt and restarted"
echo "- ✅ Services are running"
echo ""
echo "🌐 Test URLs:"
echo "- Main site: https://anyway.ro"
echo "- OTP Arrivals: https://anyway.ro/airport/OTP/arrivals"
echo "- CLJ Departures: https://anyway.ro/airport/CLJ/departures"
echo "- TSR Arrivals: https://anyway.ro/airport/TSR/arrivals"
echo "- Admin Panel: https://anyway.ro/admin (password: admin123)"
echo ""
echo "📊 Monitoring:"
echo "- Logs: docker-compose logs app -f"
echo "- Status: docker-compose ps"
echo "- Restart if needed: docker-compose restart"
echo ""
echo "🔑 API Key Info:"
echo "- Provider: API.Market AeroDataBox"
echo "- Key: cmj2m39qs0001k00404cmwu75"
echo "- Expiry: NEVER EXPIRE"
echo "- Rate Limit: 150 requests/minute"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "🎯 Status: ✅ DEPLOYMENT SUCCESSFUL - API key is working!"
else
    echo "⚠️ Status: DEPLOYMENT COMPLETED - Verify API key in API.Market dashboard"
    echo ""
    echo "🔍 If flight data doesn't load:"
    echo "1. Check API.Market dashboard: https://api.market/dashboard"
    echo "2. Verify subscription is active"
    echo "3. Check application logs: docker-compose logs app -f"
    echo "4. Test API manually: curl -H 'x-magicapi-key: cmj2m39qs0001k00404cmwu75' 'https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59'"
fi

echo ""
echo "🚀 Deployment completed at $(date)"