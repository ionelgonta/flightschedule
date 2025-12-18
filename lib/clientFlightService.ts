/**
 * Client Flight Service - Folosește API routes server-side pentru a evita CSP issues
 * Înlocuiește apelurile directe MCP din browser cu fetch către API routes
 */

import { RawFlightData } from './flightApiService';

export interface ClientFlightResponse {
  success: boolean;
  data: RawFlightData[];
  error?: string;
  cached: boolean;
  last_updated: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
}

export interface ClientFlightFilters {
  airline?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
}

class ClientFlightService {
  private baseUrl: string;

  constructor() {
    // Handle both client-side and server-side rendering
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      this.baseUrl = window.location.origin;
    } else {
      // Server-side: use empty string for relative URLs
      // This will work because Next.js API routes are on the same domain
      this.baseUrl = '';
    }
  }

  /**
   * Obține sosirile pentru un aeroport
   */
  async getArrivals(airportCode: string, filters?: ClientFlightFilters): Promise<ClientFlightResponse> {
    // Construct URL path
    let urlPath = `/api/flights/${airportCode}/arrivals`;
    
    // Add query parameters if filters exist
    const params = new URLSearchParams();
    if (filters) {
      if (filters.airline) params.set('airline', filters.airline);
      if (filters.status) params.set('status', filters.status);
      if (filters.start_time) params.set('start_time', filters.start_time);
      if (filters.end_time) params.set('end_time', filters.end_time);
    }
    
    if (params.toString()) {
      urlPath += `?${params.toString()}`;
    }
    
    // Use full URL for client-side, relative URL for server-side
    const fetchUrl = this.baseUrl ? `${this.baseUrl}${urlPath}` : urlPath;

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Forțează refresh pentru date real-time
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ClientFlightResponse = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching arrivals for ${airportCode}:`, error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Network error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Obține plecările pentru un aeroport
   */
  async getDepartures(airportCode: string, filters?: ClientFlightFilters): Promise<ClientFlightResponse> {
    // Construct URL path
    let urlPath = `/api/flights/${airportCode}/departures`;
    
    // Add query parameters if filters exist
    const params = new URLSearchParams();
    if (filters) {
      if (filters.airline) params.set('airline', filters.airline);
      if (filters.status) params.set('status', filters.status);
      if (filters.start_time) params.set('start_time', filters.start_time);
      if (filters.end_time) params.set('end_time', filters.end_time);
    }
    
    if (params.toString()) {
      urlPath += `?${params.toString()}`;
    }
    
    // Use full URL for client-side, relative URL for server-side
    const fetchUrl = this.baseUrl ? `${this.baseUrl}${urlPath}` : urlPath;

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Forțează refresh pentru date real-time
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ClientFlightResponse = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching departures for ${airportCode}:`, error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Network error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }
  }

  /**
   * Verifică statusul API-ului
   */
  async checkApiStatus(): Promise<{ available: boolean; message: string }> {
    try {
      // Testează cu un aeroport cunoscut
      const response = await this.getArrivals('OTP');
      
      return {
        available: response.success,
        message: response.success ? 'API is working' : (response.error || 'API error')
      };
    } catch (error) {
      return {
        available: false,
        message: error instanceof Error ? error.message : 'API unavailable'
      };
    }
  }

  /**
   * Preîncarcă datele pentru mai multe aeroporturi
   */
  async preloadAirports(airportCodes: string[]): Promise<void> {
    console.log('Preloading flight data for airports:', airportCodes);
    
    const promises = airportCodes.flatMap(code => [
      this.getArrivals(code),
      this.getDepartures(code)
    ]);

    try {
      await Promise.allSettled(promises);
      console.log('Airport data preloading completed');
    } catch (error) {
      console.error('Error during airport preloading:', error);
    }
  }
}

// Singleton instance pentru client
let clientFlightServiceInstance: ClientFlightService | null = null;

export function getClientFlightService(): ClientFlightService {
  if (!clientFlightServiceInstance) {
    clientFlightServiceInstance = new ClientFlightService();
  }
  return clientFlightServiceInstance;
}

export default ClientFlightService;