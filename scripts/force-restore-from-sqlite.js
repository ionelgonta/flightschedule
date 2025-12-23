#!/usr/bin/env node

/**
 * Script pentru restabilirea forțată a cache-ului din SQLite
 * Populează persistent cache-ul chiar dacă cache-ul principal există
 * Respectă toate regulile aplicației
 */

const Database = require('better-sqlite3')
const fs = require('fs').promises
const path = require('path')

// Paths
const DATA_DIR = path.join(process.cwd(), 'data')
const SQLITE_PATH = path.join(DATA_DIR, 'historical-flights.db')
const PERSISTENT_CACHE_PATH = path.join(DATA_DIR, 'flights_cache.json')

// Supported airports (IATA codes only - per airport-mapping-rules.md)
const SUPPORTED_AIRPORTS = [
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 
  'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'
]

class ForcedCacheRestorer {
  constructor() {
    this.db = null
    this.stats = {
      totalRecords: 0,
      processedRecords: 0,
      persistentEntries: 0,
      errors: 0,
      skippedInvalid: 0
    }
  }

  async initialize() {
    console.log('🚀 Inițializare Forced Cache Restorer...')
    
    // Verifică dacă SQLite database există
    try {
      await fs.access(SQLITE_PATH)
      console.log(`✅ SQLite database găsit: ${SQLITE_PATH}`)
    } catch (error) {
      throw new Error(`❌ SQLite database nu a fost găsit: ${SQLITE_PATH}`)
    }

    // Deschide conexiunea SQLite
    this.db = new Database(SQLITE_PATH, { readonly: true })
    console.log('✅ Conexiune SQLite deschisă')

    // Obține statistici inițiale
    const totalRecords = this.db.prepare('SELECT COUNT(*) as count FROM historical_flights').get()
    this.stats.totalRecords = totalRecords.count
    console.log(`📊 Total înregistrări în SQLite: ${this.stats.totalRecords}`)
  }

  async loadExistingPersistentCache() {
    console.log('📂 Încărcare persistent cache existent...')
    
    try {
      const persistentData = await fs.readFile(PERSISTENT_CACHE_PATH, 'utf-8')
      const existingPersistent = JSON.parse(persistentData)
      console.log(`✅ Persistent cache existent încărcat: ${Object.keys(existingPersistent).length} intrări`)
      return existingPersistent
    } catch (error) {
      console.log('⚠️  Nu există persistent cache existent, se va crea unul nou')
      return {}
    }
  }

  convertSQLiteToPersistentData(record) {
    // Creează o cheie unică pentru persistent cache
    const timestamp = new Date(record.scheduled_time).getTime()
    const key = `${record.flight_number}_${record.airport_iata}_${timestamp}`
    
    return {
      key,
      data: {
        flightNumber: record.flight_number,
        airlineCode: record.airline_code,
        airlineName: record.airline_name || 'Unknown',
        originCode: record.origin_code,
        originName: record.origin_name || record.origin_code,
        destinationCode: record.destination_code,
        destinationName: record.destination_name || record.destination_code,
        scheduledTime: record.scheduled_time,
        actualTime: record.actual_time || undefined,
        estimatedTime: record.estimated_time || undefined,
        status: record.status,
        delayMinutes: record.delay_minutes || 0,
        airportCode: record.airport_iata,
        type: record.flight_type === 'arrival' ? 'arrivals' : 'departures',
        cachedAt: new Date().toISOString(),
        source: 'historical_restore' // Marchează sursa ca historical restore
      }
    }
  }

  getCityFromAirportCode(code) {
    const cityMap = {
      'OTP': 'București',
      'BBU': 'București',
      'CLJ': 'Cluj-Napoca',
      'TSR': 'Timișoara',
      'IAS': 'Iași',
      'CND': 'Constanța',
      'SBZ': 'Sibiu',
      'CRA': 'Craiova',
      'BCM': 'Bacău',
      'BAY': 'Baia Mare',
      'OMR': 'Oradea',
      'SCV': 'Suceava',
      'TGM': 'Târgu Mureș',
      'ARW': 'Arad',
      'SUJ': 'Satu Mare',
      'RMO': 'Chișinău'
    }
    return cityMap[code] || code
  }

  async populatePersistentCache() {
    console.log('🔄 Începe popularea persistent cache din SQLite...')

    // Încarcă persistent cache existent
    const existingPersistent = await this.loadExistingPersistentCache()
    const existingKeys = new Set(Object.keys(existingPersistent))
    const newPersistentEntries = { ...existingPersistent }

    // Procesează fiecare aeroport suportat
    for (const airportCode of SUPPORTED_AIRPORTS) {
      console.log(`\n🏢 Procesare aeroport: ${airportCode}`)

      // Procesează arrivals și departures
      for (const sqliteType of ['arrival', 'departure']) {
        const cacheType = sqliteType === 'arrival' ? 'arrivals' : 'departures'
        
        await this.processAirportData(
          airportCode, 
          sqliteType, 
          cacheType,
          existingKeys,
          newPersistentEntries
        )
      }
    }

    console.log(`\n📊 Statistici finale:`)
    console.log(`   - Total înregistrări SQLite: ${this.stats.totalRecords}`)
    console.log(`   - Înregistrări procesate: ${this.stats.processedRecords}`)
    console.log(`   - Intrări persistent noi: ${this.stats.persistentEntries}`)
    console.log(`   - Înregistrări invalide omise: ${this.stats.skippedInvalid}`)
    console.log(`   - Erori: ${this.stats.errors}`)

    // Salvează persistent cache
    await this.savePersistentCache(newPersistentEntries)

    console.log('✅ Popularea persistent cache completă!')
  }

  async processAirportData(
    airportCode, 
    sqliteType, 
    cacheType, 
    existingKeys,
    newPersistentEntries
  ) {
    // Obține datele din SQLite - doar date recente și valide
    const query = `
      SELECT * FROM historical_flights 
      WHERE airport_iata = ? 
        AND flight_type = ?
        AND request_date >= date('now', '-30 days')
        AND flight_number IS NOT NULL
        AND flight_number != ''
        AND origin_code IS NOT NULL
        AND destination_code IS NOT NULL
        AND scheduled_time IS NOT NULL
      ORDER BY request_date DESC, scheduled_time DESC
      LIMIT 200
    `
    
    try {
      const records = this.db.prepare(query).all(airportCode, sqliteType)
      
      if (records.length === 0) {
        console.log(`   ⚠️  ${cacheType} - nu există date valide în SQLite (ultimele 30 zile)`)
        return
      }

      console.log(`   📥 ${cacheType} - găsite ${records.length} înregistrări`)

      // Filtrează și validează datele - DOAR REAL DATA (per cache-management-rules.md)
      const validRecords = records.filter(record => {
        // Verifică că nu sunt date mock/demo/test
        const flightNumber = record.flight_number || ''
        const airlineName = record.airline_name || ''
        
        // Exclude orice date care par false
        if (flightNumber.includes('TEST') || 
            flightNumber.includes('DEMO') || 
            flightNumber.includes('MOCK') ||
            airlineName.includes('Test') ||
            airlineName.includes('Demo') ||
            airlineName.includes('Mock')) {
          this.stats.skippedInvalid++
          return false
        }

        // Verifică codurile IATA (per airport-mapping-rules.md)
        if (!record.origin_code.match(/^[A-Z]{3}$/) || 
            !record.destination_code.match(/^[A-Z]{3}$/)) {
          this.stats.skippedInvalid++
          return false
        }

        return true
      })

      if (validRecords.length === 0) {
        console.log(`   ⚠️  ${cacheType} - nu există date valide după filtrare`)
        return
      }

      console.log(`   ✅ ${cacheType} - ${validRecords.length} înregistrări valide după filtrare`)

      // Adaugă în persistent cache - doar date valide
      let addedCount = 0
      validRecords.forEach(record => {
        this.stats.processedRecords++
        
        const persistentData = this.convertSQLiteToPersistentData(record)
        
        if (!existingKeys.has(persistentData.key)) {
          newPersistentEntries[persistentData.key] = persistentData.data
          existingKeys.add(persistentData.key) // Previne duplicate în aceeași rulare
          this.stats.persistentEntries++
          addedCount++
        }
      })

      console.log(`   ✅ ${cacheType} - ${addedCount} zboruri REALE adăugate în persistent cache`)

    } catch (error) {
      console.error(`   ❌ ${cacheType} - eroare:`, error.message)
      this.stats.errors++
    }
  }

  async savePersistentCache(persistentData) {
    console.log('\n💾 Salvare persistent cache...')

    try {
      await fs.writeFile(PERSISTENT_CACHE_PATH, JSON.stringify(persistentData, null, 2))
      console.log(`✅ Persistent cache salvat: ${Object.keys(persistentData).length} intrări`)
    } catch (error) {
      console.error('❌ Eroare la salvare persistent cache:', error)
      throw error
    }
  }

  async cleanup() {
    if (this.db) {
      this.db.close()
      console.log('🔒 Conexiune SQLite închisă')
    }
  }
}

// Funcția principală
async function main() {
  const restorer = new ForcedCacheRestorer()

  try {
    await restorer.initialize()
    await restorer.populatePersistentCache()
    
    console.log('\n🎉 Popularea persistent cache din SQLite a fost completată cu succes!')
    console.log('\n📋 Următorii pași:')
    console.log('   1. Verifică flights_cache.json pentru datele restaurate')
    console.log('   2. Repornește aplicația pentru a încărca noile date')
    console.log('   3. Testează API-urile pentru a confirma funcționarea')
    console.log('   4. Verifică că statisticile se generează corect')

    console.log('\n🔧 COMENZI DE TEST:')
    console.log('   # Testează API-ul pentru OTP arrivals')
    console.log('   curl https://anyway.ro/api/flights/OTP/arrivals')
    console.log('')
    console.log('   # Testează statisticile')
    console.log('   curl https://anyway.ro/api/statistici-aeroporturi')

  } catch (error) {
    console.error('\n❌ Eroare în timpul populării:', error.message)
    process.exit(1)
  } finally {
    await restorer.cleanup()
  }
}

// Rulează scriptul
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { ForcedCacheRestorer }