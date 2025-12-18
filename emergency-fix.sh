#!/bin/bash
echo "=== EMERGENCY SERVER FIX ==="
echo "Stopping conflicting Docker containers..."
docker stop $(docker ps -q) 2>/dev/null
echo "Starting nginx..."
systemctl start nginx
echo "Restarting PM2 processes..."
pm2 restart anyway-ro
pm2 restart victoriaocara
echo "=== STATUS CHECK ==="
systemctl status nginx --no-pager
pm2 list
echo "=== TESTING SITES ==="
curl -I https://anyway.ro
curl -I https://victoriaocara.com
echo "=== FIX COMPLETE ==="