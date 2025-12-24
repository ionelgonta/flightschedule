const { historicalCacheManager } = require('./lib/historicalCacheManager');

async function checkHistoricalData() {
  try {
    console.log('Initializing historical cache manager...');
    await historicalCacheManager.initialize();
    
    console.log('Getting cache statistics...');
    const stats = await historicalCacheManager.getCacheStatistics();
    
    console.log('=== HISTORICAL CACHE STATISTICS ===');
    console.log(`Total records: ${stats.totalRecords}`);
    console.log(`Date range: ${stats.dateRange.start} to ${stats.dateRange.end}`);
    console.log(`Total days: ${stats.dateRange.totalDays}`);
    console.log(`Airports: ${stats.airportCoverage.join(', ')}`);
    
    // Check available dates for OTP
    console.log('\n=== AVAILABLE DATES FOR OTP ===');
    const otpDates = await historicalCacheManager.getAvailableDates('OTP');
    console.log(`Found ${otpDates.length} dates for OTP:`);
    otpDates.forEach(date => console.log(`  - ${date}`));
    
    // Check specific dates we need (Dec 18-24)
    const requiredDates = ['2025-12-18', '2025-12-19', '2025-12-20', '2025-12-21', '2025-12-22', '2025-12-23', '2025-12-24'];
    
    console.log('\n=== CHECKING REQUIRED DATES (Dec 18-24) ===');
    for (const date of requiredDates) {
      const hasArrivals = await historicalCacheManager.hasDataForDate('OTP', date, 'arrivals');
      const hasDepartures = await historicalCacheManager.hasDataForDate('OTP', date, 'departures');
      
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      console.log(`${date} (${dayOfWeek}): Arrivals=${hasArrivals}, Departures=${hasDepartures}`);
      
      if (hasArrivals) {
        const arrivals = await historicalCacheManager.getDataForDate('OTP', date, 'arrivals');
        console.log(`  - ${arrivals.length} arrivals`);
      }
      if (hasDepartures) {
        const departures = await historicalCacheManager.getDataForDate('OTP', date, 'departures');
        console.log(`  - ${departures.length} departures`);
      }
    }
    
  } catch (error) {
    console.error('Error checking historical data:', error);
  } finally {
    historicalCacheManager.close();
  }
}

checkHistoricalData();