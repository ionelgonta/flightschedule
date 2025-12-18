/**
 * Database Migration System
 * Handles schema updates and database initialization for historical flight data
 */

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface Migration {
  version: string
  description: string
  sql: string
}

export class DatabaseMigrator {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    console.log('[Database Migrator] Starting migration process...')
    
    // Ensure migrations table exists
    this.ensureMigrationsTable()
    
    // Get applied migrations
    const appliedMigrations = this.getAppliedMigrations()
    console.log(`[Database Migrator] Found ${appliedMigrations.length} applied migrations`)
    
    // Get available migrations
    const availableMigrations = this.getAvailableMigrations()
    console.log(`[Database Migrator] Found ${availableMigrations.length} available migrations`)
    
    // Find pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !appliedMigrations.includes(migration.version)
    )
    
    if (pendingMigrations.length === 0) {
      console.log('[Database Migrator] No pending migrations')
      return
    }
    
    console.log(`[Database Migrator] Running ${pendingMigrations.length} pending migrations...`)
    
    // Run each pending migration in a transaction
    for (const migration of pendingMigrations) {
      await this.runMigration(migration)
    }
    
    console.log('[Database Migrator] All migrations completed successfully')
  }

  /**
   * Ensure the migrations table exists
   */
  private ensureMigrationsTable(): void {
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `
    
    this.db.exec(createMigrationsTable)
  }

  /**
   * Get list of applied migration versions
   */
  private getAppliedMigrations(): string[] {
    try {
      const stmt = this.db.prepare('SELECT version FROM schema_migrations ORDER BY version')
      const rows = stmt.all() as { version: string }[]
      return rows.map(row => row.version)
    } catch (error) {
      console.warn('[Database Migrator] Could not read applied migrations:', error)
      return []
    }
  }

  /**
   * Get available migrations from schema file and additional migrations
   */
  private getAvailableMigrations(): Migration[] {
    const migrations: Migration[] = []
    
    // Add initial schema migration
    try {
      const schemaPath = join(process.cwd(), 'lib', 'database', 'schema.sql')
      const schemaSql = readFileSync(schemaPath, 'utf-8')
      
      migrations.push({
        version: '001_initial_schema',
        description: 'Initial historical flight data schema',
        sql: schemaSql
      })
    } catch (error) {
      console.error('[Database Migrator] Could not read schema.sql:', error)
    }
    
    // Add future migrations here as needed
    // migrations.push({
    //   version: '002_add_indexes',
    //   description: 'Add performance indexes',
    //   sql: '...'
    // })
    
    return migrations.sort((a, b) => a.version.localeCompare(b.version))
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: Migration): Promise<void> {
    console.log(`[Database Migrator] Running migration ${migration.version}: ${migration.description}`)
    
    const transaction = this.db.transaction(() => {
      try {
        // Execute the migration SQL
        this.db.exec(migration.sql)
        
        // Record the migration as applied
        const stmt = this.db.prepare(`
          INSERT OR IGNORE INTO schema_migrations (version, description) 
          VALUES (?, ?)
        `)
        stmt.run(migration.version, migration.description)
        
        console.log(`[Database Migrator] Successfully applied migration ${migration.version}`)
      } catch (error) {
        console.error(`[Database Migrator] Failed to apply migration ${migration.version}:`, error)
        throw error
      }
    })
    
    transaction()
  }

  /**
   * Rollback a specific migration (if rollback SQL is provided)
   */
  async rollbackMigration(version: string): Promise<void> {
    console.log(`[Database Migrator] Rolling back migration ${version}`)
    
    // For now, rollbacks are not implemented
    // In a production system, each migration would include rollback SQL
    throw new Error('Migration rollbacks are not implemented yet')
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): { version: string; description: string; applied_at: string }[] {
    try {
      const stmt = this.db.prepare(`
        SELECT version, description, applied_at 
        FROM schema_migrations 
        ORDER BY version
      `)
      return stmt.all() as { version: string; description: string; applied_at: string }[]
    } catch (error) {
      console.error('[Database Migrator] Could not get migration status:', error)
      return []
    }
  }

  /**
   * Check if database is up to date
   */
  isUpToDate(): boolean {
    const appliedMigrations = this.getAppliedMigrations()
    const availableMigrations = this.getAvailableMigrations()
    
    return availableMigrations.every(migration => 
      appliedMigrations.includes(migration.version)
    )
  }
}