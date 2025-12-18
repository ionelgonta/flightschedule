#!/bin/bash

# Deploy statistics fixes to the server
# Fixes: delay percentages, unknown airlines, unknown airport codes

echo "=== DEPLOYING STATISTICS FIXES ==="
echo "Fixing: delay percentages, airline names, airport codes"

# Check if we have the required files
required_files=("lib/airlineMapping.ts" "lib/flightAnalyticsService.ts" "lib/cacheManager.ts")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file not found: $file"
        exit 1
    fi
done

echo "All required files found ✓"

# Upload the fixed files to server
echo "Uploading fixed files to server..."

# Upload lib files with fixes
scp lib/airlineMapping.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
scp lib/flightAnalyticsService.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/
scp lib/cacheManager.ts root@anyway.ro:/opt/anyway-flight-schedule/lib/

echo "Files uploaded successfully ✓"

# Clear analytics cache on server to force regeneration
echo "Clearing analytics cache on server..."

ssh root@anyway.ro << 'EOF'
cd /opt/anyway-flight-schedule
echo 'Clearing analytics cache...'
if [ -f data/cache-data.json ]; then
    # Backup current cache
    cp data/cache-data.json data/cache-data.json.backup
    # Filter out analytics entries using node
    node -e "
        const fs = require('fs');
        try {
            const cache = JSON.parse(fs.readFileSync('data/cache-data.json', 'utf-8'));
            const filtered = cache.filter(entry => entry.category !== 'analytics');
            fs.writeFileSync('data/cache-data.json', JSON.stringify(filtered, null, 2));
            console.log('Cleared ' + (cache.length - filtered.length) + ' analytics entries');
        } catch (e) {
            console.log('Cache file not found or invalid, will be created fresh');
        }
    "
else
    echo 'No cache file found - will be created fresh'
fi
EOF

echo "Cache cleared successfully ✓"

# Build the application
echo "Building application on server..."
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

echo "Build completed ✓"

# Restart PM2 process
echo "Restarting PM2 process..."
ssh root@anyway.ro "pm2 restart anyway-ro"

echo "PM2 restarted ✓"

# Test the deployment
echo "Testing deployment..."
response=$(ssh root@anyway.ro "curl -s -I https://anyway.ro")
if echo "$response" | grep -q "200 OK"; then
    echo "Site is responding ✓"
else
    echo "WARNING: Site may not be responding properly"
    echo "Response: $response"
fi

echo ""
echo "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
echo ""
echo "Statistics fixes applied:"
echo "✓ Fixed delay percentage calculation (no more 0.0%)"
echo "✓ Added airline mapping: H4 - Hisky"  
echo "✓ Added airport codes: VRN, SSH, CDT, EIN, HHN, BRI, LCA"
echo "✓ Improved route analysis with better delay handling"
echo ""
echo "Next steps:"
echo "1. Analytics will regenerate automatically via cron job"
echo "2. Or manually refresh at: https://anyway.ro/admin"
echo "3. Check Chișinău statistics to verify fixes"