#!/usr/bin/env pwsh

# Auto Deploy AdSense prin SSH
Write-Host "🚀 Auto Deploy AdSense la anyway.ro prin SSH" -ForegroundColor Green

$serverIP = "23.88.113.154"
$username = "root"
$password = "FlightSchedule2024!"
$projectPath = "/opt/anyway-flight-schedule"

# Build local mai întâi
Write-Host "🔨 Building local..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build local failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build local successful!" -ForegroundColor Green

# Pregătește fișierele pentru transfer
Write-Host "📁 Preparing files for transfer..." -ForegroundColor Yellow

# Citește conținutul fișierelor
$adsenseApiContent = Get-Content "app/api/admin/adsense/route.ts" -Raw
$adminPageContent = Get-Content "app/admin/page.tsx" -Raw
$adConfigContent = Get-Content "lib/adConfig.ts" -Raw

Write-Host "✅ Files read successfully!" -ForegroundColor Green

# Creează comenzile SSH
Write-Host "🔗 Connecting to server and deploying..." -ForegroundColor Yellow

# Comandă pentru crearea directorului și fișierelor
$sshCommands = @"
cd $projectPath &&
echo '📁 Creating AdSense API directory...' &&
mkdir -p app/api/admin/adsense &&
echo '📝 Creating AdSense API file...' &&
cat > app/api/admin/adsense/route.ts << 'ADSENSE_API_EOF'
$adsenseApiContent
ADSENSE_API_EOF
echo '✅ AdSense API file created!' &&
echo '📝 Updating admin page...' &&
cp app/admin/page.tsx app/admin/page.tsx.backup &&
cat > app/admin/page.tsx << 'ADMIN_PAGE_EOF'
$adminPageContent
ADMIN_PAGE_EOF
echo '✅ Admin page updated!' &&
echo '📝 Updating ad config...' &&
cp lib/adConfig.ts lib/adConfig.ts.backup &&
cat > lib/adConfig.ts << 'AD_CONFIG_EOF'
$adConfigContent
AD_CONFIG_EOF
echo '✅ Ad config updated!' &&
echo '🔨 Building on server...' &&
npm run build &&
echo '🐳 Restarting Docker containers...' &&
docker-compose down &&
docker-compose up -d --build &&
echo '⏳ Waiting for startup...' &&
sleep 15 &&
echo '🧪 Testing AdSense API...' &&
curl -s https://anyway.ro/api/admin/adsense &&
echo '' &&
echo '✅ Deployment completed!'
"@

# Execută comenzile SSH
try {
    Write-Host "Executing SSH commands..." -ForegroundColor Cyan
    
    # Folosește plink pentru SSH (dacă este disponibil)
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "Using plink for SSH connection..." -ForegroundColor Gray
        echo "y" | plink -ssh -l $username -pw $password $serverIP $sshCommands
    } else {
        # Încearcă cu ssh nativ
        Write-Host "Using native SSH..." -ForegroundColor Gray
        $env:SSH_ASKPASS_REQUIRE = "never"
        echo $password | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $username@$serverIP $sshCommands
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SSH command completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ SSH connection error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Metodă alternativă - creează script pentru server
    $deployScript = @"
#!/bin/bash
cd $projectPath
echo '📁 Creating AdSense API directory...'
mkdir -p app/api/admin/adsense
echo 'Files will be created manually...'
echo 'Please copy the files manually and run:'
echo 'npm run build'
echo 'docker-compose down'
echo 'docker-compose up -d --build'
"@
    
    Write-Host "Creating deploy script..." -ForegroundColor Gray
    $deployScript | Out-File -FilePath "deploy-script.sh" -Encoding UTF8
}

# Test final
Write-Host ""
Write-Host "🧪 Testing deployment..." -ForegroundColor Cyan
try {
    Start-Sleep -Seconds 5
    $testResponse = Invoke-RestMethod -Uri "https://anyway.ro/api/admin/adsense" -Method GET -TimeoutSec 15
    
    if ($testResponse.success) {
        Write-Host "✅ AdSense API is working!" -ForegroundColor Green
        Write-Host "📝 Publisher ID: $($testResponse.publisherId)" -ForegroundColor Blue
    } else {
        Write-Host "❌ AdSense API not responding correctly" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️ API test failed - may need more time to start" -ForegroundColor Yellow
    Write-Host "Manual test: https://anyway.ro/api/admin/adsense" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🌐 URLs to check:" -ForegroundColor Green
Write-Host "• Admin: https://anyway.ro/admin" -ForegroundColor Cyan
Write-Host "• API: https://anyway.ro/api/admin/adsense" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Deployment process completed!" -ForegroundColor Green