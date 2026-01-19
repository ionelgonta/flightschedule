/**
 * Extrage ora de plecare din textul PDF-ului (OCR)
 * Caută pattern-uri comune pentru ora de plecare în boarding pass-uri
 */
function extractDepartureTimeFromPDFText(pdfText: string): string | null {
  if (!pdfText) {
    console.log('[TIME] No PDF text provided');
    return null;
  }

  console.log('[TIME] ========== DEPARTURE TIME EXTRACTION ==========');
  console.log('[TIME] PDF text length:', pdfText.length);
  console.log('[TIME] PDF text (first 2000 chars):', pdfText.substring(0, 2000));

  // Normalizează textul - păstrează newlines pentru context
  const normalizedText = pdfText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Versiune fără newlines pentru pattern matching
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  console.log('[TIME] Single line text (first 1000 chars):', singleLineText.substring(0, 1000));

  // Colectează toate orele găsite
  const foundTimes: { time: string; context: string; priority: number; source: string }[] = [];

  // ===== PATTERN-URI SPECIFICE PENTRU BOARDING PASS =====
  
  // 1. Pattern pentru "09:00" sau "9:00" standalone (cel mai comun în boarding pass)
  const timeRegex = /\b(\d{1,2}):(\d{2})\b/g;
  let match;
  while ((match = timeRegex.exec(singleLineText)) !== null) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const idx = match.index;
      const contextBefore = singleLineText.substring(Math.max(0, idx - 30), idx);
      const contextAfter = singleLineText.substring(idx, Math.min(singleLineText.length, idx + 40));
      const context = contextBefore + contextAfter;
      
      // Exclude dacă e parte dintr-o dată (ex: 2026-01-13)
      if (/\d{4}[-\/]\d{2}[-\/]/.test(context) || /[-\/]\d{2}[-\/]\d{4}/.test(context)) {
        console.log(`[TIME] Skipping ${formattedTime} - part of date: "${context}"`);
        continue;
      }
      
      // Determină prioritatea bazată pe context
      let priority = 10;
      let source = 'standalone';
      
      const lowerContext = context.toLowerCase();
      if (lowerContext.includes('departure') || lowerContext.includes('dep ') || lowerContext.includes('plecare')) {
        priority = 1;
        source = 'departure-keyword';
      } else if (lowerContext.includes('boarding') || lowerContext.includes('gate')) {
        priority = 2;
        source = 'boarding-keyword';
      } else if (lowerContext.includes('flight') || lowerContext.includes('zbor')) {
        priority = 3;
        source = 'flight-keyword';
      } else if (lowerContext.includes('time') || lowerContext.includes('ora') || lowerContext.includes('hour')) {
        priority = 4;
        source = 'time-keyword';
      } else if (hours >= 5 && hours <= 23) {
        // Ore rezonabile pentru zboruri
        priority = 5;
        source = 'reasonable-hour';
      }
      
      foundTimes.push({ time: formattedTime, context: context.trim(), priority, source });
      console.log(`[TIME] Found: ${formattedTime} (${source}, priority ${priority}) context: "${context.trim()}"`);
    }
  }

  // 2. Pattern pentru format "0900" sau "900" (fără două puncte)
  const noColonRegex = /\b(\d{3,4})\s*(?:hrs?|h|hours?)\b/gi;
  while ((match = noColonRegex.exec(singleLineText)) !== null) {
    const timeStr = match[1].padStart(4, '0');
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match[0], priority: 6, source: 'no-colon-format' });
      console.log(`[TIME] Found (no colon): ${formattedTime} from "${match[0]}"`);
    }
  }

  // 3. Pattern pentru AM/PM
  const ampmRegex = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/gi;
  while ((match = ampmRegex.exec(singleLineText)) !== null) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    
    // Convertește la format 24h
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match[0], priority: 2, source: 'am-pm-format' });
      console.log(`[TIME] Found (AM/PM): ${formattedTime} from "${match[0]}"`);
    }
  }

  // Sortează după prioritate și returnează cea mai bună
  if (foundTimes.length > 0) {
    foundTimes.sort((a, b) => a.priority - b.priority);
    console.log('[TIME] All found times:', foundTimes.map(t => `${t.time}(${t.source}:${t.priority})`).join(', '));
    const best = foundTimes[0];
    console.log(`[TIME] ✅ Selected: ${best.time} (${best.source})`);
    return best.time;
  }

  console.log('[TIME] ⚠️ No departure time found');
  return null;
}
