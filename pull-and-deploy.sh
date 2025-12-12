#!/bin/bash

# Pull and Deploy Script - Rulează direct pe server
# Trage ultimele fișiere și face deployment complet

echo "🚀 Pull and Deploy - anyway.ro Flight Schedule"
echo "=============================================="
echo "Date: $(date)"
echo ""

# Verifică dacă suntem pe server
if [ ! -d "/opt/anyway-flight-schedule" ]; then
    echo "❌ Error: Not on production server"
    echo "Run this script on server 23.88.113.154"
    exit 1
fi

cd /opt/anyway-flight-schedule

echo "📦 Step 1: Pull latest files from Git..."
echo "========================================"
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Files updated successfully"
else
    echo "❌ Git pull failed"
    exit 1
fi

echo ""
echo "🔧 Step 2: Make scripts executable..."
echo "===================================="
chmod +x debug-api.sh deploy-final.sh server-update.sh test-new-api-key.sh

echo "✅ Scripts are now executable"

echo ""
echo "🔍 Step 3: Run diagnostic..."
echo "==========================="
./debug-api.sh

echo ""
echo "🚀 Step 4: Run deployment..."
echo "=========================="
./deploy-final.sh

echo ""
echo "✅ Pull and Deploy completed!"
echo "============================"
echo ""
echo "🌐 Test URLs:"
echo "- https://anyway.ro"
echo "- https://anyway.ro/airport/OTP/arrivals"
echo "- https://anyway.ro/admin"
echo ""
echo "📊 Monitor with:"
echo "- docker-compose logs app -f"
echo "- docker-compose ps"