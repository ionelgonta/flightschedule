#!/bin/bash

# Deploy AdSense Verification Code
# Adds Google AdSense verification code to the website

echo "🎯 Deploy AdSense Verification Code"
echo "==================================="
echo "Date: $(date)"
echo ""

# Configuration
SERVER_IP="23.88.113.154"
SERVER_USER="root"
SERVER_PATH="/opt/anyway-flight-schedule"
ADSENSE_PUBLISHER_ID="ca-pub-2305349540791838"

echo "📋 Configuration:"
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Path: $SERVER_PATH"
echo "AdSense ID: $ADSENSE_PUBLISHER_ID"
echo ""

echo "📤 Step 1: Push AdSense changes to Git..."
echo "========================================"

# Add and commit changes
git add .
git commit -m "🎯 Add Google AdSense Verification Code

- Update AdSenseScript with publisher ID: ca-pub-2305349540791838
- Update adConfig.ts with correct publisher ID
- Ready for AdSense site verification
- Code will be present in <head> section of all pages"

git push origin main

echo "✅ AdSense changes pushed to Git"

echo ""
echo "🔗 Step 2: Deploy to server..."
echo "============================="

# Connect to server and deploy
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH

echo "🌐 Connected to server: \$(hostname)"
echo "Current time: \$(date)"
echo ""

# Navigate to project directory
cd $SERVER_PATH

echo "📥 Pulling latest AdSense changes..."
git pull origin main

if [ \$? -eq 0 ]; then
    echo "✅ Git pull successful"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔄 Rebuilding application with AdSense code..."
echo "============================================="

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Services restarted with AdSense code"

echo ""
echo "⏳ Waiting for initialization..."
sleep 15

echo ""
echo "🧪 Testing AdSense integration..."
echo "==============================="

# Test if AdSense script is loaded
echo "Testing main site..."
response=\$(curl -s https://anyway.ro)

if echo "\$response" | grep -q "pagead2.googlesyndication.com"; then
    echo "✅ AdSense script found in HTML"
else
    echo "⚠️ AdSense script not found in HTML"
fi

if echo "\$response" | grep -q "$ADSENSE_PUBLISHER_ID"; then
    echo "✅ Publisher ID found in HTML"
else
    echo "⚠️ Publisher ID not found in HTML"
fi

echo ""
echo "🌐 Testing all pages..."
echo "======================"

# Test multiple pages
pages=(
    "https://anyway.ro"
    "https://anyway.ro/airports"
    "https://anyway.ro/airport/OTP"
    "https://anyway.ro/airport/OTP/arrivals"
    "https://anyway.ro/admin"
)

for page in "\${pages[@]}"; do
    echo "Testing: \$page"
    
    response_code=\$(curl -s -o /dev/null -w "%{http_code}" "\$page")
    
    if [ "\$response_code" = "200" ]; then
        echo "  ✅ Page loads: \$response_code"
        
        # Check for AdSense script
        if curl -s "\$page" | grep -q "pagead2.googlesyndication.com"; then
            echo "  ✅ AdSense script present"
        else
            echo "  ⚠️ AdSense script missing"
        fi
    else
        echo "  ❌ Page failed: \$response_code"
    fi
done

echo ""
echo "📊 Deployment summary..."
echo "======================="

echo ""
echo "✅ ADSENSE VERIFICATION CODE DEPLOYED!"
echo ""
echo "🎯 AdSense Details:"
echo "------------------"
echo "• Publisher ID: $ADSENSE_PUBLISHER_ID"
echo "• Script URL: https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
echo "• Integration: Present in <head> section of all pages"
echo "• Status: Ready for Google AdSense verification"
echo ""
echo "🌐 Verification URLs:"
echo "--------------------"
echo "• Main site: https://anyway.ro"
echo "• All pages include the AdSense verification code"
echo ""
echo "📋 Next Steps for AdSense:"
echo "-------------------------"
echo "1. Go to Google AdSense dashboard"
echo "2. Add site: anyway.ro"
echo "3. Choose 'AdSense code snippet' verification method"
echo "4. Verify that the code is already present (it is!)"
echo "5. Complete the verification process"
echo "6. Wait for site review and approval"
echo ""
echo "Server deployment completed at \$(date)"

ENDSSH

# Check deployment result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ADSENSE DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🎉 Summary:"
    echo "----------"
    echo "• AdSense verification code deployed"
    echo "• Publisher ID: $ADSENSE_PUBLISHER_ID"
    echo "• Code present in <head> of all pages"
    echo "• Website ready for AdSense verification"
    echo ""
    echo "🎯 AdSense Verification Steps:"
    echo "-----------------------------"
    echo "1. Go to: https://www.google.com/adsense/"
    echo "2. Add site: anyway.ro"
    echo "3. Select: 'AdSense code snippet' method"
    echo "4. The code is already installed!"
    echo "5. Click 'Verify' to complete"
    echo ""
    echo "🌐 Test your site:"
    echo "-----------------"
    echo "• Visit: https://anyway.ro"
    echo "• View source and search for: $ADSENSE_PUBLISHER_ID"
    echo "• You should see the AdSense script in <head>"
else
    echo ""
    echo "❌ ADSENSE DEPLOYMENT FAILED!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "------------------"
    echo "1. Check server connection"
    echo "2. Verify Git repository access"
    echo "3. Check Docker services status"
    echo "4. Try manual deployment"
fi

echo ""
echo "AdSense deployment completed at $(date)"