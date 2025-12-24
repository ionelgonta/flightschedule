/**
 * System Status Checker
 * Verifies the persistent flight system status and provides detailed information
 */

const { persistentFlightSystem } = require('../lib/persistentFlightSystem')

async function checkSystemStatus() {
  console.log('🔍 Checking Persistent Flight System Status...')
  console.log('=' .repeat(50))

  try {
    // Initialize the system
    console.log('📋 Initializing system...')
    await persistentFlightSystem.initialize()
    
    // Get system status
    console.log('📊 Getting system status...')
    const status = await persistentFlightSystem.getSystemStatus()
    
    console.log('\n📈 SYSTEM STATUS:')
    console.log(`✅ Initialized: ${status.isInitialized}`)
    console.log(`📊 Total Flights: ${status.statistics.totalFlights}`)
    console.log(`🛣️  Total Routes: ${status.statistics.totalRoutes}`)
    console.log(`💾 Cache Size: ${status.statistics.cacheSize}`)
    console.log(`🗓️  Last Backup: ${status.statistics.lastBackup || 'None'}`)
    
    console.log('\n🔧 COMPONENTS STATUS:')
    Object.entries(status.components).forEach(([component, isWorking]) => {
      const icon = isWorking ? '✅' : '❌'
      console.log(`${icon} ${component}: ${isWorking ? 'Working' : 'Not Available'}`)
    })
    
    // Test a few airports
    console.log('\n🏢 TESTING AIRPORT DATA:')
    const testAirports = ['OTP', 'CLJ', 'TSR']
    
    for (const airport of testAirports) {
      try {
        const arrivals = await persistentFlightSystem.getFlightData(airport, 'arrivals')
        const departures = await persistentFlightSystem.getFlightData(airport, 'departures')
        console.log(`✅ ${airport}: ${arrivals.length} arrivals, ${departures.length} departures`)
      } catch (error) {
        console.log(`❌ ${airport}: Error - ${error.message}`)
      }
    }
    
    // Test schedule generation
    console.log('\n🗓️  TESTING SCHEDULE GENERATION:')
    try {
      const schedule = await persistentFlightSystem.generateWeeklySchedule('OTP')
      console.log(`✅ OTP Schedule: ${schedule.routes.length} routes generated`)
      
      if (schedule.routes.length > 0) {
        console.log(`   📊 Sample routes: ${schedule.routes.slice(0, 3).map(r => r.route).join(', ')}`)
      }
    } catch (error) {
      console.log(`❌ Schedule Generation: Error - ${error.message}`)
    }
    
    // Test weather data
    console.log('\n🌤️  TESTING WEATHER DATA:')
    try {
      const weather = await persistentFlightSystem.getWeatherData('București')
      console.log(`✅ Weather: ${weather.temperature}°C, ${weather.description}`)
      console.log(`   📊 Source: ${weather.source}, Impact: ${weather.flightImpact?.severity || 'none'}`)
    } catch (error) {
      console.log(`❌ Weather Data: Error - ${error.message}`)
    }
    
    console.log('\n🎉 System status check completed!')
    
  } catch (error) {
    console.error('❌ System status check failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  checkSystemStatus()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Status check failed:', error)
      process.exit(1)
    })
}

module.exports = { checkSystemStatus }