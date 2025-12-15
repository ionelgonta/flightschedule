#!/bin/bash

# Deploy script pentru server
echo "🚀 Starting AdSense deployment on anyway.ro"

PROJECT_PATH="/opt/anyway-flight-schedule"
cd $PROJECT_PATH

echo "📁 Creating AdSense API directory..."
mkdir -p app/api/admin/adsense

echo "📝 Moving files from /tmp to project..."
# Backup existing files
cp app/admin/page.tsx app/admin/page.tsx.backup 2>/dev/null || echo "No existing admin page to backup"
cp lib/adConfig.ts lib/adConfig.ts.backup 2>/dev/null || echo "No existing adConfig to backup"

# Move new files
mv /tmp/adsense-route.ts app/api/admin/adsense/route.ts
mv /tmp/admin-page.tsx app/admin/page.tsx
mv /tmp/adConfig.ts lib/adConfig.ts

echo "✅ Files moved successfully!"

echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🐳 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build

echo "⏳ Waiting for containers to start..."
sleep 15

echo "🧪 Testing AdSense API..."
curl -s https://anyway.ro/api/admin/adsense

echo ""
echo "✅ Deployment completed!"
echo "🌐 Test URLs:"
echo "• Admin: https://anyway.ro/admin"
echo "• API: https://anyway.ro/api/admin/adsense"