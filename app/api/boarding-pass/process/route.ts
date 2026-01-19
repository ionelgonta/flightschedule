import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Service account pentru Google Wallet - credentials from environment variables
// IMPORTANT: Set GOOGLE_WALLET_CLIENT_EMAIL and GOOGLE_WALLET_PRIVATE_KEY in .env.local
const serviceAccount = {
  client_email: process.env.GOOGLE_WALLET_CLIENT_EMAIL || '',
  private_key: (process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Lista completă de companii aeriene cunoscute (include și coduri de 3 caractere)
const KNOWN_CARRIERS: Record<string, string> = {
  '5F': 'FlyOne', 'RO': 'TAROM', 'W4': 'Wizz Air', 'W6': 'Wizz Air', 'WZ': 'Wizz Air',
  'H4': 'HiSky', '0B': 'Blue Air', '9U': 'Air Moldova',
  'LH': 'Lufthansa', 'FR': 'Ryanair', 'BA': 'British Airways', 'KL': 'KLM', 'AF': 'Air France',
  'LX': 'Swiss', 'OS': 'Austrian', 'AZ': 'ITA Airways', 'IB': 'Iberia', 'VY': 'Vueling',
  'U2': 'easyJet', 'EW': 'Eurowings', 'EI': 'Aer Lingus', 'SK': 'SAS', 'AY': 'Finnair',
  'SN': 'Brussels Airlines', 'TP': 'TAP Portugal', 'TK': 'Turkish Airlines', 'EK': 'Emirates',
  'QR': 'Qatar Airways', 'AA': 'American Airlines', 'DL': 'Delta', 'UA': 'United',
  'AC': 'Air Canada', 'LO': 'LOT Polish', 'OK': 'Czech Airlines', 'BT': 'airBaltic',
  'PC': 'Pegasus', 'TU': 'Tunisair', 'MS': 'EgyptAir', 'AT': 'Royal Air Maroc',
  'UX': 'Air Europa', 'A3': 'Aegean', 'JU': 'Air Serbia', 'OU': 'Croatia Airlines',
  'PS': 'Ukraine Intl', 'HV': 'Transavia', 'DY': 'Norwegian', 'D8': 'Norwegian Air Intl',
  'QS': 'SmartWings', 'V7': 'Volotea', 'TO': 'Transavia France', 'XR': 'Corendon',
  'DE': 'Condor', 'XQ': 'SunExpress', 'SQ': 'Singapore Airlines', 'CX': 'Cathay Pacific',
  'NH': 'ANA', 'JL': 'Japan Airlines', 'KE': 'Korean Air', 'OZ': 'Asiana',
  'TG': 'Thai Airways', 'MH': 'Malaysia Airlines', 'AI': 'Air India', 'ET': 'Ethiopian',
  'QF': 'Qantas', 'NZ': 'Air New Zealand', 'LA': 'LATAM', 'AV': 'Avianca',
  'AM': 'Aeromexico', 'WN': 'Southwest', 'B6': 'JetBlue', 'AS': 'Alaska Airlines',
  'UC': 'LAN Chile',
  // 3-character ICAO carrier codes (some airlines use these in BCBP)
  'EJU': 'easyJet', 'EZY': 'easyJet', 'EZS': 'easyJet',
  'WZZ': 'Wizz Air', 'RYR': 'Ryanair', 'DLH': 'Lufthansa', 'BAW': 'British Airways',
  'AFR': 'Air France', 'KLM': 'KLM', 'SWR': 'Swiss', 'AUA': 'Austrian',
  'TAP': 'TAP Portugal', 'THY': 'Turkish Airlines', 'UAE': 'Emirates',
  'QTR': 'Qatar Airways', 'AAL': 'American Airlines', 'DAL': 'Delta', 'UAL': 'United'
};

// Mapare ICAO (3 char) la IATA (2 char) pentru Google Wallet
const ICAO_TO_IATA: Record<string, string> = {
  'EJU': 'U2', 'EZY': 'U2', 'EZS': 'U2',
  'WZZ': 'W6', 'RYR': 'FR', 'DLH': 'LH', 'BAW': 'BA',
  'AFR': 'AF', 'KLM': 'KL', 'SWR': 'LX', 'AUA': 'OS',
  'TAP': 'TP', 'THY': 'TK', 'UAE': 'EK',
  'QTR': 'QR', 'AAL': 'AA', 'DAL': 'DL', 'UAL': 'UA'
};

// Lista de aeroporturi IATA cunoscute
const KNOWN_AIRPORTS = new Set([
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO',
  'LHR', 'LGW', 'STN', 'LTN', 'MAN', 'BHX', 'EDI', 'GLA', 'BRS', 'NCL', 'LPL', 'EMA', 'SOU', 'ABZ', 'BFS', 'BHD',
  'CDG', 'ORY', 'BVA', 'LYS', 'NCE', 'MRS', 'TLS', 'BOD', 'NTE', 'LIL', 'MPL',
  'FRA', 'MUC', 'DUS', 'TXL', 'BER', 'HAM', 'CGN', 'STR', 'HAJ', 'NUE', 'LEJ', 'DRS', 'DTM', 'FMO', 'PAD',
  'AMS', 'RTM', 'EIN', 'MST', 'GRQ', 'BRU', 'CRL', 'ANR', 'LGG', 'OST',
  'ZRH', 'GVA', 'BSL', 'BRN', 'VIE', 'SZG', 'INN', 'GRZ', 'LNZ', 'KLU',
  'FCO', 'MXP', 'LIN', 'BGY', 'VCE', 'NAP', 'BLQ', 'PSA', 'FLR', 'CTA', 'PMO', 'BRI', 'CAG', 'OLB', 'TRN', 'GOA', 'VRN', 'TRS', 'SUF',
  'MAD', 'BCN', 'PMI', 'AGP', 'ALC', 'VLC', 'SVQ', 'BIO', 'IBZ', 'TFS', 'LPA', 'ACE', 'FUE', 'GRX', 'ZAZ', 'SCQ', 'OVD', 'SDR', 'REU',
  'LIS', 'OPO', 'FAO', 'FNC', 'PDL', 'TER',
  'ATH', 'SKG', 'HER', 'RHO', 'CFU', 'CHQ', 'KGS', 'JTR', 'JMK', 'ZTH', 'EFL', 'PVK', 'VOL', 'KVA',
  'WAW', 'KRK', 'GDN', 'WRO', 'POZ', 'KTW', 'RZE', 'SZZ', 'LUZ', 'BZG',
  'PRG', 'BRQ', 'OSR', 'BUD', 'DEB', 'BTS', 'KSC', 'TAT', 'PED', 'SLD',
  'ZAG', 'SPU', 'DBV', 'PUY', 'ZAD', 'RJK', 'OSI', 'LJU', 'MBX', 'BEG', 'INI', 'PRN',
  'SOF', 'VAR', 'BOJ', 'PDV', 'CPH', 'BLL', 'AAL', 'AAR',
  'OSL', 'BGO', 'TRD', 'SVG', 'TOS', 'BOO', 'AES', 'KRS', 'HAU', 'MOL', 'TRF',
  'ARN', 'GOT', 'MMX', 'BMA', 'NYO', 'VST', 'LLA', 'UME', 'OSD', 'VBY', 'RNB',
  'HEL', 'TMP', 'TKU', 'OUL', 'RVN', 'KUO', 'JYV', 'VAA', 'KTT', 'IVL',
  'TLL', 'TRT', 'RIX', 'LPX', 'VNO', 'KUN', 'PLQ', 'SQQ',
  'IST', 'SAW', 'ESB', 'AYT', 'ADB', 'DLM', 'BJV', 'GZT', 'TZX', 'ERZ', 'VAN', 'DIY', 'MLX', 'KYA', 'ASR', 'SZF',
  'TLV', 'SDV', 'ETH', 'VDA', 'HFA', 'DXB', 'AUH', 'SHJ', 'DWC', 'DOH', 'HIA', 'BAH', 'KWI', 'MCT', 'SLL', 'AMM', 'AQJ', 'BEY',
  'CAI', 'HRG', 'SSH', 'LXR', 'ASW', 'ALY', 'HBE', 'CMN', 'RAK', 'AGA', 'FEZ', 'TNG', 'NDR', 'OUD', 'ESU', 'RBA',
  'TUN', 'DJE', 'MIR', 'SFA', 'NBE', 'ALG', 'ORN', 'CZL', 'AAE', 'TLM', 'BJA', 'GHA', 'TMR',
  'DUB', 'SNN', 'ORK', 'KIR', 'NOC', 'GWY', 'CFN', 'WAT',
  'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS', 'EWR', 'IAD', 'PHL', 'CLT', 'PHX', 'IAH', 'LAS', 'MCO', 'MSP', 'DTW',
  'YYZ', 'YVR', 'YUL', 'YYC', 'YOW', 'YEG', 'YHZ', 'YWG',
  'SIN', 'HKG', 'BKK', 'KUL', 'NRT', 'HND', 'ICN', 'PEK', 'PVG', 'CAN', 'SZX', 'TPE', 'MNL', 'CGK', 'DEL', 'BOM', 'MAA', 'BLR', 'HYD', 'CCU',
  'SYD', 'MEL', 'BNE', 'PER', 'ADL', 'AKL', 'WLG', 'CHC', 'ZQN',
  'JNB', 'CPT', 'DUR', 'NBO', 'ADD', 'LOS', 'ACC', 'ABJ', 'DSS',
  'GRU', 'GIG', 'BSB', 'CNF', 'SSA', 'REC', 'FOR', 'POA', 'CWB', 'VCP',
  'EZE', 'AEP', 'SCL', 'LIM', 'BOG', 'MDE', 'CTG', 'UIO', 'GYE', 'CCS', 'PTY', 'SJO', 'SAL', 'GUA', 'MEX', 'CUN', 'GDL', 'MTY', 'TIJ', 'SJD',
  'MIL', 'LON', 'PAR', 'NYC', 'WAS', 'CHI', 'ROM', 'BUE'
]);

function isValidAirport(code: string): boolean {
  if (!code || code.length !== 3) return false;
  return KNOWN_AIRPORTS.has(code.toUpperCase());
}

/**
 * Extrage ora de plecare din textul PDF-ului (OCR)
 * IMPORTANT: Ora NU se afla in barcode (BCBP), ci doar in textul vizibil!
 * Cauta cuvinte cheie: Departing, Depart, Departure, DEP
 */
function extractDepartureTimeFromPDFText(pdfText: string): string | null {
  if (!pdfText) {
    console.error('[TIME] No PDF text provided');
    return null;
  }

  console.error('[TIME] ========== DEPARTURE TIME EXTRACTION ==========');
  console.error('[TIME] PDF text length:', pdfText.length);
  console.error('[TIME] PDF text (first 3000 chars):', pdfText.substring(0, 3000));

  // Versiune fara newlines pentru pattern matching
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Colecteaza toate orele gasite cu context
  const foundTimes: { time: string; context: string; priority: number; source: string }[] = [];

  // ===== STRATEGIA 1: Cauta ora DUPA cuvinte cheie de plecare =====
  // Pattern: "Departing 05:55" sau "Depart: 06:00" sau "Departure 19:00" sau "DEPART TIME ... 09:00"
  const departureKeywords = [
    /(?:departing|depart|departure|dep\.?|plecare)[:\s]*(\d{1,2})[:\.](\d{2})(?:\s*(?:AM|PM)?)?/gi,
    /(?:departing|depart|departure|dep\.?|plecare)[:\s]*(\d{1,2})[:\.](\d{2})\s*(AM|PM)/gi,
    // HiSky format: "DEPART TIME" as column header, time appears later in row
    /depart\s+time[^0-9]*(\d{1,2})[:\.](\d{2})/gi,
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
        console.error('[TIME] Found after departure keyword: ' + formattedTime + ' context: "' + context.trim() + '"');
      }
    }
  }

  // ===== STRATEGIA 2: HiSky table format - ora apare dupa ruta (BUCHAREST - CHISINAU 09:00 08:30) =====
  // Prima ora dupa un oras/ruta este departure, a doua este boarding
  const hiskyTablePattern = /(?:BUCHAREST|CHISINAU|BUCURESTI|OTOPENI|[A-Z]{3}\s*-\s*[A-Z]{3})[^0-9]*(\d{2})[:\.](\d{2})\s+(\d{2})[:\.](\d{2})/gi;
  let match1;
  while ((match1 = hiskyTablePattern.exec(singleLineText)) !== null) {
    const depHours = parseInt(match1[1]);
    const depMinutes = parseInt(match1[2]);
    // match1[3] and match1[4] would be boarding time - we skip it
    
    if (depHours >= 0 && depHours <= 23 && depMinutes >= 0 && depMinutes <= 59) {
      const formattedTime = `${depHours.toString().padStart(2, '0')}:${depMinutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match1[0], priority: 1, source: 'hisky-table' });
      console.error('[TIME] Found HiSky table format: ' + formattedTime);
    }
  }

  // ===== STRATEGIA 3: Cauta ora langa "Flight" sau numar de zbor =====
  const flightPattern = /(?:flight|zbor|vol)[:\s]*[A-Z]{2}\s*\d{2,4}[:\s]*(\d{1,2})[:\.](\d{2})/gi;
  let match2;
  while ((match2 = flightPattern.exec(singleLineText)) !== null) {
    const hours = parseInt(match2[1]);
    const minutes = parseInt(match2[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match2[0], priority: 2, source: 'flight-context' });
      console.error('[TIME] Found near flight: ' + formattedTime);
    }
  }

  // ===== STRATEGIA 4: Cauta ora langa "Gate" sau "Boarding" =====
  const boardingPattern = /(?:gate|boarding|poarta)[:\s]*[A-Z0-9]*[:\s]*(\d{1,2})[:\.](\d{2})/gi;
  while ((match2 = boardingPattern.exec(singleLineText)) !== null) {
    const hours = parseInt(match2[1]);
    const minutes = parseInt(match2[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      foundTimes.push({ time: formattedTime, context: match2[0], priority: 3, source: 'boarding-context' });
      console.error('[TIME] Found near boarding/gate: ' + formattedTime);
    }
  }

  // ===== STRATEGIA 5: Cauta toate orele standalone si filtreaza =====
  const timeRegex = /\b(\d{1,2})[:\.](\d{2})\b/g;
  let match3;
  while ((match3 = timeRegex.exec(singleLineText)) !== null) {
    const hours = parseInt(match3[1]);
    const minutes = parseInt(match3[2]);
    
    // Doar ore rezonabile pentru zboruri (05:00 - 23:59)
    if (hours >= 5 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const idx = match3.index;
      const contextBefore = singleLineText.substring(Math.max(0, idx - 40), idx).toLowerCase();
      const contextAfter = singleLineText.substring(idx, Math.min(singleLineText.length, idx + 40)).toLowerCase();
      const context = contextBefore + contextAfter;
      
      // Exclude daca e parte dintr-o data (2026-01-13, 13/01/2026)
      if (/\d{4}[-\/]\d{2}[-\/]/.test(context) || /[-\/]\d{2}[-\/]\d{4}/.test(context)) {
        console.error('[TIME] Skipping ' + formattedTime + ' - part of date');
        continue;
      }
      
      // Exclude daca e ora de sosire (arriving, arrival, arr)
      if (contextBefore.includes('arriving') || contextBefore.includes('arrival') || contextBefore.includes('arr ')) {
        console.error('[TIME] Skipping ' + formattedTime + ' - arrival time');
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
        console.error('[TIME] Found standalone: ' + formattedTime + ' (' + source + ', priority ' + priority + ')');
      }
    }
  }

  // ===== STRATEGIA 6: Format AM/PM explicit =====
  const ampmRegex = /\b(\d{1,2})[:\.](\d{2})\s*(AM|PM)\b/gi;
  let match4;
  while ((match4 = ampmRegex.exec(singleLineText)) !== null) {
    let hours = parseInt(match4[1]);
    const minutes = parseInt(match4[2]);
    const ampm = match4[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const idx = match4.index;
      const contextBefore = singleLineText.substring(Math.max(0, idx - 30), idx).toLowerCase();
      
      // Exclude arrival times
      if (contextBefore.includes('arriving') || contextBefore.includes('arrival')) {
        continue;
      }
      
      let priority = 5;
      if (contextBefore.includes('depart')) priority = 1;
      
      if (!foundTimes.some(t => t.time === formattedTime)) {
        foundTimes.push({ time: formattedTime, context: match4[0], priority, source: 'am-pm-format' });
        console.error('[TIME] Found AM/PM: ' + formattedTime);
      }
    }
  }

  // Sorteaza dupa prioritate si returneaza cea mai buna
  if (foundTimes.length > 0) {
    foundTimes.sort((a, b) => a.priority - b.priority);
    console.error('[TIME] All found times: ' + foundTimes.map(t => t.time + '(' + t.source + ':' + t.priority + ')').join(', '));
    const best = foundTimes[0];
    console.error('[TIME] SELECTED: ' + best.time + ' (source: ' + best.source + ')');
    return best.time;
  }

  console.error('[TIME] WARNING: No departure time found in PDF text!');
  return null;
}


/**
 * Extrage gate number din textul PDF-ului
 * Gate-ul NU se află în BCBP, ci doar în textul vizibil al boarding pass-ului
 */
function extractGateFromPDFText(pdfText: string): string | null {
  if (!pdfText) return null;
  
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Pattern-uri pentru gate
  const gatePatterns = [
    /(?:gate|poarta|gt\.?)[:\s]*([A-Z]?\d{1,3}[A-Z]?)/gi,
    /(?:gate|poarta)[:\s]*([A-Z]{1,2}\d{1,2})/gi,
    /\bgate\s+([A-Z0-9]{1,4})\b/gi,
  ];
  
  for (const pattern of gatePatterns) {
    const match = singleLineText.match(pattern);
    if (match) {
      // Extrage doar valoarea gate-ului
      const gateMatch = match[0].match(/([A-Z]?\d{1,3}[A-Z]?)/i);
      if (gateMatch) {
        const gate = gateMatch[1].toUpperCase();
        console.error(`[GATE] Found: ${gate}`);
        return gate;
      }
    }
  }
  
  return null;
}


/**
 * Extrage boarding group din textul PDF-ului
 * Pentru companii cu prioritate boarding (Aer Lingus, Ryanair Priority, etc.)
 */
function extractBoardingGroupFromPDFText(pdfText: string): string | null {
  if (!pdfText) return null;
  
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Pattern-uri pentru boarding group
  const groupPatterns = [
    /(?:boarding\s*group|group|zona|zone)[:\s]*(\d{1,2}|[A-Z])/gi,
    /(?:priority|prioritate)[:\s]*(\d{1,2}|yes|da)/gi,
    /(?:group)[:\s]*([A-Z0-9]{1,3})/gi,
    /\b(group\s*\d{1,2})\b/gi,
  ];
  
  for (const pattern of groupPatterns) {
    const match = singleLineText.match(pattern);
    if (match) {
      // Extrage valoarea
      const groupMatch = match[0].match(/(\d{1,2}|[A-Z]|yes|da)$/i);
      if (groupMatch) {
        let group = groupMatch[1].toUpperCase();
        // Formatează ca "Group X" dacă e doar un număr
        if (/^\d+$/.test(group)) {
          group = `Group ${group}`;
        }
        console.error(`[BOARDING GROUP] Found: ${group}`);
        return group;
      }
    }
  }
  
  // Verifică pentru priority boarding
  if (/priority\s*boarding/i.test(singleLineText) || /flexi\s*plus/i.test(singleLineText)) {
    console.error(`[BOARDING GROUP] Found: Priority`);
    return 'Priority';
  }
  
  return null;
}


/**
 * Extrage sequence number din textul PDF-ului
 */
function extractSequenceNumberFromPDFText(pdfText: string): string | null {
  if (!pdfText) return null;
  
  const singleLineText = pdfText.replace(/\s+/g, ' ').trim();
  
  // Pattern-uri pentru sequence number
  const seqPatterns = [
    /(?:seq|sequence|secv)[:\s#]*(\d{3,4})/gi,
    /(?:boarding\s*seq)[:\s]*(\d{3,4})/gi,
  ];
  
  for (const pattern of seqPatterns) {
    const match = singleLineText.match(pattern);
    if (match) {
      const seqMatch = match[0].match(/(\d{3,4})/);
      if (seqMatch) {
        console.error(`[SEQUENCE] Found: ${seqMatch[1]}`);
        return seqMatch[1];
      }
    }
  }
  
  return null;
}


// Parser BCBP IATA Resolution 792 - FĂRĂ VALORI DEFAULT
function parseIATABCBP(bcbpData: string) {
  console.log('🔍 Raw BCBP:', bcbpData);
  console.log('📊 BCBP length:', bcbpData.length);
  
  let cleanBCBP = bcbpData.replace(/[\x00-\x1F]/g, '').trim();
  console.log('🧹 Cleaned BCBP:', cleanBCBP);
  
  if (!cleanBCBP.startsWith('M1')) {
    throw new Error('Invalid BCBP format - must start with M1');
  }
  
  // Rezultate - null înseamnă că nu s-a găsit
  let passengerName: string | null = null;
  let pnrCode: string | null = null;
  let origin: string | null = null;
  let destination: string | null = null;
  let carrierCode: string | null = null;
  let flightNumber: string | null = null;
  let compartment: string | null = null;
  let seatNumber: string | null = null;
  let flightDate: string | null = null;
  let julianDate: string | null = null;
  let departureTime: string | null = null;
  
  // === EXTRAGE NUMELE PASAGERULUI ===
  const slashIndex = cleanBCBP.indexOf('/');
  if (slashIndex > 2 && slashIndex < 25) {
    let nameEnd = cleanBCBP.length;
    for (let i = slashIndex + 1; i < Math.min(cleanBCBP.length, 35); i++) {
      if (cleanBCBP[i] === ' ') {
        const afterSpace = cleanBCBP.substring(i + 1, i + 10);
        if (/^[A-Z0-9]{5,}/.test(afterSpace)) {
          nameEnd = i;
          break;
        }
      }
    }
    
    const nameField = cleanBCBP.substring(2, nameEnd).trim();
    if (nameField.includes('/')) {
      const parts = nameField.split('/');
      const lastName = parts[0].trim();
      let firstName = parts[1] ? parts[1].trim().split(' ')[0] : '';
      
      // Curăță titlurile (MR, MRS, MS, MISS, DR, etc.) de la sfârșitul prenumelui
      const titleSuffixes = ['MR', 'MRS', 'MS', 'MISS', 'DR', 'MSTR', 'CHD', 'INF'];
      for (const title of titleSuffixes) {
        if (firstName.endsWith(title)) {
          firstName = firstName.slice(0, -title.length).trim();
          break;
        }
      }
      
      passengerName = firstName ? `${firstName} ${lastName}` : lastName;
    }
    console.log(`✅ Passenger: "${passengerName}"`);
  }
  
  // === EXTRAGE PNR (BOOKING CODE) ===
  // În BCBP, PNR-ul e de obicei după "E" și înainte de rută
  // Exemplu: EAD5J68 OTPRMO... → PNR = AD5J68
  // Format standard BCBP: după numele pasagerului vine E + PNR (6 caractere)
  
  // Prima încercare: caută direct după pattern-ul standard BCBP
  // Pattern: spații + E + 6 caractere alfanumerice + spațiu
  const directPnrMatch = cleanBCBP.match(/\s+E([A-Z][A-Z0-9]{5})\s/);
  if (directPnrMatch && directPnrMatch[1]) {
    const candidate = directPnrMatch[1];
    // PNR valid: 6 caractere, nu e aeroport, nu începe cu carrier cunoscut
    if (candidate.length === 6 && !isValidAirport(candidate.substring(0, 3))) {
      pnrCode = candidate;
      console.log(`✅ PNR (direct): "${pnrCode}"`);
    }
  }
  
  // Fallback patterns dacă primul nu a funcționat
  if (!pnrCode) {
    const pnrPatterns = [
      /E([A-Z][A-Z0-9]{5})\s/,              // EAD5J68 spațiu
      /E([A-Z0-9]{6})\s/,                   // E + 6 caractere + spațiu
      /\s([A-Z][A-Z0-9]{5})\s+[A-Z]{6}/,    // PNR înainte de rută (6 litere = OTPRMO)
    ];
    
    for (const pattern of pnrPatterns) {
      const match = cleanBCBP.match(pattern);
      if (match && match[1]) {
        const candidate = match[1];
        // Validare: PNR trebuie să aibă 6 caractere și să nu fie aeroport
        if (candidate.length === 6 && !isValidAirport(candidate.substring(0, 3))) {
          pnrCode = candidate;
          console.log(`✅ PNR (pattern): "${pnrCode}"`);
          break;
        }
      }
    }
  }
  
  // Ultimul fallback: caută orice E + 6 caractere alfanumerice
  if (!pnrCode) {
    const fallbackMatch = cleanBCBP.match(/E([A-Z][A-Z0-9]{5})/);
    if (fallbackMatch && fallbackMatch[1]) {
      const candidate = fallbackMatch[1];
      if (candidate.length === 6) {
        pnrCode = candidate;
        console.log(`✅ PNR (fallback): "${pnrCode}"`);
      }
    }
  }
  
  // === EXTRAGE AEROPORTURI + CARRIER + FLIGHT ===
  // IMPORTANT: Unele companii (easyJet, Ryanair) folosesc coduri ICAO de 3 caractere în BCBP
  // Exemplu easyJet: ORYBEREJU4873 = ORY + BER + EJU + 4873
  
  const flightPatterns = [
    // Pattern pentru ICAO 3-char carrier: ORYBEREJU4873 (origin+dest+3char_carrier+flight)
    /([A-Z]{3})([A-Z]{3})([A-Z]{3})(\d{3,4})/,
    // Pattern standard 2-char carrier cu spațiu
    /([A-Z]{3})([A-Z]{3})([A-Z0-9]{2})\s*(\d{3,4})/,
    /([A-Z]{3})([A-Z]{3})\s+([A-Z0-9]{2})\s+(\d{3,4})/,
    /E([A-Z]{2})(\d{4})\s+([A-Z]{3})([A-Z]{3})/,
    // Pattern pentru format compact 2-char: ORYBERU24873
    /([A-Z]{3})([A-Z]{3})([A-Z]{2})(\d{4})/,
  ];
  
  for (const pattern of flightPatterns) {
    const match = cleanBCBP.match(pattern);
    if (match) {
      if (pattern.source.startsWith('E\\(')) {
        carrierCode = match[1];
        flightNumber = match[2];
        origin = match[3];
        destination = match[4];
      } else {
        origin = match[1];
        destination = match[2];
        carrierCode = match[3];
        flightNumber = match[4];
      }
      
      if (!isValidAirport(origin!) || !isValidAirport(destination!)) {
        console.log(`⚠️ Invalid airports: ${origin} → ${destination}`);
        origin = null;
        destination = null;
        carrierCode = null;
        flightNumber = null;
        continue;
      }
      
      // Verifică carrier-ul să fie valid (2 sau 3 caractere alfanumerice)
      // 3 caractere = ICAO code (EJU, WZZ, RYR)
      // 2 caractere = IATA code (U2, W6, FR)
      if (carrierCode && !/^[A-Z0-9]{2,3}$/.test(carrierCode)) {
        console.log(`⚠️ Invalid carrier: ${carrierCode}`);
        origin = null;
        destination = null;
        carrierCode = null;
        flightNumber = null;
        continue;
      }
      
      // Verifică dacă carrier-ul de 3 caractere este un ICAO cunoscut
      if (carrierCode && carrierCode.length === 3) {
        if (KNOWN_CARRIERS[carrierCode]) {
          console.log(`✅ ICAO carrier detected: ${carrierCode} = ${KNOWN_CARRIERS[carrierCode]}`);
        } else {
          // Dacă nu e ICAO cunoscut, ar putea fi un aeroport interpretat greșit
          // Verifică dacă e aeroport valid
          if (isValidAirport(carrierCode)) {
            console.log(`⚠️ 3-char code ${carrierCode} is an airport, not carrier - skipping pattern`);
            origin = null;
            destination = null;
            carrierCode = null;
            flightNumber = null;
            continue;
          }
        }
      }
      
      console.log(`✅ Flight: ${origin}→${destination} ${carrierCode}${flightNumber}`);
      break;
    }
  }
  
  // Fallback: caută aeroporturi valide consecutive în string
  if (!origin || !destination) {
    console.log('🔄 Searching for valid airports...');
    
    // Caută toate secvențele de 3 litere
    const allThreeLetters = cleanBCBP.match(/[A-Z]{3}/g) || [];
    const validAirports = allThreeLetters.filter(code => isValidAirport(code));
    console.log(`🔍 Valid airports found: ${validAirports.join(', ')}`);
    
    // Caută perechi consecutive de aeroporturi valide
    if (validAirports.length >= 2) {
      // Prima încercare: caută două aeroporturi consecutive în string-ul original
      for (let i = 0; i < cleanBCBP.length - 5; i++) {
        const potential = cleanBCBP.substring(i, i + 6);
        const first = potential.substring(0, 3);
        const second = potential.substring(3, 6);
        
        if (isValidAirport(first) && isValidAirport(second)) {
          origin = first;
          destination = second;
          console.log(`✅ Airport pair (consecutive): ${origin}→${destination}`);
          break;
        }
      }
    }
    
    // A doua încercare: folosește primele două aeroporturi valide găsite
    if (!origin && validAirports.length >= 2) {
      origin = validAirports[0];
      destination = validAirports[1];
      console.log(`✅ Airport pair (first two valid): ${origin}→${destination}`);
    }
  }
  
  // Fallback: caută carrier cunoscut
  if (!carrierCode || !flightNumber) {
    console.log('🔄 Searching for known carrier...');
    for (const carrier of Object.keys(KNOWN_CARRIERS)) {
      const carrierPattern = new RegExp(`${carrier}\\s*(\\d{3,4})`);
      const match = cleanBCBP.match(carrierPattern);
      if (match) {
        carrierCode = carrier;
        flightNumber = match[1];
        console.log(`✅ Carrier: ${carrierCode}${flightNumber}`);
        break;
      }
    }
  }
  
  // === EXTRAGE DATA ZBORULUI ===
  // Pattern 1: Caută data în format DDMMMYY sau DDMMM (ex: 02JAN26, 02JAN)
  const datePatterns = [
    /(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2,4})/i,
    /(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = cleanBCBP.match(pattern);
    if (match) {
      const day = match[1];
      const month = match[2].toUpperCase();
      let year = match[3] || new Date().getFullYear().toString().slice(-2);
      
      // Convertește anul la 4 cifre
      if (year.length === 2) {
        year = (parseInt(year) > 50 ? '19' : '20') + year;
      }
      
      const monthMap: Record<string, string> = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      
      flightDate = `${year}-${monthMap[month]}-${day}`;
      console.log(`✅ Flight Date: ${flightDate} (from ${match[0]})`);
      break;
    }
  }
  
  // Pattern 2: Caută Julian date (3 cifre = ziua din an) în BCBP standard
  // Format BCBP: ...ORIGDESTCARRIER FLIGHTNUM JULIANDATE CLASS...
  // Exemplu: OTPRMOH4 0482 002Y... → Julian 002 = 2 ianuarie
  // Exemplu real: "0482 002Y009E0066" → flight=0482, julian=002, class=Y
  if (!flightDate) {
    console.log('🔄 Searching for Julian date in BCBP...');
    
    const julianPatterns = [
      // Pattern: spațiu + 3 cifre + clasă (Y/C/F/J/W/S/B) - cel mai comun
      /\s(\d{3})([YCFJWSB])\d{3}/,
      // Pattern: flight number (3-4 cifre) spațiu julian (3 cifre) clasă
      /\d{3,4}\s+(\d{3})([YCFJWSB])/,
      // Pattern: după carrier și flight
      /[A-Z]{2}\s*\d{3,4}\s*(\d{3})([YCFJWSB])/,
      // Pattern generic: 3 cifre urmate de clasă
      /(\d{3})([YCFJWSB])\d{3}[A-K]/,
    ];
    
    for (const pattern of julianPatterns) {
      const match = cleanBCBP.match(pattern);
      if (match && match[1]) {
        const julianDay = parseInt(match[1]);
        const classCode = match[2];
        console.log(`🔍 Found potential Julian: ${match[1]} with class ${classCode}`);
        
        // Validare: ziua trebuie să fie între 1 și 366
        if (julianDay >= 1 && julianDay <= 366) {
          julianDate = match[1];
          compartment = classCode; // Salvează și clasa de călătorie
          
          // Convertește Julian date la dată normală
          // Folosește anul curent, dar dacă ziua e în trecut, folosește anul viitor
          let year = new Date().getFullYear();
          const today = new Date();
          const todayJulian = Math.floor((today.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          
          // Dacă ziua din BCBP e cu mult în urmă (>30 zile), probabil e anul viitor
          if (julianDay < todayJulian - 30) {
            year = year + 1;
          }
          
          // Convertește Julian day la dată - folosește UTC pentru a evita probleme de timezone
          const date = new Date(Date.UTC(year, 0, julianDay));
          flightDate = date.toISOString().split('T')[0];
          console.log(`✅ Flight Date: ${flightDate} (from Julian ${julianDate}, year ${year}, class ${classCode})`);
          break;
        }
      }
    }
    
    // Fallback: caută manual în string-ul BCBP pentru pattern "NNN[YCFJWSB]"
    if (!flightDate) {
      const manualMatch = cleanBCBP.match(/(\d{3})([YCFJWSB])(\d{3})([A-K])/);
      if (manualMatch) {
        const julianDay = parseInt(manualMatch[1]);
        if (julianDay >= 1 && julianDay <= 366) {
          julianDate = manualMatch[1];
          compartment = manualMatch[2];
          
          let year = new Date().getFullYear();
          const today = new Date();
          const todayJulian = Math.floor((today.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          
          if (julianDay < todayJulian - 30) {
            year = year + 1;
          }
          
          // Convertește Julian day la dată - folosește UTC pentru a evita probleme de timezone
          const date = new Date(Date.UTC(year, 0, julianDay));
          flightDate = date.toISOString().split('T')[0];
          console.log(`✅ Flight Date (manual): ${flightDate} (from Julian ${julianDate})`);
        }
      }
    }
  }
  
  // === EXTRAGE LOC ===
  const seatPatterns = [
    /(\d{3})([YCF])(\d{3})([A-K])/,
    /(\d{3})([YCF])(\d{2})([A-K])/,
    /\s([YCF])(\d{3})([A-K])/,
    /\s([YCF])(\d{2})([A-K])/,
    /\s(\d{1,3})([A-K])\s/,
    /(\d{1,3})([A-K])0/,
  ];
  
  for (const pattern of seatPatterns) {
    const match = cleanBCBP.match(pattern);
    if (match) {
      if (match.length === 5) {
        compartment = match[2];
        const seatNum = match[3].replace(/^0+/, '');
        if (seatNum) seatNumber = seatNum + match[4];
      } else if (match.length === 4) {
        compartment = match[1];
        const seatNum = match[2].replace(/^0+/, '');
        if (seatNum) seatNumber = seatNum + match[3];
      } else if (match.length === 3) {
        const seatNum = match[1].replace(/^0+/, '');
        if (seatNum) seatNumber = seatNum + match[2];
      }
      if (seatNumber) {
        console.log(`✅ Seat: ${seatNumber} (${compartment || '?'})`);
        break;
      }
    }
  }
  
  // === EXTRAGE ORA DE PLECARE ===
  // Caută pattern-uri de timp în format HH:MM sau H:MM
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(?:AM|PM)?/gi,  // 9:00, 09:00, 9:00 AM
    /(\d{2})(\d{2})\s*(?:hrs?|h)/gi,      // 0900hrs, 0900h
    /(?:departure|plecare|dep)[:\s]*(\d{1,2}):(\d{2})/gi,  // Departure: 09:00
  ];
  
  for (const pattern of timePatterns) {
    const matches = cleanBCBP.matchAll(pattern);
    for (const match of matches) {
      let hours = parseInt(match[1]);
      let minutes = parseInt(match[2]);
      
      // Validare: ora trebuie să fie între 0-23, minute între 0-59
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        // Formatează ca HH:MM
        departureTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log(`✅ Departure Time: ${departureTime}`);
        break;
      }
    }
    if (departureTime) break;
  }
  
  // Log rezultate
  console.log('📊 Parsing result:');
  console.log(`   Passenger: ${passengerName || 'NOT FOUND'}`);
  console.log(`   PNR: ${pnrCode || 'NOT FOUND'}`);
  console.log(`   Flight: ${carrierCode || '??'}${flightNumber || '????'}`);
  console.log(`   Route: ${origin || '???'} → ${destination || '???'}`);
  console.log(`   Date: ${flightDate || 'NOT FOUND'}`);
  console.log(`   Time: ${departureTime || 'NOT FOUND'}`);
  console.log(`   Seat: ${seatNumber || 'NOT FOUND'}`);
  
  return {
    passengerName,
    flightNumber,
    carrierCode,
    origin,
    destination,
    seatNumber,
    confirmationCode: pnrCode,
    compartment,
    flightDate,
    julianDate,
    departureTime,
    raw: cleanBCBP,
    // Gate și boarding group se extrag din PDF text, nu din BCBP
    gate: null as string | null,
    boardingGroup: null as string | null,
    sequenceNumber: null as string | null
  };
}


// Extrage BCBP din PDF folosind procesorul modern
async function extractBCBPFromPDF(pdfBuffer: Buffer): Promise<string | { airlineSpecific: true; airline: string; flightData: any; multiPassenger?: boolean; pdfText?: string } | { bcbp: string; pdfText: string }> {
  try {
    console.log('🔄 Starting PDF processing...');
    
    let ModernPDFProcessor;
    try {
      // @ts-ignore - Dynamic require for optional module
      const processorModule = require('../../../../lib/modern-pdf-processor');
      ModernPDFProcessor = processorModule.ModernPDFProcessor;
    } catch (importError) {
      console.error('❌ Failed to import PDF processor:', importError);
      throw new Error('PDF processor not available');
    }
    
    const processor = new ModernPDFProcessor();
    const result = await processor.processPDF(pdfBuffer);
    
    if (result.success && result.bcbp) {
      console.log('✅ BCBP found:', result.bcbp.substring(0, 50) + '...');
      if (result.pdfText) {
        console.log('📄 PDF text available for time extraction');
      }
      // Returnează obiect cu BCBP și textul PDF pentru extragerea orei
      return { bcbp: result.bcbp, pdfText: result.pdfText || '' };
    }
    
    if (result.success && result.airlineSpecific && result.flightData) {
      console.log(`✅ Airline-specific: ${result.airline}`);
      return {
        airlineSpecific: true,
        airline: result.airline,
        flightData: result.flightData,
        multiPassenger: result.multiPassenger || false,
        pdfText: result.pdfText || ''
      };
    }
    
    console.log('❌ PDF processing failed:', result.error);
    throw new Error(result.error || 'No BCBP found in PDF');
    
  } catch (error) {
    console.error('💥 PDF processor error:', error);
    throw new Error(`PDF processing failed: ${(error as Error).message || error}`);
  }
}

/**
 * Construiește obiectul boardingAndSeatingInfo pentru Google Wallet
 * - Free Seating: nu include seatNumber sau pune undefined
 * - Cu loc alocat: include seatNumber
 * - Cu prioritate: include boardingGroup
 * - Cu gate: include în origin
 */
function buildBoardingAndSeatingInfo(flightData: any): any {
  // Verifică dacă avem informații de seating
  const hasSeat = flightData.seatNumber && 
                  flightData.seatNumber.trim() !== '' && 
                  flightData.seatNumber.toUpperCase() !== 'FREE' &&
                  flightData.seatNumber.toUpperCase() !== 'OPEN' &&
                  !flightData.seatNumber.toUpperCase().includes('FREE');
  
  const hasBoardingGroup = flightData.boardingGroup && flightData.boardingGroup.trim() !== '';
  const hasSequenceNumber = flightData.sequenceNumber && flightData.sequenceNumber.trim() !== '';
  
  // Dacă nu avem nici seat, nici boarding group, returnăm undefined
  if (!hasSeat && !hasBoardingGroup && !hasSequenceNumber) {
    return undefined;
  }
  
  const info: any = {};
  
  // Adaugă seat number doar dacă există și nu e Free Seating
  if (hasSeat) {
    info.seatNumber = flightData.seatNumber.toUpperCase();
    
    // Determină clasa de călătorie
    const compartment = flightData.compartment?.toUpperCase() || 'Y';
    if (compartment === 'F' || compartment === 'P' || compartment === 'A') {
      info.seatClass = 'FIRST';
    } else if (compartment === 'J' || compartment === 'C' || compartment === 'D' || compartment === 'I') {
      info.seatClass = 'BUSINESS';
    } else if (compartment === 'W' || compartment === 'S') {
      info.seatClass = 'PREMIUM_ECONOMY';
    } else {
      info.seatClass = 'ECONOMY';
    }
  }
  
  // Adaugă boarding group dacă există (pentru bilete cu prioritate)
  if (hasBoardingGroup) {
    info.boardingGroup = flightData.boardingGroup;
  }
  
  // Adaugă sequence number dacă există
  if (hasSequenceNumber) {
    info.sequenceNumber = flightData.sequenceNumber;
  }
  
  return info;
}

// Generează Google Wallet Link
function generateGoogleWalletLink(flightData: any): string | null {
  // Validare - nu genera link dacă lipsesc date esențiale
  if (!flightData.origin || !flightData.destination || !flightData.carrierCode || !flightData.flightNumber) {
    console.log('⚠️ Cannot generate wallet link - missing essential data');
    return null;
  }
  
  // Verifică dacă credențialele Google Wallet sunt configurate
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    console.log('⚠️ Google Wallet credentials not configured - skipping wallet link generation');
    return null;
  }
  
  try {
    const issuerId = '3388000000023061835';
    const timestamp = Date.now();
    const now = Math.floor(timestamp / 1000);
    
    const airlineName = KNOWN_CARRIERS[flightData.carrierCode] || flightData.carrierCode;
    
    // Folosește data extrasă sau data curentă + 7 zile ca fallback
    let departureDate = flightData.flightDate;
    if (!departureDate) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      departureDate = futureDate.toISOString().split('T')[0];
    }
    
    // Folosește ora extrasă din PDF sau 10:00 ca fallback
    const departureTimeStr = flightData.departureTime || '10:00';
    
    // Calculează ora de sosire (adaugă 2.5 ore ca estimare)
    const [depHours, depMinutes] = departureTimeStr.split(':').map(Number);
    const arrivalHours = (depHours + 2) % 24;
    const arrivalMinutes = (depMinutes + 30) % 60;
    const arrivalTimeStr = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
    
    console.log(`🕐 Using departure time: ${departureTimeStr}, arrival time: ${arrivalTimeStr}`);
    
    const payload = {
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: now,
      exp: now + 3600,
      payload: {
        flightClasses: [{
          id: `${issuerId}.CLASS_${timestamp}`,
          issuerName: "EMA PLUS SOLUTION SRL",
          reviewStatus: "UNDER_REVIEW",
          transitType: "AIR",
          flightHeader: {
            carrier: {
              carrierIataCode: flightData.carrierCode,
              airlineName: { defaultValue: { language: "en-US", value: airlineName } }
            },
            flightNumber: flightData.flightNumber
          },
          origin: { 
            airportIataCode: flightData.origin, 
            terminal: flightData.terminal || undefined,
            gate: flightData.gate || undefined
          },
          destination: { airportIataCode: flightData.destination, terminal: undefined },
          localScheduledDepartureDateTime: `${departureDate}T${departureTimeStr}:00`,
          localScheduledArrivalDateTime: `${departureDate}T${arrivalTimeStr}:00`,
          boardingAndSeatingPolicy: {
            boardingPolicy: "ZONE_BASED",
            seatClassPolicy: "CABIN_BASED"
          }
        }],
        flightObjects: [{
          id: `${issuerId}.OBJ_${timestamp}`,
          classId: `${issuerId}.CLASS_${timestamp}`,
          state: "ACTIVE",
          passengerName: flightData.passengerName || "Passenger",
          reservationInfo: { confirmationCode: flightData.confirmationCode || "XXXXXX" },
          flightNumber: flightData.flightNumber,
          boardingAndSeatingInfo: buildBoardingAndSeatingInfo(flightData),
          barcode: { type: "QR_CODE", value: flightData.raw || "", alternateText: `${flightData.carrierCode}${flightData.flightNumber}` }
        }]
      }
    };
    
    const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  } catch (error) {
    console.error('❌ Error generating Google Wallet link:', error);
    return null;
  }
}


// API endpoint principal
export async function POST(request: NextRequest) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    console.log('🚀 Boarding Pass API Request received');
    
    let formData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      return NextResponse.json({ 
        success: false,
        error: 'Eroare la parsarea datelor. Verifică că fișierul PDF este valid.'
      }, { status: 400, headers });
    }

    const file = formData.get('pdf') as File;
    const manualBCBP = formData.get('bcbp') as string;
    
    let bcbpData: string = '';
    let pdfText: string = '';
    
    if (file) {
      console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);
      
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          success: false,
          error: 'Fișierul PDF este prea mare. Dimensiunea maximă permisă este 10MB.' 
        }, { status: 400, headers });
      }
      
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ 
          success: false,
          error: 'Tipul fișierului nu este valid. Doar fișiere PDF sunt acceptate.' 
        }, { status: 400, headers });
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const extractionResult = await extractBCBPFromPDF(buffer);
      
      // Handle airline-specific data
      if (typeof extractionResult === 'object' && 'airlineSpecific' in extractionResult && extractionResult.airlineSpecific) {
        console.log(`✅ Airline-specific data: ${extractionResult.airline}`);
        
        // Extrage ora din textul PDF dacă este disponibil
        if (extractionResult.pdfText && extractionResult.flightData) {
          const extractedTime = extractDepartureTimeFromPDFText(extractionResult.pdfText);
          if (extractedTime) {
            extractionResult.flightData.departureTime = extractedTime;
            console.log(`🕐 Departure time extracted from PDF text: ${extractedTime}`);
          }
        }
        
        if (extractionResult.multiPassenger && Array.isArray(extractionResult.flightData)) {
          const passengersWithWallet = extractionResult.flightData.map((passenger: any) => ({
            ...passenger,
            walletLink: generateGoogleWalletLink(passenger)
          }));
          
          return NextResponse.json({
            success: true,
            multiPassenger: true,
            airline: extractionResult.airline,
            passengers: passengersWithWallet,
            processingMethod: `${extractionResult.airline.toLowerCase()}-ocr-parser`
          }, { headers });
        }
        
        const flightData = extractionResult.flightData;
        const walletLink = generateGoogleWalletLink(flightData);
        
        return NextResponse.json({
          success: true,
          flightData,
          walletLink,
          bcbpData: flightData.raw || `${extractionResult.airline}-OCR`,
          airline: extractionResult.airline,
          processingMethod: `${extractionResult.airline.toLowerCase()}-ocr-parser`
        }, { headers });
      }
      
      // Handle new format with bcbp and pdfText
      let bcbpDataLocal: string;
      let pdfTextLocal: string = '';
      
      if (typeof extractionResult === 'object' && 'bcbp' in extractionResult) {
        bcbpDataLocal = extractionResult.bcbp;
        pdfTextLocal = extractionResult.pdfText || '';
      } else {
        // Fallback pentru string simplu (compatibilitate)
        bcbpDataLocal = extractionResult as string;
      }
      
      // FALLBACK: Dacă pdfText e gol, extrage direct din PDF folosind pdfjs-dist legacy în child process
      if (!pdfTextLocal && buffer) {
        try {
          const { execSync } = require('child_process');
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          
          // Save buffer to temp file
          const tempPdfPath = path.join(os.tmpdir(), `bp_${Date.now()}.pdf`);
          fs.writeFileSync(tempPdfPath, buffer);
          
          // Get the project root for node_modules
          const projectRoot = process.cwd();
          
          // Create extraction script using pdfjs-dist legacy build (CommonJS compatible)
          const extractScript = `
            const fs = require('fs');
            const pdfjsLib = require('${projectRoot.replace(/\\/g, '/')}/node_modules/pdfjs-dist/legacy/build/pdf.js');
            
            // Disable worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            
            async function extractText() {
              try {
                const buffer = fs.readFileSync('${tempPdfPath.replace(/\\/g, '/')}');
                const uint8Array = new Uint8Array(buffer);
                
                const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
                const pdfDoc = await loadingTask.promise;
                
                let fullText = '';
                for (let i = 1; i <= pdfDoc.numPages; i++) {
                  const page = await pdfDoc.getPage(i);
                  const textContent = await page.getTextContent();
                  const pageText = textContent.items.map(item => item.str).join(' ');
                  fullText += pageText + ' ';
                }
                
                process.stdout.write(fullText.trim());
              } catch (err) {
                process.stderr.write('ERROR:' + err.message);
                process.exit(1);
              }
            }
            
            extractText();
          `;
          
          const scriptPath = path.join(os.tmpdir(), `extract_${Date.now()}.js`);
          fs.writeFileSync(scriptPath, extractScript);
          
          // Run extraction in separate process
          const result = execSync(`node "${scriptPath}"`, { 
            encoding: 'utf8',
            timeout: 15000,
            maxBuffer: 5 * 1024 * 1024,
            cwd: projectRoot
          });
          
          // Cleanup
          try { fs.unlinkSync(tempPdfPath); } catch (e) {}
          try { fs.unlinkSync(scriptPath); } catch (e) {}
          
          if (result) {
            pdfTextLocal = result.trim();
            console.error('[FALLBACK] PDF text extracted via pdfjs-dist legacy:', pdfTextLocal.length, 'chars');
          }
        } catch (pdfError: any) {
          console.error('[FALLBACK] PDF text extraction failed:', pdfError.message || pdfError);
        }
      }
      
      bcbpData = bcbpDataLocal;
      pdfText = pdfTextLocal;
      
    } else if (manualBCBP) {
      bcbpData = manualBCBP.trim();
      console.log(`Manual BCBP: ${bcbpData.substring(0, 50)}...`);
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Nu a fost furnizat niciun PDF sau cod BCBP.' 
      }, { status: 400, headers });
    }
    
    // Parse BCBP
    const flightData = parseIATABCBP(bcbpData);
    
    // Debug info for time extraction
    let timeExtractionDebug: any = {
      pdfTextLength: pdfText?.length || 0,
      pdfTextPreview: pdfText ? pdfText.substring(0, 500) : 'NO PDF TEXT',
      bcbpDepartureTime: flightData.departureTime || null,
      extractedFromPdfText: null
    };
    
    // Extrage ora de plecare din textul PDF dacă nu a fost găsită în BCBP
    if (!flightData.departureTime && pdfText) {
      const extractedTime = extractDepartureTimeFromPDFText(pdfText);
      timeExtractionDebug.extractedFromPdfText = extractedTime;
      if (extractedTime) {
        flightData.departureTime = extractedTime;
      }
    }
    
    // Extrage gate, boarding group și sequence number din PDF text
    if (pdfText) {
      // Gate
      if (!flightData.gate) {
        flightData.gate = extractGateFromPDFText(pdfText);
      }
      // Boarding group (pentru bilete cu prioritate)
      if (!flightData.boardingGroup) {
        flightData.boardingGroup = extractBoardingGroupFromPDFText(pdfText);
      }
      // Sequence number
      if (!flightData.sequenceNumber) {
        flightData.sequenceNumber = extractSequenceNumberFromPDFText(pdfText);
      }
    }
    
    // Validare - returnează erori specifice pentru câmpurile lipsă
    const missingFields: string[] = [];
    if (!flightData.origin) missingFields.push('aeroport plecare');
    if (!flightData.destination) missingFields.push('aeroport sosire');
    if (!flightData.carrierCode) missingFields.push('companie aeriană');
    if (!flightData.flightNumber) missingFields.push('număr zbor');
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Nu s-au putut extrage următoarele date din boarding pass: ${missingFields.join(', ')}. Verifică că PDF-ul conține un barcode valid și clar vizibil.`,
        partialData: flightData,
        bcbpData
      }, { status: 400, headers });
    }
    
    // Generate wallet link
    const walletLink = generateGoogleWalletLink(flightData);
    
    // Validare aeroporturi
    const validAirports = ['OTP', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO'];
    const validation = {
      originValid: validAirports.includes(flightData.origin!),
      destValid: validAirports.includes(flightData.destination!),
      domestic: validAirports.includes(flightData.origin!) && validAirports.includes(flightData.destination!)
    };
    
    return NextResponse.json({
      success: true,
      flightData,
      walletLink,
      bcbpData,
      validation,
      processingMethod: 'bcbp-parser',
      debug: {
        timeExtraction: timeExtractionDebug
      }
    }, { headers });
    
  } catch (error: any) {
    console.error('Processing error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'A apărut o eroare la procesarea boarding pass-ului.',
      processingMethod: 'error'
    }, { status: 500, headers });
  }
}
