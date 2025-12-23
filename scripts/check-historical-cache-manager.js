#!/usr/bin/env node

/**
 * Script pentru verificarea historicalCacheManager și datelor disponibile
 */

async function checkHistoricalCacheManager() {
  try {
    console.log('=== Verificare Historical Cache Manager ===');
    
    // Import historical cache manager
    const { historicalCacheManager } = await import('../lib/historicalCacheManager.ts');
    
    console.log('✅ Historical cache manager importat cu succes');
    
    // Initialize
    await historicalCacheManager.initialize();
    console.log('✅ Historical cache manager inițializat');
    
    // Check available dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    console.log(`\n📅 Verificare date disponibile (${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}):`);
    
    // Check for OTP airport
    const otpArrivals = await historicalCacheManager.getDataForRange(
      'OTP', 
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0],
      'arrivals'
    );
    
    console.log(`OTP arrivals: ${otpArrivals.length} zboruri`);
    
    if (otpArrivals.length > 0) {
      // Group by date
      const dateGroups = new Map();
      otpArrivals.forEach(flight => {
        const date = flight.scheduledTime.split('T')[0];
        if (!dateGroups.has(date)) {
          dateGroups.set(date, 0);
        }
        dateGroups.set(date, dateGroups.get(date) + 1);
      });
      
      console.log('\n📊 Distribuția pe date:');
      Array.from(dateGroups.entries())
        .sort()
        .forEach(([date, count]) => {
          const dayDate = new Date(date + 'T12:00:00');
          const dayName = dayDate.toLocaleDateString('ro-RO', { weekday: 'long' });
          console.log(`  ${date} (${dayName}): ${count} zboruri`);
        });
      
      // Show sample data
      console.log('\n📋 Eșantion de date (primele 5):');
      otpArrivals.slice(0, 5).forEach((flight, index) => {
        console.log(`  ${index + 1}. ${flight.flightNumber} - ${flight.scheduledTime}`);
        console.log(`     ${flight.originCode} → ${flight.destinationCode} (${flight.airlineName})`);
      });
    }
    
    // Check other airports
    const airports = ['CLJ', 'TSR', 'IAS', 'RMO'];
    console.log('\n🛫 Verificare alte aeroporturi:');
    
    for (const airport of airports) {
      try {
        const arrivals = await historicalCacheManager.getDataForRange(
          airport, 
          startDate.toISOString().split('T')[0], 
          endDate.toISOString().split('T')[0],
          'arrivals'
        );
        
        const departures = await historicalCacheManager.getDataForRange(
          airport, 
          startDate.toISOString().split('T')[0], 
          endDate.toISOString().split('T')[0],
          'departures'
        );
        
        console.log(`  ${airport}: ${arrivals.length} arrivals, ${departures.length} departures`);
      } catch (error) {
        console.log(`  ${airport}: Eroare - ${error.message}`);
      }
    }
    
    console.log('\n=== Verificare completă ===');
    
  } catch (error) {
    console.error('Eroare la verificarea historical cache manager:', error);
  }
}

// Rulează verificarea
checkHistoricalCacheManager().catch(console.error);