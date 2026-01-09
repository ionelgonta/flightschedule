#!/usr/bin/env node

/**
 * SCRIPT FINAL - Optimizare completă requesturi API
 * Reduce de la 10,000/oră la ~35/oră
 */

const fs = require('fs').promises;
const path = require('path');

async function finalOptimization() {
  console.log('🎯 OPTIMIZARE FINALĂ REQUESTURI API');
  console.log('');
  
  let allGood = true;
  
  // 1. Verifică că vechiul cache manager este dezactivat
  console.log('1️⃣ VERIFICARE CACHE MANAGERS:');
  
  const oldCacheManager = path.join(process.cwd(), 'lib', 'cacheManager.ts');
  const backupCacheManager = path.join(process.cwd(), 'lib', 'cacheManager.backup.ts');
  const fixedCacheManager = path.join(process.cwd(), 'lib', 'cacheManagerFixed.ts');
  
  try {
    const oldContent = await fs.readFile(oldCacheManager, 'utf-8');
    if (oldContent.includes('setTimeout(async () => {') && !oldContent.includes('DISABLED:')) {
      console.log('   ❌ Vechiul cache manager încă activ');
      allGood = false;
    } else {
      console.log('   ✅ Vechiul cache manager dezactivat');
    }
  } catch (error) {
    console.log('   ⚠️  Nu pot verifica vechiul cache manager');
  }
  
  try {
    const backupContent = await fs.readFile(backupCacheManager, 'utf-8');
    if (backupContent.includes('setTimeout(async () => {') && !backupContent.includes('DISABLED:')) {
      console.log('   ❌ Backup cache manager încă activ');
      allGood = false;
    } else {
      console.log('   ✅ Backup cache manager dezactivat');
    }
  } catch (error) {
    console.log('   ⚠️  Nu pot verifica backup cache manager');
  }
  
  try {
    const fixedContent = await fs.readFile(fixedCacheManager, 'utf-8');
    if (fixedContent.includes('setTimeout(async () => {') && fixedContent.includes('[Fixed Cache Manager]')) {
      console.log('   ✅ Fixed cache manager activ');
    } else {
      console.log('   ❌ Fixed cache manager nu pare activ');
      allGood = false;
    }
  } catch (error) {
    console.log('   ❌ Nu pot verifica fixed cache manager');
    allGood = false;
  }
  
  console.log('');
  
  // 2. Verifică configurația
  console.log('2️⃣ VERIFICARE CONFIGURAȚIE:');
  
  const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
  
  try {
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    if (config.flightData.cronInterval >= 60) {
      console.log(`   ✅ Flight Data Interval: ${config.flightData.cronInterval} minute (optim)`);
    } else {
      console.log(`   ❌ Flight Data Interval: ${config.flightData.cronInterval} minute (prea mic!)`);
      allGood = false;
    }
    
    if (config.weather.cronInterval >= 120) {
      console.log(`   ✅ Weather Interval: ${config.weather.cronInterval} minute (optim)`);
    } else {
      console.log(`   ⚠️  Weather Interval: ${config.weather.cronInterval} minute (acceptabil)`);
    }
    
    if (config.analytics.cronInterval >= 1440) {
      console.log(`   ✅ Analytics Interval: ${config.analytics.cronInterval} minute (optim)`);
    } else {
      console.log(`   ⚠️  Analytics Interval: ${config.analytics.cronInterval} minute (acceptabil)`);
    }
    
  } catch (error) {
    console.log('   ❌ Nu pot verifica configurația');
    allGood = false;
  }
  
  console.log('');
  
  // 3. Calculează requesturile estimate
  console.log('3️⃣ CALCULUL REQUESTURILOR ESTIMATE:');
  
  const airports = 17; // Toate aeroporturile oficiale
  const flightTypes = 2; // arrivals + departures
  const flightInterval = 60; // minute
  const weatherInterval = 120; // minute
  
  const flightRequestsPerHour = airports * flightTypes * (60 / flightInterval);
  const weatherRequestsPerHour = 1 * (60 / weatherInterval); // 1 request pentru toate orașele
  const totalRequestsPerHour = flightRequestsPerHour + weatherRequestsPerHour;
  
  console.log(`   📊 Aeroporturi: ${airports}`);
  console.log(`   📊 Tipuri per aeroport: ${flightTypes}`);
  console.log(`   📊 Flight requests/oră: ${flightRequestsPerHour}`);
  console.log(`   📊 Weather requests/oră: ${weatherRequestsPerHour}`);
  console.log(`   📊 TOTAL requests/oră: ${totalRequestsPerHour}`);
  console.log(`   📊 REDUCERE: ${Math.round((10000 - totalRequestsPerHour) / 10000 * 100)}% (de la ~10,000)`);
  
  console.log('');
  
  // 4. Status final
  if (allGood) {
    console.log('✅ OPTIMIZAREA ESTE COMPLETĂ!');
    console.log('');
    console.log('🔄 RESTART APLICAȚIA:');
    console.log('   ssh root@anyway.ro "pm2 restart anyway-ro"');
    console.log('');
    console.log('📈 REZULTATE AȘTEPTATE:');
    console.log(`   - Requesturi API: ~${totalRequestsPerHour}/oră (în loc de ~10,000)`);
    console.log('   - Doar Fixed Cache Manager activ');
    console.log('   - Rate limiting aplicat');
    console.log('   - Intervale sigure pentru API');
    console.log('');
    console.log('⏰ MONITORIZARE:');
    console.log('   ssh root@anyway.ro "pm2 logs anyway-ro --lines 20"');
    console.log('   Căută: "[Fixed Cache Manager]" și intervale de 60 minute');
    
  } else {
    console.log('❌ OPTIMIZAREA NU ESTE COMPLETĂ!');
    console.log('');
    console.log('🔧 ACȚIUNI NECESARE:');
    console.log('   1. Rulează din nou scripturile de optimizare');
    console.log('   2. Verifică manual fișierele cache manager');
    console.log('   3. Restart aplicația după reparări');
  }
}

finalOptimization().catch(console.error);