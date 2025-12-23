#!/usr/bin/env node

/**
 * Script pentru verificarea conținutului SQLite database
 * Afișează statistici și exemple de date din historical-flights.db
 */

const Database = require('better-sqlite3')
const path = require('path')

const SQLITE_PATH = path.join(process.cwd(), 'data', 'historical-flights.db')

async function checkSQLiteContent() {
  console.log('🔍 Verificarea conținutului SQLite database...')
  console.log(`📁 Path: ${SQLITE_PATH}`)

  let db
  try {
    db = new Database(SQLITE_PATH, { readonly: true })
    console.log('✅ Database conectat cu succes')

    // Verifică tabelele
    console.log('\n📋 TABELE DISPONIBILE:')
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    tables.forEach(table => {
      console.log(`   - ${table.name}`)
    })

    if (!tables.find(t => t.name === 'historical_flights')) {
      console.log('❌ Tabela historical_flights nu există!')
      return
    }

    // Statistici generale
    console.log('\n📊 STATISTICI GENERALE:')
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM historical_flights').get()
    console.log(`   Total înregistrări: ${totalRecords.count}`)

    if (totalRecords.count === 0) {
      console.log('⚠️  Nu există date în tabela historical_flights')
      return
    }

    // Aeroporturi
    console.log('\n🏢 AEROPORTURI (IATA):')
    const airports = db.prepare(`
      SELECT airport_iata, COUNT(*) as count 
      FROM historical_flights 
      GROUP BY airport_iata 
      ORDER BY count DESC
    `).all()
    
    airports.forEach(airport => {
      console.log(`   ${airport.airport_iata}: ${airport.count} înregistrări`)
    })

    // Tipuri de zboruri
    console.log('\n✈️  TIPURI ZBORURI:')
    const flightTypes = db.prepare(`
      SELECT flight_type, COUNT(*) as count 
      FROM historical_flights 
      GROUP BY flight_type
    `).all()
    
    flightTypes.forEach(type => {
      console.log(`   ${type.flight_type}: ${type.count} înregistrări`)
    })

    // Perioada datelor
    console.log('\n📅 PERIOADA DATELOR:')
    const dateRange = db.prepare(`
      SELECT 
        MIN(request_date) as oldest,
        MAX(request_date) as newest,
        COUNT(DISTINCT request_date) as unique_dates
      FROM historical_flights
    `).get()
    
    console.log(`   Cea mai veche: ${dateRange.oldest}`)
    console.log(`   Cea mai nouă: ${dateRange.newest}`)
    console.log(`   Zile unice: ${dateRange.unique_dates}`)

    // Companii aeriene
    console.log('\n🛫 TOP COMPANII AERIENE:')
    const airlines = db.prepare(`
      SELECT airline_code, airline_name, COUNT(*) as count 
      FROM historical_flights 
      WHERE airline_code IS NOT NULL
      GROUP BY airline_code, airline_name 
      ORDER BY count DESC 
      LIMIT 10
    `).all()
    
    airlines.forEach(airline => {
      console.log(`   ${airline.airline_code} (${airline.airline_name || 'N/A'}): ${airline.count}`)
    })

    // Exemple de date pentru fiecare aeroport suportat
    console.log('\n📝 EXEMPLE DE DATE (ultimele 5 pentru fiecare aeroport):')
    const supportedAirports = ['OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'RMO']
    
    for (const airportCode of supportedAirports) {
      const examples = db.prepare(`
        SELECT flight_number, airline_code, origin_code, destination_code, 
               scheduled_time, status, flight_type, request_date
        FROM historical_flights 
        WHERE airport_iata = ?
        ORDER BY request_date DESC, scheduled_time DESC
        LIMIT 3
      `).all(airportCode)

      if (examples.length > 0) {
        console.log(`\n   ${airportCode} (${examples.length} exemple):`)
        examples.forEach(flight => {
          console.log(`     ${flight.flight_number} | ${flight.origin_code}→${flight.destination_code} | ${flight.status} | ${flight.request_date}`)
        })
      } else {
        console.log(`\n   ${airportCode}: Nu există date`)
      }
    }

    // Verifică calitatea datelor
    console.log('\n🔍 CALITATEA DATELOR:')
    const quality = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN flight_number IS NULL OR flight_number = '' THEN 1 ELSE 0 END) as missing_flight_number,
        SUM(CASE WHEN origin_code IS NULL OR origin_code = '' THEN 1 ELSE 0 END) as missing_origin,
        SUM(CASE WHEN destination_code IS NULL OR destination_code = '' THEN 1 ELSE 0 END) as missing_destination,
        SUM(CASE WHEN scheduled_time IS NULL OR scheduled_time = '' THEN 1 ELSE 0 END) as missing_scheduled_time,
        SUM(CASE WHEN actual_time IS NOT NULL AND actual_time != '' THEN 1 ELSE 0 END) as has_actual_time,
        SUM(CASE WHEN delay_minutes > 0 THEN 1 ELSE 0 END) as has_delay_data
      FROM historical_flights
    `).get()

    console.log(`   Total înregistrări: ${quality.total}`)
    console.log(`   Lipsă număr zbor: ${quality.missing_flight_number}`)
    console.log(`   Lipsă origine: ${quality.missing_origin}`)
    console.log(`   Lipsă destinație: ${quality.missing_destination}`)
    console.log(`   Lipsă oră programată: ${quality.missing_scheduled_time}`)
    console.log(`   Cu oră reală: ${quality.has_actual_time}`)
    console.log(`   Cu date întârziere: ${quality.has_delay_data}`)

    const completenessPercentage = quality.total > 0 
      ? Math.round(((quality.total - quality.missing_flight_number - quality.missing_origin - quality.missing_destination - quality.missing_scheduled_time) / quality.total) * 100)
      : 0
    
    console.log(`   Completitudine: ${completenessPercentage}%`)

    // Verifică date recente (ultimele 30 zile)
    console.log('\n📈 DATE RECENTE (ultimele 30 zile):')
    const recentData = db.prepare(`
      SELECT 
        airport_iata,
        flight_type,
        COUNT(*) as count
      FROM historical_flights 
      WHERE request_date >= date('now', '-30 days')
      GROUP BY airport_iata, flight_type
      ORDER BY airport_iata, flight_type
    `).all()

    if (recentData.length > 0) {
      recentData.forEach(data => {
        console.log(`   ${data.airport_iata} ${data.flight_type}: ${data.count} înregistrări`)
      })
    } else {
      console.log('   ⚠️  Nu există date din ultimele 30 zile')
    }

    console.log('\n✅ Verificarea completă!')

  } catch (error) {
    console.error('❌ Eroare:', error.message)
    
    if (error.code === 'ENOENT') {
      console.log('\n💡 SOLUȚII:')
      console.log('   1. Verifică că fișierul historical-flights.db există în directorul data/')
      console.log('   2. Verifică că aplicația a rulat și a populat database-ul')
      console.log('   3. Verifică permisiunile de citire pentru fișier')
    }
  } finally {
    if (db) {
      db.close()
      console.log('🔒 Conexiune database închisă')
    }
  }
}

// Rulează scriptul
if (require.main === module) {
  checkSQLiteContent().catch(console.error)
}

module.exports = { checkSQLiteContent }