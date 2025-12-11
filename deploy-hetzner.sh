#!/bin/bash

# Flight Schedule - Hetzner Deployment Script
# Acest script automatizează deployment-ul pe serverul Hetzner

set -e

echo "🚀 Starting Flight Schedule deployment on Hetzner..."

# Configurare variabile
SERVER_IP="YOUR_SERVER_IP"
SERVER_USER="root"
DOMAIN="your-domain.com"
PROJECT_NAME="flight-schedule"

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifică dacă variabilele sunt setate
if [ "$SERVER_IP" = "YOUR_SERVER_IP" ]; then
    print_error "Te rog să setezi SERVER_IP în script!"
    exit 1
fi

print_status "Connecting to server $SERVER_IP..."

# Creează directorul de proiect pe server
ssh $SERVER_USER@$SERVER_IP "mkdir -p /opt/$PROJECT_NAME"

print_status "Uploading project files..."

# Upload fișiere proiect
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
    ./ $SERVER_USER@$SERVER_IP:/opt/$PROJECT_NAME/

print_status "Setting up server environment..."

# Rulează comenzile pe server
ssh $SERVER_USER@$SERVER_IP << EOF
    set -e
    
    # Update system
    apt update && apt upgrade -y
    
    # Install Docker if not installed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose if not installed
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Navigate to project directory
    cd /opt/$PROJECT_NAME
    
    # Create SSL directory
    mkdir -p ssl
    
    # Generate self-signed certificate (replace with real certificate)
    if [ ! -f ssl/cert.pem ]; then
        echo "Generating self-signed SSL certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN=$DOMAIN"
    fi
    
    # Update nginx config with domain
    sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf
    
    # Build and start containers
    echo "Building Docker containers..."
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
    
    # Setup firewall
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    echo "✅ Deployment completed!"
    echo "🌐 Your site should be available at: https://$DOMAIN"
    echo "🎯 Admin panel: https://$DOMAIN/admin (password: admin123)"
    
EOF

print_success "Deployment completed successfully!"
print_status "Your Flight Schedule website is now running on Hetzner!"
print_warning "Don't forget to:"
echo "  1. Point your domain DNS to $SERVER_IP"
echo "  2. Replace self-signed certificate with real SSL certificate"
echo "  3. Update admin password in production"
echo "  4. Configure Google AdSense with your Publisher ID"

print_status "Useful commands:"
echo "  - Check logs: ssh $SERVER_USER@$SERVER_IP 'cd /opt/$PROJECT_NAME && docker-compose logs -f'"
echo "  - Restart: ssh $SERVER_USER@$SERVER_IP 'cd /opt/$PROJECT_NAME && docker-compose restart'"
echo "  - Update: Run this script again"