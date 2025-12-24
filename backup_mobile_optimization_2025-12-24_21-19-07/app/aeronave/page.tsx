import { Metadata } from 'next'
import { AircraftCatalogView } from '@/components/analytics/AircraftCatalogView'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  searchParams: { 
    search?: string
    type?: 'icao24' | 'registration'
  }
}

export const metadata: Metadata = {
  title: 'Catalog Aeronave România - Căutare ICAO24 și Înmatriculare',
  description: 'Catalog complet al aeronavelor din România: căutare după ICAO24, număr de înmatriculare, model și operator. Istoric zboruri și statistici detaliate pentru fiecare aeronavă.',
  keywords: [
    'catalog aeronave Romania',
    'ICAO24 Romania',
    'inmatriculare aeronave',
    'istoric zboruri aeronave',
    'statistici aviatie Romania',
    'aeronave comerciale Romania'
  ],
  openGraph: {
    title: 'Catalog Aeronave România - Căutare și Statistici',
    description: 'Explorează catalogul complet al aeronavelor din România. Căutare avansată și istoric zboruri.',
    type: 'website',
  },
  alternates: {
    canonical: '/aeronave',
  },
}

export default function AircraftCatalogPage({ searchParams }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Catalog Aeronave România',
    description: 'Catalog complet al aeronavelor din România cu căutare după ICAO24 și înmatriculare',
    url: 'https://anyway.ro/aeronave',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Aeronave România',
      description: 'Lista aeronavelor înregistrate și operate în România'
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
        <section className="bg-gradient-to-r from-sky-600 to-sky-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Catalog Aeronave România
              </h1>
              <p className="text-xl text-sky-100 mb-2">
                Căutare și Statistici Aeronave
              </p>
              <p className="text-sky-200">
                Explorează catalogul complet: ICAO24, înmatriculare, istoric zboruri
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <AircraftCatalogView 
                initialSearch={searchParams.search}
                initialType={searchParams.type || 'icao24'}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Search Help */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ghid Căutare
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">ICAO24</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Cod unic de 6 caractere (ex: 4A1234)
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Înmatriculare</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Numărul de înmatriculare (ex: YR-ABC)
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Model</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Tipul aeronavei (ex: Boeing 737)
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Aircraft Types */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tipuri Populare
                </h3>
                <div className="space-y-2">
                  <a
                    href="/aeronave?search=Boeing+737"
                    className="block p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">Boeing 737</div>
                  </a>
                  <a
                    href="/aeronave?search=Airbus+A320"
                    className="block p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">Airbus A320</div>
                  </a>
                  <a
                    href="/aeronave?search=ATR+72"
                    className="block p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">ATR 72</div>
                  </a>
                  <a
                    href="/aeronave?search=TAROM"
                    className="block p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">TAROM</div>
                  </a>
                </div>
              </div>

              {/* Airport Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Analize Aeroporturi
                </h3>
                <div className="space-y-2">
                  <a
                    href="/aeroport/bucuresti-henri-coanda/analize-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">București Henri Coandă</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Analize zboruri și rute</div>
                  </a>
                  <a
                    href="/aeroporturi"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Toate Aeroporturile</div>
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