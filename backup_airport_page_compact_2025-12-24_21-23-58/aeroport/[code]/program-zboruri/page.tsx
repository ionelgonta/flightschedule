import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { FlightSchedulesView } from '@/components/analytics/FlightSchedulesView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { code: string }
  searchParams: { 
    type?: 'arrivals' | 'departures'
    from?: string
    to?: string
    airline?: string
    status?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    return {
      title: 'Aeroport nu a fost găsit',
    }
  }

  return {
    title: `Program Zboruri ${airport.city} - ${airport.name}`,
    description: `Programul complet al zborurilor de la ${airport.name} din ${airport.city}. Consultă sosirile și plecările zilnice, săptămânale și istorice cu filtre avansate.`,
    keywords: [
      `program zboruri ${airport.city}`,
      `orarul zborurilor ${airport.code}`,
      `sosiri plecari ${airport.city}`,
      `calendar zboruri ${airport.name}`,
      'program zbor Romania'
    ],
    openGraph: {
      title: `Program Zboruri ${airport.city} - ${airport.name}`,
      description: `Programul complet al zborurilor de la ${airport.name}. Sosiri, plecări și informații detaliate despre zboruri.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/program-zboruri`,
    },
  }
}

export default function FlightSchedulesPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Program Zboruri ${airport.city} - ${airport.name}`,
    description: `Programul complet al zborurilor de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/program-zboruri`,
    about: {
      '@type': 'Airport',
      name: airport.name,
      iataCode: airport.code,
      address: {
        '@type': 'PostalAddress',
        addressLocality: airport.city,
        addressCountry: airport.country
      }
    }
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

        {/* Page Header */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Program Zboruri {airport.city}
              </h1>
              <p className="text-xl text-blue-100 mb-2">
                {airport.name}
              </p>
              <p className="text-blue-200">
                Programul complet al zborurilor cu filtre avansate și calendar interactiv
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Airport Selector */}
              <AirportSelector 
                currentAirport={airport}
                analyticsType="program-zboruri"
              />
              
              <FlightSchedulesView 
                airport={airport}
                initialType={searchParams.type || 'departures'}
                initialFilters={{
                  airline: searchParams.airline,
                  status: searchParams.status,
                  from: searchParams.from,
                  to: searchParams.to
                }}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Quick Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informații Aeroport
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Cod IATA</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{airport.code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Oraș</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{airport.city}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Țară</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{airport.country}</div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Analize Zboruri
                </h3>
                <div className="space-y-2">
                  <a
                    href={`/aeroport/${generateAirportSlug(airport)}/statistici`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Statistici</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Performanță și întârzieri</div>
                  </a>
                  <a
                    href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Istoric</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tendințe și evoluție</div>
                  </a>
                  <a
                    href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Analize</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rute și destinații</div>
                  </a>
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