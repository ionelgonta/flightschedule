/**
 * Script pentru forțarea refresh-ului cache-ului cu date noi
 * Folosește cache manager-ul reparat pentru a obține date fresh
 */

const path = require('path');

async function forceRefreshCache() {
  console.log('🔄 Starting forced cache refresh...\n');
  
  try {
    // Import fixed cache manager
    const { fixedCacheManager } = require('../lib/cacheManagerFixed.ts');
    
    console.log('📋 Initializing fixed cache manager...');
    await fixedCacheManager.initialize();
    
    console.log('✅ Fixed cache manager initialized successfully\n');
    
    // Test airports
    const testAirports = ['OTP', 'CLJ', 'TSR'];
    
    console.log('🛫 Forcing refresh for major airports...\n');
    
    for (const airport of testAirports) {
      console.log(`🔄 Refreshing ${airport}...`);
      
      try {
        // Force manual refresh for both arrivals and departures
        await fixedCacheManager.manualRefresh('flightData', airport);
        console.log(`✅ ${airport} refreshed successfully`);
        
        // Small delay between airports to respect rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to refresh ${airport}:`, error.message);
      }
    }
    
    console.log('\n🌤️ Refreshing weather data...');
    try {
      await fixedCacheManager.manualRefresh('weather');
      console.log('✅ Weather data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh weather:', error.message);
    }
    
    console.log('\n📊 Generating analytics...');
    try {
      await fixedCacheManager.manualRefresh('analytics');
      console.log('✅ Analytics generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate analytics:', error.message);
    }
    
    // Get cache stats
    console.log('\n📈 Current cache statistics:');
    const stats = fixedCacheManager.getCacheStats();
    console.log(`   Total entries: ${stats.cacheEntries.total}`);
    console.log(`   Flight data: ${stats.cacheEntries.flightData}`);
    console.log(`   Weather: ${stats.cacheEntries.weather}`);
    console.log(`   Analytics: ${stats.cacheEntries.analytics}`);
    
    console.log('\n🎉 Cache refresh completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check the website for updated flight data');
    console.log('   2. Monitor cache health: node scripts/monitor-cache-health.js');
    console.log('   3. Verify API endpoints return data');
    
  } catch (error) {
    console.error('❌ Cache refresh failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure the application is running');
    console.log('   2. Check API keys are configured');
    console.log('   3. Verify network connectivity');
    console.log('   4. Run diagnostics: node scripts/diagnose-cache-issues.js');
  }
}

// Run the refresh
forceRefreshCache();