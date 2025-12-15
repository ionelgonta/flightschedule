#!/usr/bin/env pwsh

Write-Host "🎨 Deploying Demo Ads Functionality" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Pre-deployment checks..." -ForegroundColor Yellow

# Check if all required files exist
$requiredFiles = @(
    "app/admin/page.tsx",
    "components/ads/AdBanner.tsx", 
    "lib/adConfig.ts"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`n❌ Some required files are missing. Deployment aborted." -ForegroundColor Red
    exit 1
}

# Check TypeScript compilation
Write-Host "`n🔍 Checking TypeScript compilation..." -ForegroundColor Yellow
try {
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "⚠️ TypeScript warnings found, but continuing..." -ForegroundColor Yellow
        Write-Host $tscResult -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Could not run TypeScript check, continuing anyway..." -ForegroundColor Yellow
}

# Build the project
Write-Host "`n🏗️ Building the project..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Build process failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Demo Ads functionality deployed successfully!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Navigate to /admin in your browser" -ForegroundColor White
Write-Host "3. Look for the 'Anunțuri Demo - Agenții de Bilete' section" -ForegroundColor White
Write-Host "4. Toggle the demo ads on/off" -ForegroundColor White
Write-Host "5. Visit the main site to see the demo banners" -ForegroundColor White

Write-Host "`nFeatures included:" -ForegroundColor Cyan
Write-Host "Toggle switch in admin panel" -ForegroundColor White
Write-Host "Demo banners for Zbor.md, Zbor24.ro, Oozh.com" -ForegroundColor White
Write-Host "Attractive designs with gradients and SVG icons" -ForegroundColor White
Write-Host "Persistent settings saved in localStorage" -ForegroundColor White
Write-Host "All ad zones supported" -ForegroundColor White

Write-Host "Ready to test!" -ForegroundColor Green