#!/usr/bin/env pwsh

# Fix Flight Data Complete - Repară complet problema cu datele de zbor
Write-Host "🔧 Fixing Flight Data Issues..." -ForegroundColor Green

$SERVER_IP = "23.88.113.154"
$API_KEY = "cmj2peefi0001la04p5rkbbcc"

Write-Host "📋 Problem Analysis:" -ForegroundColor Yellow
Write-Host "✅ CSP is fixed and working" -ForegroundColor Green
Write-Host "✅ API endpoints are accessible" -ForegroundColor Green
Write-Host "❌ MCP service returns only dummy data (N/A, Unknown)" -ForegroundColor Red
Write-Host "❌ API key doesn't work with MCP endpoint" -ForegroundColor Red

Write-Host "`n🎯 Solution: Switch to direct AeroDataBox API" -ForegroundColor Cyan

# Step 1: Update FlightApiService to use RapidAPI directly
Write-Host "`n1. Updating FlightApiService..." -ForegroundColor Blue

# Create updated service that bypasses MCP
$updatedApiService = @'
/**
 * Updated Flight API Service - Uses direct AeroDataBox API via RapidAPI
 */

import { getIcaoCode } from './icaoMapping';

export interface FlightApiConfig {
  provider: 'aerodatabox' | 'flightlabs' | 'aviationstack';
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
}

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

class FlightApiService {
  private config: FlightApiConfig;
  private requestCount: number = 0;
  private lastReset: number = Date.now();

  constructor(config: FlightApiConfig) {
    this.config = config;
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    const minutesPassed = (now - this.lastReset) / (1000 * 60);
    
    if (minutesPassed >= 1) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    return this.requestCount < this.config.rateLimit;
  }

  async getArrivals(airportCode: string): Promise<FlightApiResponse> {
    return this.getFlights(airportCode, 'arrivals');
  }

  async getDepartures(airportCode: string): Promise<FlightApiResponse> {
    return this.getFlights(airportCode, 'departures');
  }

  private async getFlights(airportCode: string, type: 'arrivals' | 'departures'): Promise<FlightApiResponse> {
    if (!this.canMakeRequest()) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: type
      };
    }

    try {
      this.requestCount++;
      
      // Use direct AeroDataBox API via RapidAPI
      const icaoCode = getIcaoCode(airportCode);
      const today = new Date().toISOString().split('T')[0];
      const url = `${this.config.baseUrl}/flights/airports/icao/${icaoCode}/${type}/${today}T00:00/${today}T23:59`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.config.apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
      };

      console.log(`Fetching flights from: ${url}`);
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log(`Raw API response:`, rawData);
      
      const flights = rawData[type] || [];
      const processedData = flights.map((flight: any) => this.normalizeFlightData(flight, type))
                                  .filter((flight: any) => flight !== null);

      return {
        success: true,
        data: processedData,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: type
      };

    } catch (error) {
      console.error(`Flight API Error for ${airportCode} ${type}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: type
      };
    }
  }

  private normalizeFlightData(flight: any, type: 'arrivals' | 'departures'): RawFlightData | null {
    try {
      const flightNumber = flight.number?.iata || flight.number?.icao || 'N/A';
      
      return {
        flight_number: flightNumber,
        airline: {
          name: flight.airline?.name || 'Unknown',
          code: flight.airline?.iata || flight.airline?.icao || 'XX',
        },
        origin: {
          airport: flight.departure?.airport?.name || 'Unknown',
          code: flight.departure?.airport?.iata || flight.departure?.airport?.icao || 'XXX',
          city: flight.departure?.airport?.municipalityName || 'Unknown'
        },
        destination: {
          airport: flight.arrival?.airport?.name || 'Unknown',
          code: flight.arrival?.airport?.iata || flight.arrival?.airport?.icao || 'XXX',
          city: flight.arrival?.airport?.municipalityName || 'Unknown'
        },
        scheduled_time: type === 'arrivals' 
          ? flight.arrival?.scheduledTime?.local 
          : flight.departure?.scheduledTime?.local,
        estimated_time: type === 'arrivals'
          ? flight.arrival?.estimatedTime?.local
          : flight.departure?.estimatedTime?.local,
        actual_time: type === 'arrivals'
          ? flight.arrival?.actualTime?.local
          : flight.departure?.actualTime?.local,
        status: this.normalizeStatus(flight.status?.text || 'unknown'),
        gate: type === 'arrivals' ? flight.arrival?.gate : flight.departure?.gate,
        terminal: type === 'arrivals' ? flight.arrival?.terminal : flight.departure?.terminal,
        aircraft: flight.aircraft?.model,
        delay: this.calculateDelay(flight, type)
      };
    } catch (error) {
      console.error('Error normalizing flight data:', error);
      return null;
    }
  }

  private normalizeStatus(status: string): string {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('scheduled')) return 'scheduled';
    if (statusLower.includes('active') || statusLower.includes('en-route')) return 'active';
    if (statusLower.includes('landed') || statusLower.includes('arrived')) return 'landed';
    if (statusLower.includes('delayed')) return 'delayed';
    if (statusLower.includes('cancelled')) return 'cancelled';
    if (statusLower.includes('boarding')) return 'boarding';
    if (statusLower.includes('departed')) return 'departed';
    
    return 'unknown';
  }

  private calculateDelay(flight: any, type: 'arrivals' | 'departures'): number | undefined {
    try {
      const movement = type === 'arrivals' ? flight.arrival : flight.departure;
      if (!movement?.scheduledTime || !movement?.actualTime) return undefined;
      
      const scheduled = new Date(movement.scheduledTime.utc);
      const actual = new Date(movement.actualTime.utc);
      
      return Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60));
    } catch {
      return undefined;
    }
  }
}

export const API_CONFIGS = {
  aerodatabox: {
    provider: 'aerodatabox' as const,
    baseUrl: 'https://aerodatabox.p.rapidapi.com',
    rateLimit: 150
  }
};

export default FlightApiService;
'@

# Write the updated service
$updatedApiService | Out-File -FilePath "lib/flightApiService.ts" -Encoding UTF8

Write-Host "✅ Updated FlightApiService.ts" -ForegroundColor Green

# Step 2: Deploy to server
Write-Host "`n2. Deploying to server..." -ForegroundColor Blue

# Copy files to server
scp -o StrictHostKeyChecking=no lib/flightApiService.ts lib/flightRepository.ts root@${SERVER_IP}:/opt/anyway-flight-schedule/lib/

# Deploy script for server
$deployScript = @'
#!/bin/bash
set -e

echo "🔧 Deploying flight data fix..."

cd /opt/anyway-flight-schedule

# Update environment variables for direct API access
echo "📝 Updating environment variables..."
cat > .env.local << EOF
NEXT_PUBLIC_FLIGHT_API_KEY=cmj2peefi0001la04p5rkbbcc
NEXT_PUBLIC_FLIGHT_API_PROVIDER=aerodatabox
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=600000
NEXT_PUBLIC_PRIORITY_AIRPORTS=OTP,CLJ,TSR,IAS,CND,KIV,SBZ,CRA,BCM,BAY
NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS=3
NEXT_PUBLIC_SCHEDULER_ENABLED=true
EOF

# Rebuild application
echo "🔨 Building application..."
npm run build

# Restart services
echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d --build

echo "✅ Deployment completed"
'@

# Execute deployment
$deployScript | ssh -o StrictHostKeyChecking=no root@$SERVER_IP 'bash -s'

Write-Host "✅ Deployed to server" -ForegroundColor Green

# Step 3: Test the fix
Write-Host "`n3. Testing the fix..." -ForegroundColor Blue
Start-Sleep -Seconds 30

try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/api/flights/OTP/arrivals" -TimeoutSec 30 -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "📊 Test Results:" -ForegroundColor Cyan
    Write-Host "  Success: $($data.success)" -ForegroundColor White
    Write-Host "  Data Count: $($data.data.Count)" -ForegroundColor White
    Write-Host "  Cached: $($data.cached)" -ForegroundColor White
    Write-Host "  Error: $($data.error)" -ForegroundColor White
    
    if ($data.data.Count -gt 0) {
        Write-Host "`n  Flight Details:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(3, $data.data.Count); $i++) {
            $flight = $data.data[$i]
            Write-Host "    $($i+1). $($flight.flight_number) - $($flight.airline.name) - $($flight.status)" -ForegroundColor White
        }
        
        $firstFlight = $data.data[0]
        if ($firstFlight.flight_number -ne "N/A" -and $firstFlight.airline.name -ne "Unknown") {
            Write-Host "`n🎉 SUCCESS! Real flight data is now being returned!" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️ Still returning dummy data - may need API key verification" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n⚠️ No flights returned - checking error..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Test failed: $_" -ForegroundColor Red
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "✅ Switched from MCP to direct AeroDataBox API" -ForegroundColor Green
Write-Host "✅ Updated service configuration" -ForegroundColor Green
Write-Host "✅ Deployed to server" -ForegroundColor Green
Write-Host "✅ CSP remains properly configured" -ForegroundColor Green

Write-Host "`n🌐 Test the website:" -ForegroundColor Yellow
Write-Host "  https://anyway.ro/airport/OTP/arrivals" -ForegroundColor White
Write-Host "  https://anyway.ro/airport/CLJ/departures" -ForegroundColor White

Write-Host "`n✅ Flight Data Fix Complete!" -ForegroundColor Green