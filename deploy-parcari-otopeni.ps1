#!/usr/bin/env pwsh

# Deploy Parcari Otopeni Page - Complete parking page for Bucharest Airport
Write-Host "Deploying Parcari Otopeni Page..." -ForegroundColor Green

# Server connection details
$SERVER = "root@anyway.ro"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "Changes being deployed:" -ForegroundColor Yellow
Write-Host "  - New parking page for Bucharest Otopeni Airport" -ForegroundColor White
Write-Host "  - JSON data file with all parking options" -ForegroundColor White
Write-Host "  - Responsive design with filtering functionality" -ForegroundColor White
Write-Host "  - Updated Navbar and Footer with parking links" -ForegroundColor White
Write-Host "  - SEO optimized with metadata and sitemap" -ForegroundColor White

# Copy updated files to server
Write-Host "Uploading files..." -ForegroundColor Blue

# Upload parking page
scp "app/parcari-otopeni/page.tsx" "${SERVER}:${REMOTE_PATH}/app/parcari-otopeni/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload parking page"; exit 1 }

# Upload parking layout
scp "app/parcari-otopeni/layout.tsx" "${SERVER}:${REMOTE_PATH}/app/parcari-otopeni/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload parking layout"; exit 1 }

# Upload parking data
scp "public/data/parking.json" "${SERVER}:${REMOTE_PATH}/public/data/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload parking data"; exit 1 }

# Upload updated navbar
scp "components/Navbar.tsx" "${SERVER}:${REMOTE_PATH}/components/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload navbar"; exit 1 }

# Upload updated footer
scp "components/Footer.tsx" "${SERVER}:${REMOTE_PATH}/components/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload footer"; exit 1 }

# Upload updated sitemap
scp "app/sitemap.ts" "${SERVER}:${REMOTE_PATH}/app/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload sitemap"; exit 1 }

Write-Host "Building and restarting application..." -ForegroundColor Blue

# SSH to server and restart
ssh $SERVER @"
cd $REMOTE_PATH

# Create data directory if it doesn't exist
mkdir -p public/data

# Build the application
echo "Building application..."
npm run build

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 restart anyway-ro

# Show PM2 status
echo "PM2 Status:"
pm2 status

echo "Parcari Otopeni page deployed successfully!"
echo ""
echo "Features:"
echo "  - Complete parking page at /parcari-otopeni"
echo "  - 8 parking options (1 official, 7 private)"
echo "  - Responsive design with filtering"
echo "  - Direct reservation links"
echo "  - SEO optimized"
echo ""
echo "Access: https://anyway.ro/parcari-otopeni"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "Parcari Otopeni Page deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was deployed:" -ForegroundColor Yellow
    Write-Host "  - Complete parking page for Bucharest Otopeni Airport" -ForegroundColor White
    Write-Host "  - 8 parking options with official and private categories" -ForegroundColor White
    Write-Host "  - Responsive design with filtering functionality" -ForegroundColor White
    Write-Host "  - Direct reservation links (target=_blank)" -ForegroundColor White
    Write-Host "  - Updated navigation (Navbar and Footer)" -ForegroundColor White
    Write-Host "  - SEO optimized with metadata and sitemap" -ForegroundColor White
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Cyan
    Write-Host "  - Filter by: All, Official, Private parking" -ForegroundColor White
    Write-Host "  - Hover effects and smooth animations" -ForegroundColor White
    Write-Host "  - Loading states and error handling" -ForegroundColor White
    Write-Host "  - Mobile responsive design" -ForegroundColor White
    Write-Host "  - Direct reservation buttons" -ForegroundColor White
    Write-Host ""
    Write-Host "Access the page at: https://anyway.ro/parcari-otopeni" -ForegroundColor Green
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}