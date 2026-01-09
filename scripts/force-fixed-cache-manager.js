#!/usr/bin/env node

/**
 * SCRIPT FINAL - Forțează folosirea Fixed Cache Manager
 * Înlocuiește complet vechiul cache manager cu cel optimizat
 */

const fs = require('fs').promises;
const path = require('path');

async function forceFixedCacheManager() {
  console.log('🔧 FORȚARE FIXED CACHE MANAGER - Soluția finală');
  console.log('');
  
  const oldCacheManagerPath = path.join(process.cwd(), 'lib', 'cacheManager.ts');
  const fixedCacheManagerPath = path.join(process.cwd(), 'lib', 'cacheManagerFixed.ts');
  const backupPath = path.join(process.cwd(), 'lib', 'cacheManager.old.backup.ts');
  
  try {
    // 1. Backup vechiul cache manager
    console.log('1️⃣ BACKUP VECHIUL CACHE MANAGER:');
    const oldContent = await fs.readFile(oldCacheManagerPath, 'utf-8');
    await fs.writeFile(backupPath, oldContent);
    console.log('   ✅ Backup salvat în cacheManager.old.backup.ts');
    
    // 2. Citește Fixed Cache Manager
    console.log('');
    console.log('2️⃣ CITIRE FIXED CACHE MANAGER:');
    const fixedContent = await fs.readFile(fixedCacheManagerPath, 'utf-8');
    console.log('   ✅ Fixed Cache Manager citit');
    
    // 3. Înlocuiește vechiul cache manager cu cel fixed
    console.log('');
    console.log('3️⃣ ÎNLOCUIRE CACHE MANAGER:');
    
    // Modifică exporturile pentru compatibilitate
    let modifiedContent = fixedContent.replace(
      'export const fixedCacheManager = FixedCacheManager.getInstance()',
      `export const fixedCacheManager = FixedCacheManager.getInstance()
export const cacheManager = fixedCacheManager // Alias pentru compatibilitate`
    );
    
    // Înlocuiește numele clasei în loguri pentru claritate
    modifiedContent = modifiedContent.replace(
      /\[Fixed Cache Manager\]/g,
      '[Cache Manager - OPTIMIZED]'
    );
    
    await fs.writeFile(oldCacheManagerPath, modifiedContent);
    console.log('   ✅ Vechiul cache manager înlocuit cu Fixed Cache Manager');
    
    // 4. Verifică configurația
    console.log('');
    console.log('4️⃣ VERIFICARE CONFIGURAȚIE:');
    
    const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    console.log(`   📊 Flight Data Interval: ${config.flightData.cronInterval} minute`);
    console.log(`   📊 Weather Interval: ${config.weather.cronInterval} minute`);
    console.log(`   📊 Analytics Interval: ${config.analytics.cronInterval} minute`);
    
    // 5. Calculează requesturile finale
    console.log('');
    console.log('5️⃣ CALCULUL REQUESTURILOR FINALE:');
    
    const airports = 17;
    const flightTypes = 2;
    const flightRequestsPerHour = airports * flightTypes * (60 / config.flightData.cronInterval);
    const weatherRequestsPerHour = 1 * (60 / config.weather.cronInterval);
    const totalRequestsPerHour = flightRequestsPerHour + weatherRequestsPerHour;
    
    console.log(`   📈 Flight requests/oră: ${flightRequestsPerHour}`);
    console.log(`   📈 Weather requests/oră: ${weatherRequestsPerHour}`);
    console.log(`   📈 TOTAL requests/oră: ${totalRequestsPerHour}`);
    console.log(`   📈 REDUCERE: ${Math.round((10000 - totalRequestsPerHour) / 10000 * 100)}% (de la ~10,000)`);
    
    console.log('');
    console.log('✅ ÎNLOCUIREA COMPLETĂ!');
    console.log('');
    console.log('🔄 RESTART APLICAȚIA ACUM:');
    console.log('   ssh root@anyway.ro "pm2 restart anyway-ro"');
    console.log('');
    console.log('📋 VERIFICĂRI DUPĂ RESTART:');
    console.log('   1. Căută "[Cache Manager - OPTIMIZED]" în loguri');
    console.log(`   2. Verifică intervalul "${config.flightData.cronInterval} minutes" pentru flight data`);
    console.log('   3. Nu mai trebuie să vezi erori 429 Too Many Requests');
    console.log('   4. Requesturile API să scadă dramatic');
    console.log('');
    console.log('⚠️  ROLLBACK (dacă e necesar):');
    console.log('   cp lib/cacheManager.old.backup.ts lib/cacheManager.ts');
    console.log('   pm2 restart anyway-ro');
    
  } catch (error) {
    console.error('❌ EROARE:', error.message);
    console.log('');
    console.log('🔧 ROLLBACK MANUAL:');
    console.log('   1. ssh root@anyway.ro');
    console.log('   2. cd /opt/anyway-flight-schedule');
    console.log('   3. cp lib/cacheManager.old.backup.ts lib/cacheManager.ts');
    console.log('   4. pm2 restart anyway-ro');
  }
}

forceFixedCacheManager().catch(console.error);