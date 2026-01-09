// Test complet pentru parseIATABCBP - simulează exact codul din route.ts

const bcbpData = "M1GONTA/IONELMR       EAD5J68 OTPRMOH4 0482 002Y009E0066 15A>5180WW6002BH4              2A132           0H4                         STXB23029627881ETX";

// Lista de aeroporturi (subset pentru test)
const KNOWN_AIRPORTS = new Set([
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO',
  'LHR', 'CDG', 'FRA', 'AMS', 'FCO', 'MAD', 'BCN'
]);

function isValidAirport(code) {
  if (!code || code.length !== 3) return false;
  return KNOWN_AIRPORTS.has(code.toUpperCase());
}

console.log('🔍 Testing Full BCBP Parser');
console.log('📊 Input:', bcbpData.substring(0, 80) + '...');
console.log('');

let cleanBCBP = bcbpData.replace(/[\x00-\x1F]/g, '').trim();
let pnrCode = null;
let flightDate = null;
let julianDate = null;
let compartment = null;

// === PNR EXTRACTION (exact ca în route.ts) ===
console.log('=== PNR EXTRACTION ===');

const directPnrMatch = cleanBCBP.match(/\s+E([A-Z][A-Z0-9]{5})\s/);
if (directPnrMatch && directPnrMatch[1]) {
  const candidate = directPnrMatch[1];
  console.log(`Direct match found: "${candidate}"`);
  console.log(`  - Length: ${candidate.length}`);
  console.log(`  - First 3 chars: "${candidate.substring(0,3)}"`);
  console.log(`  - Is airport: ${isValidAirport(candidate.substring(0, 3))}`);
  
  if (candidate.length === 6 && !isValidAirport(candidate.substring(0, 3))) {
    pnrCode = candidate;
    console.log(`✅ PNR extracted: "${pnrCode}"`);
  } else {
    console.log(`❌ PNR validation failed`);
  }
} else {
  console.log('❌ Direct pattern did not match');
}

// === JULIAN DATE EXTRACTION (exact ca în route.ts) ===
console.log('');
console.log('=== JULIAN DATE EXTRACTION ===');

const julianPatterns = [
  { name: 'space+3digits+class', pattern: /\s(\d{3})([YCFJWSB])\d{3}/ },
  { name: 'flight+space+julian', pattern: /\d{3,4}\s+(\d{3})([YCFJWSB])/ },
  { name: 'carrier+flight+julian', pattern: /[A-Z]{2}\s*\d{3,4}\s*(\d{3})([YCFJWSB])/ },
  { name: 'julian+class+seat', pattern: /(\d{3})([YCFJWSB])\d{3}[A-K]/ },
];

for (const { name, pattern } of julianPatterns) {
  const match = cleanBCBP.match(pattern);
  if (match && match[1]) {
    const julianDay = parseInt(match[1]);
    const classCode = match[2];
    console.log(`Pattern "${name}": Julian=${match[1]}, Class=${classCode}`);
    
    if (julianDay >= 1 && julianDay <= 366 && !flightDate) {
      julianDate = match[1];
      compartment = classCode;
      
      let year = new Date().getFullYear();
      const today = new Date();
      const todayJulian = Math.floor((today.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      
      if (julianDay < todayJulian - 30) {
        year = year + 1;
      }
      
      const date = new Date(Date.UTC(year, 0, julianDay));
      flightDate = date.toISOString().split('T')[0];
      console.log(`✅ Flight Date: ${flightDate} (Julian ${julianDate}, Year ${year})`);
    }
  } else {
    console.log(`Pattern "${name}": NO MATCH`);
  }
}

// === FINAL RESULTS ===
console.log('');
console.log('=== FINAL RESULTS ===');
console.log(`PNR/confirmationCode: ${pnrCode || 'null'}`);
console.log(`flightDate: ${flightDate || 'null'}`);
console.log(`julianDate: ${julianDate || 'null'}`);
console.log(`compartment: ${compartment || 'null'}`);

console.log('');
console.log('=== EXPECTED ===');
console.log('PNR: AD5J68');
console.log('flightDate: 2026-01-02');
console.log('julianDate: 002');
console.log('compartment: Y');
