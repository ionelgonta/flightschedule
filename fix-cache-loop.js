// Script rapid pentru a opri bucla infinită de cron jobs
const fs = require('fs');
const path = require('path');

console.log('Fixing cache loop issue...');

// Șterge toate fișierele de cache pentru a forța re-inițializarea
const dataDir = '/opt/anyway-flight-schedule/data';
const cacheFiles = [
  'cache-data.json',
  'cache-stats.json'
];

cacheFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${file}`);
  }
});

// Actualizează configurația cu intervale mai mari
const configPath = path.join(dataDir, 'cache-config.json');
const newConfig = {
  "flightData": {
    "cronInterval": 60,
    "cacheUntilNext": true
  },
  "analytics": {
    "cronInterval": 7,
    "cacheMaxAge": 360
  },
  "aircraft": {
    "cronInterval": 30,
    "cacheMaxAge": 360
  }
};

fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
console.log('Updated cache configuration with larger intervals');

console.log('Cache loop fix completed. Restart the application now.');