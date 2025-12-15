#!/usr/bin/env pwsh

Write-Host "Stopping Docker containers properly" -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Stop specific Docker containers
ssh "${USER}@${SERVER}" "docker stop flight-schedule-nginx"
ssh "${USER}@${SERVER}" "docker stop flight-schedule-app"
ssh "${USER}@${SERVER}" "systemctl start nginx"
ssh "${USER}@${SERVER}" "systemctl status nginx --no-pager"

Write-Host "Docker containers stopped, nginx started!" -ForegroundColor Green