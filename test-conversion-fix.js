// Test the flight data conversion fix
const AeroDataBoxService = require('./lib/aerodataboxService.ts');

// Mock flight data based on actual API response
const mockFlight = {
  "movement": {
    "airport": {
      "icao": "LKPR",
      "iata": "PRG", 
      "name": "Prague",
      "timeZone": "Europe/Prague"
    },
    "scheduledTime": {
      "utc": "2025-12-12 13:00Z",
      "local": "2025-12-12 15:00+02:00"
    },
    "revisedTime": {
      "utc": "2025-12-12 14:36Z",
      "local": "2025-12-12 16:36+02:00"
    },
    "quality": ["Basic", "Live"]
  },
  "number": "QS 1010",
  "callSign": "TVS76P",
  "status": "Arrived",
  "codeshareStatus": "IsOperator",
  "isCargo": false,
  "aircraft": {
    "reg": "OK-FYC",
    "modeS": "49D5EF",
    "model": "Airbus A220-300"
  },
  "airline": {
    "name": "SmartWings",
    "iata": "QS",
    "icao": "TVS"
  }
};

console.log('Testing flight data conversion...');

const service = new AeroDataBoxService({
  apiKey: 'test',
  baseUrl: 'test',
  rateLimit: 100
});

// Test arrival conversion
const arrivalResult = service.convertToStandardFormat(mockFlight, 'arrivals', 'OTP');
console.log('\n=== ARRIVAL CONVERSION ===');
console.log('Flight Number:', arrivalResult.flight_number);
console.log('Airline:', arrivalResult.airline.name, '(' + arrivalResult.airline.code + ')');
console.log('Origin:', arrivalResult.origin.airport, '(' + arrivalResult.origin.code + ')');
console.log('Destination:', arrivalResult.destination.airport, '(' + arrivalResult.destination.code + ')');
console.log('Status:', arrivalResult.status);
console.log('Delay:', arrivalResult.delay, 'minutes');

// Test departure conversion  
const departureResult = service.convertToStandardFormat(mockFlight, 'departures', 'OTP');
console.log('\n=== DEPARTURE CONVERSION ===');
console.log('Flight Number:', departureResult.flight_number);
console.log('Airline:', departureResult.airline.name, '(' + departureResult.airline.code + ')');
console.log('Origin:', departureResult.origin.airport, '(' + departureResult.origin.code + ')');
console.log('Destination:', departureResult.destination.airport, '(' + departureResult.destination.code + ')');
console.log('Status:', departureResult.status);
console.log('Delay:', departureResult.delay, 'minutes');

console.log('\nConversion test complete!');