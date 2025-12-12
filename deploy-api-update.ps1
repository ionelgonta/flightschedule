# Deploy API Update Script pentru anyway.ro
# Actualizează aplicația cu integrarea API.Market

Write-Host "🚀 Starting API.Market deployment for anyway.ro..." -ForegroundColor Green

# Configurații
$PROJECT_DIR = "/opt/anyway-flight-schedule"
$API_KEY = "cmj2k3c1p000djy044wbqprap"

# Navighează la directorul proiectului
Set-Location $PROJECT_DIR
Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Blue

# Backup configurația existentă
if (Test-Path ".env.local") {
    Write-Host "💾 Backing up existing .env.local..." -ForegroundColor Yellow
    $backupName = ".env.local.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item ".env.local" $backupName
}

# Creează configurația pentru API.Market
Write-Host "⚙️ Creating API.Market configuration..." -ForegroundColor Blue

$envContent = @"
# API.Market Configuration pentru AeroDataBox
NEXT_PUBLIC_FLIGHT_API_KEY=$API_KEY
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_CACHE_DURATION=600000
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_API_RATE_LIMIT=150
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_SCHEDULER_ENABLED=true
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3
NEXT_PUBLIC_DEBUG_FLIGHTS=false

# Google AdSense (dacă este configurat)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-your-id-here
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Configuration created successfully" -ForegroundColor Green

# Pull ultimele modificări din Git
Write-Host "📥 Pulling latest changes from Git..." -ForegroundColor Blue
try {
    git pull origin main
} catch {
    Write-Host "⚠️ Git pull failed, continuing with local changes..." -ForegroundColor Yellow
}

# Rebuild aplicația cu noua configurație
Write-Host "🔨 Building application with new API configuration..." -ForegroundColor Blue
$buildResult = docker-compose build --no-cache app

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Restoring backup..." -ForegroundColor Red
    $backupFiles = Get-ChildItem ".env.local.backup.*" | Sort-Object LastWriteTime -Descending
    if ($backupFiles.Count -gt 0) {
        Copy-Item $backupFiles[0].FullName ".env.local"
    }
    exit 1
}

# Restart serviciile
Write-Host "🔄 Restarting services..." -ForegroundColor Blue
docker-compose up -d

# Verifică statusul serviciilor
Write-Host "🔍 Checking service status..." -ForegroundColor Blue
Start-Sleep 10
docker-compose ps

# Test API endpoint
Write-Host "🧪 Testing API endpoints..." -ForegroundColor Blue
Start-Sleep 5

# Test local API
Write-Host "Testing local API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/flights/OTP/arrivals" -TimeoutSec 10
    Write-Host "API Response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test aplicația
Write-Host "Testing application..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10
    Write-Host "App Response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "App test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Afișează logs pentru debugging
Write-Host "📋 Recent application logs:" -ForegroundColor Blue
docker-compose logs app --tail=20

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   - Local: http://localhost:8080"
Write-Host "   - Public: https://anyway.ro (port 8080)"
Write-Host "   - SSL: https://anyway.ro:8443"
Write-Host ""
Write-Host "🔧 API Configuration:" -ForegroundColor Cyan
Write-Host "   - Provider: AeroDataBox via API.Market"
Write-Host "   - Rate Limit: 150 requests/minute"
Write-Host "   - Cache Duration: 10 minutes"
Write-Host "   - Auto Refresh: 10 minutes"
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Cyan
Write-Host "   - Logs: docker-compose logs app -f"
Write-Host "   - Status: docker-compose ps"
Write-Host "   - API Test: curl http://localhost:8080/api/flights/OTP/arrivals"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test flight data loading on https://anyway.ro/airport/OTP/arrivals"
Write-Host "2. Monitor logs for API errors: docker-compose logs app -f"
Write-Host "3. Check browser console for any JavaScript errors"
Write-Host "4. Verify scheduler is running and updating cache"
Write-Host ""