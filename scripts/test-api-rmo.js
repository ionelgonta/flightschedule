/**
 * Test API response for RMO to check if revisedTime is available
 */

const API_KEY = process.env.AERODATABOX_API_KEY || 'cmj2m39qs0001k00404cmwu75';

async function testRMOApi() {
  console.log('Testing AeroDataBox API for RMO (Chișinău)...\n');
  
  const url = `https://prod.api.market/api/v1/aedbx/aerodatabox/flights/airports/Iata/RMO`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-market-key': API_KEY,
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('=== RAW API RESPONSE STRUCTURE ===\n');
    console.log('Keys:', Object.keys(data));
    console.log('Arrivals count:', data.arrivals?.length || 0);
    console.log('Departures count:', data.departures?.length || 0);
    
    if (data.arrivals && data.arrivals.length > 0) {
      console.log('\n=== FIRST ARRIVAL FLIGHT (RAW) ===\n');
      console.log(JSON.stringify(data.arrivals[0], null, 2));
      
      // Check for revisedTime
      const firstFlight = data.arrivals[0];
      console.log('\n=== TIME FIELDS CHECK ===');
      console.log('movement.scheduledTime:', firstFlight.movement?.scheduledTime);
      console.log('movement.revisedTime:', firstFlight.movement?.revisedTime);
      console.log('movement.quality:', firstFlight.movement?.quality);
    }
    
    // Also test OTP for comparison
    console.log('\n\n========================================');
    console.log('Testing OTP for comparison...\n');
    
    const otpUrl = `https://prod.api.market/api/v1/aedbx/aerodatabox/flights/airports/Iata/OTP`;
    const otpResponse = await fetch(otpUrl, {
      headers: {
        'x-api-market-key': API_KEY,
        'accept': 'application/json'
      }
    });
    
    const otpData = await otpResponse.json();
    
    if (otpData.arrivals && otpData.arrivals.length > 0) {
      // Find a flight with Live quality
      const liveFlights = otpData.arrivals.filter(f => f.movement?.quality?.includes('Live'));
      
      if (liveFlights.length > 0) {
        console.log('=== OTP FLIGHT WITH LIVE QUALITY ===\n');
        console.log(JSON.stringify(liveFlights[0], null, 2));
        
        console.log('\n=== TIME FIELDS CHECK (OTP) ===');
        console.log('movement.scheduledTime:', liveFlights[0].movement?.scheduledTime);
        console.log('movement.revisedTime:', liveFlights[0].movement?.revisedTime);
        console.log('movement.quality:', liveFlights[0].movement?.quality);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testRMOApi();
