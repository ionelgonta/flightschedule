import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, Filter, Plane } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Program Zboruri România - Calendar Interactiv Toate Aeroporturile',
  description: 'Program complet de zboruri pentru toate aeroporturile din România și Moldova. Calendar interactiv cu filtre avansate pentru dată, companie aeriană, destinație și status. Planifică călătoriile cu informații actualizate pentru OTP, CLJ, TSR, IAS, RMO.',
  keywords: [
    'program zboruri romania',
    'calendar zboruri',
    'program aeroporturi romania',
    'zboruri otopeni program',
    'zboruri cluj program',
    'program zboruri timisoara',
    'program zboruri iasi',
    'program zboruri chisinau',
    'calendar interactiv zboruri',
    'filtre zboruri romania'
  ],
  openGraph: {
    title: 'Program Zboruri România - Calendar Interactiv Toate Aeroporturile',
    description: 'Program complet de zboruri cu calendar interactiv și filtre avansate pentru toate aeroporturile din România și Moldova.',
    type: 'website',
    url: 'https://anyway.ro/program-zboruri'
  },
  alternates: {
    canonical: '/program-zboruri',
  },
}

export default function ProgramZboruriPage() {
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  const breadcrumbItems = [
    { name: 'Analize', href: '/analize' },
    { name: 'Program Zboruri' }
  ]

  const scheduleSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Program Zboruri România',
    description: 'Program complet de zboruri cu calendar interactiv pentru toate aeroporturile din România și Moldova',
    url: 'https://anyway.ro/program-zboruri',
    mainEntity: {
      '@type': 'Service',
      name: 'Program Zboruri Interactiv',
      description: 'Calendar interactiv cu filtre avansate pentru programul zborurilor din aeroporturile românești',
      provider: {
        '@type': 'Organization',
        name: 'Orarul Zborurilor România'
      }
    }
  }

  return (
    <>
      <StructuredData data={scheduleSchema} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Analize', url: 'https://anyway.ro/analize' },
        { name: 'Program Zboruri', url: 'https://anyway.ro/program-zboruri' }
      ])} />
      
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
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                Program Zboruri România
              </h1>
              <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
                Calendar interactiv cu programul complet de zboruri pentru toate aeroporturile din România și Moldova. 
                Filtrează după dată, companie aeriană, destinație și status.
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
              {/* Features Overview */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Funcționalități Program Zboruri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 mb-1 text-sm">
                          Calendar Interactiv
                        </h3>
                        <p className="text-xs text-blue-700">
                          Navighează prin zile, săptămâni și luni pentru a vedea programul complet de zboruri
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Filter className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 mb-1 text-sm">
                          Filtre Avansate
                        </h3>
                        <p className="text-xs text-green-700">
                          Filtrează după companie aeriană, destinație, tip zbor și interval orar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 mb-1 text-sm">
                          Informații Detaliate
                        </h3>
                        <p className="text-xs text-purple-700">
                          Orare programate, estimate și statusuri actualizate
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Plane className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 mb-1 text-sm">
                          Export și Partajare
                        </h3>
                        <p className="text-xs text-orange-700">
                          Exportă programul în calendar personal sau partajează link-uri specifice
                        </p>
                      </div>
                    </div>
                  </div>
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
                  Program Zboruri - Aeroporturi România
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {romanianAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
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
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">Calendar Interactiv</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Filter className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">Filtre Avansate</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Clock className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600">Timp Real</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Moldovan Airports */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Program Zboruri - Aeroporturi Moldova
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moldovanAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
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
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">Calendar Interactiv</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Filter className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">Filtre Avansate</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Clock className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600">Timp Real</span>
                        </div>
                      </div>
                    </Link>
                  ))}
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
              
              {/* Quick Access */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Acces Rapid
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/aeroport/bucuresti-henri-coanda/program-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">OTP - București</div>
                    <div className="text-xs text-gray-500">Henri Coandă</div>
                  </Link>
                  <Link
                    href="/aeroport/cluj-napoca/program-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">CLJ - Cluj-Napoca</div>
                    <div className="text-xs text-gray-500">Avram Iancu</div>
                  </Link>
                  <Link
                    href="/aeroport/timisoara-traian-vuia/program-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">TSR - Timișoara</div>
                    <div className="text-xs text-gray-500">Traian Vuia</div>
                  </Link>
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