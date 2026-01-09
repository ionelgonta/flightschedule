import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Service account pentru Google Wallet - credentials from environment variables
// IMPORTANT: Set GOOGLE_WALLET_CLIENT_EMAIL and GOOGLE_WALLET_PRIVATE_KEY in .env.local
const serviceAccount = {
  client_email: process.env.GOOGLE_WALLET_CLIENT_EMAIL || '',
  private_key: (process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Lista completă de companii aeriene cunoscute
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
  'UC': 'LAN Chile'
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
      const firstName = parts[1] ? parts[1].trim().split(' ')[0] : '';
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
  const flightPatterns = [
    /([A-Z]{3})([A-Z]{3})([A-Z0-9]{2})\s*(\d{3,4})/,
    /([A-Z]{3})([A-Z]{3})\s+([A-Z0-9]{2})\s+(\d{3,4})/,
    /E([A-Z]{2})(\d{4})\s+([A-Z]{3})([A-Z]{3})/,
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
      
      console.log(`✅ Flight: ${origin}→${destination} ${carrierCode}${flightNumber}`);
      break;
    }
  }
  
  // Fallback: caută aeroporturi valide
  if (!origin || !destination) {
    console.log('🔄 Searching for valid airports...');
    const allThreeLetters = cleanBCBP.match(/[A-Z]{3}/g) || [];
    const validAirports = allThreeLetters.filter(code => isValidAirport(code));
    console.log(`🔍 Valid airports found: ${validAirports.join(', ')}`);
    
    if (validAirports.length >= 2) {
      for (let i = 0; i < allThreeLetters.length - 1; i++) {
        if (isValidAirport(allThreeLetters[i]) && isValidAirport(allThreeLetters[i + 1])) {
          origin = allThreeLetters[i];
          destination = allThreeLetters[i + 1];
          console.log(`✅ Airport pair: ${origin}→${destination}`);
          break;
        }
      }
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
  
  // Log rezultate
  console.log('📊 Parsing result:');
  console.log(`   Passenger: ${passengerName || 'NOT FOUND'}`);
  console.log(`   PNR: ${pnrCode || 'NOT FOUND'}`);
  console.log(`   Flight: ${carrierCode || '??'}${flightNumber || '????'}`);
  console.log(`   Route: ${origin || '???'} → ${destination || '???'}`);
  console.log(`   Date: ${flightDate || 'NOT FOUND'}`);
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
    raw: cleanBCBP
  };
}


// Extrage BCBP din PDF folosind procesorul modern
async function extractBCBPFromPDF(pdfBuffer: Buffer): Promise<string | { airlineSpecific: true; airline: string; flightData: any; multiPassenger?: boolean }> {
  try {
    console.log('🔄 Starting PDF processing...');
    
    let ModernPDFProcessor;
    try {
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
      return result.bcbp;
    }
    
    if (result.success && result.airlineSpecific && result.flightData) {
      console.log(`✅ Airline-specific: ${result.airline}`);
      return {
        airlineSpecific: true,
        airline: result.airline,
        flightData: result.flightData,
        multiPassenger: result.multiPassenger || false
      };
    }
    
    console.log('❌ PDF processing failed:', result.error);
    throw new Error(result.error || 'No BCBP found in PDF');
    
  } catch (error) {
    console.error('💥 PDF processor error:', error);
    throw new Error(`PDF processing failed: ${(error as Error).message || error}`);
  }
}

// Generează Google Wallet Link
function generateGoogleWalletLink(flightData: any): string | null {
  // Validare - nu genera link dacă lipsesc date esențiale
  if (!flightData.origin || !flightData.destination || !flightData.carrierCode || !flightData.flightNumber) {
    console.log('⚠️ Cannot generate wallet link - missing essential data');
    return null;
  }
  
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
        origin: { airportIataCode: flightData.origin, terminal: "1" },
        destination: { airportIataCode: flightData.destination, terminal: "1" },
        localScheduledDepartureDateTime: `${departureDate}T10:00:00`,
        localScheduledArrivalDateTime: `${departureDate}T12:30:00`
      }],
      flightObjects: [{
        id: `${issuerId}.OBJ_${timestamp}`,
        classId: `${issuerId}.CLASS_${timestamp}`,
        state: "ACTIVE",
        passengerName: flightData.passengerName || "Passenger",
        reservationInfo: { confirmationCode: flightData.confirmationCode || "XXXXXX" },
        flightNumber: flightData.flightNumber,
        seatInfo: flightData.seatNumber ? { seatNumber: flightData.seatNumber, seatClass: flightData.compartment || "Y" } : undefined,
        barcode: { type: "QR_CODE", value: flightData.raw || "", alternateText: `${flightData.carrierCode}${flightData.flightNumber}` }
      }]
    }
  };
  
  const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
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
    
    let bcbpData: string;
    
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
      if (typeof extractionResult === 'object' && extractionResult.airlineSpecific) {
        console.log(`✅ Airline-specific data: ${extractionResult.airline}`);
        
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
      
      bcbpData = extractionResult as string;
      console.log(`BCBP extracted: ${bcbpData.substring(0, 50)}...`);
      
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
      processingMethod: 'bcbp-parser'
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
