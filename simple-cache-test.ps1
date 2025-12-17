# Simple Cache Test - Check if API requests are being made on page access

Write-Host "🔍 Testing Cache Behavior..." -ForegroundColor Green

# Get initial cache stats
Write-Host "📊 Getting initial cache stats..." -ForegroundColor Yellow
try {
    $initialResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cache-management" -UseBasicParsing -TimeoutSec 10
    $initialStats = ($initialResponse.Content | ConvertFrom-Json).data
    $initialRequests = $initialStats.requestCounter.totalRequests
    Write-Host "   Initial API requests: $initialRequests" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error getting initial stats: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test flight endpoints
Write-Host ""
Write-Host "🛫 Testing flight endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "http://localhost:3000/api/flights/OTP/arrivals",
    "http://localhost:3000/api/flights/OTP/departures",
    "http://localhost:3000/api/flights/CLJ/arrivals"
)

foreach ($endpoint in $endpoints) {
    Write-Host "   Testing: $endpoint" -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 10
        $content = $response.Content | ConvertFrom-Json
        Write-Host "     Status: $($response.StatusCode), Success: $($content.success), Cached: $($content.cached)" -ForegroundColor Green
    } catch {
        Write-Host "     ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Get final cache stats
Write-Host ""
Write-Host "📊 Getting final cache stats..." -ForegroundColor Yellow
try {
    $finalResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cache-management" -UseBasicParsing -TimeoutSec 10
    $finalStats = ($finalResponse.Content | ConvertFrom-Json).data
    $finalRequests = $finalStats.requestCounter.totalRequests
    Write-Host "   Final API requests: $finalRequests" -ForegroundColor Cyan
    
    $requestIncrease = $finalRequests - $initialRequests
    Write-Host "   API requests made during test: $requestIncrease" -ForegroundColor $(if($requestIncrease -eq 0) { "Green" } else { "Red" })
    
    if ($requestIncrease -eq 0) {
        Write-Host "   ✅ EXCELLENT: No API requests made - cache working perfectly!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ WARNING: $requestIncrease API requests made - cache may not be working properly" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ❌ Error getting final stats: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Cache test completed!" -ForegroundColor Green