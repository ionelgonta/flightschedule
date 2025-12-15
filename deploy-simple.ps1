#!/usr/bin/env pwsh

Write-Host "🚀 Deploying URL structure and translation updates..." -ForegroundColor Green

# Copy key files that were updated
Write-Host "📁 Copying updated files..." -ForegroundColor Yellow

# Copy the main application files
scp app/page.tsx root@anyway.ro:/var/www/anyway.ro/app/
scp app/airports/page.tsx root@anyway.ro:/var/www/anyway.ro/app/airports/
scp "app/airport/[code]/page.tsx" root@anyway.ro:/var/www/anyway.ro/app/airport/[code]/
scp "app/airport/[code]/arrivals/page.tsx" root@anyway.ro:/var/www/anyway.ro/app/airport/[code]/arrivals/
scp "app/airport/[code]/departures/page.tsx" root@anyway.ro:/var/www/anyway.ro/app/airport/[code]/departures/

# Copy components
scp components/Navbar.tsx root@anyway.ro:/var/www/anyway.ro/components/
scp components/Footer.tsx root@anyway.ro:/var/www/anyway.ro/components/

# Copy lib files
scp lib/airports.ts root@anyway.ro:/var/www/anyway.ro/lib/

# Rebuild on server
Write-Host "🔨 Rebuilding on server..." -ForegroundColor Yellow
ssh root@anyway.ro "cd /var/www/anyway.ro && npm run build && pm2 restart anyway-app"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌍 Changes live at https://anyway.ro" -ForegroundColor Cyan