import { Flight, FlightFilters, ApiResponse } from '@/types/flight'
import { getAirportByCode } from './airports'

// Mock data generator for demonstration
const generateMockFlight = (index: number, type: 'arrival' | 'departure', airportCode: string): Flight => {
  const airlines = [
    { name: 'American Airlines', code: 'AA' },
    { name: 'Delta Air Lines', code: 'DL' },
    { name: 'United Airlines', code: 'UA' },
    { name: 'British Airways', code: 'BA' },
    { name: 'Air France', code: 'AF' },
    { name: 'Lufthansa', code: 'LH' },
    { name: 'Emirates', code: 'EK' },
    { name: 'Singapore Airlines', code: 'SQ' },
    { name: 'Qatar Airways', code: 'QR' },
    { name: 'TAROM', code: 'RO' }
  ]

  const otherAirports = ['JFK', 'LAX', 'LHR', 'CDG', 'FRA', 'NRT', 'SIN', 'DXB', 'SYD', 'OTP']
    .filter(code => code !== airportCode)

  const airline = airlines[index % airlines.length]
  const otherAirport = getAirportByCode(otherAirports[index % otherAirports.length])!
  const currentAirport = getAirportByCode(airportCode)!
  
  const statuses = ['scheduled', 'active', 'landed', 'delayed', 'cancelled'] as const
  const status = statuses[index % statuses.length]
  
  const baseTime = new Date()
  baseTime.setHours(baseTime.getHours() + (index % 24) - 12)
  
  const scheduledTime = baseTime.toISOString()
  const estimatedTime = new Date(baseTime.getTime() + (Math.random() - 0.5) * 3600000).toISOString()

  return {
    id: `${airline.code}${(1000 + index).toString()}`,
    flightNumber: `${airline.code}${(1000 + index).toString()}`,
    airline,
    departure: type === 'departure' ? {
      airport: currentAirport,
      scheduled: scheduledTime,
      estimated: status === 'delayed' ? estimatedTime : undefined,
      terminal: `T${(index % 3) + 1}`,
      gate: `${String.fromCharCode(65 + (index % 6))}${(index % 20) + 1}`
    } : {
      airport: otherAirport,
      scheduled: scheduledTime,
      estimated: status === 'delayed' ? estimatedTime : undefined,
      terminal: `T${(index % 3) + 1}`,
      gate: `${String.fromCharCode(65 + (index % 6))}${(index % 20) + 1}`
    },
    arrival: type === 'arrival' ? {
      airport: currentAirport,
      scheduled: scheduledTime,
      estimated: status === 'delayed' ? estimatedTime : undefined,
      terminal: `T${(index % 3) + 1}`,
      gate: `${String.fromCharCode(65 + (index % 6))}${(index % 20) + 1}`
    } : {
      airport: otherAirport,
      scheduled: scheduledTime,
      estimated: status === 'delayed' ? estimatedTime : undefined,
      terminal: `T${(index % 3) + 1}`,
      gate: `${String.fromCharCode(65 + (index % 6))}${(index % 20) + 1}`
    },
    status,
    duration: `${Math.floor(Math.random() * 12) + 1}h ${Math.floor(Math.random() * 60)}m`,
    delay: status === 'delayed' ? Math.floor(Math.random() * 180) + 15 : undefined
  }
}

export class AirportsService {
  private static instance: AirportsService
  private cache = new Map<string, { data: Flight[], timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): AirportsService {
    if (!AirportsService.instance) {
      AirportsService.instance = new AirportsService()
    }
    return AirportsService.instance
  }

  private getCacheKey(airportCode: string, type: 'arrivals' | 'departures', filters?: FlightFilters): string {
    return `${airportCode}-${type}-${JSON.stringify(filters || {})}`
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private filterFlights(flights: Flight[], filters?: FlightFilters): Flight[] {
    if (!filters) return flights

    return flights.filter(flight => {
      if (filters.airline && !flight.airline.name.toLowerCase().includes(filters.airline.toLowerCase())) {
        return false
      }
      
      if (filters.status && flight.status !== filters.status) {
        return false
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesFlightNumber = flight.flightNumber.toLowerCase().includes(searchTerm)
        const matchesAirline = flight.airline.name.toLowerCase().includes(searchTerm)
        const matchesDestination = flight.arrival.airport.city.toLowerCase().includes(searchTerm) ||
                                 flight.departure.airport.city.toLowerCase().includes(searchTerm)
        
        if (!matchesFlightNumber && !matchesAirline && !matchesDestination) {
          return false
        }
      }
      
      return true
    })
  }

  async getArrivals(airportCode: string, filters?: FlightFilters): Promise<ApiResponse<Flight[]>> {
    try {
      const cacheKey = this.getCacheKey(airportCode, 'arrivals', filters)
      const cached = this.cache.get(cacheKey)
      
      if (cached && this.isValidCache(cached.timestamp)) {
        return {
          data: this.filterFlights(cached.data, filters)
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

      // Generate mock data
      const flights = Array.from({ length: 50 }, (_, i) => 
        generateMockFlight(i, 'arrival', airportCode)
      )

      this.cache.set(cacheKey, { data: flights, timestamp: Date.now() })

      return {
        data: this.filterFlights(flights, filters)
      }
    } catch (error) {
      return {
        data: [],
        error: 'Failed to fetch arrivals data'
      }
    }
  }

  async getDepartures(airportCode: string, filters?: FlightFilters): Promise<ApiResponse<Flight[]>> {
    try {
      const cacheKey = this.getCacheKey(airportCode, 'departures', filters)
      const cached = this.cache.get(cacheKey)
      
      if (cached && this.isValidCache(cached.timestamp)) {
        return {
          data: this.filterFlights(cached.data, filters)
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

      // Generate mock data
      const flights = Array.from({ length: 50 }, (_, i) => 
        generateMockFlight(i, 'departure', airportCode)
      )

      this.cache.set(cacheKey, { data: flights, timestamp: Date.now() })

      return {
        data: this.filterFlights(flights, filters)
      }
    } catch (error) {
      return {
        data: [],
        error: 'Failed to fetch departures data'
      }
    }
  }

  async getFlightByNumber(flightNumber: string): Promise<ApiResponse<Flight | null>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

      // Generate mock flight data
      const flight = generateMockFlight(0, 'departure', 'JFK')
      flight.flightNumber = flightNumber
      flight.id = flightNumber

      return {
        data: flight
      }
    } catch (error) {
      return {
        data: null,
        error: 'Failed to fetch flight data'
      }
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}