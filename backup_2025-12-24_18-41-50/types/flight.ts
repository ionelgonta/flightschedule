export interface Flight {
  id: string
  flightNumber: string
  airline: {
    name: string
    code: string
    logo?: string
  }
  aircraft?: {
    model: string
    registration: string
  }
  departure: {
    airport: {
      name: string
      code: string
      city: string
      country: string
    }
    scheduled: string
    estimated?: string
    actual?: string
    terminal?: string
    gate?: string
  }
  arrival: {
    airport: {
      name: string
      code: string
      city: string
      country: string
    }
    scheduled: string
    estimated?: string
    actual?: string
    terminal?: string
    gate?: string
  }
  status: FlightStatus
  duration?: string
  delay?: number
}

export type FlightStatus = 
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'delayed'
  | 'diverted'
  | 'boarding'
  | 'departed'
  | 'unknown'
  | 'estimated'

export interface Airport {
  code: string
  name: string
  city: string
  country: string
  timezone: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface FlightFilters {
  airline?: string
  status?: FlightStatus
  destination?: string
  timeRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface ApiResponse<T> {
  data: T
  pagination?: {
    total: number
    page: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
  error?: string
}