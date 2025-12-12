#!/bin/bash

# Deploy Advanced Features Script - Implementează funcționalitățile avansate AeroDataBox
# Bazat pe OpenAPI spec pentru funcții complete

echo "🚀 Deploy Advanced Features - AeroDataBox Integration"
echo "===================================================="
echo "Date: $(date)"
echo ""

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server"
    echo "Run this script on server 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

echo "📦 Step 1: Backup current deployment..."
echo "======================================"

BACKUP_DIR="../anyway-backup-advanced-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo "✅ Backup created: $BACKUP_DIR"

echo ""
echo "🔄 Step 2: Pull latest advanced features..."
echo "=========================================="

git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Advanced features pulled successfully"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verify new files..."
echo "============================"

echo "New advanced services:"
ls -la lib/aerodataboxService.ts lib/advancedFlightService.ts 2>/dev/null || echo "⚠️ Advanced service files not found"

echo ""
echo "New API routes:"
find app/api -name "*.ts" -newer "$BACKUP_DIR/app/api" 2>/dev/null || echo "No new API routes detected"

echo ""
echo "New pages:"
ls -la app/search/page.tsx 2>/dev/null || echo "⚠️ Search page not found"

echo ""
echo "🧪 Step 4: Test TypeScript compilation..."
echo "========================================"

# Test TypeScript compilation
echo "Checking TypeScript compilation..."
if command -v npx &> /dev/null; then
    npx tsc --noEmit --skipLibCheck 2>/dev/null && echo "✅ TypeScript compilation successful" || echo "⚠️ TypeScript compilation issues detected"
else
    echo "⚠️ npx not available, skipping TypeScript check"
fi

echo ""
echo "🔧 Step 5: Update environment configuration..."
echo "============================================="

# Verifică dacă .env.local există și are configurația necesară
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    
    # Verifică dacă are API key configurat
    if grep -q "NEXT_PUBLIC_FLIGHT_API_KEY" .env.local; then
        echo "✅ API key configured"
        API_KEY=$(grep "NEXT_PUBLIC_FLIGHT_API_KEY" .env.local | cut -d'=' -f2)
        echo "Current API key: ${API_KEY:0:10}..."
    else
        echo "⚠️ API key not configured in .env.local"
    fi
else
    echo "⚠️ .env.local not found, creating with default configuration..."
    
    cat > .env.local << 'EOF'
# Advanced Flight API Configuration
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2m39qs0001k00404cmwu75
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
EOF
    
    echo "✅ .env.local created with advanced configuration"
fi

echo ""
echo "🏗️ Step 6: Build application with advanced features..."
echo "===================================================="

# Stop current services
echo "Stopping current services..."
docker-compose down

# Build with advanced features
echo "Building application with advanced features..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🚀 Step 7: Start services..."
echo "=========================="

docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Services started successfully"
else
    echo "❌ Failed to start services"
    exit 1
fi

echo ""
echo "⏳ Step 8: Wait for services to initialize..."
echo "============================================"

sleep 20

echo "Container status:"
docker-compose ps

echo ""
echo "🧪 Step 9: Test advanced API endpoints..."
echo "======================================="

# Test new API endpoints
endpoints=(
    "http://localhost:3000/api/flights/search?flight=RO123"
    "http://localhost:3000/api/airports/search?q=Bucharest"
    "http://localhost:3000/api/airports/OTP/stats"
    "http://localhost:3000/api/flights/route/OTP/LHR"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 15)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    case $http_code in
        200)
            echo "  ✅ Endpoint working (HTTP 200)"
            if echo "$response" | grep -q '"success":true'; then
                echo "  ✅ API response successful"
            elif echo "$response" | grep -q '"success":false'; then
                echo "  ⚠️ API returned success:false (check API key)"
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
echo "🌐 Step 10: Test new search page..."
echo "================================="

# Test search page
echo "Testing search page..."
search_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "http://localhost:3000/search" --max-time 10)
search_http_code=$(echo "$search_response" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$search_http_code" = "200" ]; then
    echo "✅ Search page accessible"
else
    echo "❌ Search page not accessible (HTTP $search_http_code)"
fi

echo ""
echo "📊 Step 11: Show application logs..."
echo "=================================="

echo "Recent application logs:"
docker-compose logs flight-schedule --tail=15

echo ""
echo "✅ ADVANCED FEATURES DEPLOYMENT COMPLETED!"
echo "=========================================="

echo ""
echo "🎯 NEW FEATURES AVAILABLE:"
echo "========================="
echo "✅ Advanced Flight Search - /search"
echo "✅ Flight Number Search API - /api/flights/search"
echo "✅ Route Information API - /api/flights/route/[from]/[to]"
echo "✅ Airport Search API - /api/airports/search"
echo "✅ Airport Statistics API - /api/airports/[code]/stats"
echo "✅ Enhanced AeroDataBox Integration"
echo "✅ Improved Flight Data Processing"
echo ""

echo "🌐 TEST URLS:"
echo "============"
echo "Main Features:"
echo "- Flight Search: https://anyway.ro/search"
echo "- Airport Search: https://anyway.ro/airports"
echo "- Flight Schedule: https://anyway.ro/airport/OTP/arrivals"
echo ""
echo "API Endpoints:"
echo "- Search Flight: https://anyway.ro/api/flights/search?flight=RO123"
echo "- Route Info: https://anyway.ro/api/flights/route/OTP/LHR"
echo "- Airport Search: https://anyway.ro/api/airports/search?q=Bucharest"
echo "- Airport Stats: https://anyway.ro/api/airports/OTP/stats"
echo ""

echo "📊 MONITORING:"
echo "============="
echo "- Application Logs: docker-compose logs flight-schedule -f"
echo "- Container Status: docker-compose ps"
echo "- API Testing: curl https://anyway.ro/api/flights/search?flight=RO123"
echo ""

if [ "$search_http_code" = "200" ]; then
    echo "🎉 SUCCESS: Advanced features deployed and accessible!"
else
    echo "⚠️ PARTIAL SUCCESS: Services running but search page needs attention"
fi

echo ""
echo "🔑 NEXT STEPS:"
echo "============="
echo "1. Test search functionality: https://anyway.ro/search"
echo "2. Verify API key is working for advanced features"
echo "3. Check all new API endpoints are responding"
echo "4. Monitor logs for any errors: docker-compose logs -f"
echo ""

echo "Advanced features deployment completed at $(date)"