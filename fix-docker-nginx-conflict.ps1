#!/usr/bin/env pwsh

Write-Host "Fixing Docker-Nginx port conflict" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Stop Docker containers using ports 80/443, then start nginx
ssh "${USER}@${SERVER}" "docker ps"
ssh "${USER}@${SERVER}" "docker stop \$(docker ps -q)"
ssh "${USER}@${SERVER}" "systemctl start nginx"
ssh "${USER}@${SERVER}" "systemctl status nginx --no-pager"

Write-Host "Docker-Nginx conflict resolved!" -ForegroundColor Green