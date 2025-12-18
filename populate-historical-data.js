#!/usr/bin/env node

/**
 * Script pentru popularea bazei de date istorice cu date din cache-ul curent
 * Rulează pe server pentru a genera statistici
 */

const fs = require('fs');
const path = require('path');

console.log('=== POPULARE BAZA DE DATE ISTORICA ===');

// Încarcă datele din cache
const cacheDataPath = path.join(__dirname, 'data', 'cache-data.json');

if (!fs.existsSync(cacheDataPath)) {
  console.error('❌ Nu există fișierul cache-data.json');
  process.exit(1);
}

const cacheData = JSON.parse(fs.readFileSync(cacheDataPath, 'utf8'));
console.log('✅ Cache data încărcat:', Object.keys(cacheData).length, 'chei');

// Importă modulele necesare - folosește import dinamic pentru ES modules
let historicalCacheManager;

async function populateHistoricalData() {
  try {
    // Import dinamic pentru ES modules
    const { historicalCacheManager: hcm } = await import('./lib/historicalCacheManager.js');
    historicalCacheManager = hcm;
    
    await historicalCacheManager.initialize();
    console.log('✅ Historical cache manager inițializat');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Lista aeroporturilor majore
    const airports = ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'RMO'];
    
    for (const airport of airports) {
      console.log(`\n📍 Procesez aeroportul ${airport}...`);
      
      // Verifică dacă există date în cache pentru acest aeroport
      const arrivalsKey = `${airport}_arrivals`;
      const departuresKey = `${airport}_departures`;
      
      if (cacheData[arrivalsKey] || cacheData[departuresKey]) {
        const arrivals = cacheData[arrivalsKey] || [];
        const departures = cacheData[departuresKey] || [];
        
        console.log(`  - Sosiri: ${arrivals.length}`);
        console.log(`  - Plecări: ${departures.length}`);
        
        // Transformă datele în format istoric
        const transformedArrivals = arrivals.map(flight => ({
          flightNumber: flight.number || flight.flight?.number || 'N/A',
          airline: flight.airline?.name || flight.airline || 'Unknown',
          airlineCode: flight.airline?.iata || flight.airline?.icao || 'XX',
          origin: flight.departure?.airport?.name || flight.origin || 'Unknown',
          originCode: flight.departure?.airport?.iata || flight.departure?.airport?.icao || 'XXX',
          destination: airport,
          destinationCode: airport,
          scheduledTime: flight.arrival?.scheduled || flight.scheduledTime || new Date().toISOString(),
          actualTime: flight.arrival?.actual || flight.actualTime || null,
          status: flight.status || 'scheduled',
          delayMinutes: flight.arrival?.delay || flight.delayMinutes || 0,
          aircraft: flight.aircraft?.model || flight.aircraft || null,
          gate: flight.arrival?.gate || flight.gate || null,
          terminal: flight.arrival?.terminal || flight.terminal || null,
          type: 'arrival'
        }));
        
        const transformedDepartures = departures.map(flight => ({
          flightNumber: flight.number || flight.flight?.number || 'N/A',
          airline: flight.airline?.name || flight.airline || 'Unknown',
          airlineCode: flight.airline?.iata || flight.airline?.icao || 'XX',
          origin: airport,
          originCode: airport,
          destination: flight.arrival?.airport?.name || flight.destination || 'Unknown',
          destinationCode: flight.arrival?.airport?.iata || flight.arrival?.airport?.icao || 'XXX',
          scheduledTime: flight.departure?.scheduled || flight.scheduledTime || new Date().toISOString(),
          actualTime: flight.departure?.actual || flight.actualTime || null,
          status: flight.status || 'scheduled',
          delayMinutes: flight.departure?.delay || flight.delayMinutes || 0,
          aircraft: flight.aircraft?.model || flight.aircraft || null,
          gate: flight.departure?.gate || flight.gate || null,
          terminal: flight.departure?.terminal || flight.terminal || null,
          type: 'departure'
        }));
        
        // Salvează datele pentru azi și ieri
        const allFlights = [...transformedArrivals, ...transformedDepartures];
        
        if (allFlights.length > 0) {
          await historicalCacheManager.saveSnapshot(airport, today, allFlights);
          await historicalCacheManager.saveSnapshot(airport, yesterday, allFlights);
          console.log(`  ✅ Salvat ${allFlights.length} zboruri pentru ${today} și ${yesterday}`);
        }
      } else {
        console.log(`  ⚠️  Nu există date în cache pentru ${airport}`);
      }
    }
    
    console.log('\n🎉 Popularea bazei de date istorice completă!');
    console.log('Acum statisticile ar trebui să afișeze date reale.');
    
  } catch (error) {
    console.error('❌ Eroare la popularea datelor:', error);
    process.exit(1);
  }
}

populateHistoricalData();