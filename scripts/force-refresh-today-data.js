#!/usr/bin/env node

/**
 * Force refresh today's data from AeroDataBox
 * Populează cache-ul cu datele reale de azi
 */

const FlightApiService = require('../lib/flightApiService').default;
const { API_CONFIGS } = require('../lib/flightApiService');
const { MAJOR_AIRPORTS } = require('../lib/airports');

async function forceRefreshTodayData() {
  console.log('=== FORCE REFRESH TODAY DATA ===');
  console.log(`Data: ${new Date().toISOString()}`);
  console.log(`Azi: ${new Date().toLocaleDateString('ro-RO')} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})`);
  
  // Initialize flight API service
  const flightService = new FlightApiService(API_CONFIGS.aerodatabox);
  
  // Test with OTP first
  const testAirport = 'OTP';
  console.log(`\n--- TESTING ${testAirport} ---`);
  
  try {
    // Test arrivals
    console.log('Fetching arrivals...');
    const arrivalsResponse = await flightService.getArrivals(testAirport);
    console.log(`Arrivals - Success: ${arrivalsResponse.success}, Count: ${arrivalsResponse.data.length}`);
    
    if (arrivalsResponse.data.length > 0) {
      console.log('First 3 arrivals:');
      arrivalsResponse.data.slice(0, 3).forEach((flight, index) => {
        console.log(`${index + 1}. ${flight.flight_number} from ${flight.origin.code} - ${flight.scheduled_time}`);
      });
      
      // Check if we have today's data
      const today = new Date().toISOString().split('T')[0];
      const todayFlights = arrivalsResponse.data.filter(flight => 
        flight.scheduled_time.startsWith(today)
      );
      console.log(`Flights for today (${today}): ${todayFlights.length}`);
    }
    
    // Test departures
    console.log('\nFetching departures...');
    const departuresResponse = await flightService.getDepartures(testAirport);
    console.log(`Departures - Success: ${departuresResponse.success}, Count: ${departuresResponse.data.length}`);
    
    if (departuresResponse.data.length > 0) {
      console.log('First 3 departures:');
      departuresResponse.data.slice(0, 3).forEach((flight, index) => {
        console.log(`${index + 1}. ${flight.flight_number} to ${flight.destination.code} - ${flight.scheduled_time}`);
      });
      
      // Check if we have today's data
      const today = new Date().toISOString().split('T')[0];
      const todayFlights = departuresResponse.data.filter(flight => 
        flight.scheduled_time.startsWith(today)
      );
      console.log(`Flights for today (${today}): ${todayFlights.length}`);
    }
    
    // If we got data, let's refresh the cache via API
    if (arrivalsResponse.success || departuresResponse.success) {
      console.log('\n--- REFRESHING CACHE VIA API ---');
      
      try {
        const response = await fetch('http://localhost:3000/api/admin/cache-management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'manualRefresh', 
            category: 'flightData',
            identifier: testAirport 
          })
        });
        
        const result = await response.json();
        console.log('Cache refresh result:', result);
        
        if (result.success) {
          console.log('✅ Cache refreshed successfully!');
          
          // Now update weekly schedule
          console.log('\n--- UPDATING WEEKLY SCHEDULE ---');
          const weeklyResponse = await fetch('http://localhost:3000/api/admin/weekly-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update' })
          });
          
          const weeklyResult = await weeklyResponse.json();
          console.log('Weekly schedule update result:', weeklyResult);
          
          if (weeklyResult.success) {
            console.log('✅ Weekly schedule updated successfully!');
            
            // Check the new weekly schedule
            const scheduleResponse = await fetch('http://localhost:3000/api/admin/weekly-schedule?action=get');
            const scheduleData = await scheduleResponse.json();
            
            if (scheduleData.success) {
              console.log(`\n--- WEEKLY SCHEDULE RESULTS ---`);
              console.log(`Total entries: ${scheduleData.count}`);
              
              const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              days.forEach(day => {
                const count = scheduleData.data.filter(item => item.weeklyPattern[day]).length;
                console.log(`${day}: ${count} flights`);
              });
            }
          }
        }
        
      } catch (apiError) {
        console.error('API refresh failed:', apiError.message);
      }
    }
    
  } catch (error) {
    console.error(`Error testing ${testAirport}:`, error);
  }
}

// Run the refresh
forceRefreshTodayData().catch(console.error);