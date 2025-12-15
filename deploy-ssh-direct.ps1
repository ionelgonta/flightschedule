#!/usr/bin/env pwsh

# Deploy direct prin SSH
Write-Host "🚀 Deploy AdSense prin SSH Direct" -ForegroundColor Green

$server = "root@23.88.113.154"
$projectPath = "/opt/anyway-flight-schedule"

# Build local
Write-Host "🔨 Building..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build OK!" -ForegroundColor Green

# Comenzi pentru server
$commands = @(
    "cd $projectPath",
    "mkdir -p app/api/admin/adsense",
    "echo 'Directory created'",
    "npm run build",
    "docker-compose down",
    "docker-compose up -d --build",
    "sleep 10",
    "curl -s https://anyway.ro/api/admin/adsense || echo 'API not ready yet'"
)

$fullCommand = $commands -join " && "

Write-Host "🔗 Connecting to server..." -ForegroundColor Yellow
Write-Host "Command: ssh $server `"$fullCommand`"" -ForegroundColor Gray

# Execută SSH
try {
    & ssh $server $fullCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH commands executed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SSH completed with exit code: $LASTEXITCODE" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ SSH error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API
Write-Host ""
Write-Host "🧪 Testing API..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "https://anyway.ro/api/admin/adsense" -Method GET -TimeoutSec 10
    Write-Host "✅ API Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API not ready yet: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Check: https://anyway.ro/admin" -ForegroundColor Cyan