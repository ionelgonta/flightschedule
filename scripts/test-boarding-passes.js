const fs = require('fs');
const path = require('path');
const { ModernPDFProcessor } = require('../lib/modern-pdf-processor.js');

const LEARNING_DIR = '/opt/anyway-flight-schedule/data/learning-boarding-passes';

async function testAllPDFs() {
  const processor = new ModernPDFProcessor();
  const files = fs.readdirSync(LEARNING_DIR).filter(f => f.endsWith('.pdf'));
  
  console.log(`Found ${files.length} PDF files to test\n`);
  
  let success = 0;
  let failed = 0;
  const results = [];
  
  for (const file of files) {
    const filepath = path.join(LEARNING_DIR, file);
    console.log(`Testing: ${file}`);
    
    try {
      const buffer = fs.readFileSync(filepath);
      const result = await processor.processPDF(buffer);
      
      if (result.success && result.bcbp) {
        console.log(`  ✅ SUCCESS - BCBP: ${result.bcbp.substring(0, 50)}...`);
        console.log(`  Method: ${result.debugInfo?.method || 'unknown'}`);
        success++;
        results.push({ file, success: true, bcbp: result.bcbp, method: result.debugInfo?.method });
      } else {
        console.log(`  ❌ FAILED - ${result.error}`);
        failed++;
        results.push({ file, success: false, error: result.error });
      }
    } catch (error) {
      console.log(`  ❌ ERROR - ${error.message}`);
      failed++;
      results.push({ file, success: false, error: error.message });
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`SUMMARY: ${success}/${files.length} successful (${failed} failed)`);
  console.log('='.repeat(60));
  
  // Save results
  fs.writeFileSync('/tmp/boarding-pass-test-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to /tmp/boarding-pass-test-results.json');
}

testAllPDFs().catch(console.error);
