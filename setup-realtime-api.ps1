#!/usr/bin/env pwsh

# Setup Real-time Flight API - Get API keys for live flight data

Write-Host "🚀 Setting up REAL-TIME Flight API (No Demo Data)" -ForegroundColor Green
Write-Host ""

Write-Host "📡 Available Real-time Flight API Providers:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. AviationStack (Recommended)" -ForegroundColor Cyan
Write-Host "   • Website: https://aviationstack.com/" -ForegroundColor White
Write-Host "   • Free Tier: 1,000 requests/month" -ForegroundColor White
Write-Host "   • Coverage: Global flight data" -ForegroundColor White
Write-Host "   • Reliability: High" -ForegroundColor White
Write-Host ""

Write-Host "2. FlightLabs" -ForegroundColor Cyan
Write-Host "   • Website: https://goflightlabs.com/" -ForegroundColor White
Write-Host "   • Free Tier: 1,000 requests/month" -ForegroundColor White
Write-Host "   • Coverage: Global flight data" -ForegroundColor White
Write-Host "   • Reliability: High" -ForegroundColor White
Write-Host ""

Write-Host "3. AirLabs" -ForegroundColor Cyan
Write-Host "   • Website: https://airlabs.co/" -ForegroundColor White
Write-Host "   • Free Tier: 1,000 requests/month" -ForegroundColor White
Write-Host "   • Coverage: Global flight data" -ForegroundColor White
Write-Host "   • Reliability: Medium" -ForegroundColor White
Write-Host ""

Write-Host "🔑 To get started:" -ForegroundColor Yellow
Write-Host "1. Sign up at one of the providers above" -ForegroundColor White
Write-Host "2. Get your API key" -ForegroundColor White
Write-Host "3. Add it to your .env.local file:" -ForegroundColor White
Write-Host ""

Write-Host "For AviationStack:" -ForegroundColor Cyan
Write-Host "AVIATIONSTACK_API_KEY=your_api_key_here" -ForegroundColor Gray
Write-Host "NEXT_PUBLIC_FLIGHT_API_PROVIDER=aviationstack" -ForegroundColor Gray
Write-Host ""

Write-Host "For FlightLabs:" -ForegroundColor Cyan
Write-Host "FLIGHTLABS_API_KEY=your_api_key_here" -ForegroundColor Gray
Write-Host "NEXT_PUBLIC_FLIGHT_API_PROVIDER=flightlabs" -ForegroundColor Gray
Write-Host ""

Write-Host "For AirLabs:" -ForegroundColor Cyan
Write-Host "AIRLABS_API_KEY=your_api_key_here" -ForegroundColor Gray
Write-Host "NEXT_PUBLIC_FLIGHT_API_PROVIDER=airlabs" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "• NO DEMO DATA will be shown" -ForegroundColor Yellow
Write-Host "• If API fails, users will see 'No flights available'" -ForegroundColor Yellow
Write-Host "• Make sure to monitor API usage limits" -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 After adding API key, run:" -ForegroundColor Green
Write-Host "./deploy-realtime-only.ps1" -ForegroundColor Cyan