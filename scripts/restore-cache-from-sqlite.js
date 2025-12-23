#!/usr/bin/env node

/**
 * Script pentru restabilirea cache-ului din SQLite și adăugarea în JSON cu persistent cache
 * Acest script va:
 * 1. Citi datele din SQLite (historical-flights.db)
 * 2. Le va converti în formatul cache-ului JSON
 * 3. Le va adăuga în cache-data.json
 * 4. Va actualiza persistent cache-ul
 */

const Database = require('better-sqlite3')
const fs = require('fs').promises
const path = require('path')

// Paths
const DATA_DIR = path.join(process.cwd(), 'data')
const SQLITE_PATH = path.join(DATA_DIR, 'historical-flights.db')
const CACHE_DATA_PATH = path.join(DATA_DIR, 'cache-data.json')
const PERSISTENT_CACHE_PATH = path.join(DATA_DIR, 'flights_cache.json')

// Supported airports (IATA codes only)
const SUPPORTED_AIRPORTS = [
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 
  'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'
]

class CacheRestorer {
  constructor() {
    this.db = null
    this.stats = {
      totalRecords: 0,
      processedRecords: 0,
      cacheEntries: 0,
      persistentEntries: 0,
      errors: 0
    }
  }

  async initialize() {
    console.log('🚀 Inițializare Cache Restorer...')
    
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

    // Verifică structura tabelei
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    console.log('📋 Tabele disponibile:', tables.map(t => t.name).join(', '))

    if (!tables.find(t => t.name === 'historical_flights')) {
      throw new Error('❌ Tabela historical_flights nu există în database')
    }

    // Obține statistici inițiale
    const totalRecords = this.db.prepare('SELECT COUNT(*) as count FROM historical_flights').get()
    this.stats.totalRecords = totalRecords.count
    console.log(`📊 Total înregistrări în SQLite: ${this.stats.totalRecords}`)
  }

  async loadExistingCache() {
    console.log('📂 Încărcare cache existent...')
    
    try {
      const cacheData = await fs.readFile(CACHE_DATA_PATH, 'utf-8')
      const existingCache = JSON.parse(cacheData)
      console.log(`✅ Cache existent încărcat: ${existingCache.length} intrări`)
      return existingCache
    } catch (error) {
      console.log('⚠️  Nu există cache existent, se va crea unul nou')
      return []
    }
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

  convertSQLiteToFlightData(record) {
    return {
      flight_number: record.flight_number,
      airline: {
        code: record.airline_code,
        name: record.airline_name || 'Unknown'
      },
      origin: {
        code: record.origin_code,
        name: record.origin_name || record.origin_code,
        city: this.getCityFromAirportCode(record.origin_code)
      },
      destination: {
        code: record.destination_code,
        name: record.destination_name || record.destination_code,
        city: this.getCityFromAirportCode(record.destination_code)
      },
      scheduled_time: record.scheduled_time,
      actual_time: record.actual_time || undefined,
      estimated_time: record.estimated_time || undefined,
      status: record.status,
      delay: record.delay_minutes || 0
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

  async restoreFromSQLite() {
    console.log('🔄 Începe restabilirea din SQLite...')

    // Încarcă cache-urile existente
    const existingCache = await this.loadExistingCache()
    const existingPersistent = await this.loadExistingPersistentCache()

    // Creează map-uri pentru verificarea duplicatelor
    const existingCacheKeys = new Set()
    existingCache.forEach(entry => {
      if (entry.category === 'flightData') {
        existingCacheKeys.add(entry.key)
      }
    })

    const existingPersistentKeys = new Set(Object.keys(existingPersistent))

    // Procesează fiecare aeroport suportat
    const newCacheEntries = []
    const newPersistentEntries = { ...existingPersistent }

    for (const airportCode of SUPPORTED_AIRPORTS) {
      console.log(`\n🏢 Procesare aeroport: ${airportCode}`)

      // Procesează arrivals
      await this.processAirportData(
        airportCode, 
        'arrival', 
        'arrivals',
        existingCacheKeys,
        existingPersistentKeys,
        newCacheEntries,
        newPersistentEntries
      )

      // Procesează departures
      await this.processAirportData(
        airportCode, 
        'departure', 
        'departures',
        existingCacheKeys,
        existingPersistentKeys,
        newCacheEntries,
        newPersistentEntries
      )
    }

    // Combină cache-urile
    const finalCache = [...existingCache, ...newCacheEntries]
    
    console.log(`\n📊 Statistici finale:`)
    console.log(`   - Total înregistrări SQLite: ${this.stats.totalRecords}`)
    console.log(`   - Înregistrări procesate: ${this.stats.processedRecords}`)
    console.log(`   - Intrări cache noi: ${this.stats.cacheEntries}`)
    console.log(`   - Intrări persistent noi: ${this.stats.persistentEntries}`)
    console.log(`   - Erori: ${this.stats.errors}`)

    // Salvează cache-urile
    await this.saveCaches(finalCache, newPersistentEntries)

    console.log('✅ Restabilire completă!')
  }

  async processAirportData(
    airportCode, 
    sqliteType, 
    cacheType, 
    existingCacheKeys,
    existingPersistentKeys,
    newCacheEntries,
    newPersistentEntries
  ) {
    const cacheKey = `${airportCode}_${cacheType}`
    
    // Verifică dacă există deja în cache
    if (existingCacheKeys.has(cacheKey)) {
      console.log(`   ⏭️  ${cacheType} - există deja în cache`)
      return
    }

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

      console.log(`   📥 ${cacheType} - găsite ${records.length} înregistrări valide`)

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
          return false
        }

        // Verifică codurile IATA (per airport-mapping-rules.md)
        if (!record.origin_code.match(/^[A-Z]{3}$/) || 
            !record.destination_code.match(/^[A-Z]{3}$/)) {
          return false
        }

        return true
      })

      if (validRecords.length === 0) {
        console.log(`   ⚠️  ${cacheType} - nu există date valide după filtrare`)
        return
      }

      console.log(`   ✅ ${cacheType} - ${validRecords.length} înregistrări valide după filtrare`)

      // Convertește la format cache
      const flightData = validRecords.map(record => {
        this.stats.processedRecords++
        return this.convertSQLiteToFlightData(record)
      })

      // Creează intrarea cache - DOAR cu date reale
      const cacheEntry = {
        id: `flight_${cacheKey}_${Date.now()}`,
        category: 'flightData',
        key: cacheKey,
        data: flightData,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 zile
        lastAccessed: new Date().toISOString(),
        source: 'historical', // Marchează ca historical pentru a indica sursa
        success: true
      }

      newCacheEntries.push(cacheEntry)
      this.stats.cacheEntries++

      // Adaugă în persistent cache - doar date valide
      validRecords.forEach(record => {
        const persistentData = this.convertSQLiteToPersistentData(record)
        
        if (!existingPersistentKeys.has(persistentData.key)) {
          newPersistentEntries[persistentData.key] = persistentData.data
          this.stats.persistentEntries++
        }
      })

      console.log(`   ✅ ${cacheType} - ${flightData.length} zboruri REALE adăugate`)

    } catch (error) {
      console.error(`   ❌ ${cacheType} - eroare:`, error.message)
      this.stats.errors++
    }
  }

  async saveCaches(cacheData, persistentData) {
    console.log('\n💾 Salvare cache-uri...')

    try {
      // Salvează cache-ul principal
      await fs.writeFile(CACHE_DATA_PATH, JSON.stringify(cacheData, null, 2))
      console.log(`✅ Cache principal salvat: ${cacheData.length} intrări`)

      // Salvează persistent cache
      await fs.writeFile(PERSISTENT_CACHE_PATH, JSON.stringify(persistentData, null, 2))
      console.log(`✅ Persistent cache salvat: ${Object.keys(persistentData).length} intrări`)

    } catch (error) {
      console.error('❌ Eroare la salvare:', error)
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
  const restorer = new CacheRestorer()

  try {
    await restorer.initialize()
    await restorer.restoreFromSQLite()
    
    console.log('\n🎉 Restabilirea cache-ului din SQLite a fost completată cu succes!')
    console.log('\n📋 Următorii pași:')
    console.log('   1. Verifică cache-data.json pentru datele restaurate')
    console.log('   2. Verifică flights_cache.json pentru persistent cache')
    console.log('   3. Repornește aplicația pentru a încărca noile date')
    console.log('   4. Testează API-urile pentru a confirma funcționarea')

  } catch (error) {
    console.error('\n❌ Eroare în timpul restabilirii:', error.message)
    process.exit(1)
  } finally {
    await restorer.cleanup()
  }
}

// Rulează scriptul
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { CacheRestorer }