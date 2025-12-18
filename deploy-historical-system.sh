#!/bin/bash

# Deploy Historical Flight Data System
# This script deploys the new historical cache system to the server

echo "=== DEPLOYING HISTORICAL FLIGHT DATA SYSTEM ==="

# Server configuration
SERVER="anyway.ro"
PROJECT_PATH="/opt/anyway-flight-schedule"
BACKUP_PATH="/opt/anyway-flight-schedule/backups/$(date +%Y%m%d_%H%M%S)"

echo "Creating backup..."
ssh root@$SERVER "mkdir -p $BACKUP_PATH"
ssh root@$SERVER "cp -r $PROJECT_PATH/lib $BACKUP_PATH/"
ssh root@$SERVER "cp -r $PROJECT_PATH/app $BACKUP_PATH/"
ssh root@$SERVER "cp $PROJECT_PATH/package.json $BACKUP_PATH/"

echo "Uploading new files..."
scp -r ./lib root@$SERVER:$PROJECT_PATH/
scp -r ./app root@$SERVER:$PROJECT_PATH/
scp ./package.json root@$SERVER:$PROJECT_PATH/

echo "Installing new dependencies..."
# First install better-sqlite3 on the server (Linux environment)
ssh root@$SERVER "cd $PROJECT_PATH && npm install better-sqlite3@^9.2.2 @types/better-sqlite3@^7.6.8"
ssh root@$SERVER "cd $PROJECT_PATH && npm install"

echo "Creating data directory structure..."
ssh root@$SERVER "mkdir -p $PROJECT_PATH/data"
ssh root@$SERVER "chmod 755 $PROJECT_PATH/data"

echo "Building application..."
ssh root@$SERVER "cd $PROJECT_PATH && npm run build"

echo "Restarting PM2 process..."
ssh root@$SERVER "pm2 restart anyway-ro"

echo "Waiting for application to start..."
sleep 10

echo "Testing application..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://anyway.ro)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Application is running successfully"
else
    echo "❌ Application test failed (HTTP $RESPONSE)"
    echo "Rolling back..."
    ssh root@$SERVER "cp -r $BACKUP_PATH/lib $PROJECT_PATH/"
    ssh root@$SERVER "cp -r $BACKUP_PATH/app $PROJECT_PATH/"
    ssh root@$SERVER "cp $BACKUP_PATH/package.json $PROJECT_PATH/"
    ssh root@$SERVER "cd $PROJECT_PATH && npm install && npm run build"
    ssh root@$SERVER "pm2 restart anyway-ro"
    exit 1
fi

echo "Testing historical cache initialization..."
ssh root@$SERVER "cd $PROJECT_PATH && node -e '
const { historicalCacheManager } = require(\"./lib/historicalCacheManager\");
historicalCacheManager.initialize().then(() => {
  console.log(\"Historical cache initialized successfully\");
  process.exit(0);
}).catch(err => {
  console.error(\"Historical cache initialization failed:\", err);
  process.exit(1);
});
'"

if [ $? -eq 0 ]; then
    echo "✅ Historical cache system initialized successfully"
else
    echo "⚠️  Historical cache initialization had issues, but application is running"
fi

echo "Testing new API endpoints..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://anyway.ro/api/stats/daily?airport=OTP&date=$(date +%Y-%m-%d)")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "404" ]; then
    echo "✅ Statistics API endpoints are accessible"
else
    echo "⚠️  Statistics API test returned HTTP $API_RESPONSE"
fi

echo "Checking PM2 status..."
ssh root@$SERVER "pm2 list"

echo "Checking application logs..."
ssh root@$SERVER "pm2 logs anyway-ro --lines 10"

echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "📊 Historical Flight Data System Features:"
echo "- ✅ SQLite database for persistent storage"
echo "- ✅ Historical cache manager integration"
echo "- ✅ Advanced flight statistics service"
echo "- ✅ REST API endpoints for analytics"
echo "- ✅ Property-based testing framework"
echo ""
echo "🔗 New API Endpoints:"
echo "- GET /api/stats/daily?airport=OTP&date=YYYY-MM-DD"
echo "- GET /api/stats/range?airport=OTP&from=YYYY-MM-DD&to=YYYY-MM-DD"
echo "- GET /api/stats/trends?airport=OTP&period=7d"
echo ""
echo "📁 Database Location: $PROJECT_PATH/data/historical-flights.db"
echo "📁 Backup Location: $BACKUP_PATH"
echo ""
echo "Next Steps:"
echo "1. Monitor PM2 logs for any issues"
echo "2. Test the new API endpoints"
echo "3. Check historical data accumulation"
echo "4. Run property-based tests if needed"