#!/usr/bin/env pwsh

Write-Host "Uploading homepage directly..." -ForegroundColor Green

# Try different server paths that have been used
$SERVER = "anyway.ro"
$USER = "root"

$paths = @(
    "/opt/anyway-flight-schedule",
    "/var/www/anyway.ro", 
    "/var/www/zbor.md"
)

foreach ($path in $paths) {
    Write-Host "Trying path: $path" -ForegroundColor Yellow
    
    # Try to upload homepage
    scp "app/page.tsx" "${USER}@${SERVER}:${path}/app/" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Uploaded to $path" -ForegroundColor Green
        
        # Try to build and restart
        ssh "${USER}@${SERVER}" "cd ${path} && npm run build && pm2 restart anyway-ro" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Built and restarted from $path" -ForegroundColor Green
            break
        } else {
            Write-Host "Failed to build/restart from $path" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Failed to upload to $path" -ForegroundColor Yellow
    }
}

Write-Host "Direct upload attempt completed" -ForegroundColor Cyan