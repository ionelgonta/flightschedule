#!/usr/bin/env node

/**
 * Test AeroDataBox API pentru data de azi
 * Încearcă să ia date reale pentru OTP (București) pentru data curentă
 */

const https = require('https');

async function testAeroDataBoxToday() {
  console.log('=== TEST AERODATABOX PENTRU AZI ===');
  console.log(`Data: ${new Date().toISOString()}`);
  console.log(`Azi: ${new Date().toLocaleDateString('ro-RO')} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})`);
  
  const apiKey = 'cmj2m39qs0001k00404cmwu75'; // API key from config
  const airportCode = 'OTP'; // București Henri Coandă
  
  // Test arrivals
  console.log('\n--- TESTING ARRIVALS ---');
  await testEndpoint(apiKey, airportCode, 'arrivals');
  
  // Test departures  
  console.log('\n--- TESTING DEPARTURES ---');
  await testEndpoint(apiKey, airportCode, 'departures');
}

async function testEndpoint(apiKey, airportCode, type) {
  const url = `https://prod.api.market/api/v1/aedbx/aerodatabox/flights/airports/Iata/${airportCode}`;
  
  console.log(`Making request to: ${url}`);
  
  try {
    const response = await makeHttpsRequest(url, {
      'x-api-market-key': apiKey,
      'accept': 'application/json'
    });
    
    console.log(`Response status: ${response.statusCode}`);
    console.log(`Response headers:`, response.headers);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log(`Response keys:`, Object.keys(data));
      
      const flights = type === 'arrivals' ? (data.arrivals || []) : (data.departures || []);
      console.log(`${type} count: ${flights.length}`);
      
      if (flights.length > 0) {
        console.log('\nFirst 3 flights:');
        flights.slice(0, 3).forEach((flight, index) => {
          console.log(`${index + 1}. ${flight.number || 'N/A'} - ${flight.airline?.name || 'Unknown'}`);
          
          if (type === 'arrivals') {
            const origin = flight.departure?.airport?.iata || flight.departure?.airport?.icao || 'Unknown';
            const scheduledTime = flight.arrival?.scheduledTime?.local || flight.arrival?.scheduledTime?.utc || 'Unknown';
            console.log(`   From: ${origin}, Scheduled: ${scheduledTime}`);
          } else {
            const destination = flight.arrival?.airport?.iata || flight.arrival?.airport?.icao || 'Unknown';
            const scheduledTime = flight.departure?.scheduledTime?.local || flight.departure?.scheduledTime?.utc || 'Unknown';
            console.log(`   To: ${destination}, Scheduled: ${scheduledTime}`);
          }
          
          console.log(`   Status: ${flight.status || 'Unknown'}`);
        });
        
        // Check dates in the flights
        console.log('\nFlight dates analysis:');
        const dates = new Set();
        flights.forEach(flight => {
          let flightDate = null;
          if (type === 'arrivals') {
            flightDate = flight.arrival?.scheduledTime?.local || flight.arrival?.scheduledTime?.utc;
          } else {
            flightDate = flight.departure?.scheduledTime?.local || flight.departure?.scheduledTime?.utc;
          }
          
          if (flightDate) {
            const date = flightDate.split('T')[0];
            dates.add(date);
          }
        });
        
        console.log(`Unique dates found: ${Array.from(dates).sort().join(', ')}`);
        
        const today = new Date().toISOString().split('T')[0];
        const todayFlights = flights.filter(flight => {
          let flightDate = null;
          if (type === 'arrivals') {
            flightDate = flight.arrival?.scheduledTime?.local || flight.arrival?.scheduledTime?.utc;
          } else {
            flightDate = flight.departure?.scheduledTime?.local || flight.departure?.scheduledTime?.utc;
          }
          
          if (flightDate) {
            const date = flightDate.split('T')[0];
            return date === today;
          }
          return false;
        });
        
        console.log(`Flights for today (${today}): ${todayFlights.length}`);
        
      } else {
        console.log('No flights returned');
      }
    } else {
      console.log(`Error response: ${response.body}`);
    }
    
  } catch (error) {
    console.error(`Request failed:`, error.message);
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

// Run the test
testAeroDataBoxToday().catch(console.error);