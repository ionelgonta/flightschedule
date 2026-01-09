/**
 * Script de verificare finală pentru reparațiile cache-ului
 * Confirmă că toate problemele au fost rezolvate
 */

const fs = require('fs').promises;
const path = require('path');

async function verifyCacheRepair() {
  console.log('🔍 Verifying cache repair completion...\n');
  
  const checks = [];
  let allPassed = true;

  try {
    // 1. Verify fixed cache manager is in place
    try {
      const cacheManagerPath = path.join(process.cwd(), 'lib', 'cacheManager.ts');
      const cacheManagerContent = await fs.readFile(cacheManagerPath, 'utf-8');
      
      if (cacheManagerContent.includes('FixedCacheManager') && cacheManagerContent.includes('Rate Limiting Management')) {
        checks.push('✅ Fixed cache manager is installed');
      } else {
        checks.push('❌ Fixed cache manager not properly installed');
        allPassed = false;
      }
    } catch (error) {
      checks.push('❌ Cache manager file not found');
      allPassed = false;
    }

    // 2. Verify safe configuration intervals
    try {
      const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      const flightInterval = config.flightData?.cronInterval || 0;
      const weatherInterval = config.weather?.cronInterval || 0;
      
      if (flightInterval >= 15) {
        checks.push(`✅ Flight data interval is safe: ${flightInterval} minutes`);
      } else {
        checks.push(`❌ Flight data interval too low: ${flightInterval} minutes`);
        allPassed = false;
      }
      
      if (weatherInterval >= 30) {
        checks.push(`✅ Weather interval is safe: ${weatherInterval} minutes`);
      } else {
        checks.push(`❌ Weather interval too low: ${weatherInterval} minutes`);
        allPassed = false;
      }
    } catch (error) {
      checks.push('❌ Could not verify cache configuration');
      allPassed = false;
    }

    // 3. Verify cache data structure integrity
    try {
      const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
      const cacheData = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheArray = JSON.parse(cacheData);
      
      let corruptedCount = 0;
      let flightDataCount = 0;
      
      cacheArray.forEach(entry => {
        if (entry.category === 'flightData') {
          flightDataCount++;
          
          // Check for nested corruption
          if (entry.data && typeof entry.data === 'object' && 'flights' in entry.data) {
            let flightData = entry.data.flights;
            let nestingLevel = 0;
            
            while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
              flightData = flightData.flights;
              nestingLevel++;
            }
            
            if (nestingLevel > 0) {
              corruptedCount++;
            }
          }
        }
      });
      
      if (corruptedCount === 0) {
        checks.push(`✅ No corrupted cache entries found (${flightDataCount} flight data entries checked)`);
      } else {
        checks.push(`❌ Found ${corruptedCount} corrupted cache entries`);
        allPassed = false;
      }
      
    } catch (error) {
      checks.push('❌ Could not verify cache data integrity');
      allPassed = false;
    }

    // 4. Verify backup files exist
    try {
      const backupPath = path.join(process.cwd(), 'lib', 'cacheManager.backup.ts');
      await fs.access(backupPath);
      checks.push('✅ Original cache manager backed up');
    } catch (error) {
      checks.push('⚠️  No backup of original cache manager found');
    }

    // 5. Check for flight data availability
    try {
      const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
      const cacheData = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheArray = JSON.parse(cacheData);
      
      const majorAirports = ['OTP', 'CLJ', 'TSR'];
      let airportsWithData = 0;
      
      majorAirports.forEach(airport => {
        const arrivals = cacheArray.find(e => e.key === `${airport}_arrivals`);
        const departures = cacheArray.find(e => e.key === `${airport}_departures`);
        
        if (arrivals || departures) {
          airportsWithData++;
        }
      });
      
      if (airportsWithData >= 2) {
        checks.push(`✅ Flight data available for ${airportsWithData}/${majorAirports.length} major airports`);
      } else {
        checks.push(`⚠️  Limited flight data: only ${airportsWithData}/${majorAirports.length} major airports`);
      }
      
    } catch (error) {
      checks.push('❌ Could not verify flight data availability');
      allPassed = false;
    }

    // 6. Verify diagnostic and monitoring scripts
    const scriptChecks = [
      'scripts/diagnose-cache-issues.js',
      'scripts/monitor-cache-health.js',
      'scripts/migrate-to-fixed-cache.js'
    ];
    
    for (const scriptPath of scriptChecks) {
      try {
        await fs.access(scriptPath);
        checks.push(`✅ ${path.basename(scriptPath)} is available`);
      } catch (error) {
        checks.push(`❌ ${path.basename(scriptPath)} is missing`);
        allPassed = false;
      }
    }

  } catch (error) {
    checks.push(`❌ Verification failed: ${error.message}`);
    allPassed = false;
  }

  // Display results
  console.log('📋 VERIFICATION RESULTS:\n');
  checks.forEach(check => console.log(check));
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 CACHE REPAIR VERIFICATION: PASSED');
    console.log('\n✅ All critical repairs have been successfully applied!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Restart your application to apply changes');
    console.log('   2. Monitor cache health: node scripts/monitor-cache-health.js');
    console.log('   3. Check logs for any remaining issues');
    console.log('\n🎯 Expected improvements:');
    console.log('   • No more cache blocking or corruption');
    console.log('   • Stable flight data that doesn\'t disappear');
    console.log('   • Proper API rate limiting');
    console.log('   • Better error handling and recovery');
  } else {
    console.log('⚠️  CACHE REPAIR VERIFICATION: ISSUES FOUND');
    console.log('\n🔧 Some repairs may need attention. Please:');
    console.log('   1. Review the failed checks above');
    console.log('   2. Re-run: node scripts/migrate-to-fixed-cache.js');
    console.log('   3. Check file permissions and paths');
    console.log('   4. Restart the application');
  }
  
  console.log('\n📞 For ongoing monitoring, run:');
  console.log('   node scripts/monitor-cache-health.js');
  console.log('');
}

// Run verification
verifyCacheRepair();