#!/usr/bin/env node

/**
 * Script to process airports found in flight cache data
 * This runs server-side and processes all IATA codes found in flight data
 */

const path = require('path');

// Set up the environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the airport database service
const AirportDatabaseService = require('../lib/airportDatabase.ts').default;
const { cacheManager } = require('../lib/cacheManager.ts');

async function extractIataCodesFromCache() {
  console.log('[Airport Processor] Initializing cache manager...');
  await cacheManager.initialize();
  
  const codes = new Set();
  
  // Get all flight data from cache
  const cacheKeys = [
    'OTP_arrivals', 'OTP_departures',
    'BBU_arrivals', 'BBU_departures', 
    'CLJ_arrivals', 'CLJ_departures',
    'TSR_arrivals', 'TSR_departures',
    'IAS_arrivals', 'IAS_departures',
    'CND_arrivals', 'CND_departures',
    'SBZ_arrivals', 'SBZ_departures',
    'CRA_arrivals', 'CRA_departures',
    'BCM_arrivals', 'BCM_departures',
    'BAY_arrivals', 'BAY_departures',
    'OMR_arrivals', 'OMR_departures',
    'SCV_arrivals', 'SCV_departures',
    'TGM_arrivals', 'TGM_departures',
    'ARW_arrivals', 'ARW_departures',
    'SUJ_arrivals', 'SUJ_departures',
    'RMO_arrivals', 'RMO_departures'
  ];
  
  for (const key of cacheKeys) {
    const flights = cacheManager.getCachedData(key);
    if (flights && Array.isArray(flights)) {
      flights.forEach(flight => {
        // Extract origin codes
        if (flight.originCode && isValidIataCode(flight.originCode)) {
          codes.add(flight.originCode.toUpperCase());
        }
        if (flight.origin?.code && isValidIataCode(flight.origin.code)) {
          codes.add(flight.origin.code.toUpperCase());
        }
        
        // Extract destination codes
        if (flight.destinationCode && isValidIataCode(flight.destinationCode)) {
          codes.add(flight.destinationCode.toUpperCase());
        }
        if (flight.destination?.code && isValidIataCode(flight.destination.code)) {
          codes.add(flight.destination.code.toUpperCase());
        }
      });
    }
  }
  
  return Array.from(codes);
}

function isValidIataCode(code) {
  return typeof code === 'string' && 
         code.length === 3 && 
         /^[A-Z]{3}$/.test(code.toUpperCase());
}

async function processAirports() {
  try {
    console.log('[Airport Processor] Starting airport processing...');
    
    // Extract IATA codes from cache
    const iataCodes = await extractIataCodesFromCache();
    console.log(`[Airport Processor] Found ${iataCodes.length} unique IATA codes:`, iataCodes);
    
    if (iataCodes.length === 0) {
      console.log('[Airport Processor] No IATA codes found in cache');
      return;
    }
    
    // Initialize airport database
    const airportDb = new AirportDatabaseService();
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const code of iataCodes) {
      processed++;
      console.log(`[Airport Processor] Processing ${code} (${processed}/${iataCodes.length})...`);
      
      try {
        // Check if already exists
        const existing = airportDb.getAirport(code);
        if (existing) {
          console.log(`[Airport Processor] ✓ ${code} already exists: ${existing.name}`);
          skipped++;
          continue;
        }
        
        // Fetch from AeroDataBox
        const airportInfo = await airportDb.fetchAirportFromAeroDataBox(code);
        if (airportInfo) {
          const saved = await airportDb.saveAirport(airportInfo);
          if (saved) {
            console.log(`[Airport Processor] ✅ Successfully added ${code}: ${airportInfo.name} (${airportInfo.city})`);
            successful++;
          } else {
            console.log(`[Airport Processor] ❌ Failed to save ${code}`);
            failed++;
          }
        } else {
          console.log(`[Airport Processor] ❌ No data found for ${code}`);
          failed++;
        }
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[Airport Processor] Error processing ${code}:`, error.message);
        failed++;
      }
    }
    
    airportDb.close();
    
    console.log('\n[Airport Processor] Processing complete!');
    console.log(`Total processed: ${processed}`);
    console.log(`Successful: ${successful}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`Failed: ${failed}`);
    
  } catch (error) {
    console.error('[Airport Processor] Fatal error:', error);
    process.exit(1);
  }
}

// Run the processor
if (require.main === module) {
  processAirports()
    .then(() => {
      console.log('[Airport Processor] Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('[Airport Processor] Error:', error);
      process.exit(1);
    });
}

module.exports = { processAirports, extractIataCodesFromCache };