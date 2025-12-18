/**
 * Script to refresh statistics cache after fixing the calculation logic
 */

const fs = require('fs').promises;
const path = require('path');

async function refreshCache() {
  console.log('Refreshing statistics cache...');
  
  try {
    // Clear existing cache data to force regeneration with new logic
    const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
    
    // Check if cache file exists
    try {
      await fs.access(cacheDataPath);
      
      // Read current cache
      const cacheContent = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheData = JSON.parse(cacheContent);
      
      // Filter out analytics entries to force regeneration
      const filteredCache = cacheData.filter(entry => entry.category !== 'analytics');
      
      // Write back the filtered cache
      await fs.writeFile(cacheDataPath, JSON.stringify(filteredCache, null, 2));
      
      console.log(`Cleared ${cacheData.length - filteredCache.length} analytics cache entries`);
      console.log('Analytics will be regenerated with the new calculation logic');
      
    } catch (error) {
      console.log('No existing cache file found - cache will be generated fresh');
    }
    
    console.log('Cache refresh completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. The analytics will be regenerated automatically by the cron job');
    console.log('2. Or you can trigger manual refresh from the admin panel');
    console.log('3. Visit https://anyway.ro/admin to manually refresh analytics');
    
  } catch (error) {
    console.error('Error refreshing cache:', error);
  }
}

refreshCache();