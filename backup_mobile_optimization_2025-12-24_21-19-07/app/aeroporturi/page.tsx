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
      
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner Ad */}
        <div className="bg-white border-b border-gray-200">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-4"
          />
        </div>

        {/* Compact Page Header */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Director Aeroporturi
                </h1>
                <p className="text-gray-600 mt-1">
                  Toate aeroporturile din România și Moldova cu informații în timp real
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Compact Stats Section */}
              <section>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Search className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Statistici Aeroporturi
                    </h2>
                  </div>
                  
                  {/* Compact Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">{MAJOR_AIRPORTS.length}+</div>
                      <div className="text-sm text-gray-600">Aeroporturi</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-green-600">2</div>
                      <div className="text-sm text-gray-600">Țări</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-purple-600">24/7</div>
                      <div className="text-sm text-gray-600">Disponibilitate</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Inline Banner Ad */}
              <div className="py-4">
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
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Aeroporturi din {region}
                    </h2>
                    
                    {/* Desktop Table - Compact */}
                    <div className="hidden md:block mb-6">
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cod</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Oraș</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nume Aeroport</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Servicii</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Acțiuni</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {airports.map((airport) => (
                              <tr 
                                key={airport.code}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    <Plane className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-600">{airport.code}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{airport.city}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{airport.name}</td>
                                <td className="px-4 py-3">
                                  <div className="flex space-x-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Sosiri
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Plecări
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/aeroport/${generateAirportSlug(airport)}`}
                                    className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Vezi
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Cards - Compact */}
                    <div className="md:hidden space-y-3 mb-6">
                      {airports.map((airport) => (
                        <Link
                          key={airport.code}
                          href={`/aeroport/${generateAirportSlug(airport)}`}
                          className="block bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Plane className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="text-sm font-semibold text-blue-600">{airport.code}</div>
                                <div className="text-xs text-gray-500">{airport.city}</div>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                              Vezi
                            </div>
                          </div>
                          <div className="text-sm text-gray-900 font-medium mb-2">{airport.name}</div>
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Sosiri
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Plecări
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              ))}

              {/* Compact SEO Content */}
              <section className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Aeroporturile din România și Moldova
                </h2>
                <div className="text-gray-600 text-sm space-y-3">
                  <p>
                    Directorul nostru cuprinzător de aeroporturi oferă acces la informații în timp real despre zboruri 
                    de la toate aeroporturile din România și Moldova. Fie că urmărești sosiri, 
                    monitorizezi plecări sau îți planifici călătoria, platforma noastră oferă date detaliate 
                    despre zboruri de la toate aeroporturile naționale și regionale.
                  </p>
                  <p>
                    De la hub-ul principal Aeroportul Internațional Henri Coandă (OTP) din București 
                    la aeroporturi regionale precum Cluj-Napoca, Timișoara, Iași și Chișinău, 
                    baza noastră de date acoperă toate facilitățile de aviație importante din România și Moldova.
                  </p>
                </div>
              </section>
            </div>

            {/* Compact Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Popular Airports - Compact */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Cele Mai Populare
                </h3>
                
                <div className="space-y-2">
                  {MAJOR_AIRPORTS.slice(0, 5).map((airport) => (
                    <div 
                      key={airport.code}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Plane className="h-3 w-3 text-blue-600" />
                        <div>
                          <div className="text-xs font-medium text-gray-900">{airport.city}</div>
                          <div className="text-xs text-gray-500">{airport.name.length > 15 ? airport.name.substring(0, 15) + '...' : airport.name}</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {airport.code}
                      </span>
                    </div>
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