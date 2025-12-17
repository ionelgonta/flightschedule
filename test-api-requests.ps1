# Test API Request Behavior
Write-Host "Testing API Request Behavior..." -ForegroundColor Green

# Get cache stats
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cache-management" -UseBasicParsing
$stats = ($response.Content | ConvertFrom-Json).data
$initialRequests = $stats.requestCounter.totalRequests

Write-Host "Initial API requests: $initialRequests" -ForegroundColor Cyan

# Test flight endpoint
Write-Host "Testing flight endpoint..." -ForegroundColor Yellow
$flightResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/flights/OTP/arrivals" -UseBasicParsing
$flightData = $flightResponse.Content | ConvertFrom-Json

Write-Host "Flight data success: $($flightData.success)" -ForegroundColor Green
Write-Host "Flight data cached: $($flightData.cached)" -ForegroundColor Green

# Get final stats
$finalResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cache-management" -UseBasicParsing
$finalStats = ($finalResponse.Content | ConvertFrom-Json).data
$finalRequests = $finalStats.requestCounter.totalRequests

$requestIncrease = $finalRequests - $initialRequests
Write-Host "API requests made: $requestIncrease" -ForegroundColor $(if($requestIncrease -eq 0) { "Green" } else { "Red" })

Write-Host "Test completed" -ForegroundColor Green