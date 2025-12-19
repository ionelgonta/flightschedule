import { Metadata } from 'next'
import Link from 'next/link'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { MapPin, Plane, Search } from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Toate Aeroporturile din România și Moldova - Director Complet',
  description: 'Director complet cu toate aeroporturile din România și Moldova. Informații în timp real despre zboruri, sosiri și plecări de la OTP Otopeni, CLJ Cluj, TSR Timișoara, IAS Iași, RMO Chișinău și toate aeroporturile naționale. Coduri IATA, statistici și programe de zbor.',
  keywords: [
    'aeroporturi romania lista completa',
    'aeroporturi moldova',
    'director aeroporturi romania',
    'coduri aeroporturi romania',
    'OTP otopeni bucuresti',
    'CLJ cluj napoca',
    'TSR timisoara',
    'IAS iasi',
    'RMO chisinau moldova',
    'CND constanta',
    'SBZ sibiu',
    'informatii aeroporturi romania',
    'program zboruri aeroporturi',
    'sosiri plecari aeroporturi romania'
  ],
  openGraph: {
    title: 'Toate Aeroporturile din România și Moldova - Director Complet',
    description: 'Director complet cu toate aeroporturile din România și Moldova. Informații în timp real despre zboruri de la toate aeroporturile naționale.',
    type: 'website',
    url: 'https://anyway.ro/aeroporturi'
  },
  alternates: {
    canonical: '/aeroporturi',
  },
}

export default function AirportsPage() {
  const airportsByRegion = {
    'România': MAJOR_AIRPORTS.filter(a => a.country === 'România'),
    'Moldova': MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')
  }

  const breadcrumbItems = [
    { name: 'Aeroporturi', href: '/aeroporturi' }
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Toate Aeroporturile din România și Moldova',
    description: 'Director complet cu toate aeroporturile din România și Moldova cu informații în timp real despre zboruri.',
    url: 'https://anyway.ro/aeroporturi',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Aeroporturi România și Moldova',
      numberOfItems: MAJOR_AIRPORTS.length,
      itemListElement: MAJOR_AIRPORTS.map((airport, index) => ({
        '@type': 'Airport',
        position: index + 1,
        name: airport.name,
        iataCode: airport.code,
        address: {
          '@type': 'PostalAddress',
          addressLocality: airport.city,
          addressCountry: airport.country
        }
      }))
    }
  }

  return (
    <>
      <StructuredData data={jsonLd} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Aeroporturi', url: 'https://anyway.ro/aeroporturi' }
      ])} />
      
      <div className="min-h-screen">
        {/* Header Banner Ad */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-300 dark:border-gray-600">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-6"
          />
        </div>

        {/* Page Header */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-3xl shadow-xl">
                  <MapPin className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Director Aeroporturi
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                Explorează toate aeroporturile din România și Moldova și accesează informații în timp real despre zboruri, 
                sosiri și plecări de la aeroporturile naționale.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Search Section */}
              <section>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 p-8 shadow-lg">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                      <Search className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Găsește un Aeroport
                    </h2>
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                    Caută după codul aeroportului sau numele orașului pentru a găsi informații despre zboruri din România și Moldova.
                  </p>
                  
                  {/* Stats Table */}
                  <div className="hidden md:block">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden shadow-md">
                      <table className="w-full">
                        <thead className="bg-gray-200 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Statistică</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Valoare</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Descriere</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-750 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">Aeroporturi</td>
                            <td className="px-6 py-4 text-xl text-blue-700 dark:text-blue-400 font-bold">{MAJOR_AIRPORTS.length}+</td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Aeroporturi acoperite</td>
                          </tr>
                          <tr className="border-b border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-750 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">Țări</td>
                            <td className="px-6 py-4 text-xl text-blue-700 dark:text-blue-400 font-bold">2</td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">România și Moldova</td>
                          </tr>
                          <tr className="hover:bg-white dark:hover:bg-gray-750 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">Disponibilitate</td>
                            <td className="px-6 py-4 text-xl text-blue-700 dark:text-blue-400 font-bold">24/7</td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">Date în timp real</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aeroporturi:</span>
                      <span className="text-lg text-blue-700 dark:text-blue-400 font-bold">{MAJOR_AIRPORTS.length}+</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700 shadow-sm">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Țări:</span>
                      <span className="text-lg text-green-700 dark:text-green-400 font-bold">2</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Disponibilitate:</span>
                      <span className="text-lg text-purple-700 dark:text-purple-400 font-bold">24/7</span>
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
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                      Aeroporturi din {region}
                    </h2>
                    
                    {/* Desktop Table */}
                    <div className="hidden md:block mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden shadow-lg">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Cod</th>
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Oraș</th>
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Nume Aeroport</th>
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Servicii</th>
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-200">Acțiuni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {airports.map((airport, index) => (
                              <tr 
                                key={airport.code}
                                className={`
                                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm
                                  ${index !== airports.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}
                                `}
                              >
                                <td className="px-6 py-5">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                                      <Plane className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-lg text-blue-700 dark:text-blue-400 font-bold">{airport.code}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-base text-gray-900 dark:text-white font-semibold">{airport.city}</td>
                                <td className="px-6 py-5 text-sm text-gray-800 dark:text-gray-200 font-medium">{airport.name}</td>
                                <td className="px-6 py-5">
                                  <div className="flex space-x-3">
                                    <span className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                                      Sosiri
                                    </span>
                                    <span className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold shadow-sm">
                                      Plecări
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <Link
                                    href={`/aeroport/${generateAirportSlug(airport)}`}
                                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                  >
                                    Vezi detalii
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4 mb-8">
                      {airports.map((airport) => (
                        <Link
                          key={airport.code}
                          href={`/aeroport/${generateAirportSlug(airport)}`}
                          className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                                <Plane className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <div className="text-xl text-blue-700 dark:text-blue-400 font-bold">{airport.code}</div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{airport.city}</div>
                              </div>
                            </div>
                            <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md">
                              <span className="text-sm font-bold">Vezi</span>
                            </div>
                          </div>
                          <div className="mb-4">
                            <div className="text-base text-gray-900 dark:text-white font-semibold mb-2">{airport.name}</div>
                            <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>{airport.city}, {airport.country}</span>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                              Sosiri
                            </span>
                            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold shadow-sm">
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
                  Aeroporturile din România și Moldova
                </h2>
                <div className="text-gray-600 dark:text-gray-400 space-y-4">
                  <p>
                    Directorul nostru cuprinzător de aeroporturi oferă acces la informații în timp real despre zboruri 
                    de la toate aeroporturile din România și Moldova. Fie că urmărești sosiri, 
                    monitorizezi plecări sau îți planifici călătoria, platforma noastră oferă date detaliate 
                    despre zboruri de la toate aeroporturile naționale și regionale.
                  </p>
                  <p>
                    Fiecare pagină de aeroport oferă informații cuprinzătoare incluzând statusul zborurilor în timp real, 
                    detalii despre companii aeriene, informații despre terminale și porți, și date istorice. 
                    Sistemul nostru avansat de filtrare îți permite să cauți după criterii specifice precum 
                    compania aeriană, statusul zborului, destinația și intervalul de timp.
                  </p>
                  <p>
                    De la hub-ul principal Aeroportul Internațional Henri Coandă (OTP) din București 
                    la aeroporturi regionale precum Cluj-Napoca, Timișoara, Iași și Chișinău, 
                    baza noastră de date acoperă toate facilitățile de aviație importante din România și Moldova.
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
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Cele Mai Populare
                </h3>
                
                {/* Popular Airports Table */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden shadow-md">
                  <table className="w-full">
                    <thead className="bg-gray-200 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 dark:text-gray-200">Aeroport</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 dark:text-gray-200">Cod</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MAJOR_AIRPORTS.slice(0, 5).map((airport, index) => (
                        <tr 
                          key={airport.code}
                          className={`
                            hover:bg-white dark:hover:bg-gray-750 transition-all duration-200 hover:shadow-sm
                            ${index !== 4 ? 'border-b border-gray-300 dark:border-gray-600' : ''}
                          `}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                <Plane className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-900 dark:text-white font-semibold">{airport.city}</div>
                                <div className="text-xs text-gray-700 dark:text-gray-300">{airport.name.length > 18 ? airport.name.substring(0, 18) + '...' : airport.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                              {airport.code}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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