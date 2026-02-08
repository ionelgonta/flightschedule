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
      
      <div className="min-h-screen">
        {/* Header Banner - glass */}
        <div className="glass-card mx-4 mt-4 rounded-2xl overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center">
            <AdBanner slot="header-banner" size="728x90" />
          </div>
        </div>

        {/* Hero - weather-app style: location + large title + CTA */}
        <section className="px-4 pt-8 md:pt-12 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              {/* Location-style header (map pin + title) */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-white/90" />
                <span className="text-lg font-medium text-white/95">România & Moldova</span>
              </div>
              {/* Large headline */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Orarul Zborurilor în Timp Real
              </h1>
              <p className="text-base md:text-lg text-white/85 mb-8 max-w-2xl mx-auto">
                Monitorizează sosirile și plecările din toate aeroporturile. Informații actualizate despre status, întârzieri și program.
              </p>
              {/* CTA buttons - glass style */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link
                  href="/aeroporturi"
                  className="flex items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-medium hover:bg-white/30 border border-white/20 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Vezi Aeroporturi
                </Link>
                <Link
                  href="/cautare"
                  className="flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-medium hover:bg-white/20 border border-white/20 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Caută Zboruri
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Features - glass cards (weather-app style) */}
              <section>
                <h2 className="text-lg md:text-xl font-bold text-white mb-4">
                  Funcționalități Principale
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-5 rounded-2xl">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Timp Real</h3>
                    </div>
                    <p className="text-sm text-white/80">
                      Actualizări continue despre statusul zborurilor și întârzieri.
                    </p>
                  </div>
                  <div className="glass-card p-5 rounded-2xl">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Toate Aeroporturile</h3>
                    </div>
                    <p className="text-sm text-white/80">
                      Acoperire completă pentru România și Moldova.
                    </p>
                  </div>
                  <div className="glass-card p-5 rounded-2xl">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Statistici</h3>
                    </div>
                    <p className="text-sm text-white/80">
                      Analize detaliate și tendințe pentru fiecare aeroport.
                    </p>
                  </div>
                </div>
              </section>

              {/* Inline Ad */}
              <div className="flex justify-center py-4">
                <AdBanner slot="inline-banner" size="728x90" />
              </div>

              {/* Airport list - glass cards */}
              <section>
                <h2 className="text-lg md:text-xl font-bold text-white mb-4">
                  Aeroporturi România și Moldova
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {featuredAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}`}
                      className="glass-card rounded-2xl p-4 hover:bg-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-white">{airport.code}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{airport.city}</div>
                            <div className="text-xs text-white/70">{airport.country}</div>
                          </div>
                        </div>
                        <Plane className="h-4 w-4 text-white/70" />
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        {airport.name}
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="glass-card rounded-2xl p-5 text-center">
                  <h3 className="font-semibold text-white mb-3">
                    Vezi toate aeroporturile ({MAJOR_AIRPORTS.length})
                  </h3>
                  <Link
                    href="/aeroporturi"
                    className="inline-flex items-center px-5 py-2.5 bg-white/25 text-white rounded-2xl text-sm font-medium hover:bg-white/35 border border-white/20 transition-colors"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Explorează toate
                  </Link>
                </div>
              </section>

              {/* Services - glass cards */}
              <section>
                <h2 className="text-lg md:text-xl font-bold text-white mb-4">
                  Servicii Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/statistici-aeroporturi" className="glass-card rounded-2xl p-5 hover:bg-white/20 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Statistici Aeroporturi</h3>
                    </div>
                    <p className="text-sm text-white/80 mb-2">Analizează performanța și punctualitatea aeroporturilor.</p>
                    <div className="text-xs text-white/90 font-medium">Vezi statistici →</div>
                  </Link>
                  <Link href="/planificator-zboruri" className="glass-card rounded-2xl p-5 hover:bg-white/20 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <Plane className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Planificator Zboruri</h3>
                    </div>
                    <p className="text-sm text-white/80 mb-2">Găsește zborurile perfecte cu flexibilitate maximă.</p>
                    <div className="text-xs text-white/90 font-medium">Planifică călătoria →</div>
                  </Link>
                  <Link href="/aeronave" className="glass-card rounded-2xl p-5 hover:bg-white/20 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <Plane className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Catalog Aeronave</h3>
                    </div>
                    <p className="text-sm text-white/80 mb-2">Căutare aeronave după înmatriculare sau model.</p>
                    <div className="text-xs text-white/90 font-medium">Explorează catalogul →</div>
                  </Link>
                  <Link href="/cautare" className="glass-card rounded-2xl p-5 hover:bg-white/20 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <Search className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white">Căutare Zboruri</h3>
                    </div>
                    <p className="text-sm text-white/80 mb-2">Caută zboruri specifice după număr sau destinație.</p>
                    <div className="text-xs text-white/90 font-medium">Caută acum →</div>
                  </Link>
                </div>
              </section>

              {/* SEO Content - glass card */}
              <section className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Monitorizare Zboruri România - Informații Complete
                </h2>
                <div className="space-y-4 text-sm text-white/85">
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

            {/* Sidebar - glass cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-3 text-sm">
                  Statistici Platformă
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-white/90">
                    <span>Aeroporturi</span>
                    <span className="font-semibold text-white">{MAJOR_AIRPORTS.length}</span>
                  </div>
                  <div className="flex justify-between text-white/90">
                    <span>Zboruri/zi</span>
                    <span className="font-semibold text-white">1000+</span>
                  </div>
                  <div className="flex justify-between text-white/90">
                    <span>Companii</span>
                    <span className="font-semibold text-white">50+</span>
                  </div>
                  <div className="flex justify-between text-white/90">
                    <span>Țări</span>
                    <span className="font-semibold text-white">2</span>
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