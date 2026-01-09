#!/usr/bin/env node

/**
 * Cache Restore Script - Restores cache data from backup safely
 * Now that corruption is fixed, we can safely restore historical data
 */

const fs = require('fs').promises;
const path = require('path');

const BACKUP_DIR = '/opt/anyway-flight-schedule/data/daily_backups/daily_backup_2025-12-25T22-00-00-001Z';
const DATA_DIR = '/opt/anyway-flight-schedule/data';

async function restoreFromBackup() {
  console.log('🔄 Starting cache restoration from backup...');
  
  try {
    // 1. Read backup manifest
    const manifestPath = path.join(BACKUP_DIR, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    
    console.log(`📋 Backup info: ${manifest.description}`);
    console.log(`📅 Created: ${manifest.createdAt}`);
    console.log(`✅ Valid: ${manifest.isValid}`);
    
    if (!manifest.isValid) {
      throw new Error('Backup is not valid, aborting restore');
    }
    
    // 2. Create backup of current data (safety measure)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = path.join(DATA_DIR, `pre-restore-backup-${timestamp}`);
    await fs.mkdir(currentBackupDir, { recursive: true });
    
    console.log('💾 Creating safety backup of current data...');
    
    // Backup current files
    const filesToBackup = [
      'historical-flights.db',
      'flights_cache.json',
      'historical_flights.json'
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(DATA_DIR, file);
      const backupPath = path.join(currentBackupDir, file);
      
      try {
        await fs.copyFile(sourcePath, backupPath);
        console.log(`✅ Backed up: ${file}`);
      } catch (error) {
        console.log(`⚠️  Could not backup ${file}: ${error.message}`);
      }
    }
    
    // 3. Restore historical database
    if (manifest.components.historicalDatabase) {
      console.log('🗄️  Restoring historical database...');
      
      const backupHistoricalPath = path.join(BACKUP_DIR, 'historical_database.json');
      const targetHistoricalPath = path.join(DATA_DIR, 'historical_flights.json');
      
      await fs.copyFile(backupHistoricalPath, targetHistoricalPath);
      console.log('✅ Historical database restored');
    }
    
    // 4. Restore persistent flight cache
    if (manifest.components.persistentFlightCache) {
      console.log('💾 Restoring persistent flight cache...');
      
      const backupCachePath = path.join(BACKUP_DIR, 'flights_cache.json');
      const targetCachePath = path.join(DATA_DIR, 'flights_cache.json');
      
      await fs.copyFile(backupCachePath, targetCachePath);
      console.log('✅ Persistent flight cache restored');
    }
    
    // 5. Verify restored data
    console.log('🔍 Verifying restored data...');
    
    const restoredHistorical = await fs.readFile(path.join(DATA_DIR, 'historical_flights.json'), 'utf-8');
    const historicalData = JSON.parse(restoredHistorical);
    
    const restoredCache = await fs.readFile(path.join(DATA_DIR, 'flights_cache.json'), 'utf-8');
    const cacheData = JSON.parse(restoredCache);
    
    console.log(`📊 Restored historical flights: ${historicalData.length || 0} records`);
    console.log(`📊 Restored cache entries: ${Object.keys(cacheData).length || 0} entries`);
    
    // 6. Success summary
    console.log('\n🎉 RESTORE COMPLETED SUCCESSFULLY!');
    console.log('📋 Summary:');
    console.log(`   - Historical data: ${historicalData.length || 0} flights`);
    console.log(`   - Cache entries: ${Object.keys(cacheData).length || 0} entries`);
    console.log(`   - Safety backup created: ${currentBackupDir}`);
    console.log('\n⚠️  IMPORTANT: Restart the application to load restored data:');
    console.log('   pm2 restart anyway-ro');
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    console.error('💡 The application will continue with current data');
    process.exit(1);
  }
}

// Run restore
restoreFromBackup().catch(console.error);