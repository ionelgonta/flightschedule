# Deploy API Tracker System - Sistem complet de contorizare request-uri AeroDataBox
# Implementeaza tracking exact al tuturor request-urilor catre API cu persistenta in baza de date

Write-Host "Deploying API Tracker System to Live Server..." -ForegroundColor Green

# Server connection details
$serverUser = "root"
$serverHost = "anyway.ro"
$deployPath = "/opt/anyway-flight-schedule"

Write-Host "Preparing API tracker files..." -ForegroundColor Yellow

# Files to deploy for API tracker
$filesToDeploy = @(
    "lib/apiRequestTracker.ts",
    "lib/aerodataboxService.ts",
    "app/api/admin/api-tracker/route.ts",
    "app/admin/page.tsx"
)

# Create deployment directory
New-Item -ItemType Directory -Force -Path "deploy-temp" | Out-Null

# Copy files to deployment directory
foreach ($file in $filesToDeploy) {
    if (Test-Path $file) {
        $destDir = Split-Path "deploy-temp/$file" -Parent
        if ($destDir -and !(Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        Copy-Item $file "deploy-temp/$file" -Force
        Write-Host "Prepared: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "Uploading API tracker files to server..." -ForegroundColor Yellow

# Upload files via SCP
scp -r deploy-temp/* ${serverUser}@${serverHost}:${deployPath}/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Setting up data directory and building..." -ForegroundColor Yellow

# SSH commands to setup and build
$sshCommands = "cd $deployPath; echo 'Creating data directory...'; mkdir -p data; chmod 755 data; echo 'Building Next.js with API tracker...'; npm run build; echo 'Restarting PM2 process...'; NODE_ENV=production pm2 restart anyway-ro --update-env; echo 'Verifying API tracker setup...'; ls -la data/"

ssh ${serverUser}@${serverHost} $sshCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "API Tracker deployment completed successfully!" -ForegroundColor Green
    Write-Host "API request tracking is now active!" -ForegroundColor Cyan
    
    Write-Host "API Tracker Features:" -ForegroundColor Yellow
    Write-Host "- Exact request counting for all AeroDataBox API calls" -ForegroundColor Green
    Write-Host "- Persistent storage in JSON database" -ForegroundColor Green
    Write-Host "- Detailed statistics by airport and request type" -ForegroundColor Green
    Write-Host "- Real-time tracking in admin interface" -ForegroundColor Green
    Write-Host "- Request success/failure monitoring" -ForegroundColor Green
    Write-Host "- Performance metrics (duration, response size)" -ForegroundColor Green
    
    Write-Host "Access API Tracker:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "2. Navigate to 'Cache Management' tab" -ForegroundColor White
    Write-Host "3. View 'Statistici API Tracker' section" -ForegroundColor White
    Write-Host "4. Monitor exact request counts by airport/type" -ForegroundColor White
    
} else {
    Write-Host "Deployment failed during build/restart!" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item -Recurse -Force "deploy-temp" -ErrorAction SilentlyContinue

Write-Host "API Tracker system deployment completed!" -ForegroundColor Green
Write-Host "All AeroDataBox API requests are now being tracked with exact counts." -ForegroundColor Cyan