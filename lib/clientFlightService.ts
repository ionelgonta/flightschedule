/**
 * Client Flight Service - Frontend interface for flight data
 * Calls internal API endpoints that use real flight data only
 */

import { FlightApiResponse } from './flightApiService';

export interface ClientFlightFilters {
  airline?: string;
  status?: string;
  timeRange?: 'all' | 'next6h' | 'next12h' | 'next24h';
}

class ClientFlightService {
  /**
   * Get arrivals for an airport via API endpoint
   */
  async getArrivals(airportCode: string, filters?: ClientFlightFilters): Promise<FlightApiResponse> {
    try {
      const url = new URL(`/api/flights/${airportCode}/arrivals`, window.location.origin);
      
      // Add filters as query parameters
      if (filters) {
        if (filters.airline) url.searchParams.set('airline', filters.airline);
        if (filters.status) url.searchParams.set('status', filters.status);
        if (filters.timeRange) url.searchParams.set('timeRange', filters.timeRange);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching arrivals for ${airportCode}:`, error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'arrivals'
      };
    }
  }

  /**
   * Get departures for an airport via API endpoint
   */
  async getDepartures(airportCode: string, filters?: ClientFlightFilters): Promise<FlightApiResponse> {
    try {
      const url = new URL(`/api/flights/${airportCode}/departures`, window.location.origin);
      
      // Add filters as query parameters
      if (filters) {
        if (filters.airline) url.searchParams.set('airline', filters.airline);
        if (filters.status) url.searchParams.set('status', filters.status);
        if (filters.timeRange) url.searchParams.set('timeRange', filters.timeRange);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching departures for ${airportCode}:`, error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: 'departures'
      };
    }
  }
}

// Singleton instance
let clientFlightServiceInstance: ClientFlightService | null = null;

/**
 * Get the client flight service instance
 */
export function getClientFlightService(): ClientFlightService {
  if (!clientFlightServiceInstance) {
    clientFlightServiceInstance = new ClientFlightService();
  }
  return clientFlightServiceInstance;
}

export default ClientFlightService;