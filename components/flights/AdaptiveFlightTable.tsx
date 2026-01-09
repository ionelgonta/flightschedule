/**
 * AdaptiveFlightTable - Tabelă adaptivă care se ajustează la dimensiunea ecranului
 * Combină designul compact pentru desktop cu versiunea ultra-compactă pentru mobile
 */

'use client';

import { RawFlightData } from '@/lib/flightApiService';
import { CompactFlightTable } from './CompactFlightTable';
import { MobileCompactTable } from './MobileCompactTable';
import { useEffect, useState } from 'react';

interface AdaptiveFlightTableProps {
  flights: RawFlightData[];
  type: 'arrivals' | 'departures';
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
}

export function AdaptiveFlightTable(props: AdaptiveFlightTableProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint - pentru ecrane foarte mici
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Pentru mobile folosim versiunea ultra-compactă
  if (isMobile) {
    return <MobileCompactTable {...props} />;
  }

  // Pentru desktop folosim versiunea compactă normală
  return <CompactFlightTable {...props} />;
}

export default AdaptiveFlightTable;