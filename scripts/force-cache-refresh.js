/**
 * Force refresh all airport cache data
 * This script directly calls the API and updates both cache files
 */

const fs = require('fs').promises;
const path = require('path');

const API_KEY = 'cmj2m39qs0001k00404cmwu75';
const BASE_URL = 'https://prod.api.market/api/v1/aedbx/aerodatabox';

// All supported airports
const AIRPORTS = ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO'];

// Airport info for conversion
const AIRPORT_INFO = {
  'OTP': { name: 'Henri Coandă International Airport', city: 'București' },
  'BBU': { name: 'Aurel Vlaicu International Airport', city: 'București' },
  'CLJ': { name: 'Cluj-Napoca International Airport', city: 'Cluj-Napoca' },
  'TSR': { name: 'Timișoara Traian Vuia International Airport', city: 'Timișoara' },
  'IAS': { name: 'Iași International Airport', city: 'Iași' },
  'CND': { name: 'Mihail Kogălniceanu International Airport', city: 'Constanța' },
  'SBZ': { name: 'Sibiu International Airport', city: 'Sibiu' },
  'CRA': { name: 'Craiova International Airport', city: 'Craiova' },
  'BCM': { name: 'George Enescu International Airport', city: 'Bacău' },
  'BAY': { name: 'Baia Mare Airport', city: 'Baia Mare' },
  'OMR': { name: 'Oradea International Airport', city: 'Oradea' },
  'SCV': { name: 'Ștefan cel Mare International Airport', city: 'Suceava' },
  'TGM': { name: 'Transilvania Târgu Mureș International Airport', city: 'Târgu Mureș' },
  'ARW': { name: 'Arad International Airport', city: 'Arad' },
  'SUJ': { name: 'Satu Mare International Airport', city: 'Satu Mare' },
  'GHV': { name: 'Brașov-Ghimbav International Airport', city: 'Brașov' },
  'RMO': { name: 'Chișinău International Airport', city: 'Chișinău' }
};

function normalizeStatus(status) {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('scheduled')) return 'scheduled';
  if (statusLower.includes('active') || statusLower.includes('en-route')) return 'active';
  if (statusLower.includes('landed') || statusLower.includes('arrived')) return 'landed';
  if (statusLower.includes('departed')) return 'departed';
  if (statusLower.includes('cancelled') || statusLower.includes('canceled')) return 'cancelled';
  if (statusLower.includes('diverted')) return 'diverted';
  if (statusLower.includes('delayed')) return 'delayed';
  if (statusLower.includes('expected')) return 'expected';
  if (statusLower.includes('estimated')) return 'estimated';
  return status || 'unknown';
}

function convertFlight(flight, type, currentAirportCode) {
  try {
    const flightNumber = flight.number || 'N/A';
    const airlineName = flight.airline?.name || 'Unknown';
    const airlineCode = flight.airline?.iata || flight.airline?.icao || 'XX';
    const status = flight.status || 'unknown';
    
    const movement = flight.movement || {};
    const otherAirport = movement.airport || {};
    
    const scheduledTime = movement.scheduledTime || {};
    const revisedTime = movement.revisedTime || {};
    
    const currentAirport = AIRPORT_INFO[currentAirportCode] || { name: 'Unknown', city: 'Unknown' };
    
    const otherAirportCode = otherAirport.iata || otherAirport.icao;
    if (!otherAirportCode || !currentAirportCode) {
      return null;
    }
    
    const currentAirportInfo = {
      airport: currentAirport.name,
      code: currentAirportCode,
      city: currentAirport.city
    };
    
    const origin = type === 'arrivals' ? {
      airport: otherAirport.name || otherAirportCode,
      code: otherAirportCode,
      city: otherAirport.name || otherAirportCode
    } : currentAirportInfo;
    
    const destination = type === 'departures' ? {
      airport: otherAirport.name || otherAirportCode,
      code: otherAirportCode,
      city: otherAirport.name || otherAirportCode
    } : currentAirportInfo;
    
    const scheduledTimeStr = scheduledTime.local || scheduledTime.utc || new Date().toISOString();
    const revisedTimeStr = revisedTime.local || revisedTime.utc;
    
    // Calculate delay
    let delay = undefined;
    if (scheduledTime.utc && revisedTime.utc) {
      const scheduled = new Date(scheduledTime.utc);
      const revised = new Date(revisedTime.utc);
      const delayMinutes = Math.round((revised.getTime() - scheduled.getTime()) / (1000 * 60));
      if (delayMinutes > 0) delay = delayMinutes;
    }
    
    return {
      flight_number: flightNumber,
      airline: {
        name: airlineName,
        code: airlineCode
      },
      origin,
      destination,
      scheduled_time: scheduledTimeStr,
      estimated_time: revisedTimeStr,
      actual_time: revisedTimeStr,
      status: normalizeStatus(status),
      gate: movement.gate,
      terminal: movement.terminal,
      aircraft: flight.aircraft?.model,
      delay,
      callSign: flight.callSign,
      isCargo: flight.isCargo || false,
      baggageBelt: movement.baggageBelt,
      runway: movement.runway,
      registration: flight.aircraft?.reg,
      quality: movement.quality || [],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error converting flight:', error);
    return null;
  }
}

async function fetchAirportData(airportCode) {
  const url = `${BASE_URL}/flights/airports/Iata/${airportCode}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-market-key': API_KEY,
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`  ❌ ${airportCode}: API error ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Filter out codeshare flights
    const filterOperatorFlights = (flights) => {
      return (flights || []).filter(f => {
        const status = f.codeshareStatus || '';
        return status === 'IsOperator' || status === 'Unknown' || status === '';
      });
    };
    
    const arrivals = filterOperatorFlights(data.arrivals)
      .map(f => convertFlight(f, 'arrivals', airportCode))
      .filter(f => f !== null);
    
    const departures = filterOperatorFlights(data.departures)
      .map(f => convertFlight(f, 'departures', airportCode))
      .filter(f => f !== null);
    
    console.log(`  ✅ ${airportCode}: ${arrivals.length} arrivals, ${departures.length} departures`);
    
    return { arrivals, departures };
  } catch (error) {
    console.log(`  ❌ ${airportCode}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('=== Force Cache Refresh ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Airports: ${AIRPORTS.length}`);
  console.log('');
  
  // Load existing cache
  const cachePath = path.join(process.cwd(), 'data', 'cache-data.json');
  const persistentCachePath = path.join(process.cwd(), 'data', 'flights_cache.json');
  let cacheData = [];
  let persistentCache = {};
  
  try {
    const existingData = await fs.readFile(cachePath, 'utf-8');
    cacheData = JSON.parse(existingData);
    console.log(`Loaded existing cache with ${cacheData.length} entries`);
  } catch (error) {
    console.log('No existing cache found, starting fresh');
  }
  
  // Load existing persistent cache
  try {
    const existingPersistent = await fs.readFile(persistentCachePath, 'utf-8');
    persistentCache = JSON.parse(existingPersistent);
    console.log(`Loaded existing persistent cache with ${Object.keys(persistentCache).length} entries`);
  } catch (error) {
    console.log('No existing persistent cache found, starting fresh');
  }
  
  // Remove old flight data entries (keep analytics, weather, etc.)
  const nonFlightEntries = cacheData.filter(entry => entry.category !== 'flightData');
  console.log(`Keeping ${nonFlightEntries.length} non-flight entries`);
  
  const newFlightEntries = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const todayDate = now.toISOString().split('T')[0];
  
  console.log('\nFetching data for all airports...');
  
  let totalPersistentAdded = 0;
  
  for (const airport of AIRPORTS) {
    const data = await fetchAirportData(airport);
    
    if (data) {
      // Create arrivals entry for main cache
      newFlightEntries.push({
        id: `flight_${airport}_arrivals_${Date.now()}`,
        category: 'flightData',
        key: `${airport}_arrivals`,
        data: data.arrivals,
        createdAt: now.toISOString(),
        expiresAt,
        lastAccessed: now.toISOString(),
        source: 'manual',
        success: true
      });
      
      // Create departures entry for main cache
      newFlightEntries.push({
        id: `flight_${airport}_departures_${Date.now() + 1}`,
        category: 'flightData',
        key: `${airport}_departures`,
        data: data.departures,
        createdAt: now.toISOString(),
        expiresAt,
        lastAccessed: now.toISOString(),
        source: 'manual',
        success: true
      });
      
      // Add to persistent cache (for historical data)
      for (const flight of data.arrivals) {
        const flightKey = `${flight.flight_number}_${airport}_arrivals_${flight.scheduled_time}`;
        if (!persistentCache[flightKey]) {
          persistentCache[flightKey] = {
            ...convertToPersistentFormat(flight),
            airportCode: airport,
            type: 'arrivals',
            addedAt: now.toISOString()
          };
          totalPersistentAdded++;
        }
      }
      
      for (const flight of data.departures) {
        const flightKey = `${flight.flight_number}_${airport}_departures_${flight.scheduled_time}`;
        if (!persistentCache[flightKey]) {
          persistentCache[flightKey] = {
            ...convertToPersistentFormat(flight),
            airportCode: airport,
            type: 'departures',
            addedAt: now.toISOString()
          };
          totalPersistentAdded++;
        }
      }
    }
    
    // Wait 500ms between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Combine and save main cache
  const finalCache = [...nonFlightEntries, ...newFlightEntries];
  await fs.writeFile(cachePath, JSON.stringify(finalCache, null, 2));
  
  // Save persistent cache
  await fs.writeFile(persistentCachePath, JSON.stringify(persistentCache, null, 2));
  
  console.log('\n=== Summary ===');
  console.log(`Main cache entries: ${finalCache.length}`);
  console.log(`New flight entries: ${newFlightEntries.length}`);
  console.log(`Persistent cache total: ${Object.keys(persistentCache).length}`);
  console.log(`New persistent entries added: ${totalPersistentAdded}`);
  console.log(`Cache saved to: ${cachePath}`);
  console.log(`Persistent cache saved to: ${persistentCachePath}`);
}

// Convert flight to persistent cache format
function convertToPersistentFormat(flight) {
  return {
    flightNumber: flight.flight_number,
    airlineCode: flight.airline?.code || 'XX',
    airlineName: flight.airline?.name || 'Unknown',
    originCode: flight.origin?.code || '',
    originName: flight.origin?.city || flight.origin?.airport || '',
    destinationCode: flight.destination?.code || '',
    destinationName: flight.destination?.city || flight.destination?.airport || '',
    scheduledTime: flight.scheduled_time,
    estimatedTime: flight.estimated_time,
    actualTime: flight.actual_time,
    status: flight.status,
    aircraft: flight.aircraft,
    delayMinutes: flight.delay || 0
  };
}

main().catch(console.error);
