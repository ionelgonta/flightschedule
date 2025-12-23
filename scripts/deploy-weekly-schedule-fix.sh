#!/bin/bash

# Deploy Weekly Schedule City Names Fix to Production
# This script deploys the updated WeeklyScheduleView component

echo "=== Deploying Weekly Schedule City Names Fix ==="
echo ""

SERVER="root@anyway.ro"
PROJECT_PATH="/opt/anyway-flight-schedule"

# Step 1: Upload the updated component
echo "Step 1: Uploading updated WeeklyScheduleView component..."
scp components/analytics/WeeklyScheduleView.tsx ${SERVER}:${PROJECT_PATH}/components/analytics/

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to upload component file"
    exit 1
fi

echo "✓ Component uploaded successfully"
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
sleep 3

curl -I https://anyway.ro/program-saptamanal > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Site is responding correctly"
else
    echo "WARNING: Site may not be responding correctly"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "The weekly schedule page should now display city names instead of IATA codes."
echo "Visit: https://anyway.ro/program-saptamanal"
echo ""
echo "Note: You may need to clear your browser cache to see the changes."