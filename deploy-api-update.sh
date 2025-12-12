#!/bin/bash

# Deploy API Update Script pentru anyway.ro
# Actualizează aplicația cu integrarea API.Market

set -e

echo "🚀 Starting API.Market deployment for anyway.ro..."

# Configurații
PROJECT_DIR="/opt/anyway-flight-schedule"
API_KEY="cmj2k3c1p000djy044wbqprap"

# Navighează la directorul proiectului
cd $PROJECT_DIR

echo "📁 Current directory: $(pwd)"

# Backup configurația existentă
if [ -f .env.local ]; then
    echo "💾 Backing up existing .env.local..."
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
fi

# Creează configurația pentru API.Market
echo "⚙️ Creating API.Market configuration..."
cat > .env.local << EOF
# API.Market Configuration pentru AeroDataBox
NEXT_PUBLIC_FLIGHT_API_KEY=$API_KEY
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_SCHEDULER_ENABLED=true
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3
NEXT_PUBLIC_DEBUG_FLIGHTS=false

# Google AdSense (dacă este configurat)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-your-id-here
EOF

echo "✅ Configuration created successfully"

# Pull ultimele modificări din Git
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Verifică dacă există modificări
if [ $? -ne 0 ]; then
    echo "⚠️ Git pull failed, continuing with local changes..."
fi

# Rebuild aplicația cu noua configurație
echo "🔨 Building application with new API configuration..."
docker-compose build --no-cache app

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Restoring backup..."
    if [ -f .env.local.backup.* ]; then
        cp .env.local.backup.* .env.local
    fi
    exit 1
fi

# Restart serviciile
echo "🔄 Restarting services..."
docker-compose up -d

# Verifică statusul serviciilor
echo "🔍 Checking service status..."
sleep 10
docker-compose ps

# Test API endpoint
echo "🧪 Testing API endpoints..."
sleep 5

# Test local API
echo "Testing local API..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/flights/OTP/arrivals || echo "API test failed"

# Test aplicația
echo "Testing application..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ || echo "App test failed"

# Afișează logs pentru debugging
echo "📋 Recent application logs:"
docker-compose logs app --tail=20

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Application URLs:"
echo "   - Local: http://localhost:8080"
echo "   - Public: https://anyway.ro (port 8080)"
echo "   - SSL: https://anyway.ro:8443"
echo ""
echo "🔧 API Configuration:"
echo "   - Provider: AeroDataBox via API.Market"
echo "   - Rate Limit: 150 requests/minute"
echo "   - Cache Duration: 10 minutes"
echo "   - Auto Refresh: 10 minutes"
echo ""
echo "📊 Monitoring:"
echo "   - Logs: docker-compose logs app -f"
echo "   - Status: docker-compose ps"
echo "   - API Test: curl http://localhost:8080/api/flights/OTP/arrivals"
echo ""
echo "🎯 Next Steps:"
echo "1. Test flight data loading on https://anyway.ro/airport/OTP/arrivals"
echo "2. Monitor logs for API errors: docker-compose logs app -f"
echo "3. Check browser console for any JavaScript errors"
echo "4. Verify scheduler is running and updating cache"
echo ""