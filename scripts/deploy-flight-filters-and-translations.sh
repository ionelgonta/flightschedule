#!/bin/bash

# Deploy Flight Filters and Airport Translations to Production
# This script deploys all the updated components with time filtering and airport translations

echo "=== Deploying Flight Filters and Airport Translations ==="
echo ""

SERVER="root@anyway.ro"
PROJECT_PATH="/opt/anyway-flight-schedule"

# Step 1: Upload all updated components
echo "Step 1: Uploading updated components..."

# Upload WeeklyScheduleView with airport translations
scp components/analytics/WeeklyScheduleView.tsx ${SERVER}:${PROJECT_PATH}/components/analytics/

# Upload FlightSchedulesView with time filtering
scp components/analytics/FlightSchedulesView.tsx ${SERVER}:${PROJECT_PATH}/components/analytics/

# Upload FlightList with time filtering
scp components/flights/FlightList.tsx ${SERVER}:${PROJECT_PATH}/components/flights/

# Upload FlightDisplay with time filtering
scp components/flights/FlightDisplay.tsx ${SERVER}:${PROJECT_PATH}/components/flights/

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to upload component files"
    exit 1
fi

echo "✓ All components uploaded successfully"
echo ""

# Step 2: Build the application on the server
echo "Step 2: Building application on server..."
ssh $SERVER "cd $PROJECT_PATH && echo '=== Building Next.js application ===' && npm run build"

if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi

echo "✓ Build completed successfully"
echo ""

# Step 3: Restart PM2
echo "Step 3: Restarting PM2 process..."
ssh $SERVER "pm2 restart anyway-ro"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to restart PM2"
    exit 1
fi

echo "✓ PM2 restarted successfully"
echo ""

# Step 4: Verify deployment
echo "Step 4: Verifying deployment..."
sleep 5

# Test main site
curl -I https://anyway.ro/program-saptamanal > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Weekly schedule page is responding correctly"
else
    echo "WARNING: Weekly schedule page may not be responding correctly"
fi

curl -I https://anyway.ro/aeroport/OTP/sosiri > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Arrivals page is responding correctly"
else
    echo "WARNING: Arrivals page may not be responding correctly"
fi

curl -I https://anyway.ro/aeroport/OTP/plecari > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Departures page is responding correctly"
else
    echo "WARNING: Departures page may not be responding correctly"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "✅ CHANGES DEPLOYED:"
echo "• Airport translations: IATA codes now show as city names in Romanian"
echo "• Time filtering: Shows only flights from last 10 hours + all future flights"
echo "• Applied to: Weekly schedule, arrivals, departures, flight schedules"
echo ""
echo "🌐 PAGES TO TEST:"
echo "• Weekly Schedule: https://anyway.ro/program-saptamanal"
echo "• Arrivals: https://anyway.ro/aeroport/OTP/sosiri"
echo "• Departures: https://anyway.ro/aeroport/OTP/plecari"
echo ""
echo "Note: Clear browser cache (Ctrl+F5) to see the changes immediately."