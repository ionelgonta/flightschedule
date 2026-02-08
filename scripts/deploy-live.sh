#!/bin/bash
# Deploy anyway.ro (flightschedule) to live server
# FOLLOWS: .kiro/steering/nginx-deployment-rules.md
# Ports: anyway.ro=3000, victoriaocara=3001, OTA=3002

set -e

REMOTE_USER="${DEPLOY_USER:-root}"
REMOTE_HOST="${DEPLOY_HOST}"
REMOTE_DIR="/opt/anyway-flight-schedule"

echo "=============================================="
echo "  DEPLOY anyway.ro → LIVE (nginx rules)"
echo "=============================================="
echo ""

# --- Local: build ---
echo "[1/4] Building locally..."
npm run build
echo "     Build OK."
echo ""

if [ -z "$REMOTE_HOST" ]; then
  echo "[2/4] No DEPLOY_HOST set. Run the following ON THE SERVER after syncing:"
  echo ""
  echo "  # On server (after git pull or rsync):"
  echo "  cd $REMOTE_DIR"
  echo "  npm ci --omit=dev  # or: npm install --production"
  echo "  nginx -t           # MUST pass before reload"
  echo "  pm2 restart all    # or: pm2 restart anyway-ro"
  echo "  systemctl reload nginx"
  echo ""
  echo "  # Verify (from nginx-deployment-rules):"
  echo "  pm2 list"
  echo "  curl -I https://anyway.ro"
  echo "  curl -I https://anyway.ro/pass/api/health"
  echo ""
  exit 0
fi

# --- Remote: sync + install + restart ---
echo "[2/4] Syncing to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR ..."
rsync -avz \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude data/backups \
  --exclude data/*.log \
  --exclude data/api-requests.log \
  --exclude uploads \
  --exclude .env \
  --exclude .env.local \
  --exclude '*.log' \
  . "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
echo "     Sync OK."
echo ""

echo "[3/4] On server: install, test nginx, restart PM2, reload nginx..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && npm ci --omit=dev && nginx -t && pm2 restart all && systemctl reload nginx"
echo ""

echo "[4/4] Verification..."
ssh "$REMOTE_USER@$REMOTE_HOST" "pm2 list; echo '---'; curl -sI https://anyway.ro | head -1; curl -sI https://anyway.ro/pass/api/health | head -1"
echo ""
echo "Done. Check: https://anyway.ro and https://anyway.ro/pass/admin"
