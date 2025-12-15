import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AircraftDetailView } from '@/components/analytics/AircraftDetailView'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { icao24: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In a real app, you'd fetch the aircraft data here
  const icao24 = params.icao24.toUpperCase()
  
  return {
    title: `Aeronavă ${icao24} - Detalii și Istoric Zboruri`,
    description: `Informații complete despre aeronava cu ICAO24 ${icao24}: model, operator, istoric zboruri, statistici de performanță și întârzieri.`,
    keywords: [
      `aeronava ${icao24}`,
      `ICAO24 ${icao24}`,
      'istoric zboruri aeronava',
      'statistici aeronava Romania',
      'detalii aeronava'
    ],
    openGraph: {
      title: `Aeronavă ${icao24} - Detalii Complete`,
      description: `Explorează istoricul și statisticile aeronavei ${icao24}. Informații despre model, operator și performanță.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeronave/${icao24.toLowerCase()}`,
    },
  }
}

export default function AircraftDetailPage({ params }: Props) {
  const icao24 = params.icao24.toUpperCase()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Aeronavă ${icao24}`,
    description: `Detalii complete despre aeronava cu ICAO24 ${icao24}`,
    url: `https://anyway.ro/aeronave/${icao24.toLowerCase()}`,
    mainEntity: {
      '@type': 'Vehicle',
      '@id': `#aircraft-${icao24}`,
      name: `Aeronavă ${icao24}`,
      identifier: icao24
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
        <section className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Aeronavă {icao24}
              </h1>
              <p className="text-xl text-cyan-100 mb-2">
                Detalii Complete și Istoric Zboruri
              </p>
              <p className="text-cyan-200">
                Informații despre model, operator, performanță și statistici
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <AircraftDetailView icao24={icao24} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Aircraft Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Despre ICAO24
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Cod Unic</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Fiecare aeronavă are un cod ICAO24 unic mondial
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Urmărire</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Folosit pentru urmărirea zborurilor în timp real
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Istoric</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Păstrează istoricul complet al zborurilor
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Căutări Similare
                </h3>
                <div className="space-y-2">
                  <a
                    href="/aeronave"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Catalog Aeronave</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Căutare generală</div>
                  </a>
                  <a
                    href="/aeronave?search=TAROM"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Aeronave TAROM</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Flota națională</div>
                  </a>
                  <a
                    href="/aeroporturi"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Aeroporturi</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">România și Moldova</div>
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