/**
 * Flight Scheduler - Client-side scheduler for periodic updates
 * Only runs in browser environment
 */

let schedulerInitialized = false;
let updateInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the flight scheduler
 * This runs periodic updates for flight data on the client side
 */
export function initializeScheduler(): void {
  // Only run in browser
  if (typeof window === 'undefined') {
    console.warn('[FlightScheduler] Cannot initialize scheduler on server side');
    return;
  }

  // Prevent multiple initializations
  if (schedulerInitialized) {
    console.log('[FlightScheduler] Scheduler already initialized');
    return;
  }

  console.log('[FlightScheduler] Initializing client-side flight scheduler...');

  // Set up periodic updates every 5 minutes
  updateInterval = setInterval(() => {
    console.log('[FlightScheduler] Triggering periodic flight data refresh...');
    
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('flightDataRefresh', {
      detail: { timestamp: new Date().toISOString() }
    }));
  }, 5 * 60 * 1000); // 5 minutes

  schedulerInitialized = true;
  console.log('[FlightScheduler] Scheduler initialized successfully');
}

/**
 * Cleanup the scheduler
 */
export function cleanupScheduler(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  schedulerInitialized = false;
  console.log('[FlightScheduler] Scheduler cleaned up');
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return schedulerInitialized && updateInterval !== null;
}