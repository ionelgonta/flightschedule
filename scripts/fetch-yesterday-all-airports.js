#!/usr/bin/env node

/**
 * Fetch yesterday's data for all airports using AeroDataBox API
 * Uses 12-hour chunks as required by API limitations
 */

const https = require('https');

async function fetchYesterdayAllAirports() {
  console.log('=== FETCH YESTERDAY DATA FOR ALL AIRPORTS ===');
  
  const apiKey = 'cmj2m39qs0001k00404cmwu75';
  
  // All Romanian and Moldovan airports
  const airports = ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'];
  
  // Calculate yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  console.log(`Fetching data for: ${yesterdayStr} (${yesterday.toLocaleDateString('en-US', { weekday: 'long' })})`);
  console.log(`Total airports: ${airports.length}`);
  
  const allFlightData = [];
  let totalFlights = 0;
  
  for (const airport of airports) {
    console.log(`\n--- Processing ${airport} ---`);
    
    try {
      // Fetch morning chunk (00:00-12:00)
      console.log(`  Fetching morning data (00:00-12:00)...`);
      const morningData = await fetchTimeChunk(apiKey, airport, yesterdayStr, '00:00:00', '11:59:59');
      
      // Fetch evening chunk (12:00-23:59)  
      console.log(`  Fetching evening data (12:00-23:59)...`);
      const eveningData = await fetchTimeChunk(apiKey, airport, yesterdayStr, '12:00:00', '23:59:59');
      
      // Combine and deduplicate data
      const combinedArrivals = [...(morningData.arrivals || []), ...(eveningData.arrivals || [])];
      const combinedDepartures = [...(morningData.departures || []), ...(eveningData.departures || [])];
      
      // Deduplicate based on flight number and scheduled time
      const uniqueArrivals = deduplicateFlights(combinedArrivals);
      const uniqueDepartures = deduplicateFlights(combinedDepartures);
      
      const airportTotal = uniqueArrivals.length + uniqueDepartures.length;
      totalFlights += airportTotal;
      
      console.log(`  ${airport}: ${uniqueArrivals.length} arrivals + ${uniqueDepartures.length} departures = ${airportTotal} total`);
      
      if (airportTotal > 0) {
        allFlightData.push({
          airport: airport,
          date: yesterdayStr,
          arrivals: uniqueArrivals,
          departures: uniqueDepartures,
          total: airportTotal
        });
        
        // Show sample flights
        if (uniqueArrivals.length > 0) {
          const sampleArrival = uniqueArrivals[0];
          const arrTime = sampleArrival.movement?.scheduledTime?.local || sampleArrival.movement?.scheduledTime?.utc || 'Unknown';
          console.log(`    Sample arrival: ${sampleArrival.number} at ${arrTime}`);
        }
        
        if (uniqueDepartures.length > 0) {
          const sampleDeparture = uniqueDepartures[0];
          const depTime = sampleDeparture.movement?.scheduledTime?.local || sampleDeparture.movement?.scheduledTime?.utc || 'Unknown';
          console.log(`    Sample departure: ${sampleDeparture.number} at ${depTime}`);
        }
      }
      
      // Rate limiting - wait 2 seconds between airports
      if (airports.indexOf(airport) < airports.length - 1) {
        console.log(`  Waiting 2 seconds...`);
        await sleep(2000);
      }
      
    } catch (error) {
      console.log(`  ERROR for ${airport}: ${error.message}`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total flights collected: ${totalFlights}`);
  console.log(`Airports with data: ${allFlightData.length}/${airports.length}`);
  
  // Show breakdown by airport
  console.log(`\n=== BREAKDOWN BY AIRPORT ===`);
  allFlightData
    .sort((a, b) => b.total - a.total)
    .forEach(data => {
      console.log(`${data.airport}: ${data.arrivals.length} arr + ${data.departures.length} dep = ${data.total} total`);
    });
  
  // Analyze dates to confirm we got yesterday's data
  console.log(`\n=== DATE ANALYSIS ===`);
  const allDates = new Set();
  allFlightData.forEach(airportData => {
    [...airportData.arrivals, ...airportData.departures].forEach(flight => {
      if (flight.movement?.scheduledTime) {
        const flightDate = flight.movement.scheduledTime.local || flight.movement.scheduledTime.utc;
        const date = flightDate.split('T')[0];
        allDates.add(date);
      }
    });
  });
  
  console.log(`Unique dates found: ${Array.from(allDates).sort().join(', ')}`);
  
  const yesterdayFlightCount = allFlightData.reduce((sum, airportData) => {
    const yesterdayFlights = [...airportData.arrivals, ...airportData.departures].filter(flight => {
      if (flight.movement?.scheduledTime) {
        const flightDate = flight.movement.scheduledTime.local || flight.movement.scheduledTime.utc;
        const date = flightDate.split('T')[0];
        return date === yesterdayStr;
      }
      return false;
    });
    return sum + yesterdayFlights.length;
  }, 0);
  
  console.log(`Flights specifically for ${yesterdayStr}: ${yesterdayFlightCount}`);
  
  return allFlightData;
}

async function fetchTimeChunk(apiKey, airportCode, date, startTime, endTime) {
  const fromTime = `${date}T${startTime}Z`;
  const toTime = `${date}T${endTime}Z`;
  
  const endpoint = `/flights/airports/Iata/${airportCode}/${fromTime}/${toTime}`;
  const url = `https://prod.api.market/api/v1/aedbx/aerodatabox${endpoint}`;
  
  try {
    const response = await makeHttpsRequest(url, {
      'x-api-market-key': apiKey,
      'accept': 'application/json'
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      return {
        arrivals: data.arrivals || [],
        departures: data.departures || []
      };
    } else {
      console.log(`    API Error ${response.statusCode} for ${airportCode} ${startTime}-${endTime}`);
      return { arrivals: [], departures: [] };
    }
  } catch (error) {
    console.log(`    Request failed for ${airportCode} ${startTime}-${endTime}: ${error.message}`);
    return { arrivals: [], departures: [] };
  }
}

function deduplicateFlights(flights) {
  const seen = new Set();
  return flights.filter(flight => {
    // Create unique key based on flight number, airline, and scheduled time
    const flightNumber = flight.number || 'unknown';
    const airline = flight.airline?.iata || flight.airline?.icao || 'unknown';
    const scheduledTime = flight.movement?.scheduledTime?.utc || flight.movement?.scheduledTime?.local || 'unknown';
    
    const key = `${flightNumber}-${airline}-${scheduledTime}`;
    
    if (seen.has(key)) {
      return false; // Duplicate
    }
    
    seen.add(key);
    return true; // Unique
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// Run the fetch
fetchYesterdayAllAirports().catch(console.error);