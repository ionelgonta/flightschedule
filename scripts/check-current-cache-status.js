#!/usr/bin/env node

/**
 * Check Current Cache Status - Flight Schedule Application
 * Analyzes what data is currently available in the cache system
 */

const fs = require('fs').promises;
const path = require('path');

async function checkCurrentCacheStatus() {
  console.log('=== CURRENT CACHE STATUS CHECK ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Today: ${new Date().toLocaleDateString('ro-RO')} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})`);
  
  try {
    // Check current cache (cache-data.json)
    const currentCachePath = path.join(process.cwd(), 'data', 'cache-data.json');
    console.log('\n--- CURRENT CACHE (cache-data.json) ---');
    
    try {
      const currentCacheContent = await fs.readFile(currentCachePath, 'utf8');
      const currentCache = JSON.parse(currentCacheContent);
      
      console.log(`Total entries: ${currentCache.length}`);
      
      // Analyze dates in current cache
      const dateAnalysis = new Map();
      const airportAnalysis = new Map();
      
      currentCache.forEach(entry => {
        if (entry.data && Array.isArray(entry.data)) {
          entry.data.forEach(flight => {
            if (flight.scheduled_time) {
              const date = flight.scheduled_time.split('T')[0];
              const count = dateAnalysis.get(date) || 0;
              dateAnalysis.set(date, count + 1);
            }
          });
          
          // Count by airport
          const airportCount = airportAnalysis.get(entry.key) || 0;
          airportAnalysis.set(entry.key, airportCount + entry.data.length);
        }
      });
      
      console.log('\nFlights by Date:');
      const sortedDates = Array.from(dateAnalysis.entries()).sort();
      sortedDates.forEach(([date, count]) => {
        const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        console.log(`  ${date} (${dayOfWeek}): ${count} flights`);
      });
      
      console.log('\nFlights by Airport (top 10):');
      const sortedAirports = Array.from(airportAnalysis.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      sortedAirports.forEach(([airport, count]) => {
        console.log(`  ${airport}: ${count} flights`);
      });
      
    } catch (error) {
      console.log(`Error reading current cache: ${error.message}`);
    }
    
    // Check persistent cache (flights_cache.json)
    const persistentCachePath = path.join(process.cwd(), 'data', 'flights_cache.json');
    console.log('\n--- PERSISTENT CACHE (flights_cache.json) ---');
    
    try {
      const persistentCacheContent = await fs.readFile(persistentCachePath, 'utf8');
      const persistentCache = JSON.parse(persistentCacheContent);
      
      console.log(`Total entries: ${Object.keys(persistentCache).length}`);
      
      // Analyze dates in persistent cache
      const persistentDateAnalysis = new Map();
      const persistentAirportAnalysis = new Map();
      
      Object.values(persistentCache).forEach(flight => {
        if (flight.scheduledTime) {
          const date = flight.scheduledTime.split('T')[0];
          const count = persistentDateAnalysis.get(date) || 0;
          persistentDateAnalysis.set(date, count + 1);
          
          // Count by airport
          const airport = flight.airportCode;
          const airportCount = persistentAirportAnalysis.get(airport) || 0;
          persistentAirportAnalysis.set(airport, airportCount + 1);
        }
      });
      
      console.log('\nFlights by Date:');
      const sortedPersistentDates = Array.from(persistentDateAnalysis.entries()).sort();
      sortedPersistentDates.forEach(([date, count]) => {
        const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        console.log(`  ${date} (${dayOfWeek}): ${count} flights`);
      });
      
      console.log('\nFlights by Airport (top 10):');
      const sortedPersistentAirports = Array.from(persistentAirportAnalysis.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      sortedPersistentAirports.forEach(([airport, count]) => {
        console.log(`  ${airport}: ${count} flights`);
      });
      
    } catch (error) {
      console.log(`Error reading persistent cache: ${error.message}`);
    }
    
    // Check weekly schedule status
    console.log('\n--- WEEKLY SCHEDULE STATUS ---');
    try {
      const response = await fetch('http://localhost:3000/api/admin/weekly-schedule?action=get');
      const data = await response.json();
      
      if (data.success) {
        console.log(`Weekly schedule entries: ${data.count}`);
        
        if (data.data && data.data.length > 0) {
          // Analyze weekly patterns
          const dayCount = {
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0
          };
          
          data.data.forEach(entry => {
            Object.keys(dayCount).forEach(day => {
              if (entry.weeklyPattern && entry.weeklyPattern[day]) {
                dayCount[day]++;
              }
            });
          });
          
          console.log('\nWeekly Pattern Distribution:');
          Object.entries(dayCount).forEach(([day, count]) => {
            console.log(`  ${day}: ${count} flights`);
          });
        }
      } else {
        console.log(`Weekly schedule error: ${data.error}`);
      }
    } catch (error) {
      console.log(`Error checking weekly schedule: ${error.message}`);
    }
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    const today = new Date().toISOString().split('T')[0];
    const hasCurrentData = sortedDates.some(([date]) => date === today);
    
    if (!hasCurrentData) {
      console.log('❌ NO CURRENT DATA FOUND');
      console.log('- The cache system does not have data for today');
      console.log('- Weekly schedule will only show historical patterns');
      console.log('- Consider refreshing cache or checking API availability');
    } else {
      console.log('✅ CURRENT DATA AVAILABLE');
      console.log('- Cache system has data for today');
      console.log('- Weekly schedule should include current patterns');
    }
    
    const totalCurrentFlights = Array.from(dateAnalysis.values()).reduce((sum, count) => sum + count, 0);
    if (totalCurrentFlights === 0) {
      console.log('❌ NO FLIGHT DATA IN CURRENT CACHE');
      console.log('- All cache entries are empty');
      console.log('- External APIs may not be providing data');
      console.log('- Check API connectivity and limits');
    }
    
  } catch (error) {
    console.error('Error during cache status check:', error);
  }
}

// Run the check
checkCurrentCacheStatus().catch(console.error);