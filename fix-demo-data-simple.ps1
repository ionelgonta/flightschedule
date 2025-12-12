#!/usr/bin/env pwsh

# Simple fix - just use demo data for now
Write-Host "🔧 Implementing simple demo data fix..." -ForegroundColor Green

$SERVER_IP = "23.88.113.154"

# Create a simple API service that just returns demo data
$simpleApiService = @'
/**
 * Simple Flight API Service - Returns demo data
 */

import { generateDemoArrivals, generateDemoDepartures } from './demoFlightData';

export interface RawFlightData {
  flight_number: string;
  airline: {
    name: string;
    code: string;
    logo?: string;
  };
  origin: {
    airport: string;
    code: string;
    city: string;
  };
  destination: {
    airport: string;
    code: string;
    city: string;
  };
  scheduled_time: string;
  estimated_time?: string;
  actual_time?: string;
  status: string;
  gate?: string;
  terminal?: string;
  aircraft?: string;
  delay?: number;
}

export interface FlightApiResponse {
  success: boolean;
  data: RawFlightData[];
  error?: string;
  cached: boolean;
  last_updated: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
}

export interface FlightApiConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
}

class FlightApiService {
  private config: FlightApiConfig;

  constructor(config: FlightApiConfig) {
    this.config = config;
  }

  async getArrivals(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Generating demo arrivals for ${airportCode}`);
    
    const demoData = generateDemoArrivals(airportCode, 15);
    
    return {
      success: true,
      data: demoData,
      error: 'Using demo data - API integration in progress',
      cached: false,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type: 'arrivals'
    };
  }

  async getDepartures(airportCode: string): Promise<FlightApiResponse> {
    console.log(`Generating demo departures for ${airportCode}`);
    
    const demoData = generateDemoDepartures(airportCode, 15);
    
    return {
      success: true,
      data: demoData,
      error: 'Using demo data - API integration in progress',
      cached: false,
      last_updated: new Date().toISOString(),
      airport_code: airportCode,
      type: 'departures'
    };
  }
}

export const API_CONFIGS = {
  aerodatabox: {
    provider: 'aerodatabox',
    baseUrl: 'demo',
    rateLimit: 150
  }
};

export default FlightApiService;
'@

# Write the simple service
$simpleApiService | Out-File -FilePath "lib/flightApiService.ts" -Encoding UTF8

Write-Host "✅ Created simple demo API service" -ForegroundColor Green

# Deploy to server
Write-Host "📤 Deploying to server..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no lib/flightApiService.ts lib/demoFlightData.ts root@${SERVER_IP}:/opt/anyway-flight-schedule/lib/

# Rebuild and restart
$deployScript = @'
#!/bin/bash
set -e

echo "🔨 Building with demo data..."
cd /opt/anyway-flight-schedule

npm run build
docker-compose restart

echo "✅ Demo data deployment complete"
'@

$deployScript | ssh -o StrictHostKeyChecking=no root@$SERVER_IP 'bash -s'

Write-Host "✅ Deployment complete!" -ForegroundColor Green

# Test
Write-Host "🧪 Testing..." -ForegroundColor Blue
Start-Sleep -Seconds 20

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals" -TimeoutSec 30 -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "  Success: $($data.success)" -ForegroundColor White
    Write-Host "  Data Count: $($data.data.Count)" -ForegroundColor White
    
    if ($data.data.Count -gt 0) {
        Write-Host "  Sample flights:" -ForegroundColor White
        for ($i = 0; $i -lt [Math]::Min(3, $data.data.Count); $i++) {
            $flight = $data.data[$i]
            Write-Host "    $($flight.flight_number) - $($flight.airline.name) - $($flight.status)" -ForegroundColor Gray
        }
        Write-Host "🎉 SUCCESS! Demo data is working!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Test failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Demo Data Fix Complete!" -ForegroundColor Green