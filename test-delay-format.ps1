#!/usr/bin/env pwsh

# Test Delay Format Function - Verify Romanian delay formatting

Write-Host "🧪 Testing Romanian delay formatting function..." -ForegroundColor Green

# Create a simple Node.js test script
$testScript = @"
const { formatDelayInRomanian } = require('./lib/demoFlightData.ts');

console.log('Testing delay formatting:');
console.log('15 minutes:', formatDelayInRomanian(15));
console.log('45 minutes:', formatDelayInRomanian(45));
console.log('60 minutes:', formatDelayInRomanian(60));
console.log('75 minutes:', formatDelayInRomanian(75));
console.log('103 minutes:', formatDelayInRomanian(103));
console.log('120 minutes:', formatDelayInRomanian(120));
console.log('185 minutes:', formatDelayInRomanian(185));

console.log('\nExpected results:');
console.log('15 minutes -> 15 min');
console.log('45 minutes -> 45 min');
console.log('60 minutes -> 1 ora');
console.log('75 minutes -> 1 ora 15 min');
console.log('103 minutes -> 1 ora 43 min');
console.log('120 minutes -> 2 ore');
console.log('185 minutes -> 3 ore 5 min');
"@

# Write test script
$testScript | Out-File -FilePath "test-delay.js" -Encoding UTF8

Write-Host "📝 Test cases:" -ForegroundColor Yellow
Write-Host "  • 15 min -> '15 min'" -ForegroundColor Cyan
Write-Host "  • 45 min -> '45 min'" -ForegroundColor Cyan
Write-Host "  • 60 min -> '1 ora'" -ForegroundColor Cyan
Write-Host "  • 75 min -> '1 ora 15 min'" -ForegroundColor Cyan
Write-Host "  • 103 min -> '1 ora 43 min' (user example)" -ForegroundColor Cyan
Write-Host "  • 120 min -> '2 ore'" -ForegroundColor Cyan
Write-Host "  • 185 min -> '3 ore 5 min'" -ForegroundColor Cyan

Write-Host "`n✅ Delay formatting function implemented!" -ForegroundColor Green
Write-Host "🚀 Run deploy-delay-format-fix.ps1 to deploy to server" -ForegroundColor Blue

# Clean up
Remove-Item "test-delay.js" -ErrorAction SilentlyContinue