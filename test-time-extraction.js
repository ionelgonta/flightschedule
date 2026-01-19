// Test script for departure time extraction
// Run with: node test-time-extraction.js

// Sample PDF text that might come from a HiSky boarding pass
const samplePDFTexts = [
  // Sample 1: HiSky format with "Departing"
  `BOARDING PASS
  HiSky Airlines
  Flight H4 0482
  From: OTP Bucharest
  To: RMO Chisinau
  Departing 09:00
  Arriving 10:30
  Gate: A12
  Seat: 15A
  Passenger: IONEL GONTA`,
  
  // Sample 2: Format with "Departure:"
  `BOARDING PASS
  Departure: 05:55
  Arrival: 08:30
  Flight: LH4820
  OTP → LHR`,
  
  // Sample 3: Format with AM/PM
  `Flight Details
  Depart: 9:00 AM
  Arrive: 11:30 AM
  Gate closes 30 minutes before departure`,
  
  // Sample 4: Romanian format
  `CARTE DE ÎMBARCARE
  Plecare: 14:30
  Sosire: 16:45
  Zbor: W6 1234`,
  
  // Sample 5: Time near flight number
  `H4 0482 09:00
  OTP RMO
  Seat 15A`,
  
  // Sample 6: Multiple times (should pick departure, not arrival)
  `Departing 06:15
  Arriving 08:45
  Boarding starts at 05:30`,
];

function extractDepartureTimeFromPDFText(pdfText) {
  if (!pdfText) {
    console.log('[TIME] No PDF text provided');
    return null;
  }

  console.log('[TIME] ========== DEPARTURE TIME EXTRACTION ==========');
  console.log('[TIME] PDF text length:', pdfText.length);

  // Versiune fara newlines pentru pattern matching
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Colecteaza toate orele gasite cu context
  const foundTimes = [];

  // ===== STRATEGIA 1: Cauta ora DUPA cuvinte cheie de plecare =====
  const departureKeywords = [
    /(?:departing|depart|departure|dep\.?|plecare)[:\s]*(\d{1,2})[:\.](\d{2})(?:\s*(?:AM|PM)?)?/gi,
    /(?:departing|depart|departure|dep\.?|plecare)[:\s]*(\d{1,2})[:\.](\d{2})\s*(AM|PM)/gi,
  ];

  for (const pattern of departureKeywords) {
    let match;
    while ((match = pattern.exec(singleLineText)) !== null) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3]?.toUpperCase();
      
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const idx = match.index;
        const context = singleLineText.substring(Math.max(0, idx - 10), Math.min(singleLineText.length, idx + 50));
        
        foundTimes.push({ time: formattedTime, context: context.trim(), priority: 1, source: 'departure-keyword' });
        console.log('[TIME] Found after departure keyword: ' + formattedTime + ' context: "' + context.trim() + '"');
      }
    }
  }

  // ===== STRATEGIA 2: Cauta ora langa "Flight" sau numar de zbor =====
  const flightPattern = /(?:flight|zbor|vol)[:\s]*[A-Z]{2}\s*\d{2,4}[:\s]*(\d{1,2})[:\.](\d{2})/gi;
  let match;
  while ((match = flightPattern.exec(singleLineText)) !== null) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match[0], priority: 2, source: 'flight-context' });
      console.log('[TIME] Found near flight: ' + formattedTime);
    }
  }

  // ===== STRATEGIA 5: Format AM/PM explicit =====
  const ampmRegex = /\b(\d{1,2})[:\.](\d{2})\s*(AM|PM)\b/gi;
  while ((match = ampmRegex.exec(singleLineText)) !== null) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const idx = match.index;
      const contextBefore = singleLineText.substring(Math.max(0, idx - 30), idx).toLowerCase();
      
      if (contextBefore.includes('arriving') || contextBefore.includes('arrival')) {
        continue;
      }
      
      let priority = 5;
      if (contextBefore.includes('depart')) priority = 1;
      
      if (!foundTimes.some(t => t.time === formattedTime)) {
        foundTimes.push({ time: formattedTime, context: match[0], priority, source: 'am-pm-format' });
        console.log('[TIME] Found AM/PM: ' + formattedTime);
      }
    }
  }

  // Sorteaza dupa prioritate si returneaza cea mai buna
  if (foundTimes.length > 0) {
    foundTimes.sort((a, b) => a.priority - b.priority);
    console.log('[TIME] All found times: ' + foundTimes.map(t => t.time + '(' + t.source + ':' + t.priority + ')').join(', '));
    const best = foundTimes[0];
    console.log('[TIME] SELECTED: ' + best.time + ' (source: ' + best.source + ')');
    return best.time;
  }

  console.log('[TIME] WARNING: No departure time found in PDF text!');
  return null;
}

// Run tests
console.log('='.repeat(60));
console.log('TESTING DEPARTURE TIME EXTRACTION');
console.log('='.repeat(60));

samplePDFTexts.forEach((text, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  console.log('Input:', text.substring(0, 100).replace(/\n/g, ' ') + '...');
  const result = extractDepartureTimeFromPDFText(text);
  console.log('RESULT:', result || 'NULL (no time found)');
  console.log('');
});
