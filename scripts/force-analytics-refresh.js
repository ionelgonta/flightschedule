/**
 * Force Analytics Refresh Script
 * Regenerates all analytics and airport-statistics from current flight data
 * 
 * Run with: node scripts/force-analytics-refresh.js
 */

const fs = require('fs');
const path = require('path');

const CACHE_DATA_PATH = path.join(process.cwd(), 'data', 'cache-data.json');

// Airport info for statistics
const AIRPORTS = {
  'OTP': { name: 'Aeroportul Internațional Henri Coandă', city: 'București', country: 'România' },
  'BBU': { name: 'Aeroportul Internațional Aurel Vlaicu', city: 'București', country: 'România' },
  'CLJ': { name: 'Aeroportul Internațional Cluj-Napoca', city: 'Cluj-Napoca', country: 'România' },
  'TSR': { name: 'Aeroportul Internațional Timișoara Traian Vuia', city: 'Timișoara', country: 'România' },
  'IAS': { name: 'Aeroportul Internațional Iași', city: 'Iași', country: 'România' },
  'CND': { name: 'Aeroportul Internațional Mihail Kogălniceanu', city: 'Constanța', country: 'România' },
  'SBZ': { name: 'Aeroportul Internațional Sibiu', city: 'Sibiu', country: 'România' },
  'CRA': { name: 'Aeroportul Craiova', city: 'Craiova', country: 'România' },
  'BCM': { name: 'Aeroportul Bacău', city: 'Bacău', country: 'România' },
  'BAY': { name: 'Aeroportul Baia Mare', city: 'Baia Mare', country: 'România' },
  'OMR': { name: 'Aeroportul Internațional Oradea', city: 'Oradea', country: 'România' },
  'SCV': { name: 'Aeroportul Suceava Ștefan cel Mare', city: 'Suceava', country: 'România' },
  'TGM': { name: 'Aeroportul Târgu Mureș Transilvania', city: 'Târgu Mureș', country: 'România' },
  'ARW': { name: 'Aeroportul Arad', city: 'Arad', country: 'România' },
  'SUJ': { name: 'Aeroportul Satu Mare', city: 'Satu Mare', country: 'România' },
  'GHV': { name: 'Aeroportul Brașov-Ghimbav', city: 'Brașov', country: 'România' },
  'RMO': { name: 'Aeroportul Internațional Chișinău', city: 'Chișinău', country: 'Moldova' }
};

/**
 * Calculate flight statistics from flight data
 */
function calculateFlightStatistics(flights, airportCode) {
  const totalFlights = flights.length;
  let onTimeFlights = 0;
  let delayedFlights = 0;
  let cancelledFlights = 0;
  const delays = [];
  
  flights.forEach(flight => {
    const status = (flight.status || '').toLowerCase();
    
    // Check for cancelled flights
    if (status === 'cancelled' || status === 'canceled') {
      cancelledFlights++;
      return;
    }
    
    // Calculate delay from scheduled vs actual/estimated time
    let delayMinutes = 0;
    
    // First check if there's a direct delay field
    if (flight.delay && typeof flight.delay === 'number') {
      delayMinutes = flight.delay;
    } 
    // Otherwise calculate from times
    else if (flight.scheduled_time && (flight.actual_time || flight.estimated_time)) {
      try {
        const scheduledStr = flight.scheduled_time.replace(/\+\d{2}:\d{2}$/, '');
        const actualStr = (flight.actual_time || flight.estimated_time).replace(/\+\d{2}:\d{2}$/, '');
        
        const scheduled = new Date(scheduledStr);
        const actual = new Date(actualStr);
        
        if (!isNaN(scheduled.getTime()) && !isNaN(actual.getTime())) {
          delayMinutes = Math.max(0, (actual.getTime() - scheduled.getTime()) / (1000 * 60));
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // A flight is considered delayed if more than 15 minutes late
    if (delayMinutes > 15) {
      delayedFlights++;
      delays.push(delayMinutes);
    } else {
      onTimeFlights++;
    }
  });
  
  const averageDelay = delays.length > 0 
    ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) 
    : 0;
  const onTimePercentage = totalFlights > 0 
    ? Math.round((onTimeFlights / totalFlights) * 100) 
    : 0;
  
  return {
    airportCode,
    totalFlights,
    onTimeFlights,
    delayedFlights,
    cancelledFlights,
    averageDelay,
    onTimePercentage,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Main function to refresh all analytics
 */
async function refreshAllAnalytics() {
  console.log('=== Force Analytics Refresh ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');
  
  // Load current cache data
  let cacheData = [];
  try {
    const data = fs.readFileSync(CACHE_DATA_PATH, 'utf-8');
    cacheData = JSON.parse(data);
    console.log(`Loaded ${cacheData.length} cache entries`);
  } catch (error) {
    console.error('Error loading cache data:', error.message);
    return;
  }
  
  // Get all flight data entries
  const flightDataEntries = cacheData.filter(e => e.category === 'flightData');
  console.log(`Found ${flightDataEntries.length} flight data entries`);
  
  // Group flights by airport
  const flightsByAirport = {};
  for (const entry of flightDataEntries) {
    const [airportCode] = entry.key.split('_');
    if (!flightsByAirport[airportCode]) {
      flightsByAirport[airportCode] = [];
    }
    
    // Extract flights from entry
    let flights = [];
    if (Array.isArray(entry.data)) {
      flights = entry.data;
    } else if (entry.data && entry.data.flights) {
      flights = entry.data.flights;
    }
    
    flightsByAirport[airportCode].push(...flights);
  }
  
  console.log('');
  console.log('Flights by airport:');
  for (const [code, flights] of Object.entries(flightsByAirport)) {
    console.log(`  ${code}: ${flights.length} flights`);
  }
  
  // Remove old analytics entries
  const oldAnalyticsCount = cacheData.filter(e => e.category === 'analytics').length;
  cacheData = cacheData.filter(e => e.category !== 'analytics');
  console.log(`\nRemoved ${oldAnalyticsCount} old analytics entries`);
  
  // Generate new analytics for each airport
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const airportStatistics = [];
  
  console.log('\nGenerating new analytics:');
  
  for (const airportCode of Object.keys(AIRPORTS)) {
    const flights = flightsByAirport[airportCode] || [];
    
    if (flights.length === 0) {
      console.log(`  ${airportCode}: No flight data available`);
      
      // Add to airport statistics with null
      airportStatistics.push({
        code: airportCode,
        name: AIRPORTS[airportCode].name,
        city: AIRPORTS[airportCode].city,
        country: AIRPORTS[airportCode].country,
        statistics: null,
        message: 'Nu sunt suficiente date pentru a afișa această informație'
      });
      continue;
    }
    
    // Calculate statistics
    const stats = calculateFlightStatistics(flights, airportCode);
    
    console.log(`  ${airportCode}: ${stats.totalFlights} flights, ${stats.onTimePercentage}% on-time, ${stats.delayedFlights} delayed, avg delay: ${stats.averageDelay}min`);
    
    // Create analytics entry
    const analyticsEntry = {
      id: `analytics_analytics_${airportCode}_${Date.now()}`,
      category: 'analytics',
      key: `analytics_${airportCode}`,
      data: stats,
      createdAt: now.toISOString(),
      expiresAt: expiresAt,
      lastAccessed: now.toISOString(),
      source: 'manual',
      success: true
    };
    
    cacheData.push(analyticsEntry);
    
    // Add to airport statistics
    airportStatistics.push({
      code: airportCode,
      name: AIRPORTS[airportCode].name,
      city: AIRPORTS[airportCode].city,
      country: AIRPORTS[airportCode].country,
      statistics: {
        totalFlights: stats.totalFlights,
        onTimePercentage: stats.onTimePercentage,
        averageDelay: stats.averageDelay,
        dailyFlights: Math.round(stats.totalFlights / 7), // Estimate based on 7 days
        cancelledFlights: stats.cancelledFlights,
        delayedFlights: stats.delayedFlights,
        lastUpdated: now.toISOString()
      }
    });
  }
  
  // Create airport-statistics entry
  const airportStatsEntry = {
    id: `analytics_airport-statistics_${Date.now()}`,
    category: 'analytics',
    key: 'airport-statistics',
    data: airportStatistics,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    lastAccessed: now.toISOString(),
    source: 'manual',
    success: true
  };
  
  cacheData.push(airportStatsEntry);
  
  // Save updated cache
  fs.writeFileSync(CACHE_DATA_PATH, JSON.stringify(cacheData, null, 2));
  
  console.log('\n=== Summary ===');
  console.log(`Total cache entries: ${cacheData.length}`);
  console.log(`New analytics entries: ${Object.keys(AIRPORTS).length + 1}`);
  console.log(`Airport statistics updated: ${airportStatistics.length} airports`);
  console.log('\nAnalytics refresh completed successfully!');
}

// Run the script
refreshAllAnalytics().catch(console.error);
