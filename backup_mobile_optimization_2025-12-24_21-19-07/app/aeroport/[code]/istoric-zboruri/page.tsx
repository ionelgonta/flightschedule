import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { HistoricalAnalysisView } from '@/components/analytics/HistoricalAnalysisView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { code: string }
  searchParams: { 
    from?: string
    to?: string
    type?: 'volume' | 'delays' | 'performance'
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
    title: `Istoric Zboruri ${airport.city} - Analize Tendințe ${airport.name}`,
    description: `Analize istorice detaliate pentru zborurile de la ${airport.name}: evoluția volumului de trafic, tendințe întârzieri și performanță în timp pentru ${airport.city}.`,
    keywords: [
      `istoric zboruri ${airport.city}`,
      `tendinte aviatie ${airport.code}`,
      `evolutie trafic aerian ${airport.city}`,
      `analiza istorica ${airport.name}`,
      'statistici aviatie Romania istoric'
    ],
    openGraph: {
      title: `Istoric Zboruri ${airport.city} - ${airport.name}`,
      description: `Urmărește evoluția zborurilor și tendințele de performanță la ${airport.name}. Analize istorice complete.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`,
    },
  }
}

export default function HistoricalAnalysisPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Istoric Zboruri ${airport.city} - ${airport.name}`,
    description: `Analize istorice și tendințe pentru zborurile de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`,
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
        <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Istoric Zboruri {airport.city}
              </h1>
              <p className="text-xl text-purple-100 mb-2">
                {airport.name}
              </p>
              <p className="text-purple-200">
                Analize istorice și tendințe: evoluție trafic, performanță în timp
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
                analyticsType="istoric-zboruri"
              />
              
              <HistoricalAnalysisView 
                airport={airport}
                initialFilters={{
                  from: searchParams.from,
                  to: searchParams.to,
                  type: searchParams.type || 'volume'
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
              
              {/* Analysis Types */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tipuri de Analize
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Volum Trafic</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Evoluția numărului de zboruri în timp
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Tendințe Întârzieri</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Analiza întârzierilor pe perioade lungi
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Performanță</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Comparații între luni și sezoane
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
                    href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Analize Rute</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Destinații și companii</div>
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