// Quick fix script to remove problematic imports from cacheManager.ts on server
const fs = require('fs');

const filePath = '/opt/anyway-flight-schedule/lib/cacheManager.ts';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the problematic import line that includes API_CONFIGS
  content = content.replace(
    /const \{ default: FlightApiService, API_CONFIGS \} = await import\('\.\/flightApiService'\)/g,
    "const { default: FlightApiService } = await import('./flightApiService')"
  );
  
  // Fix the API service instantiation
  content = content.replace(
    /new FlightApiService\(API_CONFIGS\.aerodatabox\)/g,
    `new FlightApiService({
        provider: 'aerodatabox',
        apiKey: process.env.AERODATABOX_API_KEY || '',
        baseUrl: 'https://aerodatabox.p.rapidapi.com',
        rateLimit: 100
      })`
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed cacheManager.ts imports');
  
} catch (error) {
  console.error('❌ Error fixing cacheManager.ts:', error.message);
  process.exit(1);
}