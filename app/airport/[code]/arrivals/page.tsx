'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCode } from '@/lib/airports'
import { AirportsService } from '@/lib/airportsService'
import { Flight, FlightFilters } from '@/types/flight'
import { FlightDisplay } from '@/components/flights/FlightDisplay'
import { AdBanner } from '@/components/ads/AdBanner'
import { ArrowLeft, RefreshCw, Plane } from 'lucide-react'

interface ArrivalsPageProps {
  params: {
    code: string
  }
}

export default function ArrivalsPage({ params }: ArrivalsPageProps) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const airport = getAirportByCode(params.code.toUpperCase())
  const airportsService = AirportsService.getInstance()

  if (!airport) {
    notFound()
  }

  const fetchFlights = async (filters?: FlightFilters) => {
    try {
      setLoading(true)
      setError(null)
      const response = await airportsService.getArrivals(airport.code, filters)
      
      if (response.error) {
        setError(response.error)
      } else {
        setFlights(response.data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      setError('Failed to fetch flight data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchFlights()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [airport.code])

  const handleRefresh = () => {
    fetchFlights()
  }

  const handleFiltersChange = (filters: FlightFilters) => {
    fetchFlights(filters)
  }

  return (
    <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-4"
        />
      </div>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href={`/airport/${airport.code}`}
              className="flex items-center space-x-2 text-green-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to {airport.code}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Arrivals - {airport.name}
              </h1>
              <p className="text-green-100 text-lg">
                {airport.city}, {airport.country} ({airport.code})
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                {lastUpdated && (
                  <p className="text-sm text-green-100">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Mobile Refresh Button */}
            <div className="md:hidden mb-6 flex items-center justify-between">
              {lastUpdated && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <div className="text-red-600 dark:text-red-400 mb-2">
                  <Plane className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Unable to Load Flight Data</h3>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <FlightDisplay
                flights={flights}
                loading={loading}
                type="arrivals"
                onFiltersChange={handleFiltersChange}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/airport/${airport.code}/departures`}
                  className="block w-full text-left px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  View Departures
                </Link>
                <Link
                  href={`/airport/${airport.code}`}
                  className="block w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Airport Overview
                </Link>
              </div>
            </div>

            {/* Flight Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Arrival Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Flights</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{flights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">On Time</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {flights.filter(f => f.status === 'scheduled' || f.status === 'landed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Delayed</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {flights.filter(f => f.status === 'delayed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {flights.filter(f => f.status === 'cancelled').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Square Ad */}
            <AdBanner 
              slot="sidebar-square"
              size="300x250"
            />
          </div>
        </div>
      </div>
    </div>
  )
}