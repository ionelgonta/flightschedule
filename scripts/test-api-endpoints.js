/**
 * Script pentru testarea endpoint-urilor API și verificarea datelor
 */

const http = require('http');
const https = require('https');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: 'Invalid JSON'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints...\n');
  
  // Test endpoints - adjust port if needed
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    '/api/flights/OTP/arrivals',
    '/api/flights/OTP/departures',
    '/api/flights/CLJ/arrivals',
    '/api/flights/CLJ/departures'
  ];
  
  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    console.log(`🔄 Testing: ${endpoint}`);
    
    try {
      const response = await makeRequest(url);
      
      if (response.status === 200) {
        const data = response.data;
        
        if (data.success) {
          const flightCount = Array.isArray(data.data) ? data.data.length : 0;
          const cached = data.cached ? '(cached)' : '(fresh)';
          const lastUpdated = data.last_updated ? new Date(data.last_updated).toLocaleString() : 'unknown';
          
          console.log(`   ✅ SUCCESS: ${flightCount} flights ${cached}`);
          console.log(`   📅 Last updated: ${lastUpdated}`);
          
          if (data.weather_info) {
            console.log(`   🌤️  Weather: ${data.weather_info.temperature}°C, ${data.weather_info.description}`);
          }
          
          if (flightCount > 0) {
            const firstFlight = data.data[0];
            console.log(`   🛫 Sample flight: ${firstFlight.flight_number} (${firstFlight.airline?.name || 'Unknown'})`);
          }
        } else {
          console.log(`   ❌ API ERROR: ${data.error || 'Unknown error'}`);
        }
      } else {
        console.log(`   ❌ HTTP ERROR: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ REQUEST FAILED: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Test cache health
  console.log('📊 Testing cache health...');
  try {
    const response = await makeRequest(baseUrl + '/api/admin/cache-management');
    
    if (response.status === 200 && response.data.cacheStats) {
      const stats = response.data.cacheStats;
      console.log(`   📈 Total cache entries: ${stats.cacheEntries?.total || 0}`);
      console.log(`   🛫 Flight data entries: ${stats.cacheEntries?.flightData || 0}`);
      console.log(`   🌤️  Weather entries: ${stats.cacheEntries?.weather || 0}`);
      
      if (stats.lastUpdated?.flightData) {
        const lastUpdate = new Date(stats.lastUpdated.flightData).toLocaleString();
        console.log(`   ⏰ Last flight data update: ${lastUpdate}`);
      }
    } else {
      console.log('   ⚠️  Could not retrieve cache stats');
    }
  } catch (error) {
    console.log(`   ❌ Cache stats failed: ${error.message}`);
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('If you see flights data above, the fixed cache manager is working!');
  console.log('If no flights are shown, try:');
  console.log('   1. Wait 15 minutes for cron job to populate cache');
  console.log('   2. Use admin panel to manually refresh');
  console.log('   3. Check API keys and network connectivity');
}

// Run the test
testApiEndpoints();