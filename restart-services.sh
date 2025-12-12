#!/bin/bash

# Simple restart script for server
echo "🔄 Restarting services..."
cd /opt/anyway-flight-schedule
docker-compose up -d
echo "✅ Services started"
docker-compose ps