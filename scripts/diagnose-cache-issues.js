/**
 * Script de diagnosticare pentru problemele de cache
 * Identifică și raportează toate problemele găsite
 */

const fs = require('fs').promises;
const path = require('path');

async function diagnoseCacheIssues() {
  console.log('🔍 Starting cache diagnostics...\n');
  
  const issues = [];
  const warnings = [];
  const info = [];
  
  try {
    // 1. Check cache data file
    const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
    
    try {
      const cacheData = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheArray = JSON.parse(cacheData);
      
      info.push(`📊 Found ${cacheArray.length} total cache entries`);
      
      // Analyze cache entries
      const categories = {};
      let corruptedEntries = 0;
      let expiredEntries = 0;
      let nestedCorruption = 0;
      
      cacheArray.forEach((entry, index) => {
        // Count by category
        categories[entry.category] = (categories[entry.category] || 0) + 1;
        
        // Check for corruption
        if (!entry.id || !entry.category || !entry.key) {
          corruptedEntries++;
          issues.push(`❌ Entry ${index} missing required fields`);
        }
        
        // Check for expiration
        if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
          expiredEntries++;
        }
        
        // Check for nested flight data corruption
        if (entry.category === 'flightData' && entry.data) {
          if (typeof entry.data === 'object' && 'flights' in entry.data) {
            let flightData = entry.data.flights;
            let nestingLevel = 0;
            
            while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
              flightData = flightData.flights;
              nestingLevel++;
            }
            
            if (nestingLevel > 0) {
              nestedCorruption++;
              issues.push(`🔧 Entry ${entry.key} has ${nestingLevel} levels of nested corruption`);
            }
          }
        }
      });
      
      // Report category distribution
      info.push('📈 Cache entries by category:');
      Object.entries(categories).forEach(([category, count]) => {
        info.push(`   ${category}: ${count} entries`);
      });
      
      if (corruptedEntries > 0) {
        issues.push(`❌ Found ${corruptedEntries} corrupted cache entries`);
      }
      
      if (expiredEntries > 0) {
        warnings.push(`⚠️  Found ${expiredEntries} expired cache entries`);
      }
      
      if (nestedCorruption > 0) {
        issues.push(`🔧 Found ${nestedCorruption} entries with nested data corruption`);
      }
      
    } catch (error) {
      issues.push(`❌ Cannot read cache data: ${error.message}`);
    }
    
    // 2. Check cache configuration
    const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      info.push('⚙️  Cache configuration:');
      info.push(`   Flight data interval: ${config.flightData?.cronInterval || 'NOT SET'} minutes`);
      info.push(`   Analytics interval: ${config.analytics?.cronInterval || 'NOT SET'} days`);
      info.push(`   Weather interval: ${config.weather?.cronInterval || 'NOT SET'} minutes`);
      
      // Check for dangerous intervals
      if (config.flightData?.cronInterval < 10) {
        issues.push(`❌ Flight data interval too low (${config.flightData.cronInterval} min) - will cause API rate limiting`);
      }
      
      if (config.weather?.cronInterval < 30) {
        warnings.push(`⚠️  Weather interval may be too low (${config.weather.cronInterval} min)`);
      }
      
    } catch (error) {
      warnings.push(`⚠️  Cannot read cache configuration: ${error.message}`);
    }
    
    // 3. Check for specific airport data
    const testAirports = ['OTP', 'CLJ', 'TSR'];
    const cacheDataPath2 = path.join(process.cwd(), 'data', 'cache-data.json');
    
    try {
      const cacheData = await fs.readFile(cacheDataPath2, 'utf-8');
      const cacheArray = JSON.parse(cacheData);
      
      info.push('\n🛫 Flight data availability:');
      
      testAirports.forEach(airport => {
        const arrivals = cacheArray.find(e => e.key === `${airport}_arrivals`);
        const departures = cacheArray.find(e => e.key === `${airport}_departures`);
        
        const arrivalsCount = arrivals ? (Array.isArray(arrivals.data) ? arrivals.data.length : 
          (arrivals.data?.flights ? arrivals.data.flights.length : 0)) : 0;
        const departuresCount = departures ? (Array.isArray(departures.data) ? departures.data.length : 
          (departures.data?.flights ? departures.data.flights.length : 0)) : 0;
        
        info.push(`   ${airport}: ${arrivalsCount} arrivals, ${departuresCount} departures`);
        
        if (arrivalsCount === 0 && departuresCount === 0) {
          warnings.push(`⚠️  No flight data for ${airport}`);
        }
      });
      
    } catch (error) {
      warnings.push(`⚠️  Cannot analyze flight data: ${error.message}`);
    }
    
    // 4. Check API request patterns
    try {
      const requestCounterPath = path.join(process.cwd(), 'data', 'request-counter.json');
      const requestData = await fs.readFile(requestCounterPath, 'utf-8');
      const counter = JSON.parse(requestData);
      
      info.push('\n📡 API request statistics:');
      info.push(`   Flight data requests: ${counter.flightData || 0}`);
      info.push(`   Analytics requests: ${counter.analytics || 0}`);
      info.push(`   Weather requests: ${counter.weather || 0}`);
      info.push(`   Total requests: ${counter.totalRequests || 0}`);
      info.push(`   Last reset: ${counter.lastReset || 'NEVER'}`);
      
      if (counter.totalRequests > 1000) {
        warnings.push(`⚠️  High API request count (${counter.totalRequests}) - may indicate rate limiting issues`);
      }
      
    } catch (error) {
      warnings.push(`⚠️  Cannot read request counter: ${error.message}`);
    }
    
    // 5. Check for persistent cache
    try {
      const persistentCachePath = path.join(process.cwd(), 'data', 'flights_cache.json');
      const persistentData = await fs.readFile(persistentCachePath, 'utf-8');
      const persistent = JSON.parse(persistentData);
      
      if (persistent && typeof persistent === 'object') {
        const airportCount = Object.keys(persistent).length;
        info.push(`\n💾 Persistent cache: ${airportCount} airports`);
        
        if (airportCount === 0) {
          warnings.push(`⚠️  Persistent cache is empty`);
        }
      }
      
    } catch (error) {
      info.push('\n💾 No persistent cache found (this is normal)');
    }
    
  } catch (error) {
    issues.push(`❌ Diagnostic failed: ${error.message}`);
  }
  
  // Print results
  console.log('📋 DIAGNOSTIC RESULTS\n');
  
  if (info.length > 0) {
    console.log('ℹ️  INFORMATION:');
    info.forEach(msg => console.log(msg));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(msg => console.log(msg));
    console.log('');
  }
  
  if (issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:');
    issues.forEach(msg => console.log(msg));
    console.log('');
  }
  
  // Provide recommendations
  console.log('💡 RECOMMENDATIONS:\n');
  
  if (issues.length > 0) {
    console.log('🔧 IMMEDIATE ACTION REQUIRED:');
    console.log('   1. Run: node scripts/migrate-to-fixed-cache.js');
    console.log('   2. Restart the application');
    console.log('   3. Monitor cache performance');
  } else if (warnings.length > 0) {
    console.log('⚙️  OPTIMIZATION SUGGESTED:');
    console.log('   1. Consider running the cache migration for better performance');
    console.log('   2. Monitor API request patterns');
  } else {
    console.log('✅ Cache system appears to be healthy');
    console.log('   Continue monitoring for any performance issues');
  }
  
  console.log('\n🔄 To fix all identified issues, run:');
  console.log('   node scripts/migrate-to-fixed-cache.js\n');
}

// Run diagnostics
diagnoseCacheIssues();