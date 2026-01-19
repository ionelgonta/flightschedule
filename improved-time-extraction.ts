/**
 * Extrage ora de plecare din textul PDF-ului (OCR)
 * IMPORTANT: Ora NU se afla in barcode (BCBP), ci doar in textul vizibil!
 * Cauta cuvinte cheie: Departing, Depart, Departure, DEP
 */
function extractDepartureTimeFromPDFText(pdfText: string): string | null {
  if (!pdfText) {
    console.log('[TIME] No PDF text provided');
    return null;
  }

  console.log('[TIME] ========== DEPARTURE TIME EXTRACTION ==========');
  console.log('[TIME] PDF text length:', pdfText.length);
  console.log('[TIME] PDF text (first 3000 chars):', pdfText.substring(0, 3000));

  // Versiune fara newlines pentru pattern matching
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Colecteaza toate orele gasite cu context
  const foundTimes: { time: string; context: string; priority: number; source: string }[] = [];

  // ===== STRATEGIA 1: Cauta ora DUPA cuvinte cheie de plecare =====
  // Pattern: "Departing 05:55" sau "Depart: 06:00" sau "Departure 19:00"
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
      
      // Converteste AM/PM la format 24h
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

  // ===== STRATEGIA 3: Cauta ora langa "Gate" sau "Boarding" =====
  const boardingPattern = /(?:gate|boarding|poarta)[:\s]*[A-Z0-9]*[:\s]*(\d{1,2})[:\.](\d{2})/gi;
  while ((match = boardingPattern.exec(singleLineText)) !== null) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match[0], priority: 3, source: 'boarding-context' });
      console.log('[TIME] Found near boarding/gate: ' + formattedTime);
    }
  }

  // ===== STRATEGIA 4: Cauta toate orele standalone si filtreaza =====
  const timeRegex = /\b(\d{1,2})[:\.](\d{2})\b/g;
  while ((match = timeRegex.exec(singleLineText)) !== null) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    // Doar ore rezonabile pentru zboruri (05:00 - 23:59)
    if (hours >= 5 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const idx = match.index;
      const contextBefore = singleLineText.substring(Math.max(0, idx - 40), idx).toLowerCase();
      const contextAfter = singleLineText.substring(idx, Math.min(singleLineText.length, idx + 40)).toLowerCase();
      const context = contextBefore + contextAfter;
      
      // Exclude daca e parte dintr-o data (2026-01-13, 13/01/2026)
      if (/\d{4}[-\/]\d{2}[-\/]/.test(context) || /[-\/]\d{2}[-\/]\d{4}/.test(context)) {
        console.log('[TIME] Skipping ' + formattedTime + ' - part of date');
        continue;
      }
      
      // Exclude daca e ora de sosire (arriving, arrival, arr)
      if (contextBefore.includes('arriving') || contextBefore.includes('arrival') || contextBefore.includes('arr ')) {
        console.log('[TIME] Skipping ' + formattedTime + ' - arrival time');
        continue;
      }
      
      // Verifica daca e langa cuvinte de plecare
      let priority = 10;
      let source = 'standalone';
      
      if (contextBefore.includes('depart') || contextBefore.includes('plecare')) {
        priority = 1; source = 'departure-context';
      } else if (contextBefore.includes('board') || contextBefore.includes('gate')) {
        priority = 3; source = 'boarding-context';
      } else if (contextBefore.includes('time') || contextBefore.includes('ora')) {
        priority = 4; source = 'time-context';
      }
      
      // Evita duplicate
      if (!foundTimes.some(t => t.time === formattedTime && t.priority <= priority)) {
        foundTimes.push({ time: formattedTime, context: context.trim(), priority, source });
        console.log('[TIME] Found standalone: ' + formattedTime + ' (' + source + ', priority ' + priority + ')');
      }
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
      
      // Exclude arrival times
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
