#!/usr/bin/env node

/**
 * Script pentru backup-ul cache-ului curent înainte de restabilire
 * Creează copii de siguranță pentru toate fișierele de cache
 */

const fs = require('fs').promises
const path = require('path')

const DATA_DIR = path.join(process.cwd(), 'data')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')

async function createBackup() {
  console.log('🔄 Crearea backup-ului cache-ului curent...')

  try {
    // Creează directorul de backup
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    console.log(`✅ Director backup creat: ${BACKUP_DIR}`)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupSuffix = `_backup_${timestamp}`

    // Lista fișierelor de backup
    const filesToBackup = [
      'cache-data.json',
      'flights_cache.json',
      'cache-config.json',
      'request-counter.json',
      'api-tracker.json'
    ]

    let backedUpFiles = 0

    for (const fileName of filesToBackup) {
      const sourcePath = path.join(DATA_DIR, fileName)
      const backupPath = path.join(BACKUP_DIR, fileName.replace('.json', `${backupSuffix}.json`))

      try {
        await fs.access(sourcePath)
        await fs.copyFile(sourcePath, backupPath)
        console.log(`✅ Backup creat: ${fileName} -> ${path.basename(backupPath)}`)
        backedUpFiles++
      } catch (error) {
        console.log(`⚠️  Fișier nu există: ${fileName}`)
      }
    }

    // Backup pentru SQLite database
    const sqlitePath = path.join(DATA_DIR, 'historical-flights.db')
    const sqliteBackupPath = path.join(BACKUP_DIR, `historical-flights${backupSuffix}.db`)

    try {
      await fs.access(sqlitePath)
      await fs.copyFile(sqlitePath, sqliteBackupPath)
      console.log(`✅ Backup SQLite creat: ${path.basename(sqliteBackupPath)}`)
      backedUpFiles++
    } catch (error) {
      console.log('⚠️  SQLite database nu există')
    }

    console.log(`\n📊 Backup complet: ${backedUpFiles} fișiere salvate`)
    console.log(`📁 Locația backup: ${BACKUP_DIR}`)

    // Creează un fișier de informații despre backup
    const backupInfo = {
      timestamp: new Date().toISOString(),
      files: filesToBackup.filter(async (fileName) => {
        try {
          await fs.access(path.join(DATA_DIR, fileName))
          return true
        } catch {
          return false
        }
      }),
      purpose: 'Backup înainte de restabilirea cache-ului din SQLite',
      restoreInstructions: 'Pentru a restaura, copiază fișierele din acest director înapoi în data/'
    }

    await fs.writeFile(
      path.join(BACKUP_DIR, `backup-info${backupSuffix}.json`),
      JSON.stringify(backupInfo, null, 2)
    )

    console.log('✅ Informații backup salvate')
    console.log('\n🎉 Backup complet!')

  } catch (error) {
    console.error('❌ Eroare la crearea backup-ului:', error)
    throw error
  }
}

// Funcția principală
async function main() {
  try {
    await createBackup()
    console.log('\n✅ Backup-ul a fost creat cu succes!')
    console.log('🚀 Poți rula acum scriptul de restabilire din SQLite')
  } catch (error) {
    console.error('\n❌ Eroare în timpul backup-ului:', error.message)
    process.exit(1)
  }
}

// Rulează scriptul
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createBackup }