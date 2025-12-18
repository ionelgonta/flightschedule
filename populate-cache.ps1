# Populate cache for all Romanian airports and Moldova (complete list from database)
$airports = @("LROP", "LRBB", "LRCL", "LRTR", "LRIA", "LRCK", "LRSB", "LRCV", "LRBC", "LRBM", "LROD", "LRSV", "LRTG", "LRAR", "LRST", "LUKK")

foreach ($airport in $airports) {
    Write-Host "Populating cache for $airport..."
    try {
        $body = '{"airportCode":"' + $airport + '"}'
        $response = Invoke-WebRequest -Uri "https://anyway.ro/api/debug/force-cache" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        Write-Host "Success: $airport cache populated" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Failed to populate cache for $airport" -ForegroundColor Red
    }
}

Write-Host "Cache population complete" -ForegroundColor Cyan