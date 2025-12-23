#!/usr/bin/env node

/**
 * Debug why Monday flights aren't showing in weekly schedule
 * Check if persistent cache data is being processed correctly
 */

const fs = require('fs').promises;
const path = require('path');

async function debugMondayWeeklySchedule() {
  console.log('=== DEBUG MONDAY WEEKLY SCHEDULE ===');
  
  try {
    // Load persistent cache
    const persistentCachePath = path.join(process.cwd(), 'data', 'flights_cache.json');
    const cacheContent = await fs.readFile(persistentCachePath, 'utf8');
    const cache = JSON.parse(cacheContent);
    
    console.log(`Total cache entries: ${Object.keys(cache).length}`);
    
    // Filter Monday flights (2025-12-22)
    const mondayFlights = Object.values(cache).filter(flight => 
      flight.scheduledTime && flight.scheduledTime.startsWith('2025-12-22')
    );
    
    console.log(`\nMonday flights found: ${mondayFlights.length}`);
    
    // Group by airport and type
    const byAirportType = {};
    mondayFlights.forEach(flight => {
      const key = `${flight.airportCode}_${flight.type}`;
      if (!byAirportType[key]) {
        byAirportType[key] = [];
      }
      byAirportType[key].push(flight);
    });
    
    console.log('\nMonday flights by airport and type:');
    Object.keys(byAirportType).sort().forEach(key => {
      console.log(`  ${key}: ${byAirportType[key].length} flights`);
    });
    
    // Check day of week extraction
    console.log('\nTesting day of week extraction:');
    const testDate = '2025-12-22T18:25:00+02:00';
    const date = new Date(testDate);
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[dayIndex];
    
    console.log(`Test date: ${testDate}`);
    console.log(`Day index: ${dayIndex}`);
    console.log(`Day of week: ${dayOfWeek}`);
    
    // Test a few Monday flights
    console.log('\nSample Monday flights:');
    mondayFlights.slice(0, 5).forEach((flight, index) => {
      const flightDate = new Date(flight.scheduledTime);
      const flightDayIndex = flightDate.getDay();
      const flightDayOfWeek = dayNames[flightDayIndex];
      
      console.log(`  ${index + 1}. ${flight.flightNumber} (${flight.airportCode} ${flight.type})`);
      console.log(`     Scheduled: ${flight.scheduledTime}`);
      console.log(`     Day: ${flightDayOfWeek} (index: ${flightDayIndex})`);
      console.log(`     Route: ${flight.originCode} → ${flight.destinationCode}`);
    });
    
    // Check current weekly schedule
    console.log('\n=== CHECKING CURRENT WEEKLY SCHEDULE ===');
    
    try {
      const weeklySchedulePath = path.join(process.cwd(), '.cache', 'weekly_schedule_table.json');
      const weeklyContent = await fs.readFile(weeklySchedulePath, 'utf8');
      const weeklyData = JSON.parse(weeklyContent);
      
      const scheduleEntries = Array.isArray(weeklyData) ? weeklyData : weeklyData.data || [];
      console.log(`Total weekly schedule entries: ${scheduleEntries.length}`);
      
      // Count by day
      const daysCounts = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      };
      
      scheduleEntries.forEach(entry => {
        Object.keys(daysCounts).forEach(day => {
          if (entry.weeklyPattern && entry.weeklyPattern[day]) {
            daysCounts[day]++;
          }
        });
      });
      
      console.log('\nWeekly schedule by day:');
      Object.keys(daysCounts).forEach(day => {
        console.log(`  ${day}: ${daysCounts[day]} flights`);
      });
      
      // Show some Monday entries if they exist
      const mondayEntries = scheduleEntries.filter(entry => 
        entry.weeklyPattern && entry.weeklyPattern.monday
      );
      
      console.log(`\nMonday entries in weekly schedule: ${mondayEntries.length}`);
      if (mondayEntries.length > 0) {
        console.log('Sample Monday entries:');
        mondayEntries.slice(0, 5).forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.airline} ${entry.flightNumber}: ${entry.airport} → ${entry.destination}`);
        });
      }
      
    } catch (error) {
      console.log('No weekly schedule file found or error reading it:', error.message);
    }
    
    // Test the conversion process
    console.log('\n=== TESTING CONVERSION PROCESS ===');
    
    // Simulate how weeklyScheduleAnalyzer processes the data
    const flightsByAirportType = new Map();
    
    Object.values(cache).forEach((flight) => {
      if (!flight.airportCode || !flight.type) return;
      
      const key = flight.airportCode;
      if (!flightsByAirportType.has(key)) {
        flightsByAirportType.set(key, { arrivals: [], departures: [] });
      }
      
      if (flight.type === 'arrivals') {
        flightsByAirportType.get(key).arrivals.push(flight);
      } else if (flight.type === 'departures') {
        flightsByAirportType.get(key).departures.push(flight);
      }
    });
    
    console.log('Flights grouped by airport:');
    flightsByAirportType.forEach((data, airportCode) => {
      const totalFlights = data.arrivals.length + data.departures.length;
      const mondayArrivals = data.arrivals.filter(f => f.scheduledTime && f.scheduledTime.startsWith('2025-12-22')).length;
      const mondayDepartures = data.departures.filter(f => f.scheduledTime && f.scheduledTime.startsWith('2025-12-22')).length;
      
      console.log(`  ${airportCode}: ${totalFlights} total (${mondayArrivals} Monday arrivals, ${mondayDepartures} Monday departures)`);
    });
    
  } catch (error) {
    console.error('Error debugging Monday weekly schedule:', error);
  }
}

debugMondayWeeklySchedule().catch(console.error);