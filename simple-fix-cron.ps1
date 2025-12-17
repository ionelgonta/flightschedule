#!/usr/bin/env pwsh

Write-Host "=== FIX MULTIPLE CRON JOBS ===" -ForegroundColor Cyan

# Oprește procese locale
Write-Host "Oprind procese locale..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Build
Write-Host "Building..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build reusit!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Fix aplicat cu succes!" -ForegroundColor Green