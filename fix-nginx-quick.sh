#!/bin/bash

# Quick Nginx Fix - Rezolvă problemele identificate
# Configurează SSL și path-urile corecte

echo "🔧 Quick Nginx Fix - anyway.ro"
echo "=============================="
echo "Date: $(date)"
echo ""

cd /opt/anyway-flight-schedule

echo "🔍 Step 1: Identify current issues..."
echo "===================================="

echo "Checking SSL certificates..."
if [ -d "/etc/letsencrypt/live/anyway.ro" ]; then
    echo "✅ anyway.ro SSL found"
else
    echo "❌ anyway.ro SSL missing"
fi

echo ""
echo "Checking Victoria Ocara path..."
possible_paths=(
    "/var/www/victoriaocara.com"
    "/var/www/html/victoriaocara.com"
    "/opt/victoriaocara"
    "/home/victoriaocara"
    "/var/www/html"
)

VICTORIA_PATH=""
for path in "${possible_paths[@]}"; do
    if [ -d "$path" ]; then
        echo "Found Victoria Ocara at: $path"
        VICTORIA_PATH="$path"
        break
    fi
done

if [ -z "$VICTORIA_PATH" ]; then
    echo "⚠️ Victoria Ocara path not found, using /var/www/html as fallback"
    VICTORIA_PATH="/var/www/html"
fi

echo ""
echo "🔧 Step 2: Create temporary nginx config..."
echo "=========================================="

# Creează o configurație nginx simplificată care funcționează
cat > nginx.conf.temp << EOF
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # HTTP server (redirect to HTTPS)
    server {
        listen 80;
        server_name _;
        return 301 https://\$host\$request_uri;
    }

    # HTTPS server pentru anyway.ro (Flight Schedule)
    server {
        listen 443 ssl http2;
        server_name anyway.ro www.anyway.ro;

        # SSL configuration (fallback to self-signed if Let's Encrypt not available)
        ssl_certificate /etc/letsencrypt/live/anyway.ro/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/anyway.ro/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Proxy to flight schedule app
        location / {
            proxy_pass http://flight-schedule:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
    }

    # HTTPS server pentru victoriaocara.com (Static files)
    server {
        listen 443 ssl http2;
        server_name victoriaocara.com www.victoriaocara.com;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/victoriaocara.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/victoriaocara.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Root directory pentru Victoria Ocara
        root $VICTORIA_PATH;
        index index.html index.htm index.php;

        # Static files
        location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff2?|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Main Victoria Ocara
        location / {
            try_files \$uri \$uri/ /index.html;
        }
    }
}
EOF

echo "✅ Temporary nginx config created"

echo ""
echo "🔑 Step 3: Generate SSL certificate for anyway.ro..."
echo "=================================================="

if [ ! -d "/etc/letsencrypt/live/anyway.ro" ]; then
    echo "Generating SSL certificate for anyway.ro..."
    
    # Oprește nginx temporar pentru certbot
    docker-compose stop nginx 2>/dev/null || true
    
    # Generează certificatul
    certbot certonly --standalone -d anyway.ro -d www.anyway.ro --non-interactive --agree-tos --email admin@anyway.ro
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate generated for anyway.ro"
    else
        echo "⚠️ SSL certificate generation failed, creating self-signed..."
        
        # Creează directorul pentru certificat self-signed
        mkdir -p /etc/letsencrypt/live/anyway.ro
        
        # Generează certificat self-signed
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/letsencrypt/live/anyway.ro/privkey.pem \
            -out /etc/letsencrypt/live/anyway.ro/fullchain.pem \
            -subj "/C=RO/ST=Bucharest/L=Bucharest/O=Anyway/OU=IT/CN=anyway.ro"
        
        echo "✅ Self-signed certificate created"
    fi
else
    echo "✅ SSL certificate already exists for anyway.ro"
fi

echo ""
echo "🔧 Step 4: Update docker-compose for correct paths..."
echo "=================================================="

# Actualizează docker-compose.yml cu path-ul corect
cat > docker-compose.yml << EOF
services:
  flight-schedule:
    build: .
    container_name: flight-schedule-app
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    restart: unless-stopped
    networks:
      - flight-network

  nginx:
    image: nginx:alpine
    container_name: flight-schedule-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf.temp:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - $VICTORIA_PATH:$VICTORIA_PATH:ro
    depends_on:
      - flight-schedule
    restart: unless-stopped
    networks:
      - flight-network

networks:
  flight-network:
    driver: bridge
EOF

echo "✅ Docker compose updated with correct paths"

echo ""
echo "🚀 Step 5: Start services with working config..."
echo "=============================================="

# Oprește serviciile
docker-compose down --remove-orphans

# Construiește și pornește
echo "Building flight schedule app..."
docker-compose build flight-schedule

echo "Starting services..."
docker-compose up -d

echo ""
echo "⏳ Step 6: Wait for services..."
echo "=============================="

sleep 15

echo "Container status:"
docker-compose ps

echo ""
echo "🧪 Step 7: Test configuration..."
echo "==============================="

# Test nginx
if docker-compose ps | grep -q "flight-schedule-nginx.*Up"; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    echo "Nginx logs:"
    docker-compose logs nginx --tail=10
fi

# Test app
if docker-compose ps | grep -q "flight-schedule-app.*Up"; then
    echo "✅ Flight app is running"
else
    echo "❌ Flight app failed to start"
    echo "App logs:"
    docker-compose logs flight-schedule --tail=10
fi

echo ""
echo "🌐 Step 8: Test endpoints..."
echo "=========================="

# Test local access
echo "Testing local access..."
if curl -s -k https://localhost --max-time 10 -H "Host: anyway.ro" >/dev/null; then
    echo "✅ Local HTTPS access working"
else
    echo "⚠️ Local HTTPS access failed"
fi

# Test HTTP redirect
if curl -s http://localhost --max-time 10 -H "Host: anyway.ro" | grep -q "301\|302"; then
    echo "✅ HTTP to HTTPS redirect working"
else
    echo "⚠️ HTTP redirect not working"
fi

echo ""
echo "📊 Step 9: Show logs..."
echo "====================="

echo "Recent nginx logs:"
docker-compose logs nginx --tail=10

echo ""
echo "Recent app logs:"
docker-compose logs flight-schedule --tail=10

echo ""
echo "✅ QUICK FIX COMPLETED!"
echo "======================"

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Test anyway.ro in browser: https://anyway.ro"
echo "2. If working, replace nginx.conf.temp with nginx.conf"
echo "3. Test victoriaocara.com: https://victoriaocara.com"
echo "4. Monitor logs: docker-compose logs -f"
echo ""

echo "🔧 TO FINALIZE:"
echo "==============="
echo "If everything works:"
echo "mv nginx.conf.temp nginx.conf"
echo "docker-compose restart nginx"
echo ""

echo "📊 MONITORING:"
echo "============="
echo "- Status: docker-compose ps"
echo "- Logs: docker-compose logs -f"
echo "- Test: curl -I https://anyway.ro"
echo ""

echo "Fix completed at $(date)"