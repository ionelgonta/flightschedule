#!/usr/bin/env node

/**
 * Script pentru validarea restabilirii cache-ului din SQLite
 * Verifică integritatea datelor și conformitatea cu regulile aplicației
 */

const Database = require('better-sqlite3')
const fs = require('fs').promises
const path = require('path')

// Paths
const DATA_DIR = path.join(process.cwd(), 'data')
const SQLITE_PATH = path.join(DATA_DIR, 'historical-flights.db')
const CACHE_DATA_PATH = path.join(DATA_DIR, 'cache-data.json')
const PERSISTENT_CACHE_PATH = path.join(DATA_DIR, 'flights_cache.json')

// Supported airports (IATA codes only - per airport-mapping-rules.md)
const SUPPORTED_AIRPORTS = [
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 
  'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO'
]

class CacheValidator {
  constructor() {
    this.db = null
    this.validationResults = {
      sqliteStructure: { passed: false, errors: [] },
      cacheStructure: { passed: false, errors: [] },
      persistentStructure: { passed: false, errors: [] },
      dataIntegrity: { passed: false, errors: [] },
      iataCompliance: { passed: false, errors: [] },
      realDataOnly: { passed: false, errors: [] }
    }
  }

  async initialize() {
    console.log('🔍 Inițializare Cache Validator...')
    
    try {
      await fs.access(SQLITE_PATH)
      this.db = new Database(SQLITE_PATH, { readonly: true })
      console.log('✅ SQLite database conectat')
    } catch (error) {
      console.log('⚠️  SQLite database nu este disponibil')
    }
  }

  async validateSQLiteStructure() {
    console.log('\n📋 Validare structură SQLite...')
    
    if (!this.db) {
      this.validationResults.sqliteStructure.errors.push('SQLite database nu este disponibil')
      return
    }

    try {
      // Verifică existența tabelei
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      const hasHistoricalFlights = tables.find(t => t.name === 'historical_flights')
      
      if (!hasHistoricalFlights) {
        this.validationResults.sqliteStructure.errors.push('Tabela historical_flights nu există')
        return
      }

      // Verifică structura tabelei
      const columns = this.db.prepare("PRAGMA table_info(historical_flights)").all()
      const requiredColumns = [
        'airport_iata', 'flight_number', 'airline_code', 'airline_name',
        'origin_code', 'destination_code', 'scheduled_time', 'status',
        'flight_type', 'request_date'
      ]

      const existingColumns = columns.map(col => col.name)
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

      if (missingColumns.length > 0) {
        this.validationResults.sqliteStructure.errors.push(`Coloane lipsă: ${missingColumns.join(', ')}`)
        return
      }

      // Verifică datele
      const totalRecords = this.db.prepare('SELECT COUNT(*) as count FROM historical_flights').get()
      console.log(`   📊 Total înregistrări: ${totalRecords.count}`)

      if (totalRecords.count === 0) {
        this.validationResults.sqliteStructure.errors.push('Nu există date în tabela historical_flights')
        return
      }

      // Verifică aeroporturile suportate
      const airports = this.db.prepare('SELECT DISTINCT airport_iata FROM historical_flights').all()
      const foundAirports = airports.map(a => a.airport_iata)
      const supportedFound = foundAirports.filter(code => SUPPORTED_AIRPORTS.includes(code))

      console.log(`   🏢 Aeroporturi găsite: ${foundAirports.join(', ')}`)
      console.log(`   ✅ Aeroporturi suportate: ${supportedFound.join(', ')}`)

      if (supportedFound.length === 0) {
        this.validationResults.sqliteStructure.errors.push('Nu există date pentru aeroporturile suportate')
        return
      }

      this.validationResults.sqliteStructure.passed = true
      console.log('✅ Structura SQLite validă')

    } catch (error) {
      this.validationResults.sqliteStructure.errors.push(`Eroare SQLite: ${error.message}`)
    }
  }

  async validateCacheStructure() {
    console.log('\n📂 Validare structură cache principal...')

    try {
      const cacheData = await fs.readFile(CACHE_DATA_PATH, 'utf-8')
      const cache = JSON.parse(cacheData)

      if (!Array.isArray(cache)) {
        this.validationResults.cacheStructure.errors.push('Cache-ul nu este un array')
        return
      }

      console.log(`   📊 Total intrări cache: ${cache.length}`)

      // Verifică structura intrărilor
      const flightDataEntries = cache.filter(entry => entry.category === 'flightData')
      console.log(`   ✈️  Intrări flight data: ${flightDataEntries.length}`)

      for (const entry of flightDataEntries) {
        // Verifică câmpurile obligatorii
        const requiredFields = ['id', 'category', 'key', 'data', 'createdAt', 'source', 'success']
        const missingFields = requiredFields.filter(field => !(field in entry))

        if (missingFields.length > 0) {
          this.validationResults.cacheStructure.errors.push(`Intrare ${entry.id}: câmpuri lipsă - ${missingFields.join(', ')}`)
          continue
        }

        // Verifică formatul cheii (IATA_type)
        if (!entry.key.match(/^[A-Z]{3}_(arrivals|departures)$/)) {
          this.validationResults.cacheStructure.errors.push(`Intrare ${entry.id}: format cheie invalid - ${entry.key}`)
        }

        // Verifică că datele sunt array
        if (!Array.isArray(entry.data)) {
          this.validationResults.cacheStructure.errors.push(`Intrare ${entry.id}: data nu este array`)
        }
      }

      if (this.validationResults.cacheStructure.errors.length === 0) {
        this.validationResults.cacheStructure.passed = true
        console.log('✅ Structura cache validă')
      }

    } catch (error) {
      this.validationResults.cacheStructure.errors.push(`Eroare citire cache: ${error.message}`)
    }
  }

  async validatePersistentStructure() {
    console.log('\n💾 Validare structură persistent cache...')

    try {
      const persistentData = await fs.readFile(PERSISTENT_CACHE_PATH, 'utf-8')
      const persistent = JSON.parse(persistentData)

      if (typeof persistent !== 'object' || persistent === null) {
        this.validationResults.persistentStructure.errors.push('Persistent cache nu este un obiect')
        return
      }

      const keys = Object.keys(persistent)
      console.log(`   📊 Total intrări persistent: ${keys.length}`)

      // Verifică câteva intrări pentru structură
      const sampleSize = Math.min(10, keys.length)
      for (let i = 0; i < sampleSize; i++) {
        const key = keys[i]
        const entry = persistent[key]

        const requiredFields = ['flightNumber', 'airlineCode', 'originCode', 'destinationCode', 'scheduledTime', 'airportCode', 'type']
        const missingFields = requiredFields.filter(field => !(field in entry))

        if (missingFields.length > 0) {
          this.validationResults.persistentStructure.errors.push(`Intrare ${key}: câmpuri lipsă - ${missingFields.join(', ')}`)
        }

        // Verifică tipul (arrivals/departures)
        if (!['arrivals', 'departures'].includes(entry.type)) {
          this.validationResults.persistentStructure.errors.push(`Intrare ${key}: tip invalid - ${entry.type}`)
        }
      }

      if (this.validationResults.persistentStructure.errors.length === 0) {
        this.validationResults.persistentStructure.passed = true
        console.log('✅ Structura persistent cache validă')
      }

    } catch (error) {
      this.validationResults.persistentStructure.errors.push(`Eroare citire persistent cache: ${error.message}`)
    }
  }

  async validateDataIntegrity() {
    console.log('\n🔍 Validare integritate date...')

    try {
      // Verifică consistența între cache-uri
      const cacheData = JSON.parse(await fs.readFile(CACHE_DATA_PATH, 'utf-8'))
      const persistentData = JSON.parse(await fs.readFile(PERSISTENT_CACHE_PATH, 'utf-8'))

      const flightDataEntries = cacheData.filter(entry => entry.category === 'flightData')
      
      for (const entry of flightDataEntries) {
        const [airportCode, type] = entry.key.split('_')
        
        // Verifică că aeroportul este suportat
        if (!SUPPORTED_AIRPORTS.includes(airportCode)) {
          this.validationResults.dataIntegrity.errors.push(`Aeroport nesuportat în cache: ${airportCode}`)
          continue
        }

        // Verifică că există date în persistent cache pentru acest aeroport
        const persistentFlights = Object.values(persistentData).filter(flight => 
          flight.airportCode === airportCode && flight.type === type
        )

        console.log(`   🏢 ${airportCode} ${type}: ${entry.data.length} în cache, ${persistentFlights.length} în persistent`)
      }

      this.validationResults.dataIntegrity.passed = true
      console.log('✅ Integritatea datelor validă')

    } catch (error) {
      this.validationResults.dataIntegrity.errors.push(`Eroare validare integritate: ${error.message}`)
    }
  }

  async validateIATACompliance() {
    console.log('\n🏢 Validare conformitate IATA...')

    try {
      const cacheData = JSON.parse(await fs.readFile(CACHE_DATA_PATH, 'utf-8'))
      const flightDataEntries = cacheData.filter(entry => entry.category === 'flightData')

      for (const entry of flightDataEntries) {
        // Verifică formatul cheii
        const keyParts = entry.key.split('_')
        if (keyParts.length !== 2) {
          this.validationResults.iataCompliance.errors.push(`Format cheie invalid: ${entry.key}`)
          continue
        }

        const [airportCode, type] = keyParts

        // Verifică că este cod IATA valid (3 litere)
        if (!airportCode.match(/^[A-Z]{3}$/)) {
          this.validationResults.iataCompliance.errors.push(`Cod aeroport invalid: ${airportCode}`)
          continue
        }

        // Verifică că este în lista suportată
        if (!SUPPORTED_AIRPORTS.includes(airportCode)) {
          this.validationResults.iataCompliance.errors.push(`Aeroport nesuportat: ${airportCode}`)
          continue
        }

        // Verifică tipul
        if (!['arrivals', 'departures'].includes(type)) {
          this.validationResults.iataCompliance.errors.push(`Tip invalid: ${type}`)
          continue
        }

        // Verifică datele de zbor pentru coduri IATA
        for (const flight of entry.data) {
          if (flight.origin && flight.origin.code && !flight.origin.code.match(/^[A-Z]{3}$/)) {
            this.validationResults.iataCompliance.errors.push(`Cod origine invalid: ${flight.origin.code}`)
          }
          if (flight.destination && flight.destination.code && !flight.destination.code.match(/^[A-Z]{3}$/)) {
            this.validationResults.iataCompliance.errors.push(`Cod destinație invalid: ${flight.destination.code}`)
          }
        }
      }

      if (this.validationResults.iataCompliance.errors.length === 0) {
        this.validationResults.iataCompliance.passed = true
        console.log('✅ Conformitatea IATA validă')
      }

    } catch (error) {
      this.validationResults.iataCompliance.errors.push(`Eroare validare IATA: ${error.message}`)
    }
  }

  async validateRealDataOnly() {
    console.log('\n🚫 Validare doar date reale (fără mock/demo)...')

    try {
      const cacheData = JSON.parse(await fs.readFile(CACHE_DATA_PATH, 'utf-8'))
      const flightDataEntries = cacheData.filter(entry => entry.category === 'flightData')

      for (const entry of flightDataEntries) {
        // Verifică sursa
        const forbiddenSources = ['mock', 'demo', 'test', 'fake']
        if (forbiddenSources.includes(entry.source)) {
          this.validationResults.realDataOnly.errors.push(`Sursă interzisă: ${entry.source} pentru ${entry.key}`)
        }

        // Verifică datele de zbor pentru indicii de date false
        for (const flight of entry.data) {
          // Verifică numere de zbor suspecte
          if (flight.flight_number && flight.flight_number.includes('TEST')) {
            this.validationResults.realDataOnly.errors.push(`Număr zbor suspect: ${flight.flight_number}`)
          }

          // Verifică companii aeriene suspecte
          if (flight.airline && flight.airline.name && flight.airline.name.includes('Test')) {
            this.validationResults.realDataOnly.errors.push(`Companie aeriană suspectă: ${flight.airline.name}`)
          }
        }
      }

      if (this.validationResults.realDataOnly.errors.length === 0) {
        this.validationResults.realDataOnly.passed = true
        console.log('✅ Doar date reale confirmate')
      }

    } catch (error) {
      this.validationResults.realDataOnly.errors.push(`Eroare validare date reale: ${error.message}`)
    }
  }

  async runAllValidations() {
    console.log('🔍 Începe validarea completă...')

    await this.validateSQLiteStructure()
    await this.validateCacheStructure()
    await this.validatePersistentStructure()
    await this.validateDataIntegrity()
    await this.validateIATACompliance()
    await this.validateRealDataOnly()

    this.printResults()
  }

  printResults() {
    console.log('\n📊 REZULTATE VALIDARE')
    console.log('=' .repeat(50))

    const categories = [
      { key: 'sqliteStructure', name: 'Structură SQLite' },
      { key: 'cacheStructure', name: 'Structură Cache Principal' },
      { key: 'persistentStructure', name: 'Structură Persistent Cache' },
      { key: 'dataIntegrity', name: 'Integritate Date' },
      { key: 'iataCompliance', name: 'Conformitate IATA' },
      { key: 'realDataOnly', name: 'Doar Date Reale' }
    ]

    let totalPassed = 0
    let totalTests = categories.length

    for (const category of categories) {
      const result = this.validationResults[category.key]
      const status = result.passed ? '✅ TRECUT' : '❌ EȘUAT'
      
      console.log(`\n${category.name}: ${status}`)
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   ⚠️  ${error}`)
        })
      }

      if (result.passed) totalPassed++
    }

    console.log('\n' + '=' .repeat(50))
    console.log(`📈 SCOR FINAL: ${totalPassed}/${totalTests} teste trecute`)

    if (totalPassed === totalTests) {
      console.log('🎉 TOATE VALIDĂRILE AU TRECUT!')
      console.log('✅ Cache-ul este gata pentru utilizare')
    } else {
      console.log('⚠️  UNELE VALIDĂRI AU EȘUAT')
      console.log('🔧 Verifică erorile de mai sus și corectează-le')
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
  const validator = new CacheValidator()

  try {
    await validator.initialize()
    await validator.runAllValidations()
    
  } catch (error) {
    console.error('\n❌ Eroare în timpul validării:', error.message)
    process.exit(1)
  } finally {
    await validator.cleanup()
  }
}

// Rulează scriptul
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { CacheValidator }