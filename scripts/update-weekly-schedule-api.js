#!/usr/bin/env node

/**
 * Update weekly schedule via API call
 * This will trigger the server to update the weekly schedule with current data
 */

async function updateWeeklyScheduleViaAPI() {
  console.log('=== UPDATE WEEKLY SCHEDULE VIA API ===');
  
  try {
    // Call the API endpoint to update weekly schedule
    console.log('Calling weekly schedule update API...');
    
    const response = await fetch('http://localhost:3000/api/admin/weekly-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
    if (result.success) {
      console.log(`✅ Weekly schedule updated successfully!`);
      console.log(`Generated ${result.count} schedule entries`);
      
      // Get the updated schedule to verify
      console.log('\nFetching updated schedule...');
      const getResponse = await fetch('http://localhost:3000/api/admin/weekly-schedule?action=get');
      const scheduleData = await getResponse.json();
      
      if (scheduleData.success) {
        console.log(`\n=== UPDATED WEEKLY SCHEDULE ===`);
        console.log(`Total entries: ${scheduleData.count}`);
        
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
        
        scheduleData.data.forEach(entry => {
          Object.keys(daysCounts).forEach(day => {
            if (entry.weeklyPattern && entry.weeklyPattern[day]) {
              daysCounts[day]++;
            }
          });
        });
        
        console.log('\nFlights by day:');
        Object.keys(daysCounts).forEach(day => {
          console.log(`  ${day}: ${daysCounts[day]} flights`);
        });
        
        // Show Monday flights specifically
        const mondayFlights = scheduleData.data.filter(entry => 
          entry.weeklyPattern && entry.weeklyPattern.monday
        );
        
        console.log(`\n=== MONDAY FLIGHTS ===`);
        console.log(`Total Monday flights: ${mondayFlights.length}`);
        
        if (mondayFlights.length > 0) {
          console.log('\nSample Monday flights:');
          mondayFlights.slice(0, 10).forEach((flight, index) => {
            console.log(`  ${index + 1}. ${flight.airline} ${flight.flightNumber}: ${flight.airport} → ${flight.destination}`);
          });
        } else {
          console.log('❌ No Monday flights found in weekly schedule!');
        }
      }
    } else {
      console.error('❌ Failed to update weekly schedule:', result.message);
    }
    
  } catch (error) {
    console.error('Error updating weekly schedule:', error.message);
    
    // Try alternative approach - direct server call
    console.log('\nTrying production server...');
    try {
      const prodResponse = await fetch('https://anyway.ro/api/admin/weekly-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update'
        })
      });
      
      const prodResult = await prodResponse.json();
      console.log('Production API Response:', prodResult);
      
      if (prodResult.success) {
        console.log(`✅ Production weekly schedule updated!`);
        console.log(`Generated ${prodResult.count} schedule entries`);
      }
      
    } catch (prodError) {
      console.error('Production API also failed:', prodError.message);
    }
  }
}

updateWeeklyScheduleViaAPI().catch(console.error);