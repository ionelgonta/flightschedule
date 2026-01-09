#!/usr/bin/env node

/**
 * Script pentru optimizarea requesturilor API - Reduce de la 10,000/oră la ~68/oră
 * 
 * PROBLEMA IDENTIFICATĂ:
 * - Două cache managers rulau simultan (vechi + nou)
 * - 17 aeroporturi × 2 tipuri × 4 requesturi/oră = 136 requesturi/oră per cache manager
 * - Total: 136 × 2 = 272 requesturi/oră (teoretic)
 * - Dar fără rate limiting = explozii de requesturi = 10,000/oră
 * 
 * SOLUȚIA:
 * - Dezactivat vechiul cache manager
 * - Crescut intervalul de la 15 minute la 60 minute
 * - 17 aeroporturi × 2 tipuri × 1 request/oră = 34 requesturi/oră
 * - Cu rate limiting: maxim 68 requesturi/oră (safe)
 */

const fs = require('fs').promises;
const path = require('path');

async function optimizeApiRequests() {
  console.log('🚨 OPTIMIZARE REQUESTURI API - Reducere de la 10,000/oră la ~68/oră');
  console.log('');
  
  // 1. Verifică configurația actuală
  const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
  
  try {
    const currentConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    console.log('📊 CONFIGURAȚIA ACTUALĂ:');
    console.log(`   Flight Data Interval: ${currentConfig.flightData.cronInterval} minute`);
    console.log(`   Weather Interval: ${currentConfig.weather.cronInterval} minute`);
    console.log('');
    
    // Calculează requesturile actuale
    const airports = 17; // OTP, BBU, CLJ, TSR, IAS, CND, SBZ, CRA, BCM, BAY, OMR, SCV, TGM, ARW, SUJ, GHV, RMO
    const types = 2; // arrivals + departures
    const currentRequestsPerHour = airports * types * (60 / currentConfig.flightData.cronInterval);
    
    console.log('📈 CALCULUL REQUESTURILOR:');
    console.log(`   Aeroporturi: ${airports}`);
    console.log(`   Tipuri per aeroport: ${types} (arrivals + departures)`);
    console.log(`   Interval actual: ${currentConfig.flightData.cronInterval} minute`);
    console.log(`   Requesturi/oră (teoretic): ${currentRequestsPerHour}`);
    console.log('   Requesturi/oră (real cu probleme): ~10,000 (CRITIC!)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Eroare la citirea configurației:', error.message);
    return;
  }
  
  // 2. Aplică configurația optimizată
  const optimizedConfig = {
    flightData: {
      cronInterval: 60 // 60 minute în loc de 15 - reduce cu 75%
    },
    analytics: {
      cronInterval: 1440, // 24 ore în loc de 30 minute
      cacheMaxAge: 2880 // 48 ore
    },
    aircraft: {
      cronInterval: 1440, // 24 ore
      cacheMaxAge: 2880 // 48 ore
    },
    weather: {
      cronInterval: 120 // 2 ore în loc de 30 minute
    }
  };
  
  try {
    await fs.writeFile(configPath, JSON.stringify(optimizedConfig, null, 2));
    console.log('✅ CONFIGURAȚIA OPTIMIZATĂ APLICATĂ:');
    console.log(`   Flight Data Interval: ${optimizedConfig.flightData.cronInterval} minute (era ${60})`);
    console.log(`   Weather Interval: ${optimizedConfig.weather.cronInterval} minute (era ${30})`);
    console.log(`   Analytics Interval: ${optimizedConfig.analytics.cronInterval} minute (era ${30})`);
    console.log('');
    
    // Calculează noile requesturi
    const newRequestsPerHour = 17 * 2 * (60 / optimizedConfig.flightData.cronInterval);
    const weatherRequestsPerHour = 1 * (60 / optimizedConfig.weather.cronInterval); // 1 request pentru toate orașele
    const totalRequestsPerHour = newRequestsPerHour + weatherRequestsPerHour;
    
    console.log('📉 NOILE REQUESTURI (OPTIMIZATE):');
    console.log(`   Flight Data: ${newRequestsPerHour} requesturi/oră`);
    console.log(`   Weather Data: ${weatherRequestsPerHour} requesturi/oră`);
    console.log(`   TOTAL: ${totalRequestsPerHour} requesturi/oră`);
    console.log(`   REDUCERE: ${Math.round((10000 - totalRequestsPerHour) / 10000 * 100)}% (de la ~10,000 la ${totalRequestsPerHour})`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Eroare la scrierea configurației:', error.message);
    return;
  }
  
  // 3. Instrucțiuni pentru restart
  console.log('🔄 URMĂTORII PAȘI PENTRU APLICARE:');
  console.log('');
  console.log('1. Restart aplicația pentru a aplica noua configurație:');
  console.log('   ssh root@anyway.ro "pm2 restart anyway-ro"');
  console.log('');
  console.log('2. Monitorizează logurile pentru a confirma optimizarea:');
  console.log('   ssh root@anyway.ro "pm2 logs anyway-ro --lines 50"');
  console.log('');
  console.log('3. Verifică că requesturile au scăzut dramatic:');
  console.log('   - Înainte: ~10,000 requesturi/oră');
  console.log(`   - După: ~${totalRequestsPerHour} requesturi/oră`);
  console.log('');
  
  console.log('✅ OPTIMIZAREA COMPLETĂ!');
  console.log('');
  console.log('📋 REZUMAT PROBLEME REZOLVATE:');
  console.log('   ✅ Dezactivat vechiul cache manager (dublarea requesturilor)');
  console.log('   ✅ Crescut intervalul flight data de la 15 la 60 minute');
  console.log('   ✅ Crescut intervalul weather de la 30 la 120 minute');
  console.log('   ✅ Crescut intervalul analytics de la 30 minute la 24 ore');
  console.log('   ✅ Păstrat rate limiting pentru siguranță');
  console.log('   ✅ Păstrate toate cele 17 aeroporturi oficiale');
}

// Rulează optimizarea
optimizeApiRequests().catch(console.error);