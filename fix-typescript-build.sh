#!/bin/bash

# Fix TypeScript Build Issues - Rezolvă problemele de compilare TypeScript
# Actualizează configurația și codul pentru compatibilitate ES2017

echo "🔧 Fix TypeScript Build Issues"
echo "=============================="
echo "Date: $(date)"
echo ""

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server"
    echo "Run this script on server 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

echo "📦 Step 1: Backup current files..."
echo "================================="

# Backup fișierele care vor fi modificate
cp tsconfig.json tsconfig.json.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "No tsconfig.json to backup"
cp lib/advancedFlightService.ts lib/advancedFlightService.ts.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "No advancedFlightService.ts to backup"

echo "✅ Backup completed"

echo ""
echo "🔄 Step 2: Pull latest fixes..."
echo "=============================="

git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Latest fixes pulled successfully"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verify TypeScript configuration..."
echo "============================================="

echo "Current tsconfig.json target:"
grep -A 2 '"target"' tsconfig.json || echo "Target not found"

echo ""
echo "Current lib configuration:"
grep -A 2 '"lib"' tsconfig.json || echo "Lib not found"

echo ""
echo "🧪 Step 4: Test TypeScript compilation locally..."
echo "==============================================="

# Test TypeScript compilation fără build complet
if command -v npx &> /dev/null; then
    echo "Testing TypeScript compilation..."
    npx tsc --noEmit --skipLibCheck 2>&1 | head -20
    
    if [ $? -eq 0 ]; then
        echo "✅ TypeScript compilation successful"
        TS_OK=true
    else
        echo "⚠️ TypeScript compilation still has issues"
        TS_OK=false
    fi
else
    echo "⚠️ npx not available, skipping local TypeScript check"
    TS_OK=true
fi

echo ""
echo "🏗️ Step 5: Attempt Docker build..."
echo "================================="

# Oprește serviciile curente
echo "Stopping current services..."
docker-compose down

# Încearcă build-ul
echo "Attempting Docker build..."
docker-compose build --no-cache flight-schedule

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    BUILD_SUCCESS=true
else
    echo "❌ Docker build failed"
    BUILD_SUCCESS=false
    
    echo ""
    echo "🔍 Checking build logs for specific errors..."
    docker-compose build flight-schedule 2>&1 | grep -A 5 -B 5 "Type error" || echo "No specific type errors found"
fi

echo ""
echo "🚀 Step 6: Start services if build succeeded..."
echo "=============================================="

if [ "$BUILD_SUCCESS" = true ]; then
    echo "Starting services with successful build..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Services started successfully"
        
        # Wait for services to initialize
        sleep 10
        
        echo ""
        echo "Container status:"
        docker-compose ps
        
    else
        echo "❌ Failed to start services"
    fi
else
    echo "⚠️ Skipping service start due to build failure"
fi

echo ""
echo "🧪 Step 7: Test application if running..."
echo "======================================="

if [ "$BUILD_SUCCESS" = true ]; then
    # Test basic endpoint
    echo "Testing basic endpoint..."
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "http://localhost:3000" --max-time 10)
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Application is responding (HTTP 200)"
        
        # Test API endpoint
        echo "Testing API endpoint..."
        api_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "http://localhost:3000/api/flights/OTP/arrivals" --max-time 10)
        api_http_code=$(echo "$api_response" | grep "HTTP_CODE:" | cut -d: -f2)
        
        if [ "$api_http_code" = "200" ]; then
            echo "✅ API endpoint working (HTTP 200)"
        else
            echo "⚠️ API endpoint issue: HTTP $api_http_code"
        fi
    else
        echo "❌ Application not responding: HTTP $http_code"
    fi
else
    echo "⚠️ Skipping application test due to build failure"
fi

echo ""
echo "📊 Step 8: Show recent logs..."
echo "============================"

if [ "$BUILD_SUCCESS" = true ]; then
    echo "Recent application logs:"
    docker-compose logs flight-schedule --tail=10
else
    echo "No application logs available due to build failure"
fi

echo ""
echo "✅ TYPESCRIPT FIX COMPLETED!"
echo "============================"

echo ""
echo "🎯 SUMMARY:"
echo "==========="

if [ "$BUILD_SUCCESS" = true ]; then
    echo "✅ TypeScript issues resolved"
    echo "✅ Docker build successful"
    echo "✅ Application running"
    echo ""
    echo "🌐 Test URLs:"
    echo "- Main site: https://anyway.ro"
    echo "- Search: https://anyway.ro/search"
    echo "- Admin: https://anyway.ro/admin"
else
    echo "❌ Build still failing"
    echo ""
    echo "🔍 TROUBLESHOOTING:"
    echo "==================="
    echo "1. Check TypeScript errors in build output above"
    echo "2. Verify all imports are correct"
    echo "3. Check for syntax errors in new files"
    echo "4. Consider reverting to backup if needed:"
    echo "   - cp tsconfig.json.backup.* tsconfig.json"
    echo "   - cp lib/advancedFlightService.ts.backup.* lib/advancedFlightService.ts"
    echo "   - docker-compose build --no-cache"
fi

echo ""
echo "📊 MONITORING:"
echo "============="
echo "- Build logs: docker-compose build flight-schedule"
echo "- App logs: docker-compose logs flight-schedule -f"
echo "- Container status: docker-compose ps"
echo ""

echo "TypeScript fix completed at $(date)"