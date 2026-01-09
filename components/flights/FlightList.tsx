/**
 * FlightList - Componentă adaptivă pentru afișarea listei de zboruri
 * Folosește designul compact inspirat din exemplul clasic
 */

'use client';

import { RawFlightData } from '@/lib/flightApiService';
import { FlightFilters } from '@/lib/flightRepository';
import { AdaptiveFlightTable } from './AdaptiveFlightTable';

interface FlightListProps {
  flights: RawFlightData[];
  type: 'arrivals' | 'departures';
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
  onFiltersChange?: (filters: FlightFilters) => void;
}

export function FlightList(props: FlightListProps) {
  // Folosim componenta adaptivă care se ajustează la dimensiunea ecranului
  return <AdaptiveFlightTable {...props} />;
}

export default FlightList;