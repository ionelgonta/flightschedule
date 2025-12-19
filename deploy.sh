#!/bin/bash

# Script de deployment pentru Flight Schedule Application
# Folosește acest script pentru a face deploy pe server

echo "🚀 Starting deployment to anyway.ro..."

# Upload fișierele principale
echo "📤 Uploading files..."
scp -r ./lib ./components ./app root@anyway.ro:/opt/anyway-flight-schedule/

# Build aplicația
echo "🔨 Building application..."
ssh root@anyway.ro "cd /opt/anyway-flight-schedule && npm run build"

# Restart PM2
echo "🔄 Restarting PM2..."
ssh root@anyway.ro "pm2 restart anyway-ro"

# Test site-urile
echo "🧪 Testing sites..."
curl -I https://anyway.ro
curl -I https://victoriaocara.com

echo "✅ Deployment complete!"