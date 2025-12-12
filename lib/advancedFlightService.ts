/**
 * Advanced Flight Service - Funcționalități avansate bazate pe AeroDataBox OpenAPI
 * Oferă căutare zboruri, tracking, statistici și alte funcții avansate
 */

import AeroDataBoxService, { Flight, Airport, AirportStats, FlightTrack } from './aerodataboxService';
import { API_CONFIGS } from './flightApiService';

export interface FlightSearchResult {
  flight: Flight;
  relevanceScore: number;
}

export interface RouteInfo {
  departure: Airport;
  arrival: Airport;
  distance?: number;
  flights: Flight[];
  averageFlightTime?: number;
}

export interface AirlineStats {
  airlineCode: string;
  airlineName: string;
  totalFlights: number;
  onTimePercentage: number;
  averageDelay: number;
  destinations: string[];
}

export interface FlightAlert {
  flightNumber: string;
  type: 'delay' | 'cancellation' | 'gate_change' | 'status_change';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

class AdvancedFlightService {
  private aeroDataBoxService: AeroDataBoxService;

  constructor(apiKey: string) {
    const config = {
      ...API_CONFIGS.aerodatabox,
      apiKey
    };
    
    this.aeroDataBoxService = new AeroDataBoxService(config);
  }

  /**
   * Caută zboruri după numărul de zbor
   */
  async searchFlightByNumber(
    flightNumber: string,
    date?: string
  ): Promise<FlightSearchResult[]> {
    try {
      const flights = await this.aeroDataBoxService.getFlightDetails(flightNumber, date);
      
      return flights.map(flight => ({
        flight,
        relevanceScore: this.calculateRelevanceScore(flight, flightNumber)
      })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Error searching flight by number:', error);
      return [];
    }
  }

  /**
   * Obține informații despre o rută între două aeroporturi
   */
  async getRouteInfo(
    departureAirport: string,
    arrivalAirport: string,
    date?: string
  ): Promise<RouteInfo | null> {
    try {
      const [depAirport, arrAirport, flights] = await Promise.all([
        this.aeroDataBoxService.getAirportInfo(departureAirport),
        this.aeroDataBoxService.getAirportInfo(arrivalAirport),
        this.aeroDataBoxService.getRouteFlights(departureAirport, arrivalAirport, date)
      ]);

      const distance = this.calculateDistance(
        depAirport.location.lat,
        depAirport.location.lon,
        arrAirport.location.lat,
        arrAirport.location.lon
      );

      const flightTimes = flights
        .filter(f => f.departure.actualTime && f.arrival.actualTime)
        .map(f => {
          const dep = new Date(f.departure.actualTime!.utc);
          const arr = new Date(f.arrival.actualTime!.utc);
          return (arr.getTime() - dep.getTime()) / (1000 * 60); // minutes
        });

      const averageFlightTime = flightTimes.length > 0 
        ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length
        : undefined;

      return {
        departure: depAirport,
        arrival: arrAirport,
        distance,
        flights,
        averageFlightTime
      };
    } catch (error) {
      console.error('Error getting route info:', error);
      return null;
    }
  }

  /**
   * Obține statistici pentru o companie aeriană
   */
  async getAirlineStats(
    airlineCode: string,
    date?: string
  ): Promise<AirlineStats | null> {
    try {
      const flights = await this.aeroDataBoxService.getAirlineFlights(airlineCode, date);
      
      if (flights.length === 0) return null;

      const onTimeFlights = flights.filter(f => {
        if (!f.departure.scheduledTime || !f.departure.actualTime) return false;
        const scheduled = new Date(f.departure.scheduledTime.utc);
        const actual = new Date(f.departure.actualTime.utc);
        return (actual.getTime() - scheduled.getTime()) <= 15 * 60 * 1000; // 15 minutes
      });

      const delayedFlights = flights.filter(f => {
        if (!f.departure.scheduledTime || !f.departure.actualTime) return false;
        const scheduled = new Date(f.departure.scheduledTime.utc);
        const actual = new Date(f.departure.actualTime.utc);
        return (actual.getTime() - scheduled.getTime()) > 0;
      });

      const totalDelay = delayedFlights.reduce((sum, f) => {
        const scheduled = new Date(f.departure.scheduledTime.utc);
        const actual = new Date(f.departure.actualTime!.utc);
        return sum + Math.max(0, (actual.getTime() - scheduled.getTime()) / (1000 * 60));
      }, 0);

      const destinations = [...new Set(flights.map(f => f.arrival.airport.iata || f.arrival.airport.icao))];

      return {
        airlineCode,
        airlineName: flights[0]?.airline.name || 'Unknown',
        totalFlights: flights.length,
        onTimePercentage: (onTimeFlights.length / flights.length) * 100,
        averageDelay: delayedFlights.length > 0 ? totalDelay / delayedFlights.length : 0,
        destinations
      };
    } catch (error) {
      console.error('Error getting airline stats:', error);
      return null;
    }
  }

  /**
   * Tracking pentru un zbor specific
   */
  async trackFlight(
    flightNumber: string,
    date?: string
  ): Promise<FlightTrack[]> {
    try {
      return await this.aeroDataBoxService.getFlightTrack(flightNumber, date);
    } catch (error) {
      console.error('Error tracking flight:', error);
      return [];
    }
  }

  /**
   * Caută aeroporturi după nume sau locație
   */
  async searchAirports(query: string): Promise<Airport[]> {
    try {
      return await this.aeroDataBoxService.searchAirports(query);
    } catch (error) {
      console.error('Error searching airports:', error);
      return [];
    }
  }

  /**
   * Obține aeroporturile dintr-o țară
   */
  async getCountryAirports(countryCode: string): Promise<Airport[]> {
    try {
      return await this.aeroDataBoxService.getAirportsByCountry(countryCode);
    } catch (error) {
      console.error('Error getting country airports:', error);
      return [];
    }
  }

  /**
   * Obține statistici detaliate pentru un aeroport
   */
  async getDetailedAirportStats(airportCode: string): Promise<AirportStats | null> {
    try {
      return await this.aeroDataBoxService.getAirportStats(airportCode);
    } catch (error) {
      console.error('Error getting airport stats:', error);
      return null;
    }
  }

  /**
   * Generează alerte pentru zboruri
   */
  async generateFlightAlerts(flights: Flight[]): Promise<FlightAlert[]> {
    const alerts: FlightAlert[] = [];

    flights.forEach(flight => {
      const flightNumber = flight.number.iata || flight.number.icao || 'Unknown';

      // Alert pentru întârziere
      if (flight.departure.scheduledTime && flight.departure.estimatedTime) {
        const scheduled = new Date(flight.departure.scheduledTime.utc);
        const estimated = new Date(flight.departure.estimatedTime.utc);
        const delayMinutes = (estimated.getTime() - scheduled.getTime()) / (1000 * 60);

        if (delayMinutes > 15) {
          alerts.push({
            flightNumber,
            type: 'delay',
            message: `Flight delayed by ${Math.round(delayMinutes)} minutes`,
            timestamp: new Date().toISOString(),
            severity: delayMinutes > 60 ? 'high' : delayMinutes > 30 ? 'medium' : 'low'
          });
        }
      }

      // Alert pentru anulare
      if (flight.status.text.toLowerCase().includes('cancel')) {
        alerts.push({
          flightNumber,
          type: 'cancellation',
          message: `Flight cancelled: ${flight.status.text}`,
          timestamp: new Date().toISOString(),
          severity: 'high'
        });
      }

      // Alert pentru schimbare de poartă
      if (flight.departure.gate && flight.arrival.gate) {
        // Aici ar trebui să comparăm cu datele anterioare
        // Pentru demonstrație, vom genera alert random
        if (Math.random() < 0.1) { // 10% șansă
          alerts.push({
            flightNumber,
            type: 'gate_change',
            message: `Gate changed to ${flight.departure.gate}`,
            timestamp: new Date().toISOString(),
            severity: 'medium'
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Calculează scorul de relevanță pentru căutare
   */
  private calculateRelevanceScore(flight: Flight, searchTerm: string): number {
    let score = 0;
    const term = searchTerm.toLowerCase();

    // Exact match pentru numărul de zbor
    if (flight.number.iata?.toLowerCase() === term || flight.number.icao?.toLowerCase() === term) {
      score += 100;
    }

    // Partial match pentru numărul de zbor
    if (flight.number.iata?.toLowerCase().includes(term) || flight.number.icao?.toLowerCase().includes(term)) {
      score += 50;
    }

    // Match pentru call sign
    if (flight.callSign?.toLowerCase().includes(term)) {
      score += 30;
    }

    // Match pentru compania aeriană
    if (flight.airline.name.toLowerCase().includes(term)) {
      score += 20;
    }

    return score;
  }

  /**
   * Calculează distanța între două puncte geografice (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Singleton instance
let advancedFlightServiceInstance: AdvancedFlightService | null = null;

export function getAdvancedFlightService(): AdvancedFlightService {
  if (!advancedFlightServiceInstance) {
    const apiKey = process.env.NEXT_PUBLIC_FLIGHT_API_KEY || 'demo-key';
    advancedFlightServiceInstance = new AdvancedFlightService(apiKey);
  }
  return advancedFlightServiceInstance;
}

export default AdvancedFlightService;