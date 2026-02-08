import { Metadata } from 'next'
import Link from 'next/link'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { MapPin, Plane, Search } from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Toate Aeroporturile din România și Moldova - Director Complet',
  description: 'Director complet cu toate aeroporturile din România și Moldova. Informații în timp real despre zboruri, sosiri și plecări de la Aeroportul Internațional Henri Coandă București, Aeroportul Internațional Cluj-Napoca, Aeroportul Internațional Timișoara, Aeroportul Internațional Iași, Aeroportul Internațional Chișinău și toate aeroporturile naționale. Coduri IATA, statistici și programe de zbor.',
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
        <div className="glass-card mx-4 mt-4 rounded-2xl overflow-hidden">
          <AdBanner slot="header-banner" size="728x90" className="max-w-7xl mx-auto py-4" />
        </div>

        <section className="px-4 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Director Aeroporturi</h1>
                <p className="text-white/85 mt-1">Toate aeroporturile din România și Moldova cu informații în timp real</p>
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
              <section>
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Search className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Statistici Aeroporturi</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/20">
                      <div className="text-2xl font-bold text-white">{MAJOR_AIRPORTS.length}+</div>
                      <div className="text-sm text-white/80">Aeroporturi</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/20">
                      <div className="text-2xl font-bold text-white">2</div>
                      <div className="text-sm text-white/80">Țări</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/20">
                      <div className="text-2xl font-bold text-white">24/7</div>
                      <div className="text-sm text-white/80">Disponibilitate</div>
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

              {Object.entries(airportsByRegion).map(([region, airports]) => (
                airports.length > 0 && (
                  <section key={region}>
                    <h2 className="text-xl font-bold text-white mb-4">Aeroporturi din {region}</h2>
                    <div className="hidden md:block mb-6">
                      <div className="glass-card rounded-2xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-white/10 border-b border-white/20">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase">Cod</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase">Oraș</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase">Nume Aeroport</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase">Servicii</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase">Acțiuni</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/20">
                            {airports.map((airport) => (
                              <tr key={airport.code} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    <Plane className="h-4 w-4 text-white" />
                                    <span className="text-sm font-semibold text-white">{airport.code}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-white">{airport.city}</td>
                                <td className="px-4 py-3 text-sm text-white/85">{airport.name}</td>
                                <td className="px-4 py-3">
                                  <div className="flex space-x-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-white">Sosiri</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-white">Plecări</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Link href={`/aeroport/${generateAirportSlug(airport)}`} className="inline-flex items-center px-3 py-1 rounded-xl bg-white/25 text-white text-sm font-medium hover:bg-white/35 transition-colors">Vezi</Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="md:hidden space-y-3 mb-6">
                      {airports.map((airport) => (
                        <Link key={airport.code} href={`/aeroport/${generateAirportSlug(airport)}`} className="block glass-card rounded-2xl p-4 hover:bg-white/20 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Plane className="h-4 w-4 text-white" />
                              <div>
                                <div className="text-sm font-semibold text-white">{airport.code}</div>
                                <div className="text-xs text-white/70">{airport.city}</div>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-white/25 text-white rounded-xl text-xs font-medium">Vezi</div>
                          </div>
                          <div className="text-sm text-white font-medium mb-2">{airport.name}</div>
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-white">Sosiri</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-white">Plecări</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              ))}

              <section className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Aeroporturile din România și Moldova</h2>
                <div className="text-white/85 text-sm space-y-3">
                  <p>
                    Directorul nostru cuprinzător de aeroporturi oferă acces la informații în timp real despre zboruri 
                    de la toate aeroporturile din România și Moldova. Fie că urmărești sosiri, 
                    monitorizezi plecări sau îți planifici călătoria, platforma noastră oferă date detaliate 
                    despre zboruri de la toate aeroporturile naționale și regionale.
                  </p>
                  <p>
                    De la hub-ul principal Aeroportul Internațional Henri Coandă din București 
                    la aeroporturi regionale precum Cluj-Napoca, Timișoara, Iași și Chișinău, 
                    baza noastră de date acoperă toate facilitățile de aviație importante din România și Moldova.
                  </p>
                </div>
              </section>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Cele Mai Populare</h3>
                <div className="space-y-2">
                  {MAJOR_AIRPORTS.slice(0, 5).map((airport) => (
                    <div key={airport.code} className="flex items-center justify-between p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-3 w-3 text-white" />
                        <div>
                          <div className="text-xs font-medium text-white">{airport.city}</div>
                          <div className="text-xs text-white/70">{airport.name.length > 15 ? airport.name.substring(0, 15) + '...' : airport.name}</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-white">{airport.code}</span>
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