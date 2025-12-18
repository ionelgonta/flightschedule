# Test all Romanian airports for data availability
$airports = @(
    @{Code="OTP"; Name="Otopeni (București)"},
    @{Code="CLJ"; Name="Cluj-Napoca"},
    @{Code="TSR"; Name="Timișoara"},
    @{Code="IAS"; Name="Iași"},
    @{Code="CND"; Name="Constanța"},
    @{Code="SBZ"; Name="Sibiu"},
    @{Code="CRA"; Name="Craiova"},
    @{Code="BCM"; Name="Bacău"},
    @{Code="BAY"; Name="Baia Mare"},
    @{Code="OMR"; Name="Oradea"}
)

Write-Host "=== TESTARE DISPONIBILITATE DATE AEROPORTURI ===" -ForegroundColor Cyan
Write-Host ""

foreach ($airport in $airports) {
    try {
        $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/$($airport.Code)/arrivals" -UseBasicParsing -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success -and $data.data.Count -gt 0) {
            Write-Host "✅ $($airport.Name) ($($airport.Code)): $($data.data.Count) sosiri" -ForegroundColor Green
        } else {
            Write-Host "❌ $($airport.Name) ($($airport.Code)): Fără date" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($airport.Name) ($($airport.Code)): Eroare API" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=== TEST COMPLET ===" -ForegroundColor Cyan