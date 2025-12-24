/**
 * Daily Backup Manager - Automated daily backups with 7-day rotation
 * Part of the Persistent Flight System architecture
 * Creates backups at 00:00 daily and maintains 7-day retention
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { historicalDatabaseManager, BackupInfo } from './historicalDatabaseManager'
import { persistentFlightCache } from './persistentFlightCache'
import { weatherCacheManager } from './weatherCacheManager'

export interface BackupManifest {
  id: string
  createdAt: Date
  backupType: 'daily' | 'manual'
  components: {
    historicalDatabase: boolean
    persistentFlightCache: boolean
    weatherCache: boolean
  }
  totalSize: number
  flightCount: number
  isValid: boolean
  description: string
}

/**
 * Daily Backup Manager class
 */
class DailyBackupManager {
  private static instance: DailyBackupManager
  private backupDir: string
  private manifestPath: string
  private isScheduled: boolean = false
  private backupTimer: NodeJS.Timeout | null = null

  private constructor() {
    this.backupDir = path.join(process.cwd(), 'data', 'daily_backups')
    this.manifestPath = path.join(this.backupDir, 'backup_manifest.json')
  }

  static getInstance(): DailyBackupManager {
    if (!DailyBackupManager.instance) {
      DailyBackupManager.instance = new DailyBackupManager()
    }
    return DailyBackupManager.instance
  }

  /**
   * Initialize backup manager and schedule daily backups
   */
  async initialize(): Promise<void> {
    console.log('[Backup Manager] Initializing daily backup system...')

    // Ensure backup directory exists
    try {
      await fs.access(this.backupDir)
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true })
    }

    // Schedule daily backups at 00:00
    await this.scheduleDailyBackups()

    console.log('[Backup Manager] Daily backup system initialized')
  }

  /**
   * Create daily backup
   */
  async createDailyBackup(): Promise<BackupManifest> {
    console.log('[Backup Manager] Creating daily backup...')

    const backupId = this.generateBackupId('daily')
    const backupPath = path.join(this.backupDir, backupId)

    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true })

      const components = {
        historicalDatabase: false,
        persistentFlightCache: false,
        weatherCache: false
      }
      let totalSize = 0
      let flightCount = 0

      // Backup historical database
      try {
        const dbStats = await historicalDatabaseManager.getDatabaseStats()
        const dbBackupFile = await historicalDatabaseManager.createBackup()
        
        // Copy backup to daily backup directory
        const sourcePath = path.join(process.cwd(), 'data', 'backups', dbBackupFile)
        const destPath = path.join(backupPath, 'historical_database.json')
        await fs.copyFile(sourcePath, destPath)
        
        const stats = await fs.stat(destPath)
        totalSize += stats.size
        flightCount = dbStats.totalFlights
        components.historicalDatabase = true
        
        console.log('[Backup Manager] Historical database backed up')
      } catch (error) {
        console.error('[Backup Manager] Failed to backup historical database:', error)
      }

      // Backup persistent flight cache
      try {
        const cacheStats = await persistentFlightCache.getCacheStats()
        const sourcePath = path.join(process.cwd(), 'data', 'flights_cache.json')
        const destPath = path.join(backupPath, 'flights_cache.json')
        
        await fs.copyFile(sourcePath, destPath)
        
        const stats = await fs.stat(destPath)
        totalSize += stats.size
        components.persistentFlightCache = true
        
        console.log('[Backup Manager] Persistent flight cache backed up')
      } catch (error) {
        console.error('[Backup Manager] Failed to backup persistent flight cache:', error)
      }

      // Backup weather cache
      try {
        const sourcePath = path.join(process.cwd(), 'data', 'weather_cache.json')
        const destPath = path.join(backupPath, 'weather_cache.json')
        
        await fs.copyFile(sourcePath, destPath)
        
        const stats = await fs.stat(destPath)
        totalSize += stats.size
        components.weatherCache = true
        
        console.log('[Backup Manager] Weather cache backed up')
      } catch (error) {
        console.error('[Backup Manager] Failed to backup weather cache:', error)
      }

      // Create backup manifest
      const manifest: BackupManifest = {
        id: backupId,
        createdAt: new Date(),
        backupType: 'daily',
        components,
        totalSize,
        flightCount,
        isValid: this.validateBackupComponents(components),
        description: `Daily backup - ${flightCount} flights, ${Math.round(totalSize / 1024)} KB`
      }

      // Save manifest in backup directory
      await fs.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      )

      // Update global manifest
      await this.updateGlobalManifest(manifest)

      // Clean old backups
      await this.cleanOldBackups()

      console.log(`[Backup Manager] Daily backup created: ${backupId}`)
      return manifest

    } catch (error) {
      console.error('[Backup Manager] Failed to create daily backup:', error)
      throw error
    }
  }

  /**
   * List available backups
   */
  async listAvailableBackups(): Promise<BackupManifest[]> {
    try {
      const manifestData = await fs.readFile(this.manifestPath, 'utf-8')
      const manifests: BackupManifest[] = JSON.parse(manifestData)
      
      // Convert date strings back to Date objects
      manifests.forEach(manifest => {
        manifest.createdAt = new Date(manifest.createdAt)
      })

      // Sort by creation date (newest first)
      return manifests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.log('[Backup Manager] No backup manifest found')
      return []
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    console.log(`[Backup Manager] Restoring from backup: ${backupId}`)

    const backupPath = path.join(this.backupDir, backupId)
    
    try {
      // Verify backup exists
      await fs.access(backupPath)
      
      // Load backup manifest
      const manifestPath = path.join(backupPath, 'manifest.json')
      const manifestData = await fs.readFile(manifestPath, 'utf-8')
      const manifest: BackupManifest = JSON.parse(manifestData)

      if (!manifest.isValid) {
        throw new Error('Backup is marked as invalid')
      }

      // Create backup of current state before restore
      console.log('[Backup Manager] Creating pre-restore backup...')
      await this.createManualBackup('pre-restore')

      // Restore historical database
      if (manifest.components.historicalDatabase) {
        try {
          const sourcePath = path.join(backupPath, 'historical_database.json')
          const destPath = path.join(process.cwd(), 'data', 'historical_flights.json')
          await fs.copyFile(sourcePath, destPath)
          console.log('[Backup Manager] Historical database restored')
        } catch (error) {
          console.error('[Backup Manager] Failed to restore historical database:', error)
        }
      }

      // Restore persistent flight cache
      if (manifest.components.persistentFlightCache) {
        try {
          const sourcePath = path.join(backupPath, 'flights_cache.json')
          const destPath = path.join(process.cwd(), 'data', 'flights_cache.json')
          await fs.copyFile(sourcePath, destPath)
          console.log('[Backup Manager] Persistent flight cache restored')
        } catch (error) {
          console.error('[Backup Manager] Failed to restore persistent flight cache:', error)
        }
      }

      // Restore weather cache
      if (manifest.components.weatherCache) {
        try {
          const sourcePath = path.join(backupPath, 'weather_cache.json')
          const destPath = path.join(process.cwd(), 'data', 'weather_cache.json')
          await fs.copyFile(sourcePath, destPath)
          console.log('[Backup Manager] Weather cache restored')
        } catch (error) {
          console.error('[Backup Manager] Failed to restore weather cache:', error)
        }
      }

      console.log(`[Backup Manager] Successfully restored from backup: ${backupId}`)

    } catch (error) {
      console.error(`[Backup Manager] Failed to restore from backup ${backupId}:`, error)
      throw error
    }
  }

  /**
   * Clean old backups - keep only 7 most recent
   */
  async cleanOldBackups(): Promise<void> {
    try {
      const manifests = await this.listAvailableBackups()
      
      if (manifests.length <= 7) return

      // Keep only 7 most recent backups
      const backupsToDelete = manifests.slice(7)
      
      for (const manifest of backupsToDelete) {
        try {
          const backupPath = path.join(this.backupDir, manifest.id)
          await fs.rm(backupPath, { recursive: true, force: true })
          console.log(`[Backup Manager] Deleted old backup: ${manifest.id}`)
        } catch (error) {
          console.error(`[Backup Manager] Failed to delete backup ${manifest.id}:`, error)
        }
      }

      // Update global manifest
      const remainingManifests = manifests.slice(0, 7)
      await fs.writeFile(this.manifestPath, JSON.stringify(remainingManifests, null, 2), 'utf-8')

      console.log(`[Backup Manager] Cleaned ${backupsToDelete.length} old backups`)

    } catch (error) {
      console.error('[Backup Manager] Failed to clean old backups:', error)
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, backupId)
      const manifestPath = path.join(backupPath, 'manifest.json')
      
      // Check if manifest exists
      await fs.access(manifestPath)
      const manifestData = await fs.readFile(manifestPath, 'utf-8')
      const manifest: BackupManifest = JSON.parse(manifestData)

      // Validate each component
      let isValid = true

      if (manifest.components.historicalDatabase) {
        try {
          const dbPath = path.join(backupPath, 'historical_database.json')
          await fs.access(dbPath)
          const dbData = await fs.readFile(dbPath, 'utf-8')
          JSON.parse(dbData) // Validate JSON
        } catch {
          isValid = false
        }
      }

      if (manifest.components.persistentFlightCache) {
        try {
          const cachePath = path.join(backupPath, 'flights_cache.json')
          await fs.access(cachePath)
          const cacheData = await fs.readFile(cachePath, 'utf-8')
          JSON.parse(cacheData) // Validate JSON
        } catch {
          isValid = false
        }
      }

      if (manifest.components.weatherCache) {
        try {
          const weatherPath = path.join(backupPath, 'weather_cache.json')
          await fs.access(weatherPath)
          const weatherData = await fs.readFile(weatherPath, 'utf-8')
          JSON.parse(weatherData) // Validate JSON
        } catch {
          isValid = false
        }
      }

      return isValid

    } catch (error) {
      console.error(`[Backup Manager] Failed to validate backup ${backupId}:`, error)
      return false
    }
  }

  /**
   * Create manual backup
   */
  async createManualBackup(description?: string): Promise<BackupManifest> {
    console.log('[Backup Manager] Creating manual backup...')

    const backupId = this.generateBackupId('manual')
    const backupPath = path.join(this.backupDir, backupId)

    try {
      await fs.mkdir(backupPath, { recursive: true })

      const components = {
        historicalDatabase: false,
        persistentFlightCache: false,
        weatherCache: false
      }
      let totalSize = 0
      let flightCount = 0

      // Same backup logic as daily backup
      // Backup historical database
      try {
        const dbStats = await historicalDatabaseManager.getDatabaseStats()
        const dbBackupFile = await historicalDatabaseManager.createBackup()
        
        const sourcePath = path.join(process.cwd(), 'data', 'backups', dbBackupFile)
        const destPath = path.join(backupPath, 'historical_database.json')
        await fs.copyFile(sourcePath, destPath)
        
        const stats = await fs.stat(destPath)
        totalSize += stats.size
        flightCount = dbStats.totalFlights
        components.historicalDatabase = true
      } catch (error) {
        console.error('[Backup Manager] Failed to backup historical database:', error)
      }

      // Backup persistent flight cache
      try {
        const sourcePath = path.join(process.cwd(), 'data', 'flights_cache.json')
        const destPath = path.join(backupPath, 'flights_cache.json')
        await fs.copyFile(sourcePath, destPath)
        
        const stats = await fs.stat(destPath)
        totalSize += stats.size
        components.persistentFlightCache = true
      } catch (error) {
        console.error('[Backup Manager] Failed to backup persistent flight cache:', error)
      }

      // Backup weather cache
      try {
        const sourcePath = path.join(process.cwd(), 'data', 'weather_cache.json')
        const destPath = path.join(backupPath, 'weather_cache.json')
        await fs.copyFile(sourcePath, destPath)
        
        const stats = await fs.stat(destPath)
        totalSize += stats.size
        components.weatherCache = true
      } catch (error) {
        console.error('[Backup Manager] Failed to backup weather cache:', error)
      }

      const manifest: BackupManifest = {
        id: backupId,
        createdAt: new Date(),
        backupType: 'manual',
        components,
        totalSize,
        flightCount,
        isValid: this.validateBackupComponents(components),
        description: description || `Manual backup - ${flightCount} flights, ${Math.round(totalSize / 1024)} KB`
      }

      await fs.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      )

      await this.updateGlobalManifest(manifest)

      console.log(`[Backup Manager] Manual backup created: ${backupId}`)
      return manifest

    } catch (error) {
      console.error('[Backup Manager] Failed to create manual backup:', error)
      throw error
    }
  }

  /**
   * Schedule daily backups at 00:00
   */
  private async scheduleDailyBackups(): Promise<void> {
    if (this.isScheduled) return

    const scheduleNextBackup = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime()
      
      this.backupTimer = setTimeout(async () => {
        try {
          await this.createDailyBackup()
        } catch (error) {
          console.error('[Backup Manager] Daily backup failed:', error)
        }
        
        // Schedule next backup
        scheduleNextBackup()
      }, msUntilMidnight)
      
      console.log(`[Backup Manager] Next daily backup scheduled for ${tomorrow.toISOString()}`)
    }

    scheduleNextBackup()
    this.isScheduled = true
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(type: 'daily' | 'manual'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `${type}_backup_${timestamp}`
  }

  /**
   * Validate backup components
   */
  private validateBackupComponents(components: BackupManifest['components']): boolean {
    // At least one component should be backed up successfully
    return components.historicalDatabase || components.persistentFlightCache || components.weatherCache
  }

  /**
   * Update global manifest
   */
  private async updateGlobalManifest(newManifest: BackupManifest): Promise<void> {
    try {
      const manifests = await this.listAvailableBackups()
      manifests.unshift(newManifest)
      
      // Keep only 7 most recent in manifest
      const recentManifests = manifests.slice(0, 7)
      
      await fs.writeFile(this.manifestPath, JSON.stringify(recentManifests, null, 2), 'utf-8')
    } catch (error) {
      // If manifest doesn't exist, create new one
      await fs.writeFile(this.manifestPath, JSON.stringify([newManifest], null, 2), 'utf-8')
    }
  }

  /**
   * Stop scheduled backups
   */
  stopScheduledBackups(): void {
    if (this.backupTimer) {
      clearTimeout(this.backupTimer)
      this.backupTimer = null
    }
    this.isScheduled = false
    console.log('[Backup Manager] Scheduled backups stopped')
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number
    dailyBackups: number
    manualBackups: number
    totalSize: string
    oldestBackup: Date | null
    newestBackup: Date | null
    nextScheduledBackup: Date
  }> {
    const manifests = await this.listAvailableBackups()
    
    let dailyBackups = 0
    let manualBackups = 0
    let totalSize = 0
    let oldestBackup: Date | null = null
    let newestBackup: Date | null = null

    manifests.forEach(manifest => {
      if (manifest.backupType === 'daily') {
        dailyBackups++
      } else {
        manualBackups++
      }
      
      totalSize += manifest.totalSize
      
      if (!oldestBackup || manifest.createdAt < oldestBackup) {
        oldestBackup = manifest.createdAt
      }
      if (!newestBackup || manifest.createdAt > newestBackup) {
        newestBackup = manifest.createdAt
      }
    })

    // Calculate next scheduled backup
    const now = new Date()
    const nextBackup = new Date(now)
    nextBackup.setDate(nextBackup.getDate() + 1)
    nextBackup.setHours(0, 0, 0, 0)

    return {
      totalBackups: manifests.length,
      dailyBackups,
      manualBackups,
      totalSize: `${Math.round(totalSize / 1024)} KB`,
      oldestBackup,
      newestBackup,
      nextScheduledBackup: nextBackup
    }
  }
}

// Export singleton instance
export const dailyBackupManager = DailyBackupManager.getInstance()