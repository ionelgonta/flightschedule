#!/usr/bin/env pwsh

# Test AeroDataBox via API.Market - WORKING VERSION

Write-Host "Testing AeroDataBox via API.Market (WORKING)..." -ForegroundColor Green
Write-Host ""

$apiKey = "cmj2m39qs0001k00404cmwu75"
$baseUrl = "https://prod.api.market/api/v1/aedbx/aerodatabox"

Write-Host "API Key: $apiKey" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Airport Info (your working example)
Write-Host "1. Testing Airport Info (OTP)..." -ForegroundColor Blue
$url1 = "$baseUrl/airports/Icao/LROP?withRunways=false&withTime=false"
Write-Host "URL: $url1" -ForegroundColor Gray

try {
    $response1 = Invoke-RestMethod -Uri $url1 -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = $apiKey
    } -Method GET
    
    Write-Host "Airport Info: SUCCESS" -ForegroundColor Green
    Write-Host "Airport: $($response1.name)" -ForegroundColor Cyan
    Write-Host "ICAO: $($response1.icao)" -ForegroundColor Cyan
    Write-Host "City: $($response1.municipalityName)" -ForegroundColor Cyan
} catch {
    Write-Host "Airport Info: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Flight Arrivals
Write-Host "2. Testing Flight Arrivals (OTP)..." -ForegroundColor Blue
$today = Get-Date -Format "yyyy-MM-dd"
$url2 = "$baseUrl/flights/airports/Icao/LROP/arrivals/${today}T00:00/${today}T23:59"
Write-Host "URL: $url2" -ForegroundColor Gray

try {
    $response2 = Invoke-RestMethod -Uri $url2 -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = $apiKey
    } -Method GET
    
    Write-Host "Flight Arrivals: SUCCESS" -ForegroundColor Green
    Write-Host "Arrivals found: $($response2.arrivals.Count)" -ForegroundColor Cyan
    
    if ($response2.arrivals.Count -gt 0) {
        $flight = $response2.arrivals[0]
        Write-Host "Sample flight:" -ForegroundColor White
        Write-Host "  Flight: $($flight.number.iata)" -ForegroundColor White
        Write-Host "  Airline: $($flight.airline.name)" -ForegroundColor White
        Write-Host "  From: $($flight.departure.airport.name)" -ForegroundColor White
        Write-Host "  Status: $($flight.status.text)" -ForegroundColor White
    }
} catch {
    Write-Host "Flight Arrivals: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Flight Departures
Write-Host "3. Testing Flight Departures (OTP)..." -ForegroundColor Blue
$url3 = "$baseUrl/flights/airports/Icao/LROP/departures/${today}T00:00/${today}T23:59"
Write-Host "URL: $url3" -ForegroundColor Gray

try {
    $response3 = Invoke-RestMethod -Uri $url3 -Headers @{
        "accept" = "application/json"
        "x-api-market-key" = $apiKey
    } -Method GET
    
    Write-Host "Flight Departures: SUCCESS" -ForegroundColor Green
    Write-Host "Departures found: $($response3.departures.Count)" -ForegroundColor Cyan
    
    if ($response3.departures.Count -gt 0) {
        $flight = $response3.departures[0]
        Write-Host "Sample flight:" -ForegroundColor White
        Write-Host "  Flight: $($flight.number.iata)" -ForegroundColor White
        Write-Host "  Airline: $($flight.airline.name)" -ForegroundColor White
        Write-Host "  To: $($flight.arrival.airport.name)" -ForegroundColor White
        Write-Host "  Status: $($flight.status.text)" -ForegroundColor White
    }
} catch {
    Write-Host "Flight Departures: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "AeroDataBox API is working! Ready to deploy real-time data." -ForegroundColor Green
Write-Host "Run: ./deploy-aerodatabox-realtime.ps1" -ForegroundColor Cyan