#!/bin/bash

# Setup script pentru serverul Hetzner
SERVER_IP="23.88.113.154"
OLD_PASSWORD="ba94wtRqEnMu773TpWEr"
NEW_PASSWORD="FlightSchedule2024!"
DOMAIN="victoriaocara.com"

echo "🚀 Configurez serverul Hetzner pentru Flight Schedule..."

# Instalează expect dacă nu există
if ! command -v expect &> /dev/null; then
    echo "📦 Instalez expect..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y expect
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install expect
    else
        echo "❌ Te rog să instalezi expect manual"
        exit 1
    fi
fi

echo "🔐 Schimb parola pe server..."

# Script expect pentru schimbarea parolei
expect << EOF
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@$SERVER_IP
expect {
    "password:" {
        send "$OLD_PASSWORD\r"
        exp_continue
    }
    "New password:" {
        send "$NEW_PASSWORD\r"
        exp_continue
    }
    "Retype new password:" {
        send "$NEW_PASSWORD\r"
        exp_continue
    }
    "# " {
        send "echo 'Parola schimbată cu succes'\r"
        send "exit\r"
    }
    timeout {
        puts "Timeout - nu am putut schimba parola"
        exit 1
    }
}
expect eof
EOF

echo "✅ Parola schimbată cu succes!"
echo "🔐 Noua parolă: $NEW_PASSWORD"

# Acum continuă cu deployment-ul
echo "🚀 Încep deployment-ul..."

# Testează conexiunea cu noua parolă
ssh -o StrictHostKeyChecking=no root@$SERVER_IP "echo 'Conexiune SSH reușită cu noua parolă'"

if [ $? -eq 0 ]; then
    echo "✅ Conexiunea SSH funcționează!"
    
    # Rulează deployment-ul
    echo "📦 Încep instalarea aplicației..."
    
    # Upload fișiere
    echo "📤 Upload fișiere proiect..."
    rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
        ./ root@$SERVER_IP:/opt/flight-schedule/
    
    # Rulează setup pe server
    ssh root@$SERVER_IP << 'ENDSSH'
        set -e
        
        echo "🔧 Actualizez sistemul..."
        apt update && apt upgrade -y
        
        echo "🐳 Instalez Docker..."
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl enable docker
            systemctl start docker
        fi
        
        echo "🐙 Instalez Docker Compose..."
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        echo "📁 Configurez proiectul..."
        cd /opt/flight-schedule
        
        # Creează directorul SSL
        mkdir -p ssl
        
        # Generează certificat SSL temporar
        if [ ! -f ssl/cert.pem ]; then
            echo "🔒 Generez certificat SSL temporar..."
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/key.pem \
                -out ssl/cert.pem \
                -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN=victoriaocara.com"
        fi
        
        # Actualizează configurația nginx cu domeniul
        sed -i "s/your-domain.com/victoriaocara.com/g" nginx.conf
        
        echo "🏗️ Build și pornesc containerele..."
        docker-compose down || true
        docker-compose build --no-cache
        docker-compose up -d
        
        echo "🔥 Configurez firewall..."
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        
        echo "✅ Deployment complet!"
        echo "🌐 Site-ul este disponibil la: https://victoriaocara.com"
        echo "🎯 Admin panel: https://victoriaocara.com/admin"
        
ENDSSH
    
    echo "🎉 Deployment finalizat cu succes!"
    echo ""
    echo "📋 Pașii următori:"
    echo "1. 🌐 Pointează DNS-ul domeniului victoriaocara.com către $SERVER_IP"
    echo "2. 🔒 Înlocuiește certificatul SSL temporar cu Let's Encrypt"
    echo "3. 🔐 Schimbă parola admin din /admin (actuala: admin123)"
    echo "4. 📊 Configurează Google AdSense cu Publisher ID-ul tău"
    
else
    echo "❌ Conexiunea SSH a eșuat!"
    exit 1
fi