#!/usr/bin/env node

/**
 * Master Script pentru restabilirea completă a cache-ului din SQLite
 * Orchestrează întregul proces de backup, restabilire și validare
 * 
 * Respectă toate regulile:
 * - airport-mapping-rules.md: Doar coduri IATA
 * - cache-management-rules.md: Doar date reale, fără mock/demo
 * - troubleshooting-guide.md: Proceduri sigure
 */

const { execSync } = require('child_process')
const fs = require('fs').promises
const path = require('path')

class MasterCacheRestorer {
  constructor() {
    this.startTime = new Date()
    this.steps = [
      { name: 'Verificare prerequisite', status: 'pending' },
      { name: 'Backup cache curent', status: 'pending' },
      { name: 'Validare SQLite', status: 'pending' },
      { name: 'Restabilire din SQLite', status: 'pending' },
      { name: 'Validare finală', status: 'pending' },
      { name: 'Verificare integritate', status: 'pending' }
    ]
  }

  updateStepStatus(stepIndex, status, message = '') {
    this.steps[stepIndex].status = status
    this.steps[stepIndex].message = message
    this.printProgress()
  }

  printProgress() {
    console.clear()
    console.log('🚀 MASTER CACHE RESTORE - Flight Schedule Application')
    console.log('=' .repeat(60))
    console.log(`⏰ Început: ${this.startTime.toLocaleString()}`)
    console.log(`⏱️  Durată: ${Math.round((new Date() - this.startTime) / 1000)}s`)
    console.log('')

    this.steps.forEach((step, index) => {
      let icon = '⏳'
      if (step.status === 'completed') icon = '✅'
      else if (step.status === 'failed') icon = '❌'
      else if (step.status === 'running') icon = '🔄'

      console.log(`${icon} ${index + 1}. ${step.name}`)
      if (step.message) {
        console.log(`   ${step.message}`)
      }
    })
    console.log('')
  }

  async checkPrerequisites() {
    this.updateStepStatus(0, 'running', 'Verificare fișiere și dependințe...')

    const requiredFiles = [
      'data/historical-flights.db',
      'scripts/backup-current-cache.js',
      'scripts/restore-cache-from-sqlite.js',
      'scripts/validate-sqlite-restore.js'
    ]

    const missingFiles = []
    for (const file of requiredFiles) {
      try {
        await fs.access(file)
      } catch {
        missingFiles.push(file)
      }
    }

    if (missingFiles.length > 0) {
      this.updateStepStatus(0, 'failed', `Fișiere lipsă: ${missingFiles.join(', ')}`)
      throw new Error('Prerequisite nu sunt îndeplinite')
    }

    // Verifică că Node.js are modulele necesare
    try {
      require('better-sqlite3')
    } catch {
      this.updateStepStatus(0, 'failed', 'Modulul better-sqlite3 nu este instalat')
      throw new Error('Rulează: npm install better-sqlite3')
    }

    this.updateStepStatus(0, 'completed', 'Toate prerequisitele sunt îndeplinite')
  }

  async createBackup() {
    this.updateStepStatus(1, 'running', 'Crearea backup-ului cache-ului curent...')

    try {
      const { createBackup } = require('./backup-current-cache.js')
      await createBackup()
      this.updateStepStatus(1, 'completed', 'Backup creat cu succes')
    } catch (error) {
      this.updateStepStatus(1, 'failed', `Eroare backup: ${error.message}`)
      throw error
    }
  }

  async validateSQLite() {
    this.updateStepStatus(2, 'running', 'Validarea structurii SQLite...')

    try {
      // Rulează validatorul pentru SQLite
      const { CacheValidator } = require('./validate-sqlite-restore.js')
      const validator = new CacheValidator()
      
      await validator.initialize()
      await validator.validateSQLiteStructure()
      
      if (!validator.validationResults.sqliteStructure.passed) {
        const errors = validator.validationResults.sqliteStructure.errors.join(', ')
        this.updateStepStatus(2, 'failed', `Erori SQLite: ${errors}`)
        throw new Error('SQLite validation failed')
      }

      await validator.cleanup()
      this.updateStepStatus(2, 'completed', 'SQLite valid și gata pentru restabilire')
    } catch (error) {
      this.updateStepStatus(2, 'failed', `Eroare validare SQLite: ${error.message}`)
      throw error
    }
  }

  async restoreFromSQLite() {
    this.updateStepStatus(3, 'running', 'Restabilirea cache-ului din SQLite...')

    try {
      const { CacheRestorer } = require('./restore-cache-from-sqlite.js')
      const restorer = new CacheRestorer()
      
      await restorer.initialize()
      await restorer.restoreFromSQLite()
      await restorer.cleanup()

      const stats = restorer.stats
      const message = `${stats.cacheEntries} intrări cache, ${stats.persistentEntries} intrări persistent`
      this.updateStepStatus(3, 'completed', message)
    } catch (error) {
      this.updateStepStatus(3, 'failed', `Eroare restabilire: ${error.message}`)
      throw error
    }
  }

  async validateFinal() {
    this.updateStepStatus(4, 'running', 'Validarea finală a cache-ului restaurat...')

    try {
      const { CacheValidator } = require('./validate-sqlite-restore.js')
      const validator = new CacheValidator()
      
      await validator.initialize()
      await validator.runAllValidations()
      
      // Verifică că toate validările au trecut
      const results = validator.validationResults
      const failedValidations = Object.keys(results).filter(key => !results[key].passed)
      
      if (failedValidations.length > 0) {
        const message = `Validări eșuate: ${failedValidations.join(', ')}`
        this.updateStepStatus(4, 'failed', message)
        
        // Afișează detaliile erorilor
        console.log('\n❌ DETALII ERORI VALIDARE:')
        failedValidations.forEach(validation => {
          console.log(`\n${validation}:`)
          results[validation].errors.forEach(error => {
            console.log(`  - ${error}`)
          })
        })
        
        throw new Error('Final validation failed')
      }

      await validator.cleanup()
      this.updateStepStatus(4, 'completed', 'Toate validările au trecut')
    } catch (error) {
      this.updateStepStatus(4, 'failed', `Eroare validare finală: ${error.message}`)
      throw error
    }
  }

  async checkIntegrity() {
    this.updateStepStatus(5, 'running', 'Verificarea integrității finale...')

    try {
      // Verifică că fișierele cache există și au dimensiuni rezonabile
      const cacheStats = await fs.stat('data/cache-data.json')
      const persistentStats = await fs.stat('data/flights_cache.json')

      if (cacheStats.size < 100) {
        throw new Error('Cache-ul principal pare să fie gol')
      }

      if (persistentStats.size < 100) {
        throw new Error('Persistent cache-ul pare să fie gol')
      }

      // Verifică că datele sunt JSON valid
      const cacheData = JSON.parse(await fs.readFile('data/cache-data.json', 'utf-8'))
      const persistentData = JSON.parse(await fs.readFile('data/flights_cache.json', 'utf-8'))

      const flightEntries = cacheData.filter(entry => entry.category === 'flightData').length
      const persistentEntries = Object.keys(persistentData).length

      const message = `${flightEntries} intrări flight data, ${persistentEntries} intrări persistent`
      this.updateStepStatus(5, 'completed', message)

    } catch (error) {
      this.updateStepStatus(5, 'failed', `Eroare integritate: ${error.message}`)
      throw error
    }
  }

  async runComplete() {
    try {
      this.printProgress()
      
      await this.checkPrerequisites()
      await this.createBackup()
      await this.validateSQLite()
      await this.restoreFromSQLite()
      await this.validateFinal()
      await this.checkIntegrity()

      // Succes complet
      console.log('\n🎉 RESTABILIREA CACHE-ULUI A FOST COMPLETATĂ CU SUCCES!')
      console.log('\n📋 URMĂTORII PAȘI:')
      console.log('   1. ✅ Cache-ul a fost restaurat din SQLite')
      console.log('   2. ✅ Toate validările au trecut')
      console.log('   3. ✅ Backup-ul a fost creat în data/backups/')
      console.log('   4. 🔄 Repornește aplicația pentru a încărca noile date')
      console.log('   5. 🧪 Testează API-urile pentru a confirma funcționarea')
      
      console.log('\n🔧 COMENZI DE TEST:')
      console.log('   # Testează API-ul pentru OTP arrivals')
      console.log('   curl https://anyway.ro/api/flights/OTP/arrivals')
      console.log('')
      console.log('   # Testează statisticile')
      console.log('   curl https://anyway.ro/api/statistici-aeroporturi')
      console.log('')
      console.log('   # Verifică admin panel')
      console.log('   # Deschide: https://anyway.ro/admin')

      const duration = Math.round((new Date() - this.startTime) / 1000)
      console.log(`\n⏱️  Durată totală: ${duration} secunde`)

    } catch (error) {
      console.log('\n❌ RESTABILIREA A EȘUAT!')
      console.log(`\n🔍 Eroare: ${error.message}`)
      console.log('\n🔧 SOLUȚII:')
      console.log('   1. Verifică că SQLite database-ul există și este valid')
      console.log('   2. Verifică că ai permisiuni de scriere în directorul data/')
      console.log('   3. Verifică că modulul better-sqlite3 este instalat')
      console.log('   4. Rulează scripturile individual pentru debugging')
      console.log('\n📁 Backup-ul cache-ului original este în data/backups/')
      
      process.exit(1)
    }
  }
}

// Funcția principală
async function main() {
  console.log('🚀 Începe Master Cache Restore Process...')
  console.log('📋 Acest script va:')
  console.log('   1. Crea backup pentru cache-ul curent')
  console.log('   2. Valida SQLite database-ul')
  console.log('   3. Restabili cache-ul din SQLite')
  console.log('   4. Valida rezultatul final')
  console.log('   5. Verifica integritatea datelor')
  console.log('')
  console.log('⚠️  IMPORTANT: Respectă toate regulile aplicației')
  console.log('   - Doar coduri IATA (airport-mapping-rules.md)')
  console.log('   - Doar date reale (cache-management-rules.md)')
  console.log('   - Proceduri sigure (troubleshooting-guide.md)')
  console.log('')

  // Confirmă că utilizatorul vrea să continue
  console.log('🤔 Continui cu restabilirea? (Ctrl+C pentru a anula)')
  
  // Așteaptă 3 secunde pentru a permite anularea
  await new Promise(resolve => setTimeout(resolve, 3000))

  const restorer = new MasterCacheRestorer()
  await restorer.runComplete()
}

// Rulează scriptul
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { MasterCacheRestorer }