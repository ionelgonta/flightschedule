# Test admin page
Write-Host "Testing admin page..." -ForegroundColor Yellow

$response = Invoke-WebRequest -Uri "https://anyway.ro/admin" -UseBasicParsing
if ($response.Content -match "password") {
    Write-Host "Admin page requires authentication" -ForegroundColor Green
    Write-Host "Password: admin123" -ForegroundColor Cyan
    Write-Host "New admin interface is ready!" -ForegroundColor Green
} else {
    Write-Host "Admin page authentication issue" -ForegroundColor Red
}

Write-Host "Visit https://anyway.ro/admin and use password: admin123" -ForegroundColor Cyan