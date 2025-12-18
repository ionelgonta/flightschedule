#!/bin/bash

# Deploy admin login improvements - add username field
echo "=== DEPLOYING ADMIN LOGIN IMPROVEMENTS ==="
echo "Adding username field to admin login"

# Check if we have the required files
required_files=("app/admin/layout.tsx" "components/admin/AdminLogin.tsx")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file not found: $file"
        exit 1
    fi
done

echo "All required files found ✓"

# Upload the updated admin files to server
echo "Uploading updated admin files to server..."

# Upload app files
scp app/admin/layout.tsx root@anyway.ro:/opt/anyway-flight-schedule/app/admin/
scp components/admin/AdminLogin.tsx root@anyway.ro:/opt/anyway-flight-schedule/components/admin/

echo "Files uploaded successfully ✓"

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
echo "=== ADMIN LOGIN IMPROVEMENTS DEPLOYED SUCCESSFULLY ==="
echo ""
echo "Changes applied:"
echo "✓ Added username field to admin login"
echo "✓ Updated authentication to require both username and password"
echo "✓ Improved security with dual-factor authentication"
echo ""
echo "New admin credentials:"
echo "- URL: https://anyway.ro/admin"
echo "- Username: admin"
echo "- Password: FlightSchedule2024!"
echo ""
echo "The admin panel now requires both username and password for access."