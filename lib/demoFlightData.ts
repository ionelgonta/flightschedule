/**
 * Demo Flight Data - Generează date demo realiste pentru zboruri
 * Folosit ca fallback când API-ul extern nu este disponibil
 */

import { RawFlightData } from './flightApiService';

// Airlines românești și internaționale active (2024) - Blue Air (0B) removed (ceased operations 2022)
const AIRLINES = [
  { name: 'TAROM', code: 'RO', country: 'România' },
  { name: 'Wizz Air', code: 'W6', country: 'Hungary' },
  { name: 'Ryanair', code: 'FR', country: 'Ireland' },
  { name: 'Lufthansa', code: 'LH', country: 'Germany' },
  { name: 'Austrian Airlines', code: 'OS', country: 'Austria' },
  { name: 'Turkish Airlines', code: 'TK', country: 'Turkey' },
  { name: 'Air France', code: 'AF', country: 'France' },
  { name: 'KLM', code: 'KL', country: 'Netherlands' },
  { name: 'British Airways', code: 'BA', country: 'UK' },
  { name: 'Emirates', code: 'EK', country: 'UAE' },
  { name: 'Qatar Airways', code: 'QR', country: 'Qatar' },
  { name: 'LOT Polish Airlines', code: 'LO', country: 'Poland' },
  { name: 'Swiss International', code: 'LX', country: 'Switzerland' },
  { name: 'ITA Airways', code: 'AZ', country: 'Italy' },
  { name: 'SAS', code: 'SK', country: 'Scandinavia' }
];

// Aeroporturi europene comune pentru zboruri
const AIRPORTS = {
  // România
  'OTP': { name: 'Aeroportul Internațional Henri Coandă', city: 'București', country: 'România' },
  'CLJ': { name: 'Aeroportul Internațional Cluj-Napoca', city: 'Cluj-Napoca', country: 'România' },
  'TSR': { name: 'Aeroportul Internațional Timișoara Traian Vuia', city: 'Timișoara', country: 'România' },
  'IAS': { name: 'Aeroportul Internațional Iași', city: 'Iași', country: 'România' },
  'CND': { name: 'Aeroportul Internațional Mihail Kogălniceanu', city: 'Constanța', country: 'România' },
  
  // Europa
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  'MUC': { name: 'Munich Airport', city: 'Munich', country: 'Germany' },
  'VIE': { name: 'Aeroportul Internațional Viena', city: 'Viena', country: 'Austria' },
  'IST': { name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  'CDG': { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  'AMS': { name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  'LHR': { name: 'London Heathrow Airport', city: 'London', country: 'UK' },
  'FCO': { name: 'Leonardo da Vinci Airport', city: 'Rome', country: 'Italy' },
  'MAD': { name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain' },
  'BCN': { name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain' },
  'DUB': { name: 'Dublin Airport', city: 'Dublin', country: 'Ireland' },
  'BRU': { name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },
  'ZUR': { name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
  'CPH': { name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
  'ARN': { name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden' },
  'DXB': { name: 'Aeroportul Internațional Dubai', city: 'Dubai', country: 'EAU' },
  'DOH': { name: 'Aeroportul Internațional Hamad', city: 'Doha', country: 'Qatar' }
};

const AIRCRAFT_TYPES = ['Boeing 737-800', 'Airbus A320', 'Airbus A321', 'Boeing 777-300', 'Airbus A330', 'ATR 72'];

/**
 * Formatează întârzierea din minute în format românesc
 * @param minutes Numărul de minute de întârziere
 * @returns String formatat în română (ex: "1 ora 43 minute", "25 minute")
 */
export function formatDelayInRomanian(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 ora' : `${hours} ore`;
  }
  
  const hourText = hours === 1 ? '1 ora' : `${hours} ore`;
  const minuteText = remainingMinutes.toString().padStart(2, '0');
  return `${hourText} ${minuteText} minute`;
}

/**
 * Generează date demo pentru sosiri - Enhanced with time-based realism
 */
export function generateDemoArrivals(airportCode: string, count: number = 15): RawFlightData[] {
  const flights: RawFlightData[] = [];
  const now = new Date();
  
  // Use current time as seed for consistent but changing data throughout the day
  const timeSeed = Math.floor(now.getTime() / (1000 * 60 * 10)); // Changes every 10 minutes
  
  // Generează zboruri pentru următoarele 12 ore
  for (let i = 0; i < count; i++) {
    // Use seeded random for consistent but changing data
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    const airline = AIRLINES[Math.floor(seededRandom(timeSeed + i) * AIRLINES.length)];
    const originCodes = Object.keys(AIRPORTS).filter(code => code !== airportCode);
    const originCode = originCodes[Math.floor(seededRandom(timeSeed + i + 100) * originCodes.length)];
    const origin = AIRPORTS[originCode as keyof typeof AIRPORTS];
    const destination = AIRPORTS[airportCode as keyof typeof AIRPORTS];
    
    // Generează o oră în următoarele 12 ore (seeded for consistency)
    const scheduledTime = new Date(now.getTime() + (seededRandom(timeSeed + i + 200) * 12 * 60 * 60 * 1000));
    
    // Status bazat pe timpul programat
    let status = 'scheduled';
    const timeUntilFlight = scheduledTime.getTime() - now.getTime();
    const hoursUntil = timeUntilFlight / (1000 * 60 * 60);
    
    if (hoursUntil < -1) {
      status = Math.random() > 0.1 ? 'landed' : 'delayed';
    } else if (hoursUntil < -0.5) {
      status = Math.random() > 0.2 ? 'active' : 'delayed';
    } else if (hoursUntil < 0) {
      status = Math.random() > 0.3 ? 'boarding' : 'delayed';
    } else if (Math.random() < 0.05) {
      status = 'cancelled';
    } else if (Math.random() < 0.1) {
      status = 'delayed';
    }
    
    // Generează întârziere pentru zborurile întârziate
    let delay: number | undefined;
    let estimatedTime: string | undefined;
    if (status === 'delayed') {
      delay = Math.floor(Math.random() * 120) + 15; // 15-135 minute
      estimatedTime = new Date(scheduledTime.getTime() + delay * 60 * 1000).toISOString();
    }
    
    const flightNumber = `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`;
    
    flights.push({
      flight_number: flightNumber,
      airline: {
        name: airline.name,
        code: airline.code
      },
      origin: {
        airport: origin.name,
        code: originCode,
        city: origin.city
      },
      destination: {
        airport: destination.name,
        code: airportCode,
        city: destination.city
      },
      scheduled_time: scheduledTime.toISOString(),
      estimated_time: estimatedTime,
      status: status,
      gate: Math.random() > 0.3 ? `${Math.floor(Math.random() * 20) + 1}` : undefined,
      terminal: Math.random() > 0.5 ? `${Math.floor(Math.random() * 3) + 1}` : undefined,
      aircraft: AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)],
      delay: delay
    });
  }
  
  // Sortează după ora programată
  return flights.sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
}

/**
 * Generează date demo pentru plecări
 */
export function generateDemoDepartures(airportCode: string, count: number = 15): RawFlightData[] {
  const flights: RawFlightData[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
    const destinationCodes = Object.keys(AIRPORTS).filter(code => code !== airportCode);
    const destinationCode = destinationCodes[Math.floor(Math.random() * destinationCodes.length)];
    const origin = AIRPORTS[airportCode as keyof typeof AIRPORTS];
    const destination = AIRPORTS[destinationCode as keyof typeof AIRPORTS];
    
    const scheduledTime = new Date(now.getTime() + (Math.random() * 12 * 60 * 60 * 1000));
    
    let status = 'scheduled';
    const timeUntilFlight = scheduledTime.getTime() - now.getTime();
    const hoursUntil = timeUntilFlight / (1000 * 60 * 60);
    
    if (hoursUntil < -1) {
      status = Math.random() > 0.1 ? 'departed' : 'delayed';
    } else if (hoursUntil < -0.5) {
      status = Math.random() > 0.2 ? 'active' : 'delayed';
    } else if (hoursUntil < 0) {
      status = Math.random() > 0.3 ? 'boarding' : 'delayed';
    } else if (Math.random() < 0.05) {
      status = 'cancelled';
    } else if (Math.random() < 0.1) {
      status = 'delayed';
    }
    
    let delay: number | undefined;
    let estimatedTime: string | undefined;
    if (status === 'delayed') {
      delay = Math.floor(Math.random() * 120) + 15;
      estimatedTime = new Date(scheduledTime.getTime() + delay * 60 * 1000).toISOString();
    }
    
    const flightNumber = `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`;
    
    flights.push({
      flight_number: flightNumber,
      airline: {
        name: airline.name,
        code: airline.code
      },
      origin: {
        airport: origin.name,
        code: airportCode,
        city: origin.city
      },
      destination: {
        airport: destination.name,
        code: destinationCode,
        city: destination.city
      },
      scheduled_time: scheduledTime.toISOString(),
      estimated_time: estimatedTime,
      status: status,
      gate: Math.random() > 0.3 ? `${Math.floor(Math.random() * 20) + 1}` : undefined,
      terminal: Math.random() > 0.5 ? `${Math.floor(Math.random() * 3) + 1}` : undefined,
      aircraft: AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)],
      delay: delay
    });
  }
  
  return flights.sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
}