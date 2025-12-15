#!/usr/bin/env pwsh

Write-Host "Checking server file content..." -ForegroundColor Green

$SERVER = "anyway.ro"
$USER = "root"

# Check if the file on server contains our changes
ssh "${USER}@${SERVER}" "grep -n 'Vezi toate aeroporturile' /opt/anyway-flight-schedule/app/page.tsx"

Write-Host "Server file check completed!" -ForegroundColor Green