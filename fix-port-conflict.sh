#!/bin/bash

# Fix Port Conflict Script - Rezolvă conflictul de port 3000
# Identifică și oprește procesele care folosesc portul 3000

echo "🔧 Fix Port Conflict - anyway.ro"
echo "==============================="
echo "Date: $(date)"
echo ""

cd /opt/anyway-flight-schedule

echo "🔍 Step 1: Identify port 3000 usage..."
echo "======================================"

echo "Processes using port 3000:"
lsof -i :3000 || echo "No processes found using lsof"

echo ""
echo "Alternative check with netstat:"
netstat -tulpn | grep :3000 || echo "No processes found using netstat"

echo ""
echo "Alternative check with ss:"
ss -tulpn | grep :3000 || echo "No processes found using ss"

echo ""
echo "🛑 Step 2: Stop conflicting processes..."
echo "======================================="

# Find and kill processes on port 3000
PIDS=$(lsof -ti :3000 2>/dev/null)

if [ -n "$PIDS" ]; then
    echo "Found processes on port 3000: $PIDS"
    echo "Killing processes..."
    
    for PID in $PIDS; do
        echo "Killing process $PID..."
        kill -9 $PID 2>/dev/null || echo "Failed to kill $PID"
    done
    
    sleep 2
    
    # Verify port is free
    if lsof -i :3000 >/dev/null 2>&1; then
        echo "⚠️ Port 3000 still in use after killing processes"
    else
        echo "✅ Port 3000 is now free"
    fi
else
    echo "No processes found on port 3000"
fi

echo ""
echo "🐳 Step 3: Clean Docker containers..."
echo "===================================="

# Stop all containers
echo "Stopping all Docker containers..."
docker-compose down --remove-orphans --volumes

# Remove any orphaned containers
echo "Removing orphaned containers..."
docker container prune -f

# Check if any containers are still using port 3000
echo "Checking for Docker containers on port 3000..."
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 3000 || echo "No Docker containers using port 3000"

echo ""
echo "🔧 Step 4: Fix docker-compose.yml..."
echo "===================================="

# Remove the obsolete version attribute
echo "Removing obsolete version attribute from docker-compose.yml..."
sed -i '/^version:/d' docker-compose.yml

echo "Updated docker-compose.yml:"
head -10 docker-compose.yml

echo ""
echo "🚀 Step 5: Start services with clean state..."
echo "============================================="

# Build and start
echo "Building containers..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

echo ""
echo "⏳ Step 6: Wait for services..."
echo "=============================="

sleep 10

echo "Container status:"
docker-compose ps

echo ""
echo "🔍 Step 7: Verify port usage..."
echo "=============================="

echo "Port 3000 status after startup:"
lsof -i :3000 || echo "No processes on port 3000"

echo ""
echo "Docker container ports:"
docker ps --format "table {{.Names}}\t{{.Ports}}"

echo ""
echo "🧪 Step 8: Test endpoints..."
echo "=========================="

# Wait a bit more for app to fully start
sleep 5

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
                    echo "  ✅ Flight data loaded successfully"
                elif echo "$response" | grep -q '"success":false'; then
                    echo "  ⚠️ API returned success:false (check API key)"
                fi
            fi
            ;;
        404)
            echo "  ❌ Not found (HTTP 404)"
            ;;
        500)
            echo "  ❌ Server error (HTTP 500)"
            ;;
        000)
            echo "  ❌ Connection failed (service not running)"
            ;;
        *)
            echo "  ⚠️ Unexpected response: HTTP $http_code"
            ;;
    esac
done

echo ""
echo "📊 Step 9: Show application logs..."
echo "=================================="

echo "Recent application logs:"
docker-compose logs flight-schedule --tail=15 2>/dev/null || docker-compose logs app --tail=15 2>/dev/null || echo "No logs available"

echo ""
echo "🌐 Step 10: Test external access..."
echo "=================================="

echo "Testing external URLs..."
external_urls=(
    "https://anyway.ro"
    "https://anyway.ro/airport/OTP"
)

for url in "${external_urls[@]}"; do
    echo "Testing: $url"
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    case $http_code in
        200)
            echo "  ✅ Accessible (HTTP 200)"
            ;;
        404)
            echo "  ❌ Not found (HTTP 404)"
            ;;
        502|503)
            echo "  ❌ Server error (HTTP $http_code)"
            ;;
        000)
            echo "  ❌ Connection failed"
            ;;
        *)
            echo "  ⚠️ Response: HTTP $http_code"
            ;;
    esac
done

echo ""
echo "✅ PORT CONFLICT FIX COMPLETED!"
echo "==============================="

# Check final status
if curl -s http://localhost:3000 >/dev/null; then
    echo "🎉 SUCCESS: Application is running on port 3000"
    
    if curl -s http://localhost:3000/api/flights/OTP/arrivals | grep -q '"success":true'; then
        echo "🎯 PERFECT: Flight API is working!"
    else
        echo "⚠️ Application running but API key needs attention"
    fi
else
    echo "❌ ISSUE: Application still not accessible on port 3000"
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "1. Check container logs: docker-compose logs flight-schedule -f"
    echo "2. Check container status: docker-compose ps"
    echo "3. Check port usage: lsof -i :3000"
    echo "4. Restart if needed: docker-compose restart"
fi

echo ""
echo "🌐 Test URLs:"
echo "- Local: http://localhost:3000"
echo "- External: https://anyway.ro"
echo "- API: http://localhost:3000/api/flights/OTP/arrivals"
echo "- Admin: https://anyway.ro/admin"
echo ""
echo "📊 Monitor commands:"
echo "- Logs: docker-compose logs flight-schedule -f"
echo "- Status: docker-compose ps"
echo "- Port check: lsof -i :3000"
echo ""
echo "Fix completed at $(date)"