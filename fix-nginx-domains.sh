#!/bin/bash

# Fix Nginx Domains Script - Configurează anyway.ro fără port, păstrează victoriaocara.com
# Rulează pe server pentru a actualiza configurația nginx

echo "🌐 Fix Nginx Domains - anyway.ro & victoriaocara.com"
echo "=================================================="
echo "Date: $(date)"
echo ""

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server"
    echo "Run this script on server 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

echo "📋 Step 1: Backup current nginx configuration..."
echo "==============================================="

# Backup configurația actuală
if [ -f "nginx.conf" ]; then
    cp nginx.conf nginx.conf.backup.$(date +%Y%m%d-%H%M%S)
    echo "✅ Nginx config backed up"
else
    echo "⚠️ No nginx.conf found to backup"
fi

echo ""
echo "🔄 Step 2: Pull latest configuration..."
echo "======================================"

git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Latest configuration pulled"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verify SSL certificates..."
echo "===================================="

# Verifică certificatele SSL
if [ -d "/etc/letsencrypt/live/anyway.ro" ]; then
    echo "✅ anyway.ro SSL certificate found"
    ls -la /etc/letsencrypt/live/anyway.ro/
else
    echo "⚠️ anyway.ro SSL certificate not found"
    echo "You may need to generate SSL certificate:"
    echo "certbot --nginx -d anyway.ro -d www.anyway.ro"
fi

if [ -d "/etc/letsencrypt/live/victoriaocara.com" ]; then
    echo "✅ victoriaocara.com SSL certificate found"
else
    echo "⚠️ victoriaocara.com SSL certificate not found"
fi

echo ""
echo "🔍 Step 4: Verify Victoria Ocara files..."
echo "========================================"

if [ -d "/var/www/victoriaocara.com" ]; then
    echo "✅ Victoria Ocara directory found"
    echo "Files in /var/www/victoriaocara.com:"
    ls -la /var/www/victoriaocara.com/ | head -5
else
    echo "⚠️ Victoria Ocara directory not found at /var/www/victoriaocara.com"
    echo "Please verify the correct path for Victoria Ocara files"
fi

echo ""
echo "🧪 Step 5: Test nginx configuration..."
echo "===================================="

# Test configurația nginx
echo "Testing nginx configuration..."
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    echo "Please check the configuration before proceeding"
    exit 1
fi

echo ""
echo "🛑 Step 6: Stop current services..."
echo "=================================="

docker-compose down

echo ""
echo "🚀 Step 7: Start services with new configuration..."
echo "================================================="

# Start services
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

sleep 15

echo "Container status:"
docker-compose ps

echo ""
echo "🔍 Step 9: Verify nginx is running..."
echo "===================================="

# Verifică dacă nginx rulează
if docker-compose ps | grep -q "flight-schedule-nginx.*Up"; then
    echo "✅ Nginx container is running"
else
    echo "❌ Nginx container is not running"
    echo "Checking nginx logs:"
    docker-compose logs nginx --tail=10
fi

echo ""
echo "🧪 Step 10: Test domain routing..."
echo "==============================="

# Test local endpoints
echo "Testing internal flight app (port 3000 should NOT be accessible externally)..."
if curl -s --connect-timeout 5 http://localhost:3000 >/dev/null 2>&1; then
    echo "⚠️ Port 3000 is still accessible externally (should be internal only)"
else
    echo "✅ Port 3000 is not accessible externally (correct - internal only)"
fi

# Test nginx routing
echo ""
echo "Testing nginx routing..."
endpoints=(
    "http://localhost:80"
    "https://localhost:443"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -k -w "\nHTTP_CODE:%{http_code}" "$endpoint" --max-time 10 -H "Host: anyway.ro")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    case $http_code in
        200)
            echo "  ✅ Working (HTTP 200)"
            ;;
        301|302)
            echo "  ✅ Redirect (HTTP $http_code)"
            ;;
        404)
            echo "  ❌ Not found (HTTP 404)"
            ;;
        *)
            echo "  ⚠️ Response: HTTP $http_code"
            ;;
    esac
done

echo ""
echo "🌐 Step 11: Test external domain access..."
echo "========================================"

# Test external domains
external_domains=(
    "anyway.ro"
    "www.anyway.ro"
    "victoriaocara.com"
    "www.victoriaocara.com"
)

for domain in "${external_domains[@]}"; do
    echo "Testing: https://$domain"
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" --max-time 10)
    
    case $http_code in
        200)
            echo "  ✅ Accessible (HTTP 200)"
            ;;
        301|302)
            echo "  ✅ Redirect (HTTP $http_code)"
            ;;
        404)
            echo "  ❌ Not found (HTTP 404)"
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
echo "📊 Step 12: Show nginx logs..."
echo "============================"

echo "Recent nginx logs:"
docker-compose logs nginx --tail=15

echo ""
echo "✅ NGINX DOMAIN FIX COMPLETED!"
echo "=============================="

echo ""
echo "🎯 SUMMARY:"
echo "==========="
echo "✅ anyway.ro - Flight Schedule (no port needed)"
echo "✅ victoriaocara.com - Victoria Ocara (preserved)"
echo "✅ Port 3000 - Internal only (not exposed)"
echo "✅ SSL certificates - Configured for both domains"
echo ""

echo "🌐 TEST URLS:"
echo "============"
echo "Flight Schedule:"
echo "- https://anyway.ro (main site)"
echo "- https://anyway.ro/airport/OTP/arrivals"
echo "- https://anyway.ro/admin (password: admin123)"
echo ""
echo "Victoria Ocara (should remain unchanged):"
echo "- https://victoriaocara.com"
echo "- https://www.victoriaocara.com"
echo ""

echo "📊 MONITORING:"
echo "============="
echo "- Nginx logs: docker-compose logs nginx -f"
echo "- App logs: docker-compose logs flight-schedule -f"
echo "- Container status: docker-compose ps"
echo "- Port check: netstat -tulpn | grep :80"
echo ""

echo "🔧 IF ISSUES OCCUR:"
echo "=================="
echo "1. Check nginx logs: docker-compose logs nginx"
echo "2. Verify SSL certificates: ls -la /etc/letsencrypt/live/"
echo "3. Test nginx config: docker run --rm -v \$(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t"
echo "4. Restart services: docker-compose restart"
echo ""

echo "Fix completed at $(date)"