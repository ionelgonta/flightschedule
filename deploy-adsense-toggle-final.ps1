# Deploy AdSense Toggle System to anyway.ro
# This script deploys the complete 3-mode toggle system (Active/Inactive/Demo)

Write-Host "🎯 Deploying AdSense Toggle System to anyway.ro..." -ForegroundColor Green

# Server credentials
$server = "23.88.113.154"
$username = "root"
$password = "FlightSchedule2024!"

# Create secure password
$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($username, $securePassword)

Write-Host "📁 Preparing files for deployment..." -ForegroundColor Yellow

# Files to deploy
$filesToDeploy = @(
    "lib/adConfig.ts",
    "components/ads/AdBanner.tsx",
    "ADSENSE_TOGGLE_CONSOLE.md",
    "FINAL_ADSENSE_CONTROL.md",
    "demo-banners.css"
)

# Check if files exist
foreach ($file in $filesToDeploy) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ File not found: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All files found, proceeding with deployment..." -ForegroundColor Green

try {
    # Copy files to server using SCP
    Write-Host "📤 Uploading files to server..." -ForegroundColor Yellow
    
    # Upload lib/adConfig.ts
    scp -o StrictHostKeyChecking=no "lib/adConfig.ts" "$username@$server:/root/flight-app/lib/"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload lib/adConfig.ts" }
    
    # Upload components/ads/AdBanner.tsx
    scp -o StrictHostKeyChecking=no "components/ads/AdBanner.tsx" "$username@$server:/root/flight-app/components/ads/"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload components/ads/AdBanner.tsx" }
    
    # Upload documentation files
    scp -o StrictHostKeyChecking=no "ADSENSE_TOGGLE_CONSOLE.md" "$username@$server:/root/flight-app/"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload ADSENSE_TOGGLE_CONSOLE.md" }
    
    scp -o StrictHostKeyChecking=no "FINAL_ADSENSE_CONTROL.md" "$username@$server:/root/flight-app/"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload FINAL_ADSENSE_CONTROL.md" }
    
    scp -o StrictHostKeyChecking=no "demo-banners.css" "$username@$server:/root/flight-app/"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload demo-banners.css" }
    
    Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
    
    # Connect to server and rebuild
    Write-Host "🔨 Building application on server..." -ForegroundColor Yellow
    
    $buildCommands = @"
cd /root/flight-app
echo "📦 Installing dependencies..."
npm install
echo "🔨 Building Next.js application..."
npm run build
echo "🔄 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build
echo "✅ Deployment completed!"
"@
    
    # Execute commands on server
    echo $buildCommands | ssh -o StrictHostKeyChecking=no "$username@$server" "bash -s"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed successfully!" -ForegroundColor Green
        
        # Test the deployment
        Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
        
        $testCommands = @"
cd /root/flight-app
echo "🔍 Checking if files are in place..."
ls -la lib/adConfig.ts
ls -la components/ads/AdBanner.tsx
echo "🌐 Testing website response..."
curl -I http://localhost:3000 || echo "Website not responding yet, may need a moment to start"
echo "📊 Checking Docker containers..."
docker ps | grep flight-app
"@
        
        echo $testCommands | ssh -o StrictHostKeyChecking=no "$username@$server" "bash -s"
        
        Write-Host ""
        Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Visit https://anyway.ro/admin" -ForegroundColor White
        Write-Host "2. Open browser console (F12)" -ForegroundColor White
        Write-Host "3. Copy and run the script from ADSENSE_TOGGLE_CONSOLE.md" -ForegroundColor White
        Write-Host "4. Test all 3 modes: Active, Inactive, Demo" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 AdSense Toggle Features:" -ForegroundColor Cyan
        Write-Host "• 🟢 Active: Real AdSense with Publisher ID ca-pub-2305349540791838" -ForegroundColor White
        Write-Host "• ⚫ Inactive: Hidden ads" -ForegroundColor White
        Write-Host "• 🟡 Demo: Travel agency banners (Zbor.md, Zbor24.ro, Oozh.com)" -ForegroundColor White
        Write-Host ""
        Write-Host "📍 Available Zones:" -ForegroundColor Cyan
        Write-Host "• Header Banner (728x90)" -ForegroundColor White
        Write-Host "• Sidebar Right (300x600)" -ForegroundColor White
        Write-Host "• Sidebar Square (300x250)" -ForegroundColor White
        Write-Host "• Inline Banner (728x90)" -ForegroundColor White
        Write-Host "• Footer Banner (970x90)" -ForegroundColor White
        Write-Host "• Mobile Banner (320x50)" -ForegroundColor White
        Write-Host "• Partner Banners (728x90, 300x250)" -ForegroundColor White
        
    } else {
        throw "Build failed on server"
    }
    
} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check server connection" -ForegroundColor White
    Write-Host "2. Verify file permissions" -ForegroundColor White
    Write-Host "3. Check Docker containers status" -ForegroundColor White
    Write-Host "4. Review build logs on server" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 AdSense Toggle System deployed successfully to anyway.ro!" -ForegroundColor Green
Write-Host "Visit https://anyway.ro/admin to start using the toggle controls." -ForegroundColor Cyan