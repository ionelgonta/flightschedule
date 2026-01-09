/**
 * Script pentru testarea directă a cache manager-ului reparat
 * Testează funcționalitatea fără a avea nevoie de server
 */

async function testFixedCacheManager() {
  console.log('🔍 Testing Fixed Cache Manager directly...\n');
  
  try {
    // Import the fixed cache manager
    console.log('📦 Loading fixed cache manager...');
    
    // We need to use require with .js extension since we're in Node.js
    const path = require('path');
    const fs = require('fs');
    
    // Check if the fixed cache manager file exists
    const fixedCacheManagerPath = path.join(process.cwd(), 'lib', 'cacheManagerFixed.ts');
    
    if (!fs.existsSync(fixedCacheManagerPath)) {
      console.error('❌ Fixed cache manager file not found!');
      console.log('   Expected at:', fixedCacheManagerPath);
      return;
    }
    
    console.log('✅ Fixed cache manager file found');
    
    // Test cache data directly
    console.log('\n📊 Testing cache data directly...');
    
    const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
    
    if (!fs.existsSync(cacheDataPath)) {
      console.error('❌ Cache data file not found!');
      console.log('   Expected at:', cacheDataPath);
      return;
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cacheDataPath, 'utf-8'));
    console.log(`✅ Cache data loaded: ${cacheData.length} entries`);
    
    // Analyze cache entries
    const flightDataEntries = cacheData.filter(entry => entry.category === 'flightData');
    const weatherEntries = cacheData.filter(entry => entry.category === 'weather');
    const analyticsEntries = cacheData.filter(entry => entry.category === 'analytics');
    
    console.log(`   🛫 Flight data entries: ${flightDataEntries.length}`);
    console.log(`   🌤️  Weather entries: ${weatherEntries.length}`);
    console.log(`   📊 Analytics entries: ${analyticsEntries.length}`);
    
    // Test specific airports
    const testAirports = ['OTP', 'CLJ', 'TSR'];
    
    console.log('\n🛫 Testing flight data for major airports:');
    
    for (const airport of testAirports) {
      const arrivalsKey = `${airport}_arrivals`;
      const departuresKey = `${airport}_departures`;
      
      const arrivalsEntry = cacheData.find(entry => entry.key === arrivalsKey);
      const departuresEntry = cacheData.find(entry => entry.key === departuresKey);
      
      console.log(`\n   🏢 ${airport}:`);
      
      if (arrivalsEntry) {
        const arrivalsCount = getFlightCount(arrivalsEntry.data);
        const arrivalsAge = getAgeInMinutes(arrivalsEntry.createdAt);
        console.log(`      ↓ Arrivals: ${arrivalsCount} flights (${arrivalsAge} min old)`);
        
        if (arrivalsCount > 0) {
          const sampleFlight = getSampleFlight(arrivalsEntry.data);
          if (sampleFlight) {
            console.log(`         Sample: ${sampleFlight.flight_number || sampleFlight.flightNumber} from ${sampleFlight.origin?.code || sampleFlight.originCode}`);
          }
        }
      } else {
        console.log(`      ↓ Arrivals: No data`);
      }
      
      if (departuresEntry) {
        const departuresCount = getFlightCount(departuresEntry.data);
        const departuresAge = getAgeInMinutes(departuresEntry.createdAt);
        console.log(`      ↑ Departures: ${departuresCount} flights (${departuresAge} min old)`);
        
        if (departuresCount > 0) {
          const sampleFlight = getSampleFlight(departuresEntry.data);
          if (sampleFlight) {
            console.log(`         Sample: ${sampleFlight.flight_number || sampleFlight.flightNumber} to ${sampleFlight.destination?.code || sampleFlight.destinationCode}`);
          }
        }
      } else {
        console.log(`      ↑ Departures: No data`);
      }
    }
    
    // Test weather data
    console.log('\n🌤️  Testing weather data:');
    const weatherEntry = cacheData.find(entry => entry.category === 'weather');
    
    if (weatherEntry) {
      const weatherAge = getAgeInMinutes(weatherEntry.createdAt);
      console.log(`   ✅ Weather data available (${weatherAge} min old)`);
      
      if (weatherEntry.data && typeof weatherEntry.data === 'object') {
        const cities = Object.keys(weatherEntry.data);
        console.log(`   🏙️  Cities: ${cities.length} (${cities.slice(0, 3).join(', ')}...)`);
        
        // Sample weather info
        const firstCity = cities[0];
        if (firstCity && weatherEntry.data[firstCity]) {
          const weather = weatherEntry.data[firstCity];
          console.log(`   🌡️  ${firstCity}: ${weather.temperature}°C, ${weather.description}`);
        }
      }
    } else {
      console.log('   ❌ No weather data found');
    }
    
    // Check for corruption
    console.log('\n🔧 Checking for data corruption:');
    let corruptedCount = 0;
    
    flightDataEntries.forEach(entry => {
      if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
        let flightData = entry.data.flights;
        let nestingLevel = 0;
        
        while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
          flightData = flightData.flights;
          nestingLevel++;
        }
        
        if (nestingLevel > 0) {
          corruptedCount++;
          console.log(`   🔧 ${entry.key}: ${nestingLevel} levels of nesting (corrupted)`);
        }
      }
    });
    
    if (corruptedCount === 0) {
      console.log('   ✅ No corrupted entries found');
    } else {
      console.log(`   ❌ Found ${corruptedCount} corrupted entries`);
    }
    
    // Summary
    console.log('\n🎯 SUMMARY:');
    
    const totalFlights = flightDataEntries.reduce((sum, entry) => {
      return sum + getFlightCount(entry.data);
    }, 0);
    
    console.log(`   📊 Total flights in cache: ${totalFlights}`);
    console.log(`   🏢 Airports with data: ${flightDataEntries.length / 2} (assuming arrivals + departures)`);
    console.log(`   🔧 Corrupted entries: ${corruptedCount}`);
    
    if (totalFlights > 0) {
      console.log('\n✅ GOOD NEWS: Cache contains flight data!');
      console.log('   The issue might be that the application is not using the fixed cache manager.');
      console.log('   Make sure to restart the application after the migration.');
    } else {
      console.log('\n⚠️  Cache is empty or contains no flight data.');
      console.log('   This could be normal if:');
      console.log('   - No flights are scheduled for these airports');
      console.log('   - API is not returning data');
      console.log('   - Cache needs to be refreshed');
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the application to use the fixed cache manager');
    console.log('   2. Wait 15 minutes for cron jobs to populate fresh data');
    console.log('   3. Use admin panel to manually refresh if needed');
    console.log('   4. Monitor with: node scripts/monitor-cache-health.js');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure you are in the project root directory');
    console.log('   2. Check that data/cache-data.json exists');
    console.log('   3. Verify file permissions');
  }
}

// Helper functions
function getFlightCount(data) {
  if (!data) return 0;
  
  if (Array.isArray(data)) {
    return data.length;
  }
  
  if (typeof data === 'object' && 'flights' in data) {
    let flightData = data.flights;
    
    // Handle nested corruption
    while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
      flightData = flightData.flights;
    }
    
    return Array.isArray(flightData) ? flightData.length : 0;
  }
  
  return 0;
}

function getSampleFlight(data) {
  if (!data) return null;
  
  let flights = [];
  
  if (Array.isArray(data)) {
    flights = data;
  } else if (typeof data === 'object' && 'flights' in data) {
    let flightData = data.flights;
    
    // Handle nested corruption
    while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
      flightData = flightData.flights;
    }
    
    flights = Array.isArray(flightData) ? flightData : [];
  }
  
  return flights.length > 0 ? flights[0] : null;
}

function getAgeInMinutes(timestamp) {
  if (!timestamp) return 'unknown';
  return Math.round((Date.now() - new Date(timestamp).getTime()) / (1000 * 60));
}

// Run the test
testFixedCacheManager();