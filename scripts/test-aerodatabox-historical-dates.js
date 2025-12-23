#!/usr/bin/env node

/**
 * Test AeroDataBox API pentru date istorice (ieri, alaltăieri)
 * Verifică dacă putem lua date pentru zilele anterioare
 */

const https = require('https');

async function testHistoricalDates() {
  console.log('=== TEST AERODATABOX HISTORICAL DATES ===');
  
  const apiKey = 'cmj2m39qs0001k00404cmwu75';
  const airportCode = 'OTP';
  
  // Calculate dates
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const dayBeforeStr = dayBeforeYesterday.toISOString().split('T')[0];
  
  console.log(`Today: ${todayStr} (${today.toLocaleDateString('en-US', { weekday: 'long' })})`);
  console.log(`Yesterday: ${yesterdayStr} (${yesterday.toLocaleDateString('en-US', { weekday: 'long' })})`);
  console.log(`Day before: ${dayBeforeStr} (${dayBeforeYesterday.toLocaleDateString('en-US', { weekday: 'long' })})`);
  
  // Test different endpoint formats for historical data
  const endpointsToTest = [
    // Standard endpoint (should return today's data)
    `/flights/airports/Iata/${airportCode}`,
    
    // Try with date parameter (common formats)
    `/flights/airports/Iata/${airportCode}/${yesterdayStr}`,
    `/flights/airports/Iata/${airportCode}?date=${yesterdayStr}`,
    `/flights/airports/Iata/${airportCode}?from=${yesterdayStr}&to=${yesterdayStr}`,
    
    // Try different date formats
    `/flights/airports/Iata/${airportCode}/${yesterdayStr.replace(/-/g, '')}`, // YYYYMMDD
    `/flights/airports/Iata/${airportCode}/${yesterdayStr}T00:00:00Z/${yesterdayStr}T23:59:59Z`,
  ];
  
  for (const endpoint of endpointsToTest) {
    console.log(`\n--- Testing endpoint: ${endpoint} ---`);
    await testEndpoint(apiKey, endpoint);
  }
  
  // Also test if we can get historical data by specifying time ranges
  console.log(`\n--- Testing time range endpoints ---`);
  
  const timeRangeEndpoints = [
    `/flights/airports/Iata/${airportCode}?from=${yesterdayStr}T00:00:00Z&to=${yesterdayStr}T23:59:59Z`,
    `/flights/airports/Iata/${airportCode}?startDate=${yesterdayStr}&endDate=${yesterdayStr}`,
    `/flights/date/${yesterdayStr}/airports/Iata/${airportCode}`,
  ];
  
  for (const endpoint of timeRangeEndpoints) {
    console.log(`\n--- Testing time range: ${endpoint} ---`);
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
          
          // Check dates in the response
          if (arrCount > 0) {
            const firstArrival = data.arrivals[0];
            if (firstArrival.movement && firstArrival.movement.scheduledTime) {
              const flightDate = firstArrival.movement.scheduledTime.local || firstArrival.movement.scheduledTime.utc;
              console.log(`Sample arrival date: ${flightDate}`);
            }
          }
          
          if (depCount > 0) {
            const firstDeparture = data.departures[0];
            if (firstDeparture.movement && firstDeparture.movement.scheduledTime) {
              const flightDate = firstDeparture.movement.scheduledTime.local || firstDeparture.movement.scheduledTime.utc;
              console.log(`Sample departure date: ${flightDate}`);
            }
          }
        } else {
          console.log('No arrivals/departures in response');
          console.log(`Response preview: ${JSON.stringify(data).substring(0, 200)}...`);
        }
      } catch (parseError) {
        console.log(`JSON parse error: ${parseError.message}`);
        console.log(`Response preview: ${response.body.substring(0, 200)}...`);
      }
    } else {
      console.log(`Error: ${response.statusCode}`);
      console.log(`Response: ${response.body.substring(0, 200)}...`);
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

testHistoricalDates().catch(console.error);