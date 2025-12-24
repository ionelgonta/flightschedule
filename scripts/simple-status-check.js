/**
 * Simple Status Check
 * Checks if the persistent flight system files exist and basic structure
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking Persistent Flight System Files...')
console.log('=' .repeat(50))

// Check if core files exist
const coreFiles = [
  'lib/persistentFlightSystem.ts',
  'lib/historicalDatabaseManager.ts',
  'lib/flightDataProcessor.ts',
  'lib/masterScheduleGenerator.ts',
  'lib/weatherCacheManager.ts',
  'lib/dailyBackupManager.ts',
  'lib/cacheManager.ts',
  '__tests__/persistent-flight-system.test.ts',
  'scripts/migrate-persistent-cache.ts'
]

console.log('📁 CORE FILES CHECK:')
coreFiles.forEach(file => {
  const exists = fs.existsSync(file)
  const icon = exists ? '✅' : '❌'
  console.log(`${icon} ${file}`)
})

// Check data directory
console.log('\n📂 DATA DIRECTORY CHECK:')
const dataDir = 'data'
if (fs.existsSync(dataDir)) {
  console.log('✅ data/ directory exists')
  
  const dataFiles = fs.readdirSync(dataDir)
  console.log(`📊 Found ${dataFiles.length} files in data directory:`)
  dataFiles.forEach(file => {
    const stats = fs.statSync(path.join(dataDir, file))
    const size = (stats.size / 1024).toFixed(1)
    console.log(`   📄 ${file} (${size} KB)`)
  })
} else {
  console.log('❌ data/ directory does not exist')
}

// Check if persistent cache exists
console.log('\n💾 PERSISTENT CACHE CHECK:')
const persistentCacheFile = 'data/flights_cache.json'
if (fs.existsSync(persistentCacheFile)) {
  const stats = fs.statSync(persistentCacheFile)
  const size = (stats.size / 1024).toFixed(1)
  console.log(`✅ flights_cache.json exists (${size} KB)`)
  
  try {
    const cacheData = JSON.parse(fs.readFileSync(persistentCacheFile, 'utf8'))
    console.log(`📊 Cache contains ${cacheData.length} entries`)
    
    // Analyze cache data
    const airportCounts = {}
    const typeCounts = { arrivals: 0, departures: 0 }
    
    cacheData.forEach(entry => {
      if (entry.airportCode) {
        airportCounts[entry.airportCode] = (airportCounts[entry.airportCode] || 0) + 1
      }
      if (entry.type) {
        typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1
      }
    })
    
    console.log('📈 Cache breakdown:')
    console.log(`   ✈️  Arrivals: ${typeCounts.arrivals}`)
    console.log(`   🛬 Departures: ${typeCounts.departures}`)
    
    console.log('🏢 Top airports in cache:')
    Object.entries(airportCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([airport, count]) => {
        console.log(`   ${airport}: ${count} flights`)
      })
      
  } catch (error) {
    console.log(`❌ Error reading cache file: ${error.message}`)
  }
} else {
  console.log('❌ flights_cache.json does not exist')
}

// Check package.json for dependencies
console.log('\n📦 DEPENDENCIES CHECK:')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = ['fast-check', 'jest', 'ts-jest', 'better-sqlite3']
  
  requiredDeps.forEach(dep => {
    const hasDevDep = packageJson.devDependencies && packageJson.devDependencies[dep]
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep]
    const icon = (hasDevDep || hasDep) ? '✅' : '❌'
    console.log(`${icon} ${dep}`)
  })
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`)
}

console.log('\n🎯 NEXT STEPS:')
console.log('1. Run migration: node scripts/run-migration.js')
console.log('2. Run tests: npm run test:properties')
console.log('3. Deploy to production with backup')

console.log('\n✅ File structure check completed!')