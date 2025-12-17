# Test Cache Behavior and API Request Patterns
# Verifies that cache logic is working correctly and no chaotic requests are made

Write-Host "🔍 Testing Cache Behavior and API Request Patterns..." -ForegroundColor Green

# Function to test API endpoint and check cache headers
function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Write-Host "📋 Testing: $Description" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Success: $($content.success)" -ForegroundColor $(if($content.success) { "Green" } else { "Red" })
        Write-Host "   Cached: $($content.cached)" -ForegroundColor $(if($content.cached) { "Green" } else { "Yellow" })
        Write-Host "   Data Count: $($content.data.Count)" -ForegroundColor Cyan
        
        # Check cache headers
        $cacheStatus = $response.Headers['X-Cache-Status']
        $lastUpdated = $response.Headers['X-Last-Updated']
        
        if ($cacheStatus) {
            Write-Host "   Cache Status: $cacheStatus" -ForegroundColor $(if($cacheStatus -eq "HIT") { "Green" } else { "Yellow" })
        }
        
        if ($lastUpdated) {
            Write-Host "   Last Updated: $lastUpdated" -ForegroundColor Gray
        }
        
        return @{
            Success = $content.success
            Cached = $content.cached
            DataCount = $content.data.Count
            CacheStatus = $cacheStatus
        }
        
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
    
    Write-Host ""
}

# Function to get cache statistics
function Get-CacheStats {
    Write-Host "📊 Getting Cache Statistics..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/cache-management" -UseBasicParsing -TimeoutSec 10
        $stats = ($response.Content | ConvertFrom-Json).data
        
        Write-Host "   Request Counter:" -ForegroundColor Cyan
        Write-Host "     Flight Data: $($stats.requestCounter.flightData)" -ForegroundColor White
        Write-Host "     Analytics: $($stats.requestCounter.analytics)" -ForegroundColor White
        Write-Host "     Aircraft: $($stats.requestCounter.aircraft)" -ForegroundColor White
        Write-Host "     Total: $($stats.requestCounter.totalRequests)" -ForegroundColor White
        Write-Host "     Last Reset: $($stats.requestCounter.lastReset)" -ForegroundColor Gray
        
        Write-Host "   Cache Entries:" -ForegroundColor Cyan
        Write-Host "     Flight Data: $($stats.cacheEntries.flightData)" -ForegroundColor White
        Write-Host "     Analytics: $($stats.cacheEntries.analytics)" -ForegroundColor White
        Write-Host "     Aircraft: $($stats.cacheEntries.aircraft)" -ForegroundColor White
        Write-Host "     Total: $($stats.cacheEntries.total)" -ForegroundColor White
        
        Write-Host "   Configuration:" -ForegroundColor Cyan
        Write-Host "     Flight Data Interval: $($stats.config.flightData.cronInterval) minutes" -ForegroundColor White
        Write-Host "     Analytics Interval: $($stats.config.analytics.cronInterval) days" -ForegroundColor White
        Write-Host "     Aircraft Interval: $($stats.config.aircraft.cronInterval) days" -ForegroundColor White
        
        return $stats
        
    } catch {
        Write-Host "   ❌ Error getting cache stats: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
    
    Write-Host ""
}

# Test sequence
Write-Host "🚀 Starting Cache Behavior Test Sequence..." -ForegroundColor Green
Write-Host ""

# 1. Get initial cache stats
$initialStats = Get-CacheStats

# 2. Test multiple requests to same endpoint (should be cached)
Write-Host "🔄 Testing Cache Hit Behavior (Multiple requests to same endpoint)..." -ForegroundColor Green

$endpoints = @(
    @{ Url = "http://localhost:3000/api/flights/OTP/arrivals"; Description = "OTP Arrivals" },
    @{ Url = "http://localhost:3000/api/flights/OTP/departures"; Description = "OTP Departures" },
    @{ Url = "http://localhost:3000/api/flights/CLJ/arrivals"; Description = "CLJ Arrivals" }
)

$results = @()

foreach ($endpoint in $endpoints) {
    Write-Host "Testing $($endpoint.Description) - First Request:" -ForegroundColor Cyan
    $result1 = Test-ApiEndpoint -Url $endpoint.Url -Description "$($endpoint.Description) (1st)"
    
    Write-Host "Testing $($endpoint.Description) - Second Request (should be cached):" -ForegroundColor Cyan
    $result2 = Test-ApiEndpoint -Url $endpoint.Url -Description "$($endpoint.Description) (2nd)"
    
    $results += @{
        Endpoint = $endpoint.Description
        FirstRequest = $result1
        SecondRequest = $result2
    }
}

# 3. Get final cache stats
$finalStats = Get-CacheStats

# 4. Analysis
Write-Host "📈 Cache Behavior Analysis:" -ForegroundColor Green

if ($initialStats -and $finalStats) {
    $requestIncrease = $finalStats.requestCounter.totalRequests - $initialStats.requestCounter.totalRequests
    Write-Host "   Total API Requests Made: $requestIncrease" -ForegroundColor $(if($requestIncrease -eq 0) { "Green" } else { "Yellow" })
    
    if ($requestIncrease -eq 0) {
        Write-Host "   ✅ EXCELLENT: No API requests made - all data served from cache!" -ForegroundColor Green
    } elseif ($requestIncrease -le 3) {
        Write-Host "   ✅ GOOD: Minimal API requests made ($requestIncrease)" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️ WARNING: Too many API requests made ($requestIncrease)" -ForegroundColor Red
    }
}

# 5. Cache Hit Analysis
Write-Host "   Cache Hit Analysis:" -ForegroundColor Cyan
foreach ($result in $results) {
    if ($result.FirstRequest -and $result.SecondRequest) {
        $cacheWorking = $result.SecondRequest.Cached -eq $true
        Write-Host "     $($result.Endpoint): $(if($cacheWorking) { "✅ Cache Working" } else { "❌ Cache Not Working" })" -ForegroundColor $(if($cacheWorking) { "Green" } else { "Red" })
    }
}

# 6. Refresh Test (should not make API calls if cache is working)
Write-Host ""
Write-Host "🔄 Testing Page Refresh Behavior..." -ForegroundColor Green

$preRefreshStats = Get-CacheStats
Start-Sleep -Seconds 2

# Simulate page refreshes
Test-ApiEndpoint -Url "http://localhost:3000/api/flights/OTP/arrivals" -Description "OTP Arrivals (Refresh 1)" | Out-Null
Test-ApiEndpoint -Url "http://localhost:3000/api/flights/OTP/arrivals" -Description "OTP Arrivals (Refresh 2)" | Out-Null
Test-ApiEndpoint -Url "http://localhost:3000/api/flights/OTP/arrivals" -Description "OTP Arrivals (Refresh 3)" | Out-Null

$postRefreshStats = Get-CacheStats

if ($preRefreshStats -and $postRefreshStats) {
    $refreshRequests = $postRefreshStats.requestCounter.totalRequests - $preRefreshStats.requestCounter.totalRequests
    Write-Host "   API Requests During Refreshes: $refreshRequests" -ForegroundColor $(if($refreshRequests -eq 0) { "Green" } else { "Red" })
    
    if ($refreshRequests -eq 0) {
        Write-Host "   ✅ PERFECT: No API requests on page refresh - cache working correctly!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ PROBLEM: API requests made on refresh - cache not working properly!" -ForegroundColor Red
    }
}

# 7. Summary
Write-Host ""
Write-Host "📋 CACHE BEHAVIOR TEST SUMMARY:" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

if ($finalStats) {
    Write-Host "✅ Cache Manager: Initialized and Running" -ForegroundColor Green
    Write-Host "✅ Cache Entries: $($finalStats.cacheEntries.total) total entries" -ForegroundColor Green
    Write-Host "✅ Flight Data Interval: $($finalStats.config.flightData.cronInterval) minutes" -ForegroundColor Green
    
    $totalApiRequests = $finalStats.requestCounter.totalRequests
    if ($totalApiRequests -eq 0) {
        Write-Host "✅ API Usage: PERFECT - No API requests during test" -ForegroundColor Green
    } elseif ($totalApiRequests -le 5) {
        Write-Host "⚠️ API Usage: ACCEPTABLE - $totalApiRequests requests total" -ForegroundColor Yellow
    } else {
        Write-Host "❌ API Usage: PROBLEMATIC - $totalApiRequests requests (too many)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Cache Manager: Not working properly" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Recommendations:" -ForegroundColor Cyan
Write-Host "   • Cache should serve all requests without API calls" -ForegroundColor White
Write-Host "   • Page refreshes should not trigger API requests" -ForegroundColor White
Write-Host "   • Cron jobs should handle API calls automatically" -ForegroundColor White
Write-Host "   • Monitor API request counter to detect issues" -ForegroundColor White

Write-Host ""
Write-Host "Test completed! Check results above for cache behavior analysis." -ForegroundColor Green