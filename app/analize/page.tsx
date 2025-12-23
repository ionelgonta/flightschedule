import { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, Clock, TrendingUp, Plane, Building } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Analize și Statistici Complete Zboruri România - Toate Aeroporturile',
  description: 'Analize avansate și statistici detaliate pentru toate aeroporturile din România și Moldova. Performanță zboruri, punctualitate, program complet, analize istorice, catalog aeronave și statistici comparative pentru OTP, CLJ, TSR, IAS, RMO și toate aeroporturile naționale.',
  keywords: [
    'analize zboruri romania complete',
    'statistici aeroporturi romania',
    'performanta zboruri romania',
    'punctualitate aeroporturi',
    'program zboruri romania',
    'analize aviatie romania',
    'statistici punctualitate zboruri',
    'istoric zboruri romania',
    'catalog aeronave romania',
    'analize comparative aeroporturi',
    'statistici OTP CLJ TSR IAS',
    'performanta aeroporturi romania',
    'tendinte aviatie romania'
  ],
  openGraph: {
    title: 'Analize și Statistici Complete Zboruri România - Toate Aeroporturile',
    description: 'Analize avansate și statistici detaliate pentru toate aeroporturile din România și Moldova. Performanță, punctualitate și tendințe aviație.',
    type: 'website',
    url: 'https://anyway.ro/analize'
  },
  alternates: {
    canonical: '/analize',
  },
}

export default function AnalyzePage() {
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  const breadcrumbItems = [
    { name: 'Analize și Statistici', href: '/analize' }
  ]

  const analyticsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Analize și Statistici Zboruri România',
    description: 'Analize complete și statistici detaliate pentru toate aeroporturile din România și Moldova',
    url: 'https://anyway.ro/analize',
    mainEntity: {
      '@type': 'Service',
      name: 'Servicii Analize Zboruri',
      description: 'Analize avansate și statistici pentru monitorizarea performanței aeroporturilor',
      provider: {
        '@type': 'Organization',
        name: 'Orarul Zborurilor România'
      },
      serviceType: 'Flight Analytics Service',
      offers: [
        {
          '@type': 'Offer',
          name: 'Statistici Aeroporturi',
          description: 'Indice întârzieri, performanță la timp, ore de vârf'
        },
        {
          '@type': 'Offer', 
          name: 'Program Zboruri',
          description: 'Calendar interactiv cu filtre avansate'
        },
        {
          '@type': 'Offer',
          name: 'Analize Istorice', 
          description: 'Tendințe și evoluție în timp'
        }
      ]
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-white border-b border-gray-200">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-2"
        />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              Analize și Statistici Zboruri
            </h1>
            <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
              Explorează analize detaliate și statistici complete pentru toate aeroporturile din România și Moldova. 
              Alege aeroportul care te interesează pentru a vedea date specifice.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Analytics Categories */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tipuri de Analize Disponibile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/aeroport/bucuresti-henri-coanda/statistici" className="block">
                  <div className="bg-green-50 rounded-lg border border-green-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 mb-1 text-sm">
                          Statistici Aeroporturi
                        </h3>
                        <p className="text-xs text-green-700 mb-2">
                          Indice întârzieri, performanță la timp, ore de vârf și distribuția statusurilor pentru fiecare aeroport
                        </p>
                        <div className="text-xs text-green-600 font-medium">
                          Disponibil pentru toate aeroporturile →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/aeroport/bucuresti-henri-coanda/program-zboruri" className="block">
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 mb-1 text-sm">
                          Program Zboruri
                        </h3>
                        <p className="text-xs text-blue-700 mb-2">
                          Calendar interactiv cu filtre pentru zboruri: dată, companie aeriană, destinație și status
                        </p>
                        <div className="text-xs text-blue-600 font-medium">
                          Filtrare avansată disponibilă →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/aeroport/bucuresti-henri-coanda/istoric-zboruri" className="block">
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 mb-1 text-sm">
                          Analize Istorice
                        </h3>
                        <p className="text-xs text-purple-700 mb-2">
                          Tendințe și evoluție în timp: volum trafic, întârzieri medii și performanță pe perioade
                        </p>
                        <div className="text-xs text-purple-600 font-medium">
                          Până la 365 de zile istoric →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/aeroport/bucuresti-henri-coanda/analize-zboruri" className="block">
                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Plane className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 mb-1 text-sm">
                          Analize Rute
                        </h3>
                        <p className="text-xs text-orange-700 mb-2">
                          Rute frecvente, companii aeriene, punctualitate pe destinații și analize comparative
                        </p>
                        <div className="text-xs text-orange-600 font-medium">
                          Top destinații și companii →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </section>

            {/* Inline Banner Ad */}
            <div className="py-6">
              <AdBanner 
                slot="inline-banner"
                size="728x90"
                className="mx-auto"
              />
            </div>

            {/* Romanian Airports */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Aeroporturi din România
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {romanianAirports.map((airport) => (
                  <div
                    key={airport.code}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center mb-3">
                      <div className="text-base font-bold text-blue-600 mb-1">
                        {airport.city}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                        {airport.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Cod: {airport.code}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/statistici`}
                        className="block w-full text-center px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs"
                      >
                        Statistici
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                        className="block w-full text-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                      >
                        Program Zboruri
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                        className="block w-full text-center px-2 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-xs"
                      >
                        Istoric
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
                        className="block w-full text-center px-2 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-xs"
                      >
                        Analize Rute
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Moldovan Airports */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Aeroporturi din Moldova
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moldovanAirports.map((airport) => (
                  <div
                    key={airport.code}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center mb-3">
                      <div className="text-base font-bold text-blue-600 mb-1">
                        {airport.city}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                        {airport.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Cod: {airport.code}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/statistici`}
                        className="block w-full text-center px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs"
                      >
                        Statistici
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                        className="block w-full text-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                      >
                        Program Zboruri
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                        className="block w-full text-center px-2 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-xs"
                      >
                        Istoric
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
                        className="block w-full text-center px-2 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-xs"
                      >
                        Analize Rute
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Aircraft Catalog Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Catalog Aeronave
              </h2>
              <div className="bg-cyan-50 rounded-lg border border-cyan-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-cyan-600 rounded-lg">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-cyan-800 mb-3">
                      Explorează Catalogul de Aeronave
                    </h3>
                    <p className="text-cyan-700 mb-4 text-sm">
                      Căutare aeronave după ICAO24 sau înmatriculare, istoric zboruri, statistici de performanță 
                      și informații detaliate despre fiecare aeronavă.
                    </p>
                    <Link
                      href="/aeronave"
                      className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                    >
                      <Plane className="h-4 w-4 mr-2" />
                      Accesează Catalogul
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Statistici Platformă
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Aeroporturi Analizate</span>
                  <span className="font-semibold text-gray-900">{MAJOR_AIRPORTS.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Țări Acoperite</span>
                  <span className="font-semibold text-gray-900">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tipuri Analize</span>
                  <span className="font-semibold text-gray-900">4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Catalog Aeronave</span>
                  <span className="font-semibold text-gray-900">Da</span>
                </div>
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
  )
}