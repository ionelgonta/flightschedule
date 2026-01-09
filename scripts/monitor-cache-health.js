/**
 * Script de monitorizare pentru sănătatea cache-ului
 * Monitorizează în timp real performanța și identifică probleme
 */

const fs = require('fs').promises;
const path = require('path');

class CacheHealthMonitor {
  constructor() {
    this.isRunning = false;
    this.stats = {
      totalEntries: 0,
      flightDataEntries: 0,
      analyticsEntries: 0,
      weatherEntries: 0,
      corruptedEntries: 0,
      expiredEntries: 0,
      apiRequests: 0,
      lastUpdate: null
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Starting cache health monitor...\n');
    console.log('Press Ctrl+C to stop monitoring\n');

    // Initial check
    await this.checkCacheHealth();
    
    // Set up periodic monitoring
    this.monitorInterval = setInterval(async () => {
      await this.checkCacheHealth();
    }, 30000); // Check every 30 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
    });
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    console.log('\n🛑 Cache health monitor stopped');
    process.exit(0);
  }

  async checkCacheHealth() {
    const timestamp = new Date().toISOString();
    const previousStats = { ...this.stats };

    try {
      // Read cache data
      const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
      const cacheData = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheArray = JSON.parse(cacheData);

      // Reset stats
      this.stats = {
        totalEntries: cacheArray.length,
        flightDataEntries: 0,
        analyticsEntries: 0,
        weatherEntries: 0,
        corruptedEntries: 0,
        expiredEntries: 0,
        apiRequests: 0,
        lastUpdate: timestamp
      };

      // Analyze entries
      cacheArray.forEach(entry => {
        // Count by category
        if (entry.category === 'flightData') this.stats.flightDataEntries++;
        else if (entry.category === 'analytics') this.stats.analyticsEntries++;
        else if (entry.category === 'weather') this.stats.weatherEntries++;

        // Check for corruption
        if (!entry.id || !entry.category || !entry.key) {
          this.stats.corruptedEntries++;
        }

        // Check for nested corruption in flight data
        if (entry.category === 'flightData' && entry.data) {
          if (typeof entry.data === 'object' && 'flights' in entry.data) {
            let flightData = entry.data.flights;
            while (flightData && typeof flightData === 'object' && 'flights' in flightData && !Array.isArray(flightData)) {
              flightData = flightData.flights;
              this.stats.corruptedEntries++;
              break; // Count once per entry
            }
          }
        }

        // Check for expiration
        if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
          this.stats.expiredEntries++;
        }
      });

      // Read API request counter
      try {
        const requestCounterPath = path.join(process.cwd(), 'data', 'request-counter.json');
        const requestData = await fs.readFile(requestCounterPath, 'utf-8');
        const counter = JSON.parse(requestData);
        this.stats.apiRequests = counter.totalRequests || 0;
      } catch (error) {
        // Request counter file may not exist
      }

      // Display current status
      this.displayStatus(previousStats);

    } catch (error) {
      console.error(`❌ Error checking cache health: ${error.message}`);
    }
  }

  displayStatus(previousStats) {
    // Clear screen and show header
    console.clear();
    console.log('🔍 CACHE HEALTH MONITOR');
    console.log('='.repeat(50));
    console.log(`Last Update: ${this.stats.lastUpdate}`);
    console.log('');

    // Cache statistics
    console.log('📊 CACHE STATISTICS:');
    console.log(`   Total Entries: ${this.stats.totalEntries} ${this.getChangeIndicator(this.stats.totalEntries, previousStats.totalEntries)}`);
    console.log(`   Flight Data: ${this.stats.flightDataEntries} ${this.getChangeIndicator(this.stats.flightDataEntries, previousStats.flightDataEntries)}`);
    console.log(`   Analytics: ${this.stats.analyticsEntries} ${this.getChangeIndicator(this.stats.analyticsEntries, previousStats.analyticsEntries)}`);
    console.log(`   Weather: ${this.stats.weatherEntries} ${this.getChangeIndicator(this.stats.weatherEntries, previousStats.weatherEntries)}`);
    console.log('');

    // Health indicators
    console.log('🏥 HEALTH INDICATORS:');
    
    if (this.stats.corruptedEntries > 0) {
      console.log(`   ❌ Corrupted Entries: ${this.stats.corruptedEntries} ${this.getChangeIndicator(this.stats.corruptedEntries, previousStats.corruptedEntries)}`);
    } else {
      console.log('   ✅ No Corrupted Entries');
    }

    if (this.stats.expiredEntries > 0) {
      console.log(`   ⚠️  Expired Entries: ${this.stats.expiredEntries} ${this.getChangeIndicator(this.stats.expiredEntries, previousStats.expiredEntries)}`);
    } else {
      console.log('   ✅ No Expired Entries');
    }

    console.log(`   📡 Total API Requests: ${this.stats.apiRequests} ${this.getChangeIndicator(this.stats.apiRequests, previousStats.apiRequests)}`);
    console.log('');

    // Overall health status
    const healthScore = this.calculateHealthScore();
    console.log('🎯 OVERALL HEALTH:');
    
    if (healthScore >= 90) {
      console.log('   ✅ EXCELLENT - Cache is performing optimally');
    } else if (healthScore >= 70) {
      console.log('   ⚠️  GOOD - Minor issues detected');
    } else if (healthScore >= 50) {
      console.log('   ⚠️  FAIR - Some issues need attention');
    } else {
      console.log('   ❌ POOR - Immediate action required');
    }
    
    console.log(`   Health Score: ${healthScore}%`);
    console.log('');

    // Flight data status for major airports
    this.displayFlightDataStatus();

    // Recommendations
    this.displayRecommendations();

    console.log('Press Ctrl+C to stop monitoring');
  }

  async displayFlightDataStatus() {
    try {
      const cacheDataPath = path.join(process.cwd(), 'data', 'cache-data.json');
      const cacheData = await fs.readFile(cacheDataPath, 'utf-8');
      const cacheArray = JSON.parse(cacheData);

      console.log('🛫 FLIGHT DATA STATUS:');
      
      const majorAirports = ['OTP', 'CLJ', 'TSR', 'IAS'];
      
      majorAirports.forEach(airport => {
        const arrivals = cacheArray.find(e => e.key === `${airport}_arrivals`);
        const departures = cacheArray.find(e => e.key === `${airport}_departures`);
        
        const arrivalsCount = this.getFlightCount(arrivals);
        const departuresCount = this.getFlightCount(departures);
        const arrivalsAge = arrivals ? this.getAgeInMinutes(arrivals.createdAt) : null;
        const departuresAge = departures ? this.getAgeInMinutes(departures.createdAt) : null;
        
        const status = (arrivalsCount > 0 || departuresCount > 0) ? '✅' : '❌';
        console.log(`   ${status} ${airport}: ${arrivalsCount}↓ ${departuresCount}↑ (${arrivalsAge || 'N/A'}min / ${departuresAge || 'N/A'}min old)`);
      });
      
      console.log('');
    } catch (error) {
      console.log('   ❌ Could not read flight data status');
      console.log('');
    }
  }

  getFlightCount(entry) {
    if (!entry || !entry.data) return 0;
    
    if (Array.isArray(entry.data)) {
      return entry.data.length;
    }
    
    if (entry.data.flights && Array.isArray(entry.data.flights)) {
      return entry.data.flights.length;
    }
    
    return 0;
  }

  getAgeInMinutes(timestamp) {
    if (!timestamp) return null;
    return Math.round((Date.now() - new Date(timestamp).getTime()) / (1000 * 60));
  }

  displayRecommendations() {
    console.log('💡 RECOMMENDATIONS:');
    
    if (this.stats.corruptedEntries > 0) {
      console.log('   🔧 Run cache repair: node scripts/migrate-to-fixed-cache.js');
    }
    
    if (this.stats.expiredEntries > 5) {
      console.log('   🧹 Clean expired entries: Consider cache cleanup');
    }
    
    if (this.stats.flightDataEntries === 0) {
      console.log('   📡 No flight data: Check API connectivity and cron jobs');
    }
    
    if (this.stats.apiRequests > 1000) {
      console.log('   ⚠️  High API usage: Consider increasing cache intervals');
    }
    
    if (this.stats.totalEntries === 0) {
      console.log('   🚨 Empty cache: Restart application and check logs');
    }
    
    console.log('');
  }

  calculateHealthScore() {
    let score = 100;
    
    // Deduct points for issues
    score -= this.stats.corruptedEntries * 10; // -10 per corrupted entry
    score -= Math.min(this.stats.expiredEntries * 2, 20); // -2 per expired entry, max -20
    
    // Deduct points for missing data
    if (this.stats.flightDataEntries === 0) score -= 30;
    if (this.stats.weatherEntries === 0) score -= 10;
    
    // Deduct points for excessive API usage
    if (this.stats.apiRequests > 1000) score -= 15;
    if (this.stats.apiRequests > 2000) score -= 25;
    
    return Math.max(0, Math.min(100, score));
  }

  getChangeIndicator(current, previous) {
    if (previous === undefined || previous === current) return '';
    
    if (current > previous) {
      return `(+${current - previous})`;
    } else {
      return `(${current - previous})`;
    }
  }
}

// Start monitoring
const monitor = new CacheHealthMonitor();
monitor.start();