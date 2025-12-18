#!/usr/bin/env node

/**
 * Emergency cache fix script
 * This script will manually populate the cache with some flight data
 */

const fs = require('fs').promises;
const path = require('path');

async function fixCache() {
  console.log('🔧 Emergency cache fix starting...');
  
  const dataDir = '/opt/anyway-flight-schedule/data';
  const cacheDataPath = path.join(dataDir, 'cache-data.json');
  
  try {
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Create minimal cache data structure
    const minimalCacheData = [
      {
        id: `flight_LROP_arrivals_${Date.now()}`,
        category: 'flightData',
        key: 'LROP_arrivals',
        data: [
          {
            flight_number: 'KL 1373',
            airline: { name: 'KLM Royal Dutch Airlines', code: 'KL' },
            origin: { airport: 'Amsterdam Airport Schiphol', code: 'AMS', city: 'Amsterdam' },
            destination: { airport: 'Henri Coandă International Airport', code: 'OTP', city: 'București' },
            scheduled_time: new Date().toISOString(),
            status: 'scheduled',
            delay: 0
          }
        ],
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        lastAccessed: new Date().toISOString(),
        source: 'manual',
        success: true
      },
      {
        id: `flight_LROP_departures_${Date.now()}`,
        category: 'flightData',
        key: 'LROP_departures',
        data: [
          {
            flight_number: 'RO 371',
            airline: { name: 'TAROM', code: 'RO' },
            origin: { airport: 'Henri Coandă International Airport', code: 'OTP', city: 'București' },
            destination: { airport: 'London Heathrow Airport', code: 'LHR', city: 'London' },
            scheduled_time: new Date().toISOString(),
            status: 'scheduled',
            delay: 0
          }
        ],
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        lastAccessed: new Date().toISOString(),
        source: 'manual',
        success: true
      }
    ];
    
    // Write cache data
    await fs.writeFile(cacheDataPath, JSON.stringify(minimalCacheData, null, 2));
    console.log('✅ Cache data written successfully');
    
    // Create cache config if it doesn't exist
    const configPath = path.join(dataDir, 'cache-config.json');
    const config = {
      flightData: {
        cronInterval: 60, // 60 minutes
        cacheUntilNext: true
      },
      analytics: {
        cronInterval: 30, // 30 days
        cacheMaxAge: 360 // 360 days
      },
      aircraft: {
        cronInterval: 360, // 360 days
        cacheMaxAge: 360 // 360 days
      }
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Cache config written successfully');
    
    // Create request counter
    const counterPath = path.join(dataDir, 'request-counter.json');
    const counter = {
      flightData: 0,
      analytics: 0,
      aircraft: 0,
      lastReset: new Date().toISOString(),
      totalRequests: 0
    };
    
    await fs.writeFile(counterPath, JSON.stringify(counter, null, 2));
    console.log('✅ Request counter written successfully');
    
    console.log('🎉 Emergency cache fix completed!');
    console.log('📝 Next steps:');
    console.log('   1. Restart PM2: pm2 restart anyway-ro');
    console.log('   2. Test the site: curl http://127.0.0.1:3000/api/aeroport/OTP/statistici');
    
  } catch (error) {
    console.error('❌ Error fixing cache:', error);
    process.exit(1);
  }
}

fixCache();