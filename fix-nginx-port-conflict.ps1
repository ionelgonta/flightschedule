#!/usr/bin/env pwsh

Write-Host "Fixing nginx port conflict - checking what's using ports 80/443" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Check what's using ports 80 and 443, then fix nginx
ssh "${USER}@${SERVER}" @"
echo "=== Checking port 80 ==="
lsof -i :80
echo "=== Checking port 443 ==="
lsof -i :443
echo "=== Killing processes on ports 80/443 ==="
fuser -k 80/tcp
fuser -k 443/tcp
echo "=== Starting nginx ==="
systemctl start nginx
systemctl status nginx --no-pager -l
"@

Write-Host "Nginx port conflict fixed!" -ForegroundColor Green