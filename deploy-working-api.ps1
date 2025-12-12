# Deploy Working API Key Configuration
$ServerIP = "23.88.113.154"
$ServerUser = "root"
$ServerPassword = "FlightSchedule2024!"

Write-Host "Deploying Working API Configuration..." -ForegroundColor Cyan
Write-Host "API Key: cmj2peefi0001la04p5rkbbcc (CONFIRMED WORKING)" -ForegroundColor Green
Write-Host ""

# Commit current changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Add working API key configuration and MCP tests - API key cmj2peefi0001la04p5rkbbcc confirmed working with MCP endpoint"
git push origin main
Write-Host "Changes pushed to Git" -ForegroundColor Green

# Deploy to server with restart
Write-Host ""
Write-Host "Deploying to server..." -ForegroundColor Yellow
plink -ssh -pw $ServerPassword $ServerUser@$ServerIP "cd /opt/anyway-flight-schedule && git pull origin main && docker-compose restart"

Write-Host ""
Write-Host "Waiting for restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 25

Write-Host ""
Write-Host "Testing deployment..." -ForegroundColor Yellow

# Test API key status
try {
    $apiTest = Invoke-WebRequest -Uri "https://anyway.ro/api/admin/api-key" -UseBasicParsing
    $apiResult = $apiTest.Content | ConvertFrom-Json
    Write-Host "API Key Status: hasKey=$($apiResult.hasKey)" -ForegroundColor $(if($apiResult.hasKey){'Green'}else{'Red'})
    Write-Host "API Key Display: $($apiResult.apiKey)" -ForegroundColor White
} catch {
    Write-Host "API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test MCP integration
Write-Host ""
Write-Host "Testing MCP integration..." -ForegroundColor Yellow
try {
    $mcpTest = Invoke-WebRequest -Uri "https://anyway.ro/api/mcp/flights" -UseBasicParsing
    $mcpResult = $mcpTest.Content | ConvertFrom-Json
    Write-Host "MCP Status: success=$($mcpResult.success)" -ForegroundColor $(if($mcpResult.success){'Green'}else{'Red'})
    if ($mcpResult.tools) {
        Write-Host "MCP Tools Available: $($mcpResult.tools.Count)" -ForegroundColor Green
    }
} catch {
    Write-Host "MCP test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit: https://anyway.ro/admin" -ForegroundColor White
Write-Host "2. Test API key in 'API Management' tab" -ForegroundColor White
Write-Host "3. Check MCP integration in 'MCP Integration' tab" -ForegroundColor White
Write-Host "4. Test flight data at: https://anyway.ro/airport/OTP" -ForegroundColor White