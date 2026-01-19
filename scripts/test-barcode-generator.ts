/**
 * Test script pentru Universal Barcode Generator
 * 
 * Testează generarea de barcode-uri pentru diferite tipuri de date:
 * - PDF417 pentru BCBP (Ryanair, Lufthansa, TAROM)
 * - QR Code pentru URL-uri și ID-uri scurte
 * - Aztec pentru coduri numerice
 */

import { 
  generateUniversalBarcode, 
  detectBarcodeType, 
  validateBarcodeData 
} from '../lib/universal-barcode-generator';

async function runTests() {
  console.log('=== Universal Barcode Generator Tests ===\n');

  // Test 1: BCBP Data (Ryanair style) -> PDF417
  const bcbpData = 'M1SORIC/ARTUR         EABC123 OTPSTN FR 1234 123Y015A0025 100';
  console.log('Test 1: BCBP Data (Ryanair)');
  console.log(`  Input: "${bcbpData.substring(0, 50)}..."`);
  console.log(`  Length: ${bcbpData.length} chars`);
  console.log(`  Detected Type: ${detectBarcodeType(bcbpData)}`);
  
  const result1 = await generateUniversalBarcode(bcbpData);
  console.log(`  Result: ${result1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (result1.success) {
    console.log(`  Generated Type: ${result1.type}`);
    console.log(`  Image Size: ${result1.base64Image?.length} chars`);
  } else {
    console.log(`  Error: ${result1.error}`);
  }
  console.log('');

  // Test 2: Numeric Code (Aer Lingus style) -> Aztec
  const numericCode = '05324726853992';
  console.log('Test 2: Numeric Code (Aer Lingus)');
  console.log(`  Input: "${numericCode}"`);
  console.log(`  Length: ${numericCode.length} chars`);
  console.log(`  Detected Type: ${detectBarcodeType(numericCode)}`);
  
  const result2 = await generateUniversalBarcode(numericCode);
  console.log(`  Result: ${result2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (result2.success) {
    console.log(`  Generated Type: ${result2.type}`);
    console.log(`  Image Size: ${result2.base64Image?.length} chars`);
  } else {
    console.log(`  Error: ${result2.error}`);
  }
  console.log('');

  // Test 3: Full BCBP (Lufthansa/TAROM style) -> PDF417
  const fullBcbp = 'M1GONTA/IONEL         ELH4820 OTPLHR LH 007Y015A0025 100>5181WW1234BLH 1234567890123456789012345678901234567890';
  console.log('Test 3: Full BCBP (Lufthansa)');
  console.log(`  Input: "${fullBcbp.substring(0, 50)}..."`);
  console.log(`  Length: ${fullBcbp.length} chars`);
  console.log(`  Detected Type: ${detectBarcodeType(fullBcbp)}`);
  
  const result3 = await generateUniversalBarcode(fullBcbp);
  console.log(`  Result: ${result3.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (result3.success) {
    console.log(`  Generated Type: ${result3.type}`);
    console.log(`  Image Size: ${result3.base64Image?.length} chars`);
  } else {
    console.log(`  Error: ${result3.error}`);
  }
  console.log('');

  // Test 4: URL -> QR Code
  const urlData = 'https://anyway.ro/boarding-pass/abc123';
  console.log('Test 4: URL Data');
  console.log(`  Input: "${urlData}"`);
  console.log(`  Length: ${urlData.length} chars`);
  console.log(`  Detected Type: ${detectBarcodeType(urlData)}`);
  
  const result4 = await generateUniversalBarcode(urlData);
  console.log(`  Result: ${result4.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (result4.success) {
    console.log(`  Generated Type: ${result4.type}`);
    console.log(`  Image Size: ${result4.base64Image?.length} chars`);
  } else {
    console.log(`  Error: ${result4.error}`);
  }
  console.log('');

  // Test 5: Short ID -> QR Code
  const shortId = 'ABC123XYZ';
  console.log('Test 5: Short ID');
  console.log(`  Input: "${shortId}"`);
  console.log(`  Length: ${shortId.length} chars`);
  console.log(`  Detected Type: ${detectBarcodeType(shortId)}`);
  
  const result5 = await generateUniversalBarcode(shortId);
  console.log(`  Result: ${result5.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (result5.success) {
    console.log(`  Generated Type: ${result5.type}`);
    console.log(`  Image Size: ${result5.base64Image?.length} chars`);
  } else {
    console.log(`  Error: ${result5.error}`);
  }
  console.log('');

  // Test 6: Validation
  console.log('Test 6: Data Validation');
  console.log(`  Empty string: ${validateBarcodeData('').valid ? '✅' : '❌'} (expected: ❌)`);
  console.log(`  Valid BCBP: ${validateBarcodeData(bcbpData).valid ? '✅' : '❌'} (expected: ✅)`);
  console.log(`  Valid numeric: ${validateBarcodeData(numericCode).valid ? '✅' : '❌'} (expected: ✅)`);
  
  console.log('\n=== Tests Complete ===');
}

// Run tests
runTests().catch(console.error);
