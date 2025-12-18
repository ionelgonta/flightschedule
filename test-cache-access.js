#!/usr/bin/env node

/**
 * Test script pentru verificarea accesului la cache
 */

const fs = require('fs');
const path = require('path');

console.log('=== TEST ACCES CACHE ===');

// Încarcă datele din cache
const cacheDataPath = path.join(__dirname, 'data', 'cache-data.json');

if (!fs.existsSync(cacheDataPath)) {
  console.error('❌ Nu există fișierul cache-data.json');
  process.exit(1);
}

const cacheData = JSON.parse(fs.readFileSync(cacheDataPath, 'utf8'));
console.log('✅ Cache data încărcat:', cacheData.length, 'intrări');

// Caută date pentru OTP/LROP
const otpKeys = cacheData.filter(item => 
  item.key && (
    item.key.includes('OTP') || 
    item.key.includes('LROP') ||
    item.key.includes('arrivals') ||
    item.key.includes('departures')
  )
);

console.log('\n📍 Chei găsite pentru OTP/LROP:');
otpKeys.forEach(item => {
  console.log(`  - ${item.key}: ${Array.isArray(item.data) ? item.data.length : 'N/A'} elemente`);
  if (Array.isArray(item.data) && item.data.length > 0) {
    console.log(`    Primul element:`, JSON.stringify(item.data[0], null, 2).substring(0, 200) + '...');
  }
});

// Testează direct cacheManager
async function testCacheManager() {
  try {
    console.log('\n🔧 Testez cacheManager...');
    
    // Simulează structura cacheManager
    const mockCacheManager = {
      getCachedData: (key) => {
        const item = cacheData.find(entry => entry.key === key);
        return item ? item.data : null;
      }
    };
    
    const testKeys = [
      'OTP_arrivals',
      'OTP_departures', 
      'LROP_arrivals',
      'LROP_departures'
    ];
    
    for (const key of testKeys) {
      const data = mockCacheManager.getCachedData(key);
      console.log(`  ${key}: ${data ? data.length : 0} elemente`);
      
      if (data && data.length > 0) {
        const flight = data[0];
        console.log(`    Exemplu zbor:`, {
          flight_number: flight.flight_number,
          airline: flight.airline?.name,
          status: flight.status,
          delay: flight.delay
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Eroare la testarea cacheManager:', error);
  }
}

testCacheManager();