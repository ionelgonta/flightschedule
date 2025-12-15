#!/usr/bin/env pwsh

Write-Host "Checking nginx and fixing both sites - NO port changes" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Check nginx status and reload configuration
ssh "${USER}@${SERVER}" @"
nginx -t
systemctl reload nginx
systemctl status nginx --no-pager -l
"@

Write-Host "Nginx configuration reloaded!" -ForegroundColor Green