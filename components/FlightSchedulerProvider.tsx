/**
 * FlightSchedulerProvider - Inițializează scheduler-ul global pentru actualizări automate
 */

'use client';

import { useEffect } from 'react';
import { initializeScheduler } from '@/lib/flightScheduler';

export function FlightSchedulerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inițializează scheduler-ul doar în browser
    if (typeof window !== 'undefined') {
      console.log('[FlightSchedulerProvider] Initializing flight scheduler...');
      initializeScheduler();
    }
  }, []);

  return <>{children}</>;
}

export default FlightSchedulerProvider;