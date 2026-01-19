import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to test departure time extraction from PDF text
 * POST /api/boarding-pass/debug-time
 * Body: { "pdfText": "..." }
 */

function extractDepartureTimeFromPDFText(pdfText: string): { time: string | null; debug: any } {
  if (!pdfText) {
    return { time: null, debug: { error: 'No PDF text provided' } };
  }

  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  const foundTimes: { time: string; context: string; priority: number; source: string }[] = [];

  // Strategy 1: Keywords like Departing, Depart, Departure, DEP, Plecare
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
      }
    }
  }

  // Strategy 2: AM/PM format
  const ampmRegex = /\b(\d{1,2})[:\.](\d{2})\s*(AM|PM)\b/gi;
  let match;
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
      
      // Skip arrival times
      if (contextBefore.includes('arriving') || contextBefore.includes('arrival') || contextBefore.includes('arr ')) {
        continue;
      }
      
      let priority = 5;
      if (contextBefore.includes('depart')) priority = 1;
      
      if (!foundTimes.some(t => t.time === formattedTime && t.priority <= priority)) {
        foundTimes.push({ time: formattedTime, context: match[0], priority, source: 'am-pm-format' });
      }
    }
  }

  // Strategy 3: Standalone times (lower priority)
  const timeRegex = /\b(\d{1,2})[:\.](\d{2})\b/g;
  while ((match = timeRegex.exec(singleLineText)) !== null) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours >= 5 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const idx = match.index;
      const contextBefore = singleLineText.substring(Math.max(0, idx - 40), idx).toLowerCase();
      const contextAfter = singleLineText.substring(idx, Math.min(singleLineText.length, idx + 40)).toLowerCase();
      const context = contextBefore + contextAfter;
      
      // Skip if part of date
      if (/\d{4}[-\/]\d{2}[-\/]/.test(context) || /[-\/]\d{2}[-\/]\d{4}/.test(context)) {
        continue;
      }
      
      // Skip arrival times
      if (contextBefore.includes('arriving') || contextBefore.includes('arrival') || contextBefore.includes('arr ')) {
        continue;
      }
      
      let priority = 10;
      let source = 'standalone';
      
      if (contextBefore.includes('depart') || contextBefore.includes('plecare')) {
        priority = 1; source = 'departure-context';
      } else if (contextBefore.includes('board') || contextBefore.includes('gate')) {
        priority = 3; source = 'boarding-context';
      }
      
      if (!foundTimes.some(t => t.time === formattedTime && t.priority <= priority)) {
        foundTimes.push({ time: formattedTime, context: context.trim(), priority, source });
      }
    }
  }

  // Sort by priority and return best match
  if (foundTimes.length > 0) {
    foundTimes.sort((a, b) => a.priority - b.priority);
    const best = foundTimes[0];
    return {
      time: best.time,
      debug: {
        selectedTime: best.time,
        selectedSource: best.source,
        selectedPriority: best.priority,
        allFoundTimes: foundTimes,
        pdfTextLength: pdfText.length,
        singleLineTextPreview: singleLineText.substring(0, 500)
      }
    };
  }

  return {
    time: null,
    debug: {
      error: 'No departure time found',
      pdfTextLength: pdfText.length,
      singleLineTextPreview: singleLineText.substring(0, 500)
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pdfText = body.pdfText || '';
    
    const result = extractDepartureTimeFromPDFText(pdfText);
    
    return NextResponse.json({
      success: true,
      extractedTime: result.time,
      debug: result.debug
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/boarding-pass/debug-time',
    method: 'POST',
    body: { pdfText: 'string - the text extracted from PDF' },
    description: 'Debug endpoint to test departure time extraction logic'
  });
}
