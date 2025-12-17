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
        <div className="bg-surface-container border-b border-outline-variant">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-container mx-auto py-4"
          />
        </div>

        {/* Page Header */}
        <section className="bg-gradient-to-r from-primary-40 to-primary-30 text-on-primary py-20">
          <div className="max-w-container mx-auto container-padding">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-primary-container rounded-3xl shadow-elevation-2">
                  <MapPin className="h-12 w-12 text-on-primary-container" />
                </div>
              </div>
              <h1 className="display-small md:display-medium mb-6">
                Director Aeroporturi
              </h1>
              <p className="headline-small text-primary-90 mb-8 max-w-4xl mx-auto leading-relaxed">
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
                <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary-container rounded-lg">
                      <Search className="h-5 w-5 text-on-primary-container" />
                    </div>
                    <h2 className="title-large text-on-surface">
                      Găsește un Aeroport
                    </h2>
                  </div>
                  <p className="body-large text-on-surface-variant mb-6">
                    Caută după codul aeroportului sau numele orașului pentru a găsi informații despre zboruri din România și Moldova.
                  </p>
                  
                  {/* Stats Table */}
                  <div className="hidden md:block">
                    <div className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-surface-container-high">
                          <tr>
                            <th className="px-4 py-3 text-left label-medium font-medium text-on-surface-variant">Statistică</th>
                            <th className="px-4 py-3 text-left label-medium font-medium text-on-surface-variant">Valoare</th>
                            <th className="px-4 py-3 text-left label-medium font-medium text-on-surface-variant">Descriere</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-outline-variant/50">
                            <td className="px-4 py-3 body-medium text-on-surface font-medium">Aeroporturi</td>
                            <td className="px-4 py-3 title-medium text-primary-40 font-medium">{MAJOR_AIRPORTS.length}+</td>
                            <td className="px-4 py-3 body-small text-on-surface-variant">Aeroporturi acoperite</td>
                          </tr>
                          <tr className="border-b border-outline-variant/50">
                            <td className="px-4 py-3 body-medium text-on-surface font-medium">Țări</td>
                            <td className="px-4 py-3 title-medium text-primary-40 font-medium">2</td>
                            <td className="px-4 py-3 body-small text-on-surface-variant">România și Moldova</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 body-medium text-on-surface font-medium">Disponibilitate</td>
                            <td className="px-4 py-3 title-medium text-primary-40 font-medium">24/7</td>
                            <td className="px-4 py-3 body-small text-on-surface-variant">Date în timp real</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-outline-variant">
                      <span className="body-medium text-on-surface-variant">Aeroporturi:</span>
                      <span className="title-small text-primary-40 font-medium">{MAJOR_AIRPORTS.length}+</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-outline-variant">
                      <span className="body-medium text-on-surface-variant">Țări:</span>
                      <span className="title-small text-primary-40 font-medium">2</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-outline-variant">
                      <span className="body-medium text-on-surface-variant">Disponibilitate:</span>
                      <span className="title-small text-primary-40 font-medium">24/7</span>
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
                    <h2 className="headline-large text-on-surface mb-8">
                      Aeroporturi din {region}
                    </h2>
                    
                    {/* Desktop Table */}
                    <div className="hidden md:block mb-8">
                      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-surface-container-high">
                            <tr className="border-b border-outline-variant">
                              <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Cod</th>
                              <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Oraș</th>
                              <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Nume Aeroport</th>
                              <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Servicii</th>
                              <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Acțiuni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {airports.map((airport, index) => (
                              <tr 
                                key={airport.code}
                                className={`
                                  state-layer hover:bg-surface-container-high transition-colors duration-200
                                  ${index !== airports.length - 1 ? 'border-b border-outline-variant/50' : ''}
                                `}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-primary-container rounded-lg">
                                      <Plane className="h-4 w-4 text-on-primary-container" />
                                    </div>
                                    <span className="title-small text-primary-40 font-medium">{airport.code}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 body-medium text-on-surface font-medium">{airport.city}</td>
                                <td className="px-6 py-4 body-medium text-on-surface">{airport.name}</td>
                                <td className="px-6 py-4">
                                  <div className="flex space-x-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-primary-container text-on-primary-container label-small font-medium">
                                      Sosiri
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-secondary-container text-on-secondary-container label-small font-medium">
                                      Plecări
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Link
                                    href={`/aeroport/${generateAirportSlug(airport)}`}
                                    className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-40 text-on-primary label-small font-medium hover:bg-primary-30 transition-colors duration-200"
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
                    <div className="md:hidden space-y-3 mb-8">
                      {airports.map((airport) => (
                        <Link
                          key={airport.code}
                          href={`/aeroport/${generateAirportSlug(airport)}`}
                          className="block state-layer bg-surface-container rounded-xl border border-outline-variant p-4 hover:bg-surface-container-high transition-colors duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary-container rounded-lg">
                                <Plane className="h-5 w-5 text-on-primary-container" />
                              </div>
                              <div>
                                <div className="title-medium text-primary-40 font-medium">{airport.code}</div>
                                <div className="body-small text-on-surface-variant">{airport.city}</div>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-primary-40 text-on-primary rounded-lg">
                              <span className="label-small font-medium">Vezi</span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="body-medium text-on-surface font-medium mb-1">{airport.name}</div>
                            <div className="flex items-center space-x-1 body-small text-on-surface-variant">
                              <MapPin className="h-3 w-3" />
                              <span>{airport.city}, {airport.country}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-primary-container text-on-primary-container label-small font-medium">
                              Sosiri
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-secondary-container text-on-secondary-container label-small font-medium">
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
              <div className="bg-surface-container rounded-xl border border-outline-variant p-6">
                <h3 className="title-medium text-on-surface mb-6">
                  Cele Mai Populare
                </h3>
                
                {/* Popular Airports Table */}
                <div className="bg-surface rounded-lg border border-outline-variant overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-surface-container-high">
                      <tr>
                        <th className="px-3 py-2 text-left label-small font-medium text-on-surface-variant">Aeroport</th>
                        <th className="px-3 py-2 text-left label-small font-medium text-on-surface-variant">Cod</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MAJOR_AIRPORTS.slice(0, 5).map((airport, index) => (
                        <tr 
                          key={airport.code}
                          className={`
                            state-layer hover:bg-surface-container-high transition-colors duration-200
                            ${index !== 4 ? 'border-b border-outline-variant/50' : ''}
                          `}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center space-x-2">
                              <Plane className="h-3 w-3 text-on-surface-variant" />
                              <div>
                                <div className="body-small text-on-surface font-medium">{airport.city}</div>
                                <div className="label-small text-on-surface-variant">{airport.name.length > 20 ? airport.name.substring(0, 20) + '...' : airport.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-primary-container text-on-primary-container label-small font-medium">
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