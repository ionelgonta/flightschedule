# Deploy Sitemap Fix - Corectare robots.txt si implementare robots.ts
# Rezolva problemele cu Google Search Console

Write-Host "Deploying Sitemap Fix to Live Server..." -ForegroundColor Green

# Server connection details
$serverUser = "root"
$serverHost = "anyway.ro"
$deployPath = "/opt/anyway-flight-schedule"

Write-Host "Preparing sitemap fix files..." -ForegroundColor Yellow

# Files to deploy for sitemap fix
$filesToDeploy = @(
    "public/robots.txt",
    "app/robots.ts",
    "SITEMAP_GOOGLE_SEARCH_CONSOLE_FIX.md"
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

Write-Host "Uploading sitemap fix files to server..." -ForegroundColor Yellow

# Upload files via SCP
scp -r deploy-temp/* ${serverUser}@${serverHost}:${deployPath}/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Building and restarting services..." -ForegroundColor Yellow

# SSH commands to build and restart
$sshCommands = "cd $deployPath; echo 'Building Next.js with sitemap fix...'; npm run build; echo 'Restarting PM2 process...'; pm2 restart anyway-ro; echo 'Verifying robots.txt fix...'; cat public/robots.txt"

ssh ${serverUser}@${serverHost} $sshCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sitemap fix deployment completed successfully!" -ForegroundColor Green
    Write-Host "Google Search Console sitemap issues should now be resolved!" -ForegroundColor Cyan
    
    Write-Host "Sitemap Fix Summary:" -ForegroundColor Yellow
    Write-Host "- robots.txt corrected with proper sitemap URL" -ForegroundColor Green
    Write-Host "- robots.ts added for Next.js dynamic generation" -ForegroundColor Green
    Write-Host "- Sitemap accessible at https://anyway.ro/sitemap.xml" -ForegroundColor Green
    Write-Host "- robots.txt accessible at https://anyway.ro/robots.txt" -ForegroundColor Green
    
    Write-Host "Next Steps for Google Search Console:" -ForegroundColor Cyan
    Write-Host "1. Go to Google Search Console" -ForegroundColor White
    Write-Host "2. Navigate to Sitemaps section" -ForegroundColor White
    Write-Host "3. Remove old sitemap if exists" -ForegroundColor White
    Write-Host "4. Add new sitemap: https://anyway.ro/sitemap.xml" -ForegroundColor White
    Write-Host "5. Wait 24-48h for Google to re-crawl" -ForegroundColor White
    
} else {
    Write-Host "Deployment failed during build/restart!" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item -Recurse -Force "deploy-temp" -ErrorAction SilentlyContinue

Write-Host "Sitemap fix deployment completed!" -ForegroundColor Green
Write-Host "Google Search Console errors should be resolved within 24-48 hours." -ForegroundColor Cyan