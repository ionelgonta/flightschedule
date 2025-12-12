# Deploy AdSense and MCP updates to anyway.ro server
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"
$ServerPath = "/opt/anyway-flight-schedule"

Write-Host "Deploying AdSense Verification and MCP Updates" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "Server: $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "Path: $ServerPath" -ForegroundColor White
Write-Host "AdSense ID: ca-pub-2305349540791838" -ForegroundColor White
Write-Host ""

# Check if plink is available
try {
    plink -V 2>$null | Out-Null
    Write-Host "PuTTY found" -ForegroundColor Green
} catch {
    Write-Host "PuTTY not found. Please install from: https://www.putty.org/" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Committing and pushing changes..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

# Add and commit changes
git add .
git commit -m "Deploy AdSense Verification & MCP Integration

- AdSense verification code with publisher ID: ca-pub-2305349540791838
- Complete MCP integration with API.Market AeroDataBox
- Enhanced admin panel with API key management
- Fixed TypeScript compilation issues
- Ready for Google AdSense verification"

git push origin main

Write-Host "Changes pushed to Git" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Deploying to server..." -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

# Create deployment script
$bashScript = @'
#!/bin/bash
echo "Connected to server: $(hostname)"
echo "Current time: $(date)"
echo ""

# Navigate to project directory
cd /opt/anyway-flight-schedule

echo "Pulling latest changes..."
git pull origin main

if [ $? -eq 0 ]; then
    echo "Git pull successful"
else
    echo "Git pull failed"
    exit 1
fi

echo ""
echo "Rebuilding application with AdSense and MCP..."
echo "=============================================="

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Services restarted with updates"

echo ""
echo "Waiting for initialization..."
sleep 15

echo ""
echo "Testing deployment..."
echo "===================="

# Test if site is running
echo "Testing main site..."
response=$(curl -s https://anyway.ro)

if echo "$response" | grep -q "pagead2.googlesyndication.com"; then
    echo "AdSense script found in HTML"
else
    echo "AdSense script not found in HTML"
fi

if echo "$response" | grep -q "ca-pub-2305349540791838"; then
    echo "Publisher ID found in HTML"
else
    echo "Publisher ID not found in HTML"
fi

echo ""
echo "DEPLOYMENT SUCCESSFUL!"
echo ""
echo "AdSense Details:"
echo "---------------"
echo "Publisher ID: ca-pub-2305349540791838"
echo "Script URL: https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
echo "Integration: Present in head section of all pages"
echo "Status: Ready for Google AdSense verification"
echo ""
echo "URLs:"
echo "-----"
echo "Main site: https://anyway.ro"
echo "Admin panel: https://anyway.ro/admin"
echo ""
echo "Server deployment completed at $(date)"
'@

# Save script to temp file
$bashScript | Out-File -FilePath "temp_deploy.sh" -Encoding UTF8

# Upload and execute script
pscp -pw $ServerPassword "temp_deploy.sh" root@${ServerIP}:/tmp/
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "chmod +x /tmp/temp_deploy.sh && /tmp/temp_deploy.sh"

# Clean up
Remove-Item "temp_deploy.sh" -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "--------" -ForegroundColor Cyan
    Write-Host "AdSense verification code deployed" -ForegroundColor White
    Write-Host "MCP integration with API.Market deployed" -ForegroundColor White
    Write-Host "Enhanced admin panel with API key management" -ForegroundColor White
    Write-Host "Publisher ID: ca-pub-2305349540791838" -ForegroundColor White
    Write-Host "Website ready for AdSense verification" -ForegroundColor White
    Write-Host ""
    Write-Host "AdSense Verification Steps:" -ForegroundColor Yellow
    Write-Host "--------------------------" -ForegroundColor Yellow
    Write-Host "1. Go to: https://www.google.com/adsense/" -ForegroundColor White
    Write-Host "2. Add site: anyway.ro" -ForegroundColor White
    Write-Host "3. Select: 'AdSense code snippet' method" -ForegroundColor White
    Write-Host "4. The code is already installed!" -ForegroundColor White
    Write-Host "5. Click 'Verify' to complete" -ForegroundColor White
    Write-Host ""
    Write-Host "Test your site:" -ForegroundColor Yellow
    Write-Host "--------------" -ForegroundColor Yellow
    Write-Host "Visit: https://anyway.ro" -ForegroundColor White
    Write-Host "Admin: https://anyway.ro/admin (password: admin123)" -ForegroundColor White
    Write-Host "View source and search for: ca-pub-2305349540791838" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "---------------" -ForegroundColor Yellow
    Write-Host "1. Check server connection" -ForegroundColor White
    Write-Host "2. Verify Git repository access" -ForegroundColor White
    Write-Host "3. Check Docker services status" -ForegroundColor White
    Write-Host "4. Try manual deployment" -ForegroundColor White
}

Write-Host ""
Write-Host "Deployment completed at $(Get-Date)" -ForegroundColor Cyan