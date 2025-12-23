#!/bin/bash

# Script pentru deployment cache restaurat pe serverul de producție
# Respectă toate regulile de siguranță din troubleshooting-guide.md

set -e  # Exit on error

echo "🚀 DEPLOYMENT CACHE RESTAURAT PE PRODUCȚIE"
echo "=========================================="
echo ""

# Configurare
SERVER="anyway.ro"
USER="root"
REMOTE_PATH="/opt/anyway-flight-schedule"
LOCAL_DATA_DIR="./data"

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funcție pentru afișare mesaje
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verifică că fișierele locale există
echo "📋 Verificare fișiere locale..."
if [ ! -f "$LOCAL_DATA_DIR/flights_cache.json" ]; then
    log_error "Fișierul flights_cache.json nu există!"
    exit 1
fi

if [ ! -f "$LOCAL_DATA_DIR/historical-flights.db" ]; then
    log_warning "Fișierul historical-flights.db nu există (opțional)"
fi

log_info "Fișiere locale găsite"

# Verifică dimensiunea fișierelor
CACHE_SIZE=$(du -h "$LOCAL_DATA_DIR/flights_cache.json" | cut -f1)
log_info "Dimensiune flights_cache.json: $CACHE_SIZE"

# Numără intrările din cache
CACHE_ENTRIES=$(grep -o '"flightNumber"' "$LOCAL_DATA_DIR/flights_cache.json" | wc -l)
log_info "Intrări în cache: $CACHE_ENTRIES zboruri"

if [ "$CACHE_ENTRIES" -lt 100 ]; then
    log_warning "Cache-ul pare să aibă prea puține intrări ($CACHE_ENTRIES)"
    read -p "Continui deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment anulat"
        exit 1
    fi
fi

echo ""
echo "🔐 Conectare la server..."

# Verifică conexiunea SSH
if ! ssh -o ConnectTimeout=5 "$USER@$SERVER" "echo 'Conexiune OK'" > /dev/null 2>&1; then
    log_error "Nu se poate conecta la $SERVER"
    exit 1
fi

log_info "Conexiune SSH stabilită"

echo ""
echo "💾 Backup cache existent pe server..."

# Creează backup pe server
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ssh "$USER@$SERVER" << EOF
    cd $REMOTE_PATH
    
    # Creează director backup dacă nu există
    mkdir -p data/backups
    
    # Backup fișiere existente
    if [ -f data/flights_cache.json ]; then
        cp data/flights_cache.json data/backups/flights_cache_backup_${BACKUP_TIMESTAMP}.json
        echo "✓ Backup flights_cache.json creat"
    fi
    
    if [ -f data/cache-data.json ]; then
        cp data/cache-data.json data/backups/cache-data_backup_${BACKUP_TIMESTAMP}.json
        echo "✓ Backup cache-data.json creat"
    fi
    
    if [ -f data/historical-flights.db ]; then
        cp data/historical-flights.db data/backups/historical-flights_backup_${BACKUP_TIMESTAMP}.db
        echo "✓ Backup historical-flights.db creat"
    fi
EOF

log_info "Backup complet pe server"

echo ""
echo "📤 Upload fișiere cache..."

# Upload flights_cache.json
scp "$LOCAL_DATA_DIR/flights_cache.json" "$USER@$SERVER:$REMOTE_PATH/data/flights_cache.json"
log_info "flights_cache.json uploaded"

# Upload cache-data.json dacă există
if [ -f "$LOCAL_DATA_DIR/cache-data.json" ]; then
    scp "$LOCAL_DATA_DIR/cache-data.json" "$USER@$SERVER:$REMOTE_PATH/data/cache-data.json"
    log_info "cache-data.json uploaded"
fi

# Upload historical-flights.db dacă există
if [ -f "$LOCAL_DATA_DIR/historical-flights.db" ]; then
    scp "$LOCAL_DATA_DIR/historical-flights.db" "$USER@$SERVER:$REMOTE_PATH/data/historical-flights.db"
    log_info "historical-flights.db uploaded"
fi

echo ""
echo "🔧 Verificare permisiuni pe server..."

ssh "$USER@$SERVER" << EOF
    cd $REMOTE_PATH/data
    
    # Setează permisiuni corecte
    chmod 644 flights_cache.json
    chmod 644 cache-data.json 2>/dev/null || true
    chmod 644 historical-flights.db 2>/dev/null || true
    
    # Verifică owner
    chown -R root:root .
    
    echo "✓ Permisiuni setate"
EOF

log_info "Permisiuni configurate"

echo ""
echo "🔄 Restart aplicație..."

# Restart PM2 (NU nginx - conform troubleshooting-guide.md)
ssh "$USER@$SERVER" << EOF
    cd $REMOTE_PATH
    
    # Restart PM2
    pm2 restart anyway-ro
    
    echo "✓ PM2 restartat"
    
    # Așteaptă 3 secunde pentru inițializare
    sleep 3
    
    # Verifică status
    pm2 list | grep anyway-ro
EOF

log_info "Aplicație restartată"

echo ""
echo "🧪 Testare deployment..."

# Așteaptă puțin pentru ca aplicația să se încarce
sleep 5

# Test API
echo "Testare API statistici..."
RESPONSE=$(curl -s "https://anyway.ro/api/statistici-aeroporturi")

# Verifică dacă răspunsul conține statistici
if echo "$RESPONSE" | grep -q '"statistics":{'; then
    log_info "API returnează statistici!"
    
    # Numără aeroporturile cu statistici
    AIRPORTS_WITH_STATS=$(echo "$RESPONSE" | grep -o '"statistics":{' | wc -l)
    log_info "Aeroporturi cu statistici: $AIRPORTS_WITH_STATS"
else
    log_warning "API nu returnează statistici încă"
fi

echo ""
echo "📊 Verificare finală pe server..."

ssh "$USER@$SERVER" << EOF
    cd $REMOTE_PATH
    
    echo "📁 Dimensiuni fișiere:"
    ls -lh data/flights_cache.json data/cache-data.json 2>/dev/null || true
    
    echo ""
    echo "📈 Intrări în cache:"
    grep -o '"flightNumber"' data/flights_cache.json | wc -l
    
    echo ""
    echo "🔍 Status PM2:"
    pm2 list | grep anyway-ro
    
    echo ""
    echo "📝 Ultimele 10 linii din log:"
    pm2 logs anyway-ro --lines 10 --nostream
EOF

echo ""
echo "=========================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLET!${NC}"
echo "=========================================="
echo ""
echo "📋 Următorii pași:"
echo "   1. Verifică https://anyway.ro/statistici-aeroporturi"
echo "   2. Verifică https://anyway.ro/api/statistici-aeroporturi"
echo "   3. Monitorizează logs: ssh root@anyway.ro 'pm2 logs anyway-ro'"
echo ""
echo "🔙 Rollback (dacă e necesar):"
echo "   ssh root@anyway.ro 'cd $REMOTE_PATH/data && cp backups/flights_cache_backup_${BACKUP_TIMESTAMP}.json flights_cache.json && pm2 restart anyway-ro'"
echo ""
