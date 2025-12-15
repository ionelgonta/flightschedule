#!/usr/bin/env pwsh

Write-Host "Simple nginx fix" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Simple commands to fix nginx
ssh "${USER}@${SERVER}" "netstat -tulpn | grep :80"
ssh "${USER}@${SERVER}" "netstat -tulpn | grep :443"
ssh "${USER}@${SERVER}" "pkill -f nginx"
ssh "${USER}@${SERVER}" "systemctl start nginx"
ssh "${USER}@${SERVER}" "systemctl status nginx"

Write-Host "Nginx fix attempted!" -ForegroundColor Green