import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { FlightAnalyticsView } from '@/components/analytics/FlightAnalyticsView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { code: string }
  searchParams: { 
    view?: 'routes' | 'airlines' | 'punctuality'
    period?: 'week' | 'month' | 'quarter'
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
    title: `Analize Zboruri ${airport.city} - Rute și Destinații ${airport.name}`,
    description: `Analize complete ale zborurilor de la ${airport.name}: cele mai frecvente rute, top destinații, companii aeriene punctuale și statistici detaliate pentru ${airport.city}.`,
    keywords: [
      `analize zboruri ${airport.city}`,
      `rute aeriene ${airport.code}`,
      `destinatii populare ${airport.city}`,
      `companii aeriene ${airport.name}`,
      'analiza trafic aerian Romania'
    ],
    openGraph: {
      title: `Analize Zboruri ${airport.city} - ${airport.name}`,
      description: `Descoperă rutele cele mai frecvente și companiile aeriene de la ${airport.name}. Analize complete de trafic aerian.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/analize-zboruri`,
    },
  }
}

export default function FlightAnalyticsPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Analize Zboruri ${airport.city} - ${airport.name}`,
    description: `Analize detaliate ale rutelor și companiilor aeriene de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/analize-zboruri`,
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
        <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Analize Zboruri {airport.city}
              </h1>
              <p className="text-xl text-indigo-100 mb-2">
                {airport.name}
              </p>
              <p className="text-indigo-200">
                Rute frecvente, destinații populare și analize de punctualitate
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
                analyticsType="analize-zboruri"
              />
              
              <FlightAnalyticsView 
                airport={airport}
                initialView={searchParams.view || 'routes'}
                initialPeriod={searchParams.period || 'month'}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Analysis Views */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tipuri de Analize
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Rute Frecvente</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Destinațiile cele mai populare și volumul de trafic
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Companii Aeriene</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Operatorii principali și cota de piață
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Punctualitate</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Zborurile cele mai punctuale și întârziate
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Alte Analize
                </h3>
                <div className="space-y-2">
                  <a
                    href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Program Zboruri</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Calendar și filtre</div>
                  </a>
                  <a
                    href={`/aeroport/${generateAirportSlug(airport)}/statistici`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Statistici</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Performanță și indici</div>
                  </a>
                  <a
                    href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Istoric</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tendințe și evoluție</div>
                  </a>
                </div>
              </div>

              {/* Aircraft Catalog Link */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Catalog Aeronave
                </h3>
                <a
                  href="/aeronave"
                  className="block p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-colors"
                >
                  <div className="font-medium text-blue-900 dark:text-blue-100">Explorează Aeronavele</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Căutare după ICAO24, înmatriculare și istoric zboruri
                  </div>
                </a>
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