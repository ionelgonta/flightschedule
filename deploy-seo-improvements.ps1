#!/usr/bin/env pwsh

Write-Host "🚀 Deploying SEO Improvements to Production..." -ForegroundColor Green

# Build the application with SEO improvements
Write-Host "📦 Building application with SEO enhancements..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to server
Write-Host "🚀 Deploying to production server..." -ForegroundColor Yellow

# Copy files to server
scp -r .next package.json package-lock.json root@anyway.ro:/opt/anyway-flight-schedule/
scp -r app components lib public root@anyway.ro:/opt/anyway-flight-schedule/
scp next.config.js tailwind.config.js postcss.config.js tsconfig.json root@anyway.ro:/opt/anyway-flight-schedule/

# Install dependencies and restart on server
ssh root@anyway.ro "
    cd /opt/anyway-flight-schedule
    npm ci --production
    pm2 restart anyway-flight-schedule
    pm2 save
"

Write-Host "SEO improvements deployed successfully!" -ForegroundColor Green

# Test the deployment
Write-Host "🧪 Testing SEO improvements..." -ForegroundColor Yellow

$testUrls = @(
    "https://anyway.ro",
    "https://anyway.ro/aeroporturi", 
    "https://anyway.ro/despre",
    "https://anyway.ro/analize",
    "https://anyway.ro/sitemap.xml"
)

foreach ($url in $testUrls) {
    Write-Host "Testing $url..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "$url - OK" -ForegroundColor Green
    } else {
        Write-Host "$url - Failed" -ForegroundColor Red
    }
}

Write-Host "🎉 SEO Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "SEO Improvements Deployed:" -ForegroundColor Yellow
Write-Host "- Comprehensive structured data (JSON-LD)" -ForegroundColor White
Write-Host "- Breadcrumb navigation on all pages" -ForegroundColor White  
Write-Host "- Enhanced meta descriptions and keywords" -ForegroundColor White
Write-Host "- Improved internal linking structure" -ForegroundColor White
Write-Host "- Organization and WebSite schema markup" -ForegroundColor White
Write-Host "- Enhanced sitemap with all pages" -ForegroundColor White
Write-Host "- Optimized robots.txt" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps for SEO:" -ForegroundColor Yellow
Write-Host "1. Submit sitemap to Google Search Console" -ForegroundColor White
Write-Host "2. Monitor Core Web Vitals in PageSpeed Insights" -ForegroundColor White
Write-Host "3. Check structured data with Google Rich Results Test" -ForegroundColor White
Write-Host "4. Monitor indexing status in Google Search Console" -ForegroundColor White