/**
 * Flight Scheduler - Actualizări automate în background pentru cache
 * Rulează periodic pentru a menține datele fresh
 */

import { getFlightRepository } from './flightRepository';

export interface SchedulerConfig {
  interval: number; // milliseconds
  priorityAirports: string[];
  maxConcurrentRequests: number;
  enabled: boolean;
}

class FlightScheduler {
  private config: SchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private runCount: number = 0;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Pornește scheduler-ul automat
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) {
      console.log('Flight scheduler already running or disabled');
      return;
    }

    console.log(`Starting flight scheduler with ${this.config.interval}ms interval`);
    console.log(`Priority airports: ${this.config.priorityAirports.join(', ')}`);

    this.isRunning = true;
    
    // Rulează imediat prima dată
    this.runUpdate();

    // Apoi la interval
    this.intervalId = setInterval(() => {
      this.runUpdate();
    }, this.config.interval);
  }

  /**
   * Oprește scheduler-ul
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('Flight scheduler stopped');
  }

  /**
   * Rulează o actualizare completă
   */
  private async runUpdate(): Promise<void> {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.runCount++;
    
    console.log(`[Scheduler] Run #${this.runCount} started at ${new Date().toISOString()}`);

    try {
      const flightRepository = getFlightRepository();
      
      // Curăță cache-ul expirat înainte de actualizare
      // Note: Cache cleanup is handled by cacheManager automatically

      // Actualizează aeroporturile prioritare în batch-uri
      await this.updateAirportsInBatches(this.config.priorityAirports);

      const duration = Date.now() - startTime;
      this.lastRun = new Date();

      console.log(`[Scheduler] Run #${this.runCount} completed in ${duration}ms`);
      
      // Log statistici cache
      const stats = flightRepository.getCacheStats();
      console.log(`[Scheduler] Cache stats:`, stats);

    } catch (error) {
      console.error(`[Scheduler] Error in run #${this.runCount}:`, error);
    }
  }

  /**
   * Actualizează aeroporturile în batch-uri pentru a respecta rate limiting
   */
  private async updateAirportsInBatches(airports: string[]): Promise<void> {
    const flightRepository = getFlightRepository();
    const batchSize = Math.min(this.config.maxConcurrentRequests, 3); // Max 3 concurrent requests
    
    for (let i = 0; i < airports.length; i += batchSize) {
      const batch = airports.slice(i, i + batchSize);
      
      console.log(`[Scheduler] Processing batch: ${batch.join(', ')}`);
      
      // Procesează batch-ul curent
      const promises = batch.flatMap(airportCode => [
        this.updateAirportSafely(flightRepository, airportCode, 'arrivals'),
        this.updateAirportSafely(flightRepository, airportCode, 'departures')
      ]);

      await Promise.allSettled(promises);
      
      // Pauză între batch-uri pentru rate limiting
      if (i + batchSize < airports.length) {
        await this.sleep(2000); // 2 secunde pauză
      }
    }
  }

  /**
   * Actualizează un aeroport cu error handling
   */
  private async updateAirportSafely(
    repository: any, 
    airportCode: string, 
    type: 'arrivals' | 'departures'
  ): Promise<void> {
    try {
      const result = type === 'arrivals' 
        ? await repository.getArrivals(airportCode)
        : await repository.getDepartures(airportCode);

      if (result.success) {
        console.log(`[Scheduler] ✅ ${airportCode} ${type}: ${result.data.length} flights`);
      } else {
        console.log(`[Scheduler] ⚠️ ${airportCode} ${type}: ${result.error}`);
      }
    } catch (error) {
      console.error(`[Scheduler] ❌ ${airportCode} ${type}:`, error);
    }
  }

  /**
   * Pauză asincronă
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obține statistici scheduler
   */
  getStats(): {
    isRunning: boolean;
    runCount: number;
    lastRun: Date | null;
    config: SchedulerConfig;
  } {
    return {
      isRunning: this.isRunning,
      runCount: this.runCount,
      lastRun: this.lastRun,
      config: this.config
    };
  }

  /**
   * Actualizează configurația
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduler dacă intervalul s-a schimbat
    if (newConfig.interval && this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Forțează o actualizare imediată
   */
  async forceUpdate(): Promise<void> {
    console.log('[Scheduler] Force update requested');
    await this.runUpdate();
  }
}

// Configurația default
const DEFAULT_CONFIG: SchedulerConfig = {
  interval: 10 * 60 * 1000, // 10 minutes
  priorityAirports: ['OTP', 'CLJ', 'TSR', 'IAS', 'CND', 'KIV', 'SBZ', 'CRA', 'BCM', 'BAY'],
  maxConcurrentRequests: 3,
  enabled: true
};

// Singleton instance
let schedulerInstance: FlightScheduler | null = null;

/**
 * Obține instanța singleton a scheduler-ului
 */
export function getFlightScheduler(): FlightScheduler {
  if (!schedulerInstance) {
    // Configurația din environment variables
    const config: SchedulerConfig = {
      interval: parseInt(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL || '600000'),
      priorityAirports: (process.env.NEXT_PUBLIC_PRIORITY_AIRPORTS || DEFAULT_CONFIG.priorityAirports.join(',')).split(','),
      maxConcurrentRequests: parseInt(process.env.NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS || '3'),
      enabled: process.env.NEXT_PUBLIC_SCHEDULER_ENABLED !== 'false'
    };

    schedulerInstance = new FlightScheduler(config);
  }
  
  return schedulerInstance;
}

/**
 * Inițializează scheduler-ul automat (doar în browser)
 */
export function initializeScheduler(): void {
  if (typeof window !== 'undefined') {
    const scheduler = getFlightScheduler();
    
    // Pornește scheduler-ul
    scheduler.start();
    
    // Oprește scheduler-ul când se închide pagina
    window.addEventListener('beforeunload', () => {
      scheduler.stop();
    });
    
    // Oprește scheduler-ul când tab-ul devine inactiv (opțional)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        scheduler.stop();
      } else {
        scheduler.start();
      }
    });
  }
}

export default FlightScheduler;