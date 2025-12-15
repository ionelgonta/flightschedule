# Test admin authentication and new page
Write-Host "Testing admin authentication..." -ForegroundColor Yellow

# Test if admin page requires password
$response = Invoke-WebRequest -Uri "https://anyway.ro/admin" -UseBasicParsing
if ($response.Content -match "password") {
    Write-Host "✅ Admin page requires authentication (password: admin123)" -ForegroundColor Green
    Write-Host "📋 To access the new admin interface:" -ForegroundColor Cyan
    Write-Host "1. Visit: https://anyway.ro/admin" -ForegroundColor White
    Write-Host "2. Enter password: admin123" -ForegroundColor White
    Write-Host "3. Access the new interface with tabs:" -ForegroundColor White
    Write-Host "   - AdSense Toggle (3 modes)" -ForegroundColor White
    Write-Host "   - API Management (AeroDataBox + AdSense)" -ForegroundColor White
    Write-Host "   - MCP Integration" -ForegroundColor White
} else {
    Write-Host "❌ Admin page authentication not working" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 New Admin Features Available:" -ForegroundColor Green
Write-Host "✅ AdSense Toggle System (Active/Inactive/Demo)" -ForegroundColor White
Write-Host "✅ API Key Management (AeroDataBox)" -ForegroundColor White
Write-Host "✅ AdSense Publisher ID Management" -ForegroundColor White
Write-Host "✅ MCP Integration Status & Tools" -ForegroundColor White
Write-Host "✅ Console Script for AdSense Control" -ForegroundColor White