// Test script pentru BCBP parser
// Testează extragerea PNR și Julian date din BCBP

const bcbpData = "M1GONTA/IONELMR       EAD5J68 OTPRMOH4 0482 002Y009E0066 15A>5180WW6002BH4              2A132           0H4                         STXB23029627881ETX";

console.log('🔍 Testing BCBP Parser');
console.log('📊 Input BCBP:', bcbpData);
console.log('');

// Simulează parseIATABCBP
let cleanBCBP = bcbpData.replace(/[\x00-\x1F]/g, '').trim();

// Test PNR extraction
console.log('=== PNR EXTRACTION ===');
const directPnrMatch = cleanBCBP.match(/\s+E([A-Z][A-Z0-9]{5})\s/);
console.log('Direct PNR match:', directPnrMatch ? directPnrMatch[1] : 'NOT FOUND');

const fallbackPnrMatch = cleanBCBP.match(/E([A-Z][A-Z0-9]{5})/);
console.log('Fallback PNR match:', fallbackPnrMatch ? fallbackPnrMatch[1] : 'NOT FOUND');

// Test Julian date extraction
console.log('');
console.log('=== JULIAN DATE EXTRACTION ===');

// Pattern 1: spațiu + 3 cifre + clasă
const pattern1 = cleanBCBP.match(/\s(\d{3})([YCFJWSB])\d{3}/);
console.log('Pattern 1 (space+3digits+class):', pattern1 ? `Julian=${pattern1[1]}, Class=${pattern1[2]}` : 'NOT FOUND');

// Pattern 2: flight number + space + julian + class
const pattern2 = cleanBCBP.match(/\d{3,4}\s+(\d{3})([YCFJWSB])/);
console.log('Pattern 2 (flight+space+julian):', pattern2 ? `Julian=${pattern2[1]}, Class=${pattern2[2]}` : 'NOT FOUND');

// Pattern 3: manual search
const pattern3 = cleanBCBP.match(/(\d{3})([YCFJWSB])(\d{3})([A-K])/);
console.log('Pattern 3 (manual):', pattern3 ? `Julian=${pattern3[1]}, Class=${pattern3[2]}, Seat=${pattern3[3]}${pattern3[4]}` : 'NOT FOUND');

// Convert Julian to date using UTC (same as the fix in route.ts)
if (pattern1 || pattern2 || pattern3) {
  const julianDay = parseInt((pattern1 || pattern2 || pattern3)[1]);
  const year = 2026; // Current year from context
  const date = new Date(Date.UTC(year, 0, julianDay));
  console.log('');
  console.log(`✅ Julian ${julianDay} = ${date.toISOString().split('T')[0]}`);
}

// Expected results
console.log('');
console.log('=== EXPECTED RESULTS ===');
console.log('PNR: AD5J68');
console.log('Julian: 002 = 2026-01-02 (January 2nd)');
console.log('Class: Y (Economy)');
