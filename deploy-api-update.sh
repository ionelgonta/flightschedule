#!/bin/bash

# Deploy API Update Script pentru anyway.ro
# Actualizează codul cu noua implementare API și ICAO mapping

set -e

echo "🚀 Starting API update deployment for anyway.ro..."

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server. Run this script on 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

echo "📦 Backing up current deployment..."
cp -r . ../anyway-flight-schedule-backup-$(date +%Y%m%d-%H%M%S) || true

echo "🔄 Pulling latest code..."
git pull origin main

echo "🔧 Setting up environment variables..."
if [ ! -f .env.local ]; then
    echo "Creating .env.local with API configuration..."
    cat > .env.local << EOF
# API.Market Configuration
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2m39qs0001k00404cmwu75
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_DEBUG_FLIGHTS=false
EOF
    echo "✅ Created .env.local with API configuration"
else
    echo "✅ .env.local already exists"
fi

echo "🏗️ Building application with new API integration..."
docker-compose build --no-cache

echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service status..."
docker-compose ps

echo "📊 Checking application logs..."
docker-compose logs app --tail=20

echo "🧪 Testing API integration..."
sleep 5

# Test API endpoint
echo "Testing OTP arrivals endpoint..."
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/flights/OTP/arrivals" || echo "API test failed"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Application should be available at:"
echo "   - https://anyway.ro"
echo "   - https://anyway.ro/airport/OTP/arrivals"
echo "   - https://anyway.ro/airport/CLJ/departures"
echo ""
echo "📋 Next steps:"
echo "1. Test flight data loading on website"
echo "2. Check browser console for any errors"
echo "3. Verify API key is working (check for 404 errors)"
echo "4. Monitor logs: docker-compose logs app -f"
echo ""
echo "🔑 If API key returns 404 errors:"
echo "1. Check API.Market dashboard for key validity"
echo "2. Verify credits/subscription status"
echo "3. Update API key in .env.local if needed"
echo "4. Restart: docker-compose restart"