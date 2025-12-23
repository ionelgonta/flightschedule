#!/usr/bin/env node

/**
 * Debug AeroDataBox API structure
 * Analizează structura exactă a răspunsului pentru a înțelege de ce nu găsim datele
 */

const https = require('https');

async function debugAeroDataBoxStructure() {
  console.log('=== DEBUG AERODATABOX STRUCTURE ===');
  
  const apiKey = 'cmj2m39qs0001k00404cmwu75';
  const airportCode = 'OTP';
  const url = `https://prod.api.market/api/v1/aedbx/aerodatabox/flights/airports/Iata/${airportCode}`;
  
  try {
    const response = await makeHttpsRequest(url, {
      'x-api-market-key': apiKey,
      'accept': 'application/json'
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      console.log('=== FULL RESPONSE STRUCTURE ===');
      console.log('Top level keys:', Object.keys(data));
      
      if (data.arrivals && data.arrivals.length > 0) {
        console.log('\n=== FIRST ARRIVAL FLIGHT STRUCTURE ===');
        const firstArrival = data.arrivals[0];
        console.log(JSON.stringify(firstArrival, null, 2));
        
        console.log('\n=== ARRIVAL FLIGHT KEYS ===');
        console.log('Flight keys:', Object.keys(firstArrival));
        
        if (firstArrival.arrival) {
          console.log('Arrival movement keys:', Object.keys(firstArrival.arrival));
          if (firstArrival.arrival.scheduledTime) {
            console.log('Scheduled time keys:', Object.keys(firstArrival.arrival.scheduledTime));
          }
        }
        
        if (firstArrival.departure) {
          console.log('Departure movement keys:', Object.keys(firstArrival.departure));
          if (firstArrival.departure.scheduledTime) {
            console.log('Departure scheduled time keys:', Object.keys(firstArrival.departure.scheduledTime));
          }
        }
      }
      
      if (data.departures && data.departures.length > 0) {
        console.log('\n=== FIRST DEPARTURE FLIGHT STRUCTURE ===');
        const firstDeparture = data.departures[0];
        console.log(JSON.stringify(firstDeparture, null, 2));
      }
      
    } else {
      console.log(`Error: ${response.statusCode} - ${response.body}`);
    }
    
  } catch (error) {
    console.error('Request failed:', error);
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

debugAeroDataBoxStructure().catch(console.error);