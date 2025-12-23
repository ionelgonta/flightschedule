#!/usr/bin/env node

/**
 * Add today's flight data to persistent cache
 * Takes real data from current APIs and adds to flights_cache.json
 */

const fs = require('fs').promises;
const path = require('path');

async function addTodayToPersistentCache() {
  console.log('=== ADD TODAY DATA TO PERSISTENT CACHE ===');
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  console.log(`Processing data for: ${todayStr} (${today.toLocaleDateString('en-US', { weekday: 'long' })})`);
  
  // All Romanian and Moldovan airports
  const airports = ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'];
  
  try {
    // Load existing persistent cache
    const persistentCachePath = path.join(process.cwd(), 'data', 'flights_cache.json');
    let existingCache = {};
    
    try {
      const existingContent = await fs.readFile(persistentCachePath, 'utf8');
      existingCache = JSON.parse(existingContent);
      console.log(`Loaded existing cache with ${Object.keys(existingCache).length} entries`);
    } catch (error) {
      console.log('No existing cache found, starting fresh');
    }
    
    let totalAddedFlights = 0;
    
    // Fetch real data from APIs for each airport
    for (const airport of airports) {
      console.log(`\n--- Processing ${airport} ---`);
      
      try {
        // Fetch arrivals
        const arrivalsResponse = await fetch(`https://anyway.ro/api/flights/${airport}/arrivals`);
        const arrivalsData = await arrivalsResponse.json();
        
        // Fetch departures
        const departuresResponse = await fetch(`https://anyway.ro/api/flights/${airport}/departures`);
        const departuresData = await departuresResponse.json();
        
        const arrivalsCount = arrivalsData.success ? arrivalsData.data.length : 0;
        const departuresCount = departuresData.success ? departuresData.data.length : 0;
        
        console.log(`  ${airport}: ${arrivalsCount} arrivals + ${departuresCount} departures = ${arrivalsCount + departuresCount} total`);
        
        // Add arrivals to persistent cache
        if (arrivalsData.success && arrivalsData.data.length > 0) {
          arrivalsData.data.forEach((flight, index) => {
            // Only add flights for today
            if (flight.scheduled_time && flight.scheduled_time.startsWith(todayStr)) {
              const flightKey = `${flight.flight_number}_${airport}_${new Date(flight.scheduled_time).getTime()}_arr`;
              
              existingCache[flightKey] = {
                flightNumber: flight.flight_number,
                airlineCode: flight.airline?.code || 'XX',
                airlineName: flight.airline?.name || 'Unknown',
                originCode: flight.origin?.code || 'Unknown',
                originName: flight.origin?.city || flight.origin?.airport || 'Unknown',
                destinationCode: airport,
                destinationName: airport,
                scheduledTime: flight.scheduled_time,
                actualTime: flight.actual_time,
                estimatedTime: flight.estimated_time,
                status: flight.status || 'scheduled',
                delayMinutes: flight.delay || 0,
                airportCode: airport,
                type: 'arrivals',
                cachedAt: new Date().toISOString(),
                source: 'aerodatabox_current'
              };
              
              totalAddedFlights++;
            }
          });
        }
        
        // Add departures to persistent cache
        if (departuresData.success && departuresData.data.length > 0) {
          departuresData.data.forEach((flight, index) => {
            // Only add flights for today
            if (flight.scheduled_time && flight.scheduled_time.startsWith(todayStr)) {
              const flightKey = `${flight.flight_number}_${airport}_${new Date(flight.scheduled_time).getTime()}_dep`;
              
              existingCache[flightKey] = {
                flightNumber: flight.flight_number,
                airlineCode: flight.airline?.code || 'XX',
                airlineName: flight.airline?.name || 'Unknown',
                originCode: airport,
                originName: airport,
                destinationCode: flight.destination?.code || 'Unknown',
                destinationName: flight.destination?.city || flight.destination?.airport || 'Unknown',
                scheduledTime: flight.scheduled_time,
                actualTime: flight.actual_time,
                estimatedTime: flight.estimated_time,
                status: flight.status || 'scheduled',
                delayMinutes: flight.delay || 0,
                airportCode: airport,
                type: 'departures',
                cachedAt: new Date().toISOString(),
                source: 'aerodatabox_current'
              };
              
              totalAddedFlights++;
            }
          });
        }
        
        // Rate limiting
        if (airports.indexOf(airport) < airports.length - 1) {
          await sleep(1000); // 1 second between requests
        }
        
      } catch (error) {
        console.log(`  ERROR for ${airport}: ${error.message}`);
      }
    }
    
    // Save updated cache
    await fs.writeFile(persistentCachePath, JSON.stringify(existingCache, null, 2));
    
    console.log(`\n=== CACHE UPDATE COMPLETE ===`);
    console.log(`Added ${totalAddedFlights} new flight entries for today`);
    console.log(`Total cache entries: ${Object.keys(existingCache).length}`);
    console.log(`Cache saved to: ${persistentCachePath}`);
    
    // Deploy to production
    console.log(`\n=== DEPLOYING TO PRODUCTION ===`);
    
    try {
      // Copy to server (you'll need to run this manually or use the PowerShell command)
      console.log('To deploy to production, run:');
      console.log('scp data/flights_cache.json root@anyway.ro:/opt/anyway-flight-schedule/data/');
      console.log('ssh root@anyway.ro "cd /opt/anyway-flight-schedule && pm2 restart anyway-ro"');
      
      // Update weekly schedule via API
      console.log('\nUpdating weekly schedule...');
      const response = await fetch('https://anyway.ro/api/admin/weekly-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update' })
      });
      
      const result = await response.json();
      console.log('Weekly schedule update result:', result.message);
      
      if (result.success) {
        // Check the updated schedule
        const scheduleResponse = await fetch('https://anyway.ro/api/admin/weekly-schedule?action=get');
        const scheduleData = await scheduleResponse.json();
        
        if (scheduleData.success) {
          console.log(`\n=== UPDATED WEEKLY SCHEDULE ===`);
          console.log(`Total entries: ${scheduleData.count}`);
          
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          days.forEach(day => {
            const count = scheduleData.data.filter(item => item.weeklyPattern[day]).length;
            console.log(`${day}: ${count} flights`);
          });
        }
      }
      
    } catch (apiError) {
      console.error('Failed to update weekly schedule:', apiError.message);
    }
    
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

addTodayToPersistentCache().catch(console.error);