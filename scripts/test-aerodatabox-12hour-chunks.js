#!/usr/bin/env node

/**
 * Test AeroDataBox API cu intervale de 12 ore pentru ieri
 * API-ul permite maxim 12 ore per request
 */

const https = require('https');

async function test12HourChunks() {
  console.log('=== TEST AERODATABOX 12-HOUR CHUNKS ===');
  
  const apiKey = 'cmj2m39qs0001k00404cmwu75';
  const airportCode = 'OTP';
  
  // Calculate yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  console.log(`Testing for yesterday: ${yesterdayStr} (${yesterday.toLocaleDateString('en-US', { weekday: 'long' })})`);
  
  // Test 12-hour chunks for yesterday
  const chunks = [
    {
      name: 'Yesterday Morning (00:00-12:00)',
      from: `${yesterdayStr}T00:00:00Z`,
      to: `${yesterdayStr}T12:00:00Z`
    },
    {
      name: 'Yesterday Evening (12:00-23:59)',
      from: `${yesterdayStr}T12:00:00Z`,
      to: `${yesterdayStr}T23:59:59Z`
    },
    {
      name: 'Yesterday Full Day (00:00-11:59) - exactly 12h',
      from: `${yesterdayStr}T00:00:00Z`,
      to: `${yesterdayStr}T11:59:59Z`
    }
  ];
  
  for (const chunk of chunks) {
    console.log(`\n--- ${chunk.name} ---`);
    const endpoint = `/flights/airports/Iata/${airportCode}/${chunk.from}/${chunk.to}`;
    await testEndpoint(apiKey, endpoint);
  }
  
  // Also test some other historical endpoints that might work
  console.log(`\n--- Testing alternative historical endpoints ---`);
  
  const alternativeEndpoints = [
    // Try different API paths that might support historical data
    `/flights/airports/Iata/${airportCode}/history?date=${yesterdayStr}`,
    `/flights/airports/Iata/${airportCode}/schedule?date=${yesterdayStr}`,
    `/airports/Iata/${airportCode}/flights?date=${yesterdayStr}`,
    `/airports/Iata/${airportCode}/flights/${yesterdayStr}`,
  ];
  
  for (const endpoint of alternativeEndpoints) {
    console.log(`\n--- Testing: ${endpoint} ---`);
    await testEndpoint(apiKey, endpoint);
  }
}

async function testEndpoint(apiKey, endpoint) {
  const url = `https://prod.api.market/api/v1/aedbx/aerodatabox${endpoint}`;
  
  try {
    const response = await makeHttpsRequest(url, {
      'x-api-market-key': apiKey,
      'accept': 'application/json'
    });
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        console.log(`Response keys: ${Object.keys(data).join(', ')}`);
        
        if (data.arrivals || data.departures) {
          const arrCount = data.arrivals ? data.arrivals.length : 0;
          const depCount = data.departures ? data.departures.length : 0;
          console.log(`Arrivals: ${arrCount}, Departures: ${depCount}`);
          
          // Analyze dates in the response
          const dates = new Set();
          
          if (data.arrivals) {
            data.arrivals.forEach(flight => {
              if (flight.movement && flight.movement.scheduledTime) {
                const flightDate = flight.movement.scheduledTime.local || flight.movement.scheduledTime.utc;
                const date = flightDate.split('T')[0];
                dates.add(date);
              }
            });
          }
          
          if (data.departures) {
            data.departures.forEach(flight => {
              if (flight.movement && flight.movement.scheduledTime) {
                const flightDate = flight.movement.scheduledTime.local || flight.movement.scheduledTime.utc;
                const date = flightDate.split('T')[0];
                dates.add(date);
              }
            });
          }
          
          console.log(`Unique dates in response: ${Array.from(dates).sort().join(', ')}`);
          
          if (arrCount > 0) {
            const firstArrival = data.arrivals[0];
            if (firstArrival.movement && firstArrival.movement.scheduledTime) {
              const flightDate = firstArrival.movement.scheduledTime.local || firstArrival.movement.scheduledTime.utc;
              console.log(`First arrival: ${firstArrival.number} at ${flightDate}`);
            }
          }
          
        } else {
          console.log('No arrivals/departures in response');
          if (Object.keys(data).length > 0) {
            console.log(`Response preview: ${JSON.stringify(data).substring(0, 300)}...`);
          }
        }
      } catch (parseError) {
        console.log(`JSON parse error: ${parseError.message}`);
        console.log(`Response preview: ${response.body.substring(0, 200)}...`);
      }
    } else {
      console.log(`Error: ${response.statusCode}`);
      const errorPreview = response.body.substring(0, 300);
      console.log(`Response: ${errorPreview}...`);
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(response.body);
        if (errorData.message) {
          console.log(`Error message: ${errorData.message}`);
        }
      } catch (e) {
        // Ignore parse errors for error responses
      }
    }
    
  } catch (error) {
    console.log(`Request failed: ${error.message}`);
  }
}

function makeHttpsRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

test12HourChunks().catch(console.error);