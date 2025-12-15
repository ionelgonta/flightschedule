import { Metadata } from 'next'
import Link from 'next/link'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { MapPin, Plane, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aeroporturi - Program Zboruri',
  description: 'Explorează toate aeroporturile majore din lume. Obține informații în timp real despre zboruri, sosiri și plecări de la aeroporturi internaționale.',
  keywords: ['aeroporturi', 'aeroporturi internaționale', 'informații zboruri', 'coduri aeroporturi', 'aviație'],
  openGraph: {
    title: 'Aeroporturi - Program Zboruri',
    description: 'Explorează toate aeroporturile majore din lume cu informații în timp real despre zboruri.',
    type: 'website',
  },
  alternates: {
    canonical: '/aeroporturi',
  },
}

export default function AirportsPage() {
  const airportsByRegion = {
    'Romania & Moldova': MAJOR_AIRPORTS.filter(a => ['Romania', 'Moldova'].includes(a.country)),
    'Western Europe': MAJOR_AIRPORTS.filter(a => ['United Kingdom', 'France', 'Germany', 'Austria', 'Italy'].includes(a.country)),
    'Middle East & Turkey': MAJOR_AIRPORTS.filter(a => ['United Arab Emirates', 'Turkey'].includes(a.country)),
    'Other Regions': MAJOR_AIRPORTS.filter(a => !['Romania', 'Moldova', 'United Kingdom', 'France', 'Germany', 'Austria', 'Italy', 'United Arab Emirates', 'Turkey'].includes(a.country))
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Airports - Flight Schedule',
    description: 'Browse all major airports worldwide with real-time flight information.',
    url: 'https://anyway.ro/aeroporturi',
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
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <MapPin className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Director Aeroporturi
              </h1>
              <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
                Explorează aeroporturi majore din întreaga lume și accesează informații în timp real despre zboruri, 
                sosiri și plecări de la hub-uri internaționale de aviație.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Search Section */}
              <section>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Search className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Găsește un Aeroport
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Caută după codul aeroportului, numele orașului sau țara pentru a găsi informații despre zboruri.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                        {MAJOR_AIRPORTS.length}+
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Aeroporturi</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                        50+
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Țări</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                        24/7
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Date în Timp Real</div>
                    </div>
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

              {/* Airports by Region */}
              {Object.entries(airportsByRegion).map(([region, airports]) => (
                airports.length > 0 && (
                  <section key={region}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {region}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {airports.map((airport) => (
                        <Link
                          key={airport.code}
                          href={`/aeroport/${generateAirportSlug(airport)}`}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                  {airport.city}
                                </span>
                                <Plane className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                {airport.name}
                              </h3>
                              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4" />
                                <span>{airport.city}, {airport.country}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Sosiri
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Plecări
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              ))}

              {/* SEO Content */}
              <section className="prose prose-gray dark:prose-invert max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Rețeaua Globală de Aeroporturi
                </h2>
                <div className="text-gray-600 dark:text-gray-400 space-y-4">
                  <p>
                    Directorul nostru cuprinzător de aeroporturi oferă acces la informații în timp real despre zboruri 
                    de la aeroporturi internaționale majore din întreaga lume. Fie că urmărești sosiri, 
                    monitorizezi plecări sau îți planifici călătoria, platforma noastră oferă date detaliate 
                    despre zboruri de la sute de aeroporturi de pe șase continente.
                  </p>
                  <p>
                    Fiecare pagină de aeroport oferă informații cuprinzătoare incluzând statusul zborurilor în timp real, 
                    detalii despre companii aeriene, informații despre terminale și porți, și date istorice. 
                    Sistemul nostru avansat de filtrare îți permite să cauți după criterii specifice precum 
                    compania aeriană, statusul zborului, destinația și intervalul de timp.
                  </p>
                  <p>
                    De la hub-uri majore precum Aeroportul Internațional Henri Coandă (OTP) din București 
                    și London Heathrow (LHR) la aeroporturi regionale care deservesc milioane de pasageri 
                    anual, baza noastră de date acoperă cele mai aglomerate și importante facilități de aviație din lume.
                  </p>
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
              
              {/* Popular Airports */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cele Mai Populare
                </h3>
                <div className="space-y-3">
                  {MAJOR_AIRPORTS.slice(0, 5).map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {airport.city}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {airport.name}
                          </div>
                        </div>
                        <Plane className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
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