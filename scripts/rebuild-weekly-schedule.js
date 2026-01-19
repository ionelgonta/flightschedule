const fs = require('fs');
const path = require('path');

// Read all daily backups
const backupsDir = './data/daily_backups';
const dirs = fs.readdirSync(backupsDir).filter(d => d.startsWith('daily_backup_'));

const flightsByRoute = new Map();
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

console.log(`Processing ${dirs.length} backup directories...`);

dirs.forEach((dir, idx) => {
  const dirPath = path.join(backupsDir, dir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        data.forEach(flight => {
          if (flight.flightNumber && flight.scheduledTime) {
            const key = `${flight.flightNumber}_${flight.originCode || ''}_${flight.destinationCode || ''}`;
            if (!flightsByRoute.has(key)) {
              flightsByRoute.set(key, {
                flightNumber: flight.flightNumber,
                airline: flight.airlineName || 'Unknown',
                origin: flight.originName || flight.originCode || '',
                originCode: flight.originCode || '',
                destination: flight.destinationName || flight.destinationCode || '',
                destinationCode: flight.destinationCode || '',
                weeklyPattern: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false },
                scheduledTimes: {},
                lastSeenDates: {},
                frequency: 0
              });
            }
            
            const date = new Date(flight.scheduledTime);
            const dayOfWeek = dayNames[date.getDay()];
            
            // Check if time already has timezone offset (like +02:00)
            const timeStr = flight.scheduledTime;
            let time;
            const offsetMatch = timeStr.match(/(\d{2}):(\d{2})(?::\d{2})?([+-]\d{2}:\d{2})/);
            if (offsetMatch && offsetMatch[3] !== '+00:00') {
              // Time has non-UTC offset, use directly
              time = `${offsetMatch[1]}:${offsetMatch[2]}`;
            } else if (timeStr.endsWith('Z') || timeStr.includes('.000Z')) {
              // UTC time - convert to local
              time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Bucharest' });
            } else {
              // Extract time directly
              const directMatch = timeStr.match(/(\d{2}):(\d{2})/);
              time = directMatch ? `${directMatch[1]}:${directMatch[2]}` : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            
            const dateStr = date.toISOString().split('T')[0];
            
            const route = flightsByRoute.get(key);
            route.weeklyPattern[dayOfWeek] = true;
            
            if (!route.scheduledTimes[dayOfWeek]) {
              route.scheduledTimes[dayOfWeek] = [];
            }
            if (!route.scheduledTimes[dayOfWeek].includes(time)) {
              route.scheduledTimes[dayOfWeek].push(time);
            }
            
            if (!route.lastSeenDates[dayOfWeek] || route.lastSeenDates[dayOfWeek] < dateStr) {
              route.lastSeenDates[dayOfWeek] = dateStr;
            }
            
            route.frequency++;
          }
        });
      }
    } catch (e) {
      // Skip invalid files
    }
  });
  
  if ((idx + 1) % 50 === 0) {
    console.log(`Processed ${idx + 1}/${dirs.length} directories...`);
  }
});

// Convert to array and add metadata
const scheduleData = Array.from(flightsByRoute.values()).map(route => ({
  airport: route.origin,
  destination: route.destination,
  airline: route.airline,
  flightNumber: route.flightNumber,
  weeklyPattern: route.weeklyPattern,
  scheduledTimes: route.scheduledTimes,
  lastSeenDates: route.lastSeenDates,
  frequency: route.frequency,
  lastUpdated: new Date().toISOString(),
  dataSource: 'historical'
}));

// Sort by frequency (most frequent first)
scheduleData.sort((a, b) => b.frequency - a.frequency);

// Save to weekly schedule file
const outputPath = './.cache/weekly_schedule_table.json';
const output = {
  data: scheduleData,
  metadata: {
    savedAt: new Date().toISOString(),
    count: scheduleData.length,
    version: '1.0',
    rebuiltFromBackups: true
  }
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nDone! Rebuilt ${scheduleData.length} routes from ${dirs.length} backup directories.`);

// Show OS 716 as example
const os716 = scheduleData.find(r => r.flightNumber === 'OS 716');
if (os716) {
  console.log('\nOS 716 example:');
  console.log(JSON.stringify(os716.scheduledTimes, null, 2));
}
