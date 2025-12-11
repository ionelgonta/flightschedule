import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCode } from '@/lib/airports'
import { Plane, ArrowRight, MapPin, Clock, Users, Building } from 'lucide-react'
import { AdBanner } from '@/components/ads/AdBanner'

interface AirportPageProps {
  params: {
    code: string
  }
}

export async function generateMetadata({ params }: AirportPageProps): Promise<Metadata> {
  const airport = getAirportByCode(params.code.toUpperCase())
  
  if (!airport) {
    return {
      title: 'Airport Not Found'
    }
  }

  return {
    title: `${airport.name} (${airport.code}) - Flight Schedule`,
    description: `Real-time flight arrivals and departures for ${airport.name} in ${airport.city}, ${airport.country}. Track flights, check status, and get detailed information.`,
    keywords: [`${airport.code} airport`, `${airport.city} flights`, `${airport.name}`, 'flight schedule', 'arrivals', 'departures'],
    openGraph: {
      title: `${airport.name} (${airport.code}) - Flight Schedule`,
      description: `Real-time flight information for ${airport.name} in ${airport.city}, ${airport.country}`,
      type: 'website',
    },
    alternates: {
      canonical: `/airport/${airport.code}`,
    },
  }
}

export default function AirportPage({ params }: AirportPageProps) {
  const airport = getAirportByCode(params.code.toUpperCase())

  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Airport',
    name: airport.name,
    iataCode: airport.code,
    address: {
      '@type': 'PostalAddress',
      addressLocality: airport.city,
      addressCountry: airport.country,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen">
        {/* Header Banner Ad */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-4"
          />
        </div>

        {/* Airport Header */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <Plane className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {airport.name}
              </h1>
              <div className="flex items-center justify-center space-x-2 text-xl text-primary-100 mb-8">
                <MapPin className="h-5 w-5" />
                <span>{airport.city}, {airport.country}</span>
                <span className="mx-2">•</span>
                <span className="font-mono font-bold">{airport.code}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/airport/${airport.code}/arrivals`}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>View Arrivals</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/airport/${airport.code}/departures`}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>View Departures</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Quick Stats */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Airport Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Real-Time Data
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Live flight information updated every few minutes
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Multiple Airlines
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Comprehensive coverage of all major carriers
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Building className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Terminal Info
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Detailed terminal and gate information
                    </p>
                  </div>
                </div>
              </section>

              {/* Inline Banner Ad */}
              <div className="py-8">
                <AdBanner 
                  slot="inline-banner"
                  size="728x90"
                  className="mx-auto"
                />
              </div>

              {/* Airport Information */}
              <section className="prose prose-gray dark:prose-invert max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  About {airport.name}
                </h2>
                <div className="text-gray-600 dark:text-gray-400 space-y-4">
                  <p>
                    {airport.name} ({airport.code}) is a major international airport serving {airport.city}, {airport.country}. 
                    As one of the busiest airports in the region, it handles millions of passengers annually and serves as a 
                    crucial hub for both domestic and international travel.
                  </p>
                  <p>
                    The airport features modern facilities and multiple terminals designed to accommodate the growing number 
                    of travelers. With state-of-the-art technology and efficient operations, {airport.name} provides a seamless 
                    travel experience for passengers from around the world.
                  </p>
                  <p>
                    Our real-time flight tracking system provides comprehensive information about all arrivals and departures 
                    at {airport.name}, including flight status updates, gate assignments, terminal information, and estimated 
                    arrival/departure times. Whether you're picking up passengers, catching a flight, or simply monitoring 
                    flight activity, our platform keeps you informed with the latest information.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  Airlines Operating at {airport.code}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {airport.name} serves as a hub for numerous international and domestic airlines, offering connections 
                  to destinations worldwide. Major carriers operating from this airport include both full-service and 
                  low-cost airlines, providing travelers with a wide range of options for their journey.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  Terminal Facilities
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The airport features multiple terminals equipped with modern amenities including restaurants, shops, 
                  lounges, and business facilities. Each terminal is designed to provide comfort and convenience for 
                  travelers, with clear signage and efficient passenger flow management.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  Transportation and Access
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {airport.name} is well-connected to {airport.city} and surrounding areas through various transportation 
                  options including public transit, taxis, ride-sharing services, and rental cars. The airport's strategic 
                  location ensures easy access for both local and international travelers.
                </p>
              </section>

              {/* FAQ Section */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Frequently Asked Questions - {airport.code}
                </h2>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How do I check real-time flight status at {airport.code}?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Use our arrivals and departures pages to get real-time flight information for {airport.name}. 
                      You can filter by airline, flight status, or search for specific flights.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      What information is available for each flight?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Our system provides comprehensive flight details including airline, flight number, origin/destination, 
                      scheduled and estimated times, current status, terminal, and gate information.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How often is the flight data updated?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Flight information is updated in real-time, with data refreshed every few minutes to ensure 
                      accuracy and provide the most current status updates.
                    </p>
                  </div>
                </div>
              </section>
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
                  Quick Access
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/airport/${airport.code}/arrivals`}
                    className="block w-full text-left px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    View Arrivals
                  </Link>
                  <Link
                    href={`/airport/${airport.code}/departures`}
                    className="block w-full text-left px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    View Departures
                  </Link>
                </div>
              </div>

              {/* Airport Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Airport Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Code</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">City</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Country</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timezone</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.timezone}</span>
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
    </>
  )
}