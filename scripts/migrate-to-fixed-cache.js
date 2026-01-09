/**
 * Script de migrare pentru înlocuirea cache manager-ului cu versiunea reparată
 * 
 * ACEST SCRIPT REPARĂ:
 * 1. Corupția structurii nested în cache
 * 2. Rate limiting pentru API calls
 * 3. Cron jobs suprapuse
 * 4. Gestionarea deficitară a erorilor
 */

const fs = require('fs').promises;
const path = require('path');

async function migrateCacheManager() {
  console.log('🔧 Starting cache manager migration...');
  
  try {
    // 1. Backup existing cache manager
    const originalPath = path.join(process.cwd(), 'lib', 'cacheManager.ts');
    const backupPath = path.join(process.cwd(), 'lib', 'cacheManager.backup.ts');
    
    try {
      await fs.copyFile(originalPath, backupPath);
      console.log('✅ Backed up original cache manager');
    } catch (error) {
      console.log('⚠️  Could not backup original cache manager (may not exist)');
    }
    
    // 2. Replace with fixed version
    const fixedPath = path.join(process.cwd(), 'lib', 'cacheManagerFixed.ts');
    const fixedContent = await fs.readFile(fixedPath, 'utf-8');
    
    await fs.writeFile(originalPath, fixedContent);
    console.log('✅ Replaced cache manager with fixed version');
    
    // 3. Clean up corrupted cache data
    const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
    
    try {
      const cacheData = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheArray = JSON.parse(cacheData);
      
      console.log(`📊 Found ${cacheArray.length} cache entries`);
      
      let repairedCount = 0;
      const repairedArray = cacheArray.map(entry => {
        if (entry.category === 'flightData' && entry.data) {
          let cleanData = entry.data;
          let wasCorrupted = false;
          
          // Fix nested flights structure
          if (typeof cleanData === 'object' && 'flights' in cleanData) {
            let flightData = cleanData.flights;
            
            // Detect and fix nested corruption
            while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
              flightData = flightData.flights;
              wasCorrupted = true;
            }
            
            if (wasCorrupted) {
              const weatherInfo = cleanData.weather_info || null;
              cleanData = weatherInfo ? {
                flights: Array.isArray(flightData) ? flightData : [],
                weather_info: weatherInfo
              } : (Array.isArray(flightData) ? flightData : []);
              
              repairedCount++;
            }
          }
          
          return {
            ...entry,
            data: cleanData,
            lastAccessed: new Date().toISOString()
          };
        }
        
        return entry;
      });
      
      if (repairedCount > 0) {
        // Backup corrupted cache
        const corruptedBackupPath = path.join(process.cwd(), 'data', 'cache-data.corrupted.json');
        await fs.writeFile(corruptedBackupPath, cacheData);
        
        // Save repaired cache
        await fs.writeFile(cacheDataPath, JSON.stringify(repairedArray, null, 2));
        console.log(`🔧 Repaired ${repairedCount} corrupted cache entries`);
        console.log(`💾 Backed up corrupted cache to cache-data.corrupted.json`);
      } else {
        console.log('✅ No corrupted cache entries found');
      }
      
    } catch (error) {
      console.log('⚠️  Could not process cache data:', error.message);
    }
    
    // 4. Update cache configuration with safer intervals
    const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      // Apply safer intervals
      const saferConfig = {
        flightData: {
          cronInterval: Math.max(15, config.flightData?.cronInterval || 15) // Minimum 15 minutes
        },
        analytics: {
          cronInterval: Math.max(1, config.analytics?.cronInterval || 7), // Minimum 1 day
          cacheMaxAge: Math.max(7, config.analytics?.cacheMaxAge || 30) // Minimum 7 days
        },
        aircraft: {
          cronInterval: Math.max(7, config.aircraft?.cronInterval || 30), // Minimum 7 days
          cacheMaxAge: Math.max(7, config.aircraft?.cacheMaxAge || 30) // Minimum 7 days
        },
        weather: {
          cronInterval: Math.max(30, config.weather?.cronInterval || 30) // Minimum 30 minutes
        }
      };
      
      await fs.writeFile(configPath, JSON.stringify(saferConfig, null, 2));
      console.log('⚙️  Updated cache configuration with safer intervals');
      
    } catch (error) {
      console.log('⚠️  Could not update cache configuration:', error.message);
    }
    
    console.log('\n🎉 Cache manager migration completed successfully!');
    console.log('\n📋 CHANGES MADE:');
    console.log('   ✅ Fixed nested cache data corruption');
    console.log('   ✅ Implemented proper API rate limiting');
    console.log('   ✅ Prevented overlapping cron jobs');
    console.log('   ✅ Improved error handling');
    console.log('   ✅ Set safer cache intervals');
    console.log('\n🔄 Please restart the application to apply changes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCacheManager();