import Link from 'next/link'
import { Plane, Clock, MapPin, TrendingUp, Search, BarChart3 } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '@/components/seo/StructuredData'
import { InternalLinks } from '@/components/seo/InternalLinks'

export default function HomePage() {
  // Feature Romanian and Moldovan airports
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')
  const featuredAirports = [
    ...romanianAirports.slice(0, 6), // Mai multe aeroporturi pe homepage
    ...moldovanAirports.slice(0, 1)
  ].filter(Boolean)

  return (
    <>
      {/* Enhanced Structured Data pentru SEO */}
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
        description: 'Monitorizează zborurile din România și Moldova în timp real. Sosiri și plecări de la OTP Otopeni, CLJ Cluj, TSR Timișoara, IAS Iași, RMO Chișinău. Informații actualizate despre statusul zborurilor.',
        url: 'https://anyway.ro',
        mainEntity: {
          '@type': 'Service',
          name: 'Monitorizare Zboruri România',
          description: 'Serviciu de monitorizare în timp real a zborurilor din aeroporturile majore din România și Moldova cu informații despre sosiri, plecări, întârzieri și statusul zborurilor.',
          provider: {
            '@type': 'Organization',
            name: 'Orarul Zborurilor România'
          },
          areaServed: ['România', 'Moldova'],
          serviceType: 'Flight Information Service',
          offers: {
            '@type': 'Offer',
            description: 'Informații gratuite despre zboruri în timp real'
          }
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [{
            '@type': 'ListItem',
            position: 1,
            name: 'Acasă',
            item: 'https://anyway.ro'
          }]
        }
      }} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Compact Header Banner */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center">
            <AdBanner slot="header-banner" size="728x90" />
          </div>
        </div>

        {/* Compact Hero Section - Mobile First */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="text-center">
              {/* Compact Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
                <Plane className="h-6 w-6 text-white" />
              </div>
              
              {/* SEO Optimized Headlines */}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                Orarul Zborurilor România - Informații în Timp Real
              </h1>
              <p className="text-base md:text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
                Monitorizează sosirile și plecările zborurilor din aeroporturile din România și Moldova. 
                Informații actualizate despre statusul zborurilor, întârzieri și schimbări de program.
              </p>
              
              {/* Compact Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link
                  href="/aeroporturi"
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Vezi Aeroporturi
                </Link>
                <Link
                  href="/cautare"
                  className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Caută Zboruri
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Compact Features - Mobile First */}
              <section>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  Funcționalități Principale
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Timp Real</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Actualizări continue despre statusul zborurilor și întârzieri.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Toate Aeroporturile</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Acoperire completă pentru România și Moldova.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Statistici</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Analize detaliate și tendințe pentru fiecare aeroport.
                    </p>
                  </div>
                </div>
              </section>

              {/* Inline Ad */}
              <div className="flex justify-center py-4">
                <AdBanner slot="inline-banner" size="728x90" />
              </div>

              {/* Compact Airport List - Mobile Optimized */}
              <section>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  Aeroporturi România și Moldova
                </h2>
                
                {/* Mobile-First Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {featuredAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}`}
                      className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-white">{airport.code}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{airport.city}</div>
                            <div className="text-xs text-gray-500">{airport.country}</div>
                          </div>
                        </div>
                        <Plane className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {airport.name}
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Call to Action */}
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Vezi toate aeroporturile ({MAJOR_AIRPORTS.length})
                  </h3>
                  <Link
                    href="/aeroporturi"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Explorează toate
                  </Link>
                </div>
              </section>

              {/* Compact Services - Mobile First */}
              <section>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  Servicii Disponibile
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/statistici-aeroporturi"
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Statistici Aeroporturi</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Analizează performanța și punctualitatea aeroporturilor.
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Vezi statistici →
                    </div>
                  </Link>
                  
                  <Link
                    href="/planificator-zboruri"
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <Plane className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Planificator Zboruri</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Găsește zborurile perfecte cu flexibilitate maximă.
                    </p>
                    <div className="text-xs text-purple-600 font-medium">
                      Planifică călătoria →
                    </div>
                  </Link>
                  
                  <Link
                    href="/aeronave"
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <Plane className="h-4 w-4 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Catalog Aeronave</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Căutare aeronave după înmatriculare sau model.
                    </p>
                    <div className="text-xs text-orange-600 font-medium">
                      Explorează catalogul →
                    </div>
                  </Link>
                  
                  <Link
                    href="/cautare"
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Search className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Căutare Zboruri</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Caută zboruri specifice după număr sau destinație.
                    </p>
                    <div className="text-xs text-blue-600 font-medium">
                      Caută acum →
                    </div>
                  </Link>
                </div>
              </section>

              {/* SEO Content - Compact */}
              <section className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Monitorizare Zboruri România - Informații Complete
                </h2>
                <div className="space-y-4 text-sm text-gray-600">
                  <p>
                    <strong>Orarul Zborurilor România</strong> oferă informații complete și actualizate în timp real despre 
                    zborurile din aeroporturile majore din România și Moldova. Monitorizează sosirile și plecările de la 
                    <strong> Otopeni (OTP)</strong>, <strong>Cluj-Napoca (CLJ)</strong>, <strong>Timișoara (TSR)</strong>, 
                    <strong> Iași (IAS)</strong>, <strong>Chișinău (RMO)</strong> și multe altele.
                  </p>
                  <p>
                    Platforma noastră agregează date din surse oficiale pentru a oferi informații precise despre 
                    <strong> statusul zborurilor</strong>, <strong>întârzieri</strong>, <strong>anulări</strong> și 
                    <strong> schimbări de program</strong>. Ideal pentru călători, familii care așteaptă sosiri și 
                    profesioniști din industria aviației.
                  </p>
                  <p>
                    Accesează <strong>statistici detaliate</strong> despre performanța aeroporturilor, 
                    <strong> analize istorice</strong> ale traficului aerian și <strong>tendințe</strong> pentru 
                    fiecare aeroport din România și Moldova. Toate informațiile sunt actualizate continuu pentru 
                    acuratețe maximă.
                  </p>
                </div>
              </section>
            </div>

            {/* Compact Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner slot="sidebar-right" size="300x600" />
              
              {/* Quick Stats - Compact */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                  Statistici Platformă
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aeroporturi</span>
                    <span className="font-semibold">{MAJOR_AIRPORTS.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zboruri/zi</span>
                    <span className="font-semibold">1000+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Companii</span>
                    <span className="font-semibold">50+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Țări</span>
                    <span className="font-semibold">2</span>
                  </div>
                </div>
              </div>

              {/* Internal Links - Compact */}
              <InternalLinks currentPage="/" />

              {/* Square Ad */}
              <AdBanner slot="sidebar-square" size="300x250" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}