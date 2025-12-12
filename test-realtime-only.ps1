#!/usr/bin/env pwsh

# Test Real-time ONLY Flight API

Write-Host "🧪 Testing REAL-TIME ONLY Flight API..." -ForegroundColor Green
Write-Host ""

# Check environment variables
Write-Host "🔑 Checking API Keys:" -ForegroundColor Yellow

$hasApiKey = $false

if ($env:AVIATIONSTACK_API_KEY) {
    Write-Host "✅ AviationStack API Key: Found" -ForegroundColor Green
    $hasApiKey = $true
    $provider = "aviationstack"
    $apiKey = $env:AVIATIONSTACK_API_KEY
    $baseUrl = "http://api.aviationstack.com/v1"
} elseif ($env:FLIGHTLABS_API_KEY) {
    Write-Host "✅ FlightLabs API Key: Found" -ForegroundColor Green
    $hasApiKey = $true
    $provider = "flightlabs"
    $apiKey = $env:FLIGHTLABS_API_KEY
    $baseUrl = "https://app.goflightlabs.com/api"
} elseif ($env:AIRLABS_API_KEY) {
    Write-Host "✅ AirLabs API Key: Found" -ForegroundColor Green
    $hasApiKey = $true
    $provider = "airlabs"
    $apiKey = $env:AIRLABS_API_KEY
    $baseUrl = "https://airlabs.co/api/v9"
} else {
    Write-Host "❌ No API Key found!" -ForegroundColor Red
    Write-Host "Please run: ./setup-realtime-api.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📡 Testing $provider API..." -ForegroundColor Blue

# Test API call based on provider
try {
    switch ($provider) {
        "aviationstack" {
            $url = "$baseUrl/flights?access_key=$apiKey&arr_icao=LROP&limit=5"
        }
        "flightlabs" {
            $url = "$baseUrl/schedules?access_key=$apiKey&arr_icao=LROP"
        }
        "airlabs" {
            $url = "$baseUrl/schedules?api_key=$apiKey&arr_icao=LROP"
        }
    }
    
    Write-Host "Testing URL: $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 30
    
    Write-Host "✅ API Test Successful!" -ForegroundColor Green
    
    # Check response structure
    if ($provider -eq "aviationstack" -and $response.data) {
        Write-Host "📊 Found $($response.data.Count) flights" -ForegroundColor Cyan
        if ($response.data.Count -gt 0) {
            $flight = $response.data[0]
            Write-Host "Sample flight: $($flight.flight.iata) - $($flight.airline.name)" -ForegroundColor White
        }
    } elseif ($provider -eq "flightlabs" -and $response.data) {
        Write-Host "📊 Found $($response.data.Count) flights" -ForegroundColor Cyan
    } elseif ($provider -eq "airlabs" -and $response.response) {
        Write-Host "📊 Found $($response.response.Count) flights" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  API responded but no flight data found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ API Test Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "• Invalid API key" -ForegroundColor White
    Write-Host "• API rate limit exceeded" -ForegroundColor White
    Write-Host "• Network connectivity issues" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 Ready to deploy real-time only version!" -ForegroundColor Green
Write-Host "Run: ./deploy-realtime-only.ps1" -ForegroundColor Cyan