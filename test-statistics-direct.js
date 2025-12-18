#!/usr/bin/env node

/**
 * Test direct pentru statistici
 */

const fs = require('fs');
const path = require('path');

console.log('=== TEST DIRECT STATISTICI ===');

// Simulează exact ce face flightStatisticsService
async function testStatistics() {
  try {
    // Încarcă cache data
    const cacheDataPath = path.join(__dirname, 'data', 'cache-data.json');
    const cacheData = JSON.parse(fs.readFileSync(cacheDataPath, 'utf8'));
    
    // Simulează cacheManager
    const mockCacheManager = {
      getCachedData: (key) => {
        const item = cacheData.find(entry => entry.key === key);
        return item ? item.data : null;
      }
    };
    
    const airportCode = 'OTP';
    const icaoCode = 'LROP';
    
    console.log(`\n🔍 Căutare date pentru ${airportCode}...`);
    
    let currentArrivals = mockCacheManager.getCachedData(`${airportCode}_arrivals`) || [];
    let currentDepartures = mockCacheManager.getCachedData(`${airportCode}_departures`) || [];
    
    console.log(`  IATA ${airportCode}: ${currentArrivals.length} sosiri, ${currentDepartures.length} plecări`);
    
    if (currentArrivals.length === 0 && currentDepartures.length === 0) {
      currentArrivals = mockCacheManager.getCachedData(`${icaoCode}_arrivals`) || [];
      currentDepartures = mockCacheManager.getCachedData(`${icaoCode}_departures`) || [];
      console.log(`  ICAO ${icaoCode}: ${currentArrivals.length} sosiri, ${currentDepartures.length} plecări`);
    }
    
    if (currentArrivals.length === 0 && currentDepartures.length === 0) {
      console.log('❌ Nu s-au găsit date!');
      return;
    }
    
    // Transformă datele
    const transformedArrivals = currentArrivals.map((flight) => ({
      flightNumber: flight.flight_number || flight.number || 'N/A',
      airline: flight.airline?.name || flight.airline || 'Unknown',
      airlineCode: flight.airline?.code || flight.airline?.iata || flight.airline?.icao || 'XX',
      status: flight.status || 'scheduled',
      delayMinutes: flight.delay || flight.delayMinutes || 0,
      scheduledTime: flight.scheduled_time || flight.scheduledTime || new Date().toISOString(),
      actualTime: flight.actual_time || flight.actualTime || null,
      aircraft: flight.aircraft?.model || flight.aircraft || null,
      type: 'arrival'
    }));
    
    const transformedDepartures = currentDepartures.map((flight) => ({
      flightNumber: flight.flight_number || flight.number || 'N/A',
      airline: flight.airline?.name || flight.airline || 'Unknown',
      airlineCode: flight.airline?.code || flight.airline?.iata || flight.airline?.icao || 'XX',
      status: flight.status || 'scheduled',
      delayMinutes: flight.delay || flight.delayMinutes || 0,
      scheduledTime: flight.scheduled_time || flight.scheduledTime || new Date().toISOString(),
      actualTime: flight.actual_time || flight.actualTime || null,
      aircraft: flight.aircraft?.model || flight.aircraft || null,
      type: 'departure'
    }));
    
    const allFlights = [...transformedArrivals, ...transformedDepartures];
    console.log(`\n✅ Total zboruri transformate: ${allFlights.length}`);
    
    if (allFlights.length > 0) {
      console.log('\n📊 Primul zbor:');
      console.log(JSON.stringify(allFlights[0], null, 2));
      
      // Calculează statistici
      const isOnTime = (flight) => {
        const status = flight.status?.toLowerCase() || '';
        return (status === 'on-time' || status === 'scheduled' || status === 'landed' || 
                status === 'departed' || status === 'en-route') && flight.delayMinutes <= 15;
      };
      
      const isDelayed = (flight) => {
        const status = flight.status?.toLowerCase() || '';
        return status === 'delayed' || flight.delayMinutes > 15;
      };
      
      const isCancelled = (flight) => {
        const status = flight.status?.toLowerCase() || '';
        return status === 'cancelled' || status === 'canceled';
      };
      
      const totalFlights = allFlights.length;
      const onTimeFlights = allFlights.filter(isOnTime).length;
      const delayedFlights = allFlights.filter(isDelayed).length;
      const cancelledFlights = allFlights.filter(isCancelled).length;
      
      const onTimePercentage = Math.round((onTimeFlights / totalFlights) * 100);
      
      const delayedFlightsList = allFlights.filter(f => f.delayMinutes > 0);
      const averageDelay = delayedFlightsList.length > 0
        ? Math.round(delayedFlightsList.reduce((sum, f) => sum + f.delayMinutes, 0) / delayedFlightsList.length)
        : 0;
      
      console.log('\n📈 Statistici calculate:');
      console.log(`  Total zboruri: ${totalFlights}`);
      console.log(`  La timp: ${onTimeFlights} (${onTimePercentage}%)`);
      console.log(`  Întârziate: ${delayedFlights}`);
      console.log(`  Anulate: ${cancelledFlights}`);
      console.log(`  Întârziere medie: ${averageDelay} min`);
      
      // Verifică statusurile
      const statusCounts = {};
      allFlights.forEach(f => {
        const status = f.status?.toLowerCase() || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n🏷️  Statusuri zboruri:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Eroare:', error);
  }
}

testStatistics();