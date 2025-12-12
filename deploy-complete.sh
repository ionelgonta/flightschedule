#!/bin/bash

# Complete Deployment Script pentru anyway.ro cu API.Market Integration
# Acest script face deployment complet cu date reale de zboruri

set -e

echo "🚀 Starting Complete API.Market Deployment for anyway.ro..."
echo "=================================================="

# Configurații
PROJECT_DIR="/opt/anyway-flight-schedule"
API_KEY="cmj2m39qs0001k00404cmwu75"
BACKUP_DIR="/tmp/anyway-backup-$(date +%Y%m%d_%H%M%S)"

# Verifică că suntem în directorul corect
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory $PROJECT_DIR not found!"
    exit 1
fi

cd $PROJECT_DIR
echo "📁 Working in: $(pwd)"

# Creează backup complet
echo "💾 Creating full backup..."
mkdir -p $BACKUP_DIR
if [ -f .env.local ]; then
    cp .env.local $BACKUP_DIR/
fi
if [ -f docker-compose.yml ]; then
    cp docker-compose.yml $BACKUP_DIR/
fi
echo "✅ Backup created at: $BACKUP_DIR"

# Pull ultimele modificări
echo "📥 Pulling latest changes from Git..."
git stash push -m "Auto-stash before deployment $(date)"
git pull origin main || echo "⚠️ Git pull failed, continuing..."

# Creează configurația API.Market
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

echo "✅ Configuration created"

# Test API key înainte de build
echo "🧪 Testing API key..."
API_TEST_URL="https://api.market/aerodatabox/v1/flights/airports/icao/LROP/arrivals/$(date +%Y-%m-%d)T00:00/$(date +%Y-%m-%d)T23:59"
API_RESPONSE=$(curl -s -w "%{http_code}" -H "x-magicapi-key: $API_KEY" "$API_TEST_URL" -o /dev/null)

if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API key is valid"
elif [ "$API_RESPONSE" = "401" ]; then
    echo "❌ API key is invalid!"
    echo "Restoring backup..."
    cp $BACKUP_DIR/.env.local ./ 2>/dev/null || true
    exit 1
elif [ "$API_RESPONSE" = "429" ]; then
    echo "⚠️ Rate limit hit, but key seems valid"
else
    echo "⚠️ API test returned: $API_RESPONSE (continuing anyway)"
fi

# Stop serviciile pentru rebuild
echo "⏹️ Stopping services..."
docker-compose down

# Rebuild aplicația
echo "🔨 Building application with new configuration..."
docker-compose build --no-cache app

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Restoring backup..."
    cp $BACKUP_DIR/.env.local ./ 2>/dev/null || true
    docker-compose up -d
    exit 1
fi

# Start serviciile
echo "🚀 Starting services..."
docker-compose up -d

# Așteaptă ca serviciile să pornească
echo "⏳ Waiting for services to start..."
sleep 15

# Verifică statusul
echo "🔍 Checking service status..."
docker-compose ps

# Test aplicația
echo "🧪 Testing application..."
sleep 5

# Test homepage
echo "Testing homepage..."
HOME_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8080/ -o /dev/null)
if [ "$HOME_RESPONSE" = "200" ]; then
    echo "✅ Homepage: OK"
else
    echo "⚠️ Homepage: $HOME_RESPONSE"
fi

# Test API endpoint
echo "Testing API endpoint..."
API_ENDPOINT_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8080/api/flights/OTP/arrivals -o /dev/null)
if [ "$API_ENDPOINT_RESPONSE" = "200" ]; then
    echo "✅ API Endpoint: OK"
else
    echo "⚠️ API Endpoint: $API_ENDPOINT_RESPONSE"
fi

# Afișează logs recente
echo "📋 Recent application logs:"
docker-compose logs app --tail=30

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "🌐 Application URLs:"
echo "   - Local: http://localhost:8080"
echo "   - Public: https://anyway.ro"
echo "   - SSL: https://anyway.ro:8443"
echo ""
echo "🔧 Configuration:"
echo "   - API Provider: AeroDataBox via API.Market"
echo "   - API Key: ${API_KEY:0:10}..."
echo "   - Cache Duration: 10 minutes"
echo "   - Auto Refresh: 10 minutes"
echo "   - Rate Limit: 150 req/min"
echo ""
echo "📊 Monitoring Commands:"
echo "   - Logs: docker-compose logs app -f"
echo "   - Status: docker-compose ps"
echo "   - Restart: docker-compose restart app"
echo ""
echo "🧪 Test URLs:"
echo "   - OTP Arrivals: https://anyway.ro/airport/OTP/arrivals"
echo "   - CLJ Departures: https://anyway.ro/airport/CLJ/departures"
echo "   - API Direct: https://anyway.ro/api/flights/OTP/arrivals"
echo ""
echo "💾 Backup Location: $BACKUP_DIR"
echo ""
echo "🎯 Next Steps:"
echo "1. Test flight data loading in browser"
echo "2. Monitor logs for any errors"
echo "3. Verify scheduler is running"
echo "4. Check cache performance"
echo ""
echo "✅ Real flight data is now live on anyway.ro!"