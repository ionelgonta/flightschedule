const fs = require('fs');
const path = require('path');

const cacheFile = path.join(__dirname, '..', 'data', 'cache-data.json');

try {
  let data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  const before = data.length;
  data = data.filter(e => !e.key || !e.key.includes('RMO_'));
  const removed = before - data.length;
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
  console.log(`Removed ${removed} RMO cache entries`);
} catch (error) {
  console.error('Error:', error.message);
}
